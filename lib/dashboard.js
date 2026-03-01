const { dbRequest, ensureSeedAssociationData, isDatabaseConfigured, toInFilter } = require("./db");
const { createId, getStore } = require("./store");

const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

function parsePositiveId(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function isValidImageUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return IMAGE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

function normalizeGalleryPayload(payload, partial = false) {
  const output = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload || {}, "title")) {
    const title = String(payload?.title || "").trim();
    if (title.length < 2) {
      throw new Error("title must be at least 2 characters");
    }
    output.title = title;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload || {}, "imageUrl")) {
    const imageUrl = String(payload?.imageUrl || "").trim();
    if (!isValidImageUrl(imageUrl)) {
      throw new Error("imageUrl must be a valid http/https URL");
    }
    output.imageUrl = imageUrl;
  }

  if (Object.prototype.hasOwnProperty.call(payload || {}, "position")) {
    const position = Number(payload.position);
    if (!Number.isInteger(position) || position < 0) {
      throw new Error("position must be an integer >= 0");
    }
    output.position = position;
  }

  if (partial && Object.keys(output).length === 0) {
    throw new Error("at least one field is required");
  }

  return output;
}

function normalizeNotificationPayload(payload) {
  const title = String(payload?.title || "").trim();
  const message = String(payload?.message || "").trim();
  if (title.length < 2) {
    throw new Error("title must be at least 2 characters");
  }
  if (title.length > 160) {
    throw new Error("title is too long");
  }
  if (message.length > 1000) {
    throw new Error("message is too long");
  }
  return { title, message };
}

function toGalleryModel(row) {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    position: Number(row.position || 0),
    createdAt: row.created_at || null
  };
}

function toNotificationModel(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message || "",
    createdAt: row.created_at || null
  };
}

async function listGalleryPhotos() {
  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();
    const rows = await dbRequest({
      table: "gallery_photos",
      method: "GET",
      query: { select: "*", order: "position.asc,created_at.desc" },
      prefer: null
    });
    return rows.map(toGalleryModel);
  }

  const store = getStore();
  return [...store.galleryPhotos]
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((photo) => ({
      ...photo
    }));
}

async function createGalleryPhoto(payload) {
  const normalized = normalizeGalleryPayload(payload);

  if (isDatabaseConfigured()) {
    const rows = await dbRequest({
      table: "gallery_photos",
      method: "POST",
      body: {
        id: createId(12),
        title: normalized.title,
        image_url: normalized.imageUrl,
        position: Number(normalized.position || 0),
        created_at: new Date().toISOString()
      }
    });
    return toGalleryModel(rows[0]);
  }

  const store = getStore();
  const photo = {
    id: createId(12),
    title: normalized.title,
    imageUrl: normalized.imageUrl,
    position: Number(normalized.position || 0),
    createdAt: new Date().toISOString()
  };
  store.galleryPhotos.push(photo);
  return photo;
}

async function updateGalleryPhoto(photoId, payload) {
  const normalized = normalizeGalleryPayload(payload, true);
  const id = String(photoId || "").trim();
  if (!id) {
    const error = new Error("photo id is required");
    error.status = 400;
    throw error;
  }

  if (isDatabaseConfigured()) {
    const patch = {};
    if (Object.prototype.hasOwnProperty.call(normalized, "title")) {
      patch.title = normalized.title;
    }
    if (Object.prototype.hasOwnProperty.call(normalized, "imageUrl")) {
      patch.image_url = normalized.imageUrl;
    }
    if (Object.prototype.hasOwnProperty.call(normalized, "position")) {
      patch.position = normalized.position;
    }

    const rows = await dbRequest({
      table: "gallery_photos",
      method: "PATCH",
      query: { id: `eq.${id}`, select: "*" },
      body: patch
    });
    if (!Array.isArray(rows) || rows.length === 0) {
      const error = new Error("photo not found");
      error.status = 404;
      throw error;
    }
    return toGalleryModel(rows[0]);
  }

  const store = getStore();
  const index = store.galleryPhotos.findIndex((photo) => String(photo.id) === id);
  if (index === -1) {
    const error = new Error("photo not found");
    error.status = 404;
    throw error;
  }

  store.galleryPhotos[index] = {
    ...store.galleryPhotos[index],
    ...normalized
  };
  return store.galleryPhotos[index];
}

async function deleteGalleryPhoto(photoId) {
  const id = String(photoId || "").trim();
  if (!id) {
    const error = new Error("photo id is required");
    error.status = 400;
    throw error;
  }

  if (isDatabaseConfigured()) {
    const rows = await dbRequest({
      table: "gallery_photos",
      method: "DELETE",
      query: { id: `eq.${id}`, select: "*" }
    });
    if (!Array.isArray(rows) || rows.length === 0) {
      const error = new Error("photo not found");
      error.status = 404;
      throw error;
    }
    return toGalleryModel(rows[0]);
  }

  const store = getStore();
  const index = store.galleryPhotos.findIndex((photo) => String(photo.id) === id);
  if (index === -1) {
    const error = new Error("photo not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.galleryPhotos.splice(index, 1);
  return removed;
}

async function listNotifications(limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();
    const rows = await dbRequest({
      table: "notifications",
      method: "GET",
      query: { select: "*", order: "created_at.desc", limit: safeLimit },
      prefer: null
    });
    return rows.map(toNotificationModel);
  }

  const store = getStore();
  return [...store.notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit);
}

async function createNotification(payload) {
  const normalized = normalizeNotificationPayload(payload);

  if (isDatabaseConfigured()) {
    const rows = await dbRequest({
      table: "notifications",
      method: "POST",
      body: {
        id: createId(12),
        title: normalized.title,
        message: normalized.message,
        created_at: new Date().toISOString()
      }
    });
    return toNotificationModel(rows[0]);
  }

  const store = getStore();
  const notification = {
    id: createId(12),
    title: normalized.title,
    message: normalized.message,
    createdAt: new Date().toISOString()
  };
  store.notifications.push(notification);
  return notification;
}

async function deleteNotification(notificationId) {
  const id = String(notificationId || "").trim();
  if (!id) {
    const error = new Error("notification id is required");
    error.status = 400;
    throw error;
  }

  if (isDatabaseConfigured()) {
    const rows = await dbRequest({
      table: "notifications",
      method: "DELETE",
      query: { id: `eq.${id}`, select: "*" }
    });
    if (!Array.isArray(rows) || rows.length === 0) {
      const error = new Error("notification not found");
      error.status = 404;
      throw error;
    }
    return toNotificationModel(rows[0]);
  }

  const store = getStore();
  const index = store.notifications.findIndex((notification) => String(notification.id) === id);
  if (index === -1) {
    const error = new Error("notification not found");
    error.status = 404;
    throw error;
  }
  const [removed] = store.notifications.splice(index, 1);
  return removed;
}

function summarizeEnrollmentProgress(progressRows) {
  const map = new Map();
  for (const row of progressRows) {
    const enrollmentId = Number(row.enrollment_id || row.enrollmentId);
    const current = map.get(enrollmentId) || { totalLessons: 0, completedLessons: 0 };
    current.totalLessons += 1;
    if (Boolean(row.is_completed ?? row.isCompleted)) {
      current.completedLessons += 1;
    }
    map.set(enrollmentId, current);
  }
  return map;
}

async function listStudentsOverview() {
  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const students = await dbRequest({
      table: "students",
      method: "GET",
      query: { select: "id,full_name,email,created_at", order: "created_at.desc" },
      prefer: null
    });

    if (students.length === 0) {
      return [];
    }

    const studentIds = students.map((student) => Number(student.id));
    const enrollments = await dbRequest({
      table: "enrollments",
      method: "GET",
      query: {
        select: "id,student_id,course_id,enrolled_at",
        student_id: toInFilter(studentIds),
        order: "enrolled_at.desc"
      },
      prefer: null
    });

    const courseIds = [...new Set(enrollments.map((enrollment) => Number(enrollment.course_id)))];
    const enrollmentIds = enrollments.map((enrollment) => Number(enrollment.id));

    const [courses, languages, progressRows] = await Promise.all([
      courseIds.length
        ? dbRequest({
            table: "courses",
            method: "GET",
            query: {
              select: "id,language_id,title,level",
              id: toInFilter(courseIds)
            },
            prefer: null
          })
        : Promise.resolve([]),
      dbRequest({ table: "languages", method: "GET", query: { select: "id,name" }, prefer: null }),
      enrollmentIds.length
        ? dbRequest({
            table: "lesson_progress",
            method: "GET",
            query: {
              select: "enrollment_id,is_completed",
              enrollment_id: toInFilter(enrollmentIds)
            },
            prefer: null
          })
        : Promise.resolve([])
    ]);

    const courseMap = new Map(courses.map((course) => [Number(course.id), course]));
    const languageMap = new Map(languages.map((language) => [Number(language.id), language.name]));
    const progressByEnrollment = summarizeEnrollmentProgress(progressRows);

    return students.map((student) => {
      const studentEnrollments = enrollments
        .filter((enrollment) => Number(enrollment.student_id) === Number(student.id))
        .map((enrollment) => {
          const course = courseMap.get(Number(enrollment.course_id));
          const progress = progressByEnrollment.get(Number(enrollment.id)) || {
            totalLessons: 0,
            completedLessons: 0
          };
          return {
            enrollmentId: Number(enrollment.id),
            courseId: Number(enrollment.course_id),
            courseTitle: course?.title || "Unknown course",
            level: course?.level || "Beginner",
            languageName: languageMap.get(Number(course?.language_id)) || "Unknown",
            enrolledAt: enrollment.enrolled_at,
            totalLessons: progress.totalLessons,
            completedLessons: progress.completedLessons,
            completionRate: progress.totalLessons
              ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
              : 0
          };
        });

      const totals = studentEnrollments.reduce(
        (acc, enrollment) => {
          acc.totalLessons += enrollment.totalLessons;
          acc.completedLessons += enrollment.completedLessons;
          return acc;
        },
        { totalLessons: 0, completedLessons: 0 }
      );

      return {
        studentId: Number(student.id),
        fullName: student.full_name,
        email: student.email,
        createdAt: student.created_at,
        enrollmentCount: studentEnrollments.length,
        totalLessons: totals.totalLessons,
        completedLessons: totals.completedLessons,
        completionRate: totals.totalLessons
          ? Math.round((totals.completedLessons / totals.totalLessons) * 100)
          : 0,
        enrollments: studentEnrollments
      };
    });
  }

  const store = getStore();
  const languageMap = new Map(store.languages.map((language) => [Number(language.id), language.name]));
  const courseMap = new Map(store.courses.map((course) => [Number(course.id), course]));

  return [...store.students]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((student) => {
      const studentEnrollments = store.enrollments
        .filter((enrollment) => Number(enrollment.studentId) === Number(student.id))
        .map((enrollment) => {
          const course = courseMap.get(Number(enrollment.courseId));
          const progressRows = store.lessonProgress.filter(
            (row) => Number(row.enrollmentId) === Number(enrollment.id)
          );
          const totalLessons = progressRows.length;
          const completedLessons = progressRows.filter((row) => Boolean(row.isCompleted)).length;
          return {
            enrollmentId: Number(enrollment.id),
            courseId: Number(enrollment.courseId),
            courseTitle: course?.title || "Unknown course",
            level: course?.level || "Beginner",
            languageName: languageMap.get(Number(course?.languageId)) || "Unknown",
            enrolledAt: enrollment.enrolledAt,
            totalLessons,
            completedLessons,
            completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
          };
        });

      const totals = studentEnrollments.reduce(
        (acc, enrollment) => {
          acc.totalLessons += enrollment.totalLessons;
          acc.completedLessons += enrollment.completedLessons;
          return acc;
        },
        { totalLessons: 0, completedLessons: 0 }
      );

      return {
        studentId: Number(student.id),
        fullName: student.fullName,
        email: student.email,
        createdAt: student.createdAt,
        enrollmentCount: studentEnrollments.length,
        totalLessons: totals.totalLessons,
        completedLessons: totals.completedLessons,
        completionRate: totals.totalLessons
          ? Math.round((totals.completedLessons / totals.totalLessons) * 100)
          : 0,
        enrollments: studentEnrollments
      };
    });
}

module.exports = {
  createGalleryPhoto,
  createNotification,
  deleteGalleryPhoto,
  deleteNotification,
  listGalleryPhotos,
  listNotifications,
  listStudentsOverview,
  parsePositiveId,
  updateGalleryPhoto
};
