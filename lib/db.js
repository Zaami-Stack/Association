const {
  seedCourses,
  seedGalleryPhotos,
  seedLanguages,
  seedLessons,
  seedNotifications
} = require("./store");

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

async function ensureSeedAssociationData() {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (globalThis.__ASSOCIATION_DB_SEEDED__) {
    return;
  }

  const languageRows = await dbRequest({
    table: "languages",
    method: "GET",
    query: { select: "id", limit: 1, order: "id.asc" },
    prefer: null
  });

  if (Array.isArray(languageRows) && languageRows.length === 0) {
    await dbRequest({
      table: "languages",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedLanguages.map(mapSeedLanguageRow),
      prefer: "resolution=merge-duplicates,return=minimal"
    });

    await dbRequest({
      table: "courses",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedCourses.map(mapSeedCourseRow),
      prefer: "resolution=merge-duplicates,return=minimal"
    });

    await dbRequest({
      table: "lessons",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedLessons.map(mapSeedLessonRow),
      prefer: "resolution=merge-duplicates,return=minimal"
    });
  }

  const galleryRows = await dbRequest({
    table: "gallery_photos",
    method: "GET",
    query: { select: "id", limit: 1, order: "position.asc" },
    prefer: null
  });

  if (Array.isArray(galleryRows) && galleryRows.length === 0) {
    await dbRequest({
      table: "gallery_photos",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedGalleryPhotos.map(mapSeedGalleryPhotoRow),
      prefer: "resolution=merge-duplicates,return=minimal"
    });
  }

  const notificationRows = await dbRequest({
    table: "notifications",
    method: "GET",
    query: { select: "id", limit: 1, order: "created_at.desc" },
    prefer: null
  });

  if (Array.isArray(notificationRows) && notificationRows.length === 0) {
    await dbRequest({
      table: "notifications",
      method: "POST",
      query: { on_conflict: "id" },
      body: seedNotifications.map(mapSeedNotificationRow),
      prefer: "resolution=merge-duplicates,return=minimal"
    });
  }

  globalThis.__ASSOCIATION_DB_SEEDED__ = true;
}

module.exports = {
  dbRequest,
  ensureSeedAssociationData,
  isDatabaseConfigured,
  toInFilter
};
