const {
  authenticateCredentials,
  clearSessionCookie,
  getSessionUser,
  isAuthConfigured,
  registerStudent,
  setSessionCookie
} = require("../lib/auth");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const user = getSessionUser(req);
      if (!user) {
        return json(res, 200, { authenticated: false, user: null });
      }
      return json(res, 200, { authenticated: true, user });
    }

    if (req.method !== "POST") {
      return methodNotAllowed(res, ["GET", "POST"]);
    }

    const url = parseUrl(req);
    const action = String(url.searchParams.get("action") || "").trim().toLowerCase();

    if (action === "logout") {
      clearSessionCookie(res);
      return json(res, 200, { ok: true });
    }

    if (!isAuthConfigured()) {
      clearSessionCookie(res);
      return json(res, 503, {
        message: "authentication is not configured. Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD."
      });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return json(res, 400, { message: "invalid JSON body" });
    }

    if (action === "login") {
      let user;
      try {
        user = await authenticateCredentials(body?.email, body?.password);
      } catch (error) {
        clearSessionCookie(res);
        return json(res, 500, { message: error.message || "login failed" });
      }

      if (!user) {
        clearSessionCookie(res);
        return json(res, 401, { message: "invalid email or password" });
      }

      setSessionCookie(res, user);
      return json(res, 200, { user });
    }

    if (action === "signup") {
      try {
        const user = await registerStudent({
          name: body?.name,
          email: body?.email,
          password: body?.password
        });
        setSessionCookie(res, user);
        return json(res, 201, { user });
      } catch (error) {
        return json(res, 400, { message: error.message || "signup failed" });
      }
    }

    return json(res, 400, { message: "action must be login, signup, or logout" });
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

