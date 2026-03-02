const {
  seedCourses,
  seedGalleryPhotos,
  seedLanguages,
  seedLessons,
  seedNotifications
} = require("./store");

const SEED_VERSION_SETTING_KEY = "association_seed_version";
const CURRENT_SEED_VERSION = "2026-03-02";

function getSupabaseUrl() {
  return String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
}

function getSupabaseServiceRoleKey() {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

function isDatabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

function toInFilter(values) {
  const safeValues = values.map((value) => `"${String(value).replace(/"/g, '\\"')}"`);
  return `in.(${safeValues.join(",")})`;
}

function isMissingPhoneColumnError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    Number(error?.status || 0) === 400 &&
    message.includes("phone") &&
    (message.includes("column") || message.includes("does not exist"))
  );
}

function isMissingTableError(error, tableName) {
  const message = String(error?.message || "").toLowerCase();
  const normalizedTableName = String(tableName || "").toLowerCase();
  return (
    message.includes(normalizedTableName) &&
    (message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("table") ||
      message.includes("not found"))
  );
}

async function hasStudentPhoneColumn() {
  if (!isDatabaseConfigured()) {
    return false;
  }

  if (typeof globalThis.__ASSOCIATION_HAS_STUDENT_PHONE_COLUMN__ === "boolean") {
    return globalThis.__ASSOCIATION_HAS_STUDENT_PHONE_COLUMN__;
  }

  try {
    await dbRequest({
      table: "students",
      method: "GET",
      query: { select: "phone", limit: 1 },
      prefer: null
    });
    globalThis.__ASSOCIATION_HAS_STUDENT_PHONE_COLUMN__ = true;
    return true;
  } catch (error) {
    if (isMissingPhoneColumnError(error)) {
      globalThis.__ASSOCIATION_HAS_STUDENT_PHONE_COLUMN__ = false;
      return false;
    }
    throw error;
  }
}

async function dbRequest({
  table,
  method = "GET",
  query = {},
  body,
  prefer = "return=representation",
  headers: extraHeaders = {}
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("database is not configured");
  }

  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.set(key, String(value));
  });

  const url = `${getSupabaseUrl()}/rest/v1/${table}${params.toString() ? `?${params}` : ""}`;
  const headers = {
    apikey: getSupabaseServiceRoleKey(),
    Authorization: `Bearer ${getSupabaseServiceRoleKey()}`,
    ...extraHeaders
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.message || data?.details || data?.hint || `database request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

function mapSeedLanguageRow(language) {
  return {
    id: language.id,
    name: language.name,
    description: language.description
  };
}

function mapSeedCourseRow(course) {
  return {
    id: course.id,
    language_id: course.languageId,
    title: course.title,
    level: course.level,
    duration_weeks: course.durationWeeks,
    description: course.description,
    image_url: course.imageUrl
  };
}

function mapSeedLessonRow(lesson) {
  return {
    id: lesson.id,
    course_id: lesson.courseId,
    title: lesson.title,
    summary: lesson.summary,
    lesson_order: lesson.lessonOrder,
    key_phrases: lesson.keyPhrases
  };
}

function mapSeedGalleryPhotoRow(photo) {
  return {
    id: photo.id,
    title: photo.title,
    image_url: photo.imageUrl,
    position: photo.position,
    created_at: photo.createdAt
  };
}

function mapSeedNotificationRow(notification) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    created_at: notification.createdAt
  };
}

async function getSeedVersionSetting() {
  try {
    const rows = await dbRequest({
      table: "site_settings",
      method: "GET",
      query: {
        select: "setting_key,setting_value",
        setting_key: `eq.${SEED_VERSION_SETTING_KEY}`,
        limit: 1
      },
      prefer: null
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      return "";
    }
    return String(rows[0]?.setting_value || "").trim();
  } catch (error) {
    if (isMissingTableError(error, "site_settings")) {
      return "";
    }
    throw error;
  }
}

async function setSeedVersionSetting() {
  try {
    await dbRequest({
      table: "site_settings",
      method: "POST",
      query: { on_conflict: "setting_key" },
      body: {
        setting_key: SEED_VERSION_SETTING_KEY,
        setting_value: CURRENT_SEED_VERSION,
        updated_at: new Date().toISOString()
      },
      prefer: "resolution=merge-duplicates,return=minimal"
    });
  } catch (error) {
    if (isMissingTableError(error, "site_settings")) {
      return;
    }
    throw error;
  }
}

async function isTableEmpty(table) {
  const rows = await dbRequest({
    table,
    method: "GET",
    query: { select: "id", limit: 1 },
    prefer: null
  });
  return !Array.isArray(rows) || rows.length === 0;
}

async function ensureSeedAssociationData() {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (globalThis.__ASSOCIATION_DB_SEEDED__) {
    return;
  }

  const seedVersion = await getSeedVersionSetting();
  if (seedVersion === CURRENT_SEED_VERSION) {
    globalThis.__ASSOCIATION_DB_SEEDED__ = true;
    return;
  }

  if (await isTableEmpty("languages")) {
    await dbRequest({
      table: "languages",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedLanguages.map(mapSeedLanguageRow),
      prefer: "resolution=ignore-duplicates,return=minimal"
    });
  }

  if (await isTableEmpty("courses")) {
    await dbRequest({
      table: "courses",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedCourses.map(mapSeedCourseRow),
      prefer: "resolution=ignore-duplicates,return=minimal"
    });
  }

  if (await isTableEmpty("lessons")) {
    await dbRequest({
      table: "lessons",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedLessons.map(mapSeedLessonRow),
      prefer: "resolution=ignore-duplicates,return=minimal"
    });
  }

  if (await isTableEmpty("gallery_photos")) {
    await dbRequest({
      table: "gallery_photos",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedGalleryPhotos.map(mapSeedGalleryPhotoRow),
      prefer: "resolution=ignore-duplicates,return=minimal"
    });
  }

  if (await isTableEmpty("notifications")) {
    await dbRequest({
      table: "notifications",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedNotifications.map(mapSeedNotificationRow),
      prefer: "resolution=ignore-duplicates,return=minimal"
    });
  }

  await setSeedVersionSetting();
  globalThis.__ASSOCIATION_DB_SEEDED__ = true;
}

module.exports = {
  dbRequest,
  ensureSeedAssociationData,
  hasStudentPhoneColumn,
  isDatabaseConfigured,
  toInFilter
};
