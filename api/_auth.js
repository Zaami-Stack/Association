const { createHmac, randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");
const { dbRequest, isDatabaseConfigured } = require("./_db");
const { createId, getStore } = require("./_store");
const { json, parseCookies } = require("./_utils");

const SESSION_COOKIE = "association_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return Buffer.from(normalized + "=".repeat(padding), "base64").toString("utf8");
}

function getSecret() {
  return String(process.env.AUTH_SECRET || "change-this-auth-secret");
}

function hasValidSecret() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const secret = getSecret();
  return secret.length >= 24 && secret !== "change-this-auth-secret";
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function signToken(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = createHmac("sha256", getSecret())
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const unsigned = `${header}.${body}`;
  const expected = createHmac("sha256", getSecret())
    .update(unsigned)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    return null;
  }

  return payload;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(storedPassword, inputPassword) {
  const stored = String(storedPassword || "");
  const input = String(inputPassword || "");

  if (!stored.startsWith("scrypt$")) {
    return safeEqual(stored, input);
  }

  const parts = stored.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const [, salt, expectedHashHex] = parts;
  const actualHashHex = scryptSync(input, salt, 64).toString("hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  const actual = Buffer.from(actualHashHex, "hex");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

function getConfiguredUsers() {
  const isProduction = process.env.NODE_ENV === "production";
  const adminEmail = String(process.env.ADMIN_EMAIL || (isProduction ? "" : "admin@association.com"))
    .trim()
    .toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || (isProduction ? "" : "Admin1234!"));

  if (!adminEmail || !adminPassword) {
    return [];
  }

  return [
    {
      id: "admin-1",
      name: "Administrator",
      email: adminEmail,
      password: adminPassword,
      role: "admin"
    }
  ];
}

function isAuthConfigured() {
  return getConfiguredUsers().length > 0 && hasValidSecret();
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name || "",
    email: user.email,
    role: user.role
  };
}

function serializeCookie(name, value, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function setSessionCookie(res, user) {
  const now = Math.floor(Date.now() / 1000);
  const token = signToken({
    sub: user.id,
    name: user.name || "",
    email: user.email,
    role: user.role,
    exp: now + SESSION_TTL_SECONDS
  });
  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, token, SESSION_TTL_SECONDS));
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const payload = verifyToken(cookies[SESSION_COOKIE]);
  if (!payload) {
    return null;
  }
  return {
    id: payload.sub,
    name: payload.name || "",
    email: payload.email,
    role: payload.role
  };
}

function requireRole(req, res, roles) {
  if (!isAuthConfigured()) {
    json(res, 503, {
      message: "authentication is not configured. Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD."
    });
    return null;
  }

  const user = getSessionUser(req);
  if (!user) {
    json(res, 401, { message: "authentication required" });
    return null;
  }

  if (!roles.includes(user.role)) {
    json(res, 403, { message: "insufficient permissions" });
    return null;
  }

  return user;
}

function getLocalUsers() {
  const store = getStore();
  if (!Array.isArray(store.users)) {
    store.users = [];
  }
  return store.users;
}

async function findDbUserByEmail(email) {
  const rows = await dbRequest({
    table: "users",
    method: "GET",
    query: {
      select: "id,name,email,password,role,created_at",
      email: `eq.${email}`,
      limit: 1
    },
    prefer: null
  });
  return rows[0] || null;
}

async function authenticateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  for (const configuredUser of getConfiguredUsers()) {
    if (!safeEqual(configuredUser.email, normalizedEmail)) {
      continue;
    }
    if (verifyPassword(configuredUser.password, normalizedPassword)) {
      return toPublicUser(configuredUser);
    }
  }

  if (isDatabaseConfigured()) {
    const dbUser = await findDbUserByEmail(normalizedEmail);
    if (!dbUser) {
      return null;
    }
    if (!verifyPassword(dbUser.password, normalizedPassword)) {
      return null;
    }
    return toPublicUser(dbUser);
  }

  const localUser = getLocalUsers().find((user) => safeEqual(user.email, normalizedEmail));
  if (!localUser) {
    return null;
  }
  if (!verifyPassword(localUser.password, normalizedPassword)) {
    return null;
  }
  return toPublicUser(localUser);
}

async function registerStudent({ name, email, password }) {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "");

  if (normalizedName.length < 2) {
    throw new Error("name must be at least 2 characters");
  }
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("valid email is required");
  }
  if (normalizedPassword.length < 8) {
    throw new Error("password must be at least 8 characters");
  }

  const configuredUserExists = getConfiguredUsers().some((user) => safeEqual(user.email, normalizedEmail));
  if (configuredUserExists) {
    throw new Error("email already exists");
  }

  if (isDatabaseConfigured()) {
    const existing = await findDbUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error("email already exists");
    }

    const rows = await dbRequest({
      table: "users",
      method: "POST",
      body: {
        id: createId(12),
        name: normalizedName,
        email: normalizedEmail,
        password: hashPassword(normalizedPassword),
        role: "student",
        created_at: new Date().toISOString()
      }
    });

    return toPublicUser(rows[0]);
  }

  const localUsers = getLocalUsers();
  const exists = localUsers.some((user) => safeEqual(user.email, normalizedEmail));
  if (exists) {
    throw new Error("email already exists");
  }

  const user = {
    id: createId(12),
    name: normalizedName,
    email: normalizedEmail,
    password: hashPassword(normalizedPassword),
    role: "student",
    createdAt: new Date().toISOString()
  };
  localUsers.push(user);
  return toPublicUser(user);
}

module.exports = {
  authenticateCredentials,
  clearSessionCookie,
  getSessionUser,
  isAuthConfigured,
  registerStudent,
  requireRole,
  setSessionCookie
};

