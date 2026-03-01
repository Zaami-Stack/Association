const { dbRequest, ensureSeedAssociationData, hasStudentPhoneColumn, isDatabaseConfigured } = require("./db");
const { createId, getStore } = require("./store");

const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const HERO_IMAGE_SETTING_ID = "__hero_image__";
const HERO_IMAGE_SETTING_KEY = "hero_image_url";
const DEFAULT_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1500&q=80";

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

function isMissingSiteSettingsTableError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("site_settings") &&
    (message.includes("does not exist") || message.includes("relation") || message.includes("table"))
  );
}

function normalizeHeroPayload(payload) {
  const imageUrl = String(payload?.imageUrl || "").trim();
  if (!isValidImageUrl(imageUrl)) {
    const error = new Error("imageUrl must be a valid http/https URL");
    error.status = 400;
    throw error;
  }
  return { imageUrl };
}

function toHeroModel(row) {
  const imageUrl = String(row?.setting_value || row?.image_url || row?.imageUrl || "").trim();
  return {
    imageUrl: isValidImageUrl(imageUrl) ? imageUrl : DEFAULT_HERO_IMAGE_URL
  };
}

async function getHeroImage() {
  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    try {
      const settingRows = await dbRequest({
        table: "site_settings",
        method: "GET",
        query: {
          select: "setting_key,setting_value,updated_at",
          setting_key: `eq.${HERO_IMAGE_SETTING_KEY}`,
          limit: 1
        },
        prefer: null
      });

      if (Array.isArray(settingRows) && settingRows.length > 0) {
        return toHeroModel(settingRows[0]);
      }
    } catch (error) {
      if (!isMissingSiteSettingsTableError(error)) {
        throw error;
      }
    }

    const legacyRows = await dbRequest({
      table: "gallery_photos",
      method: "GET",
      query: {
        select: "id,image_url,created_at",
        id: `eq.${HERO_IMAGE_SETTING_ID}`,
        limit: 1
      },
      prefer: null
    });

    if (!Array.isArray(legacyRows) || legacyRows.length === 0) {
      return { imageUrl: DEFAULT_HERO_IMAGE_URL };
    }
    return toHeroModel(legacyRows[0]);
  }

  const store = getStore();
  const row = store.galleryPhotos.find((photo) => String(photo.id) === HERO_IMAGE_SETTING_ID);
  if (!row) {
    return { imageUrl: DEFAULT_HERO_IMAGE_URL };
  }
  return toHeroModel(row);
}

async function updateHeroImage(payload) {
  const normalized = normalizeHeroPayload(payload);

  if (isDatabaseConfigured()) {
    try {
      const rows = await dbRequest({
        table: "site_settings",
        method: "POST",
        query: { on_conflict: "setting_key" },
        body: {
          setting_key: HERO_IMAGE_SETTING_KEY,
          setting_value: normalized.imageUrl,
          updated_at: new Date().toISOString()
        },
        prefer: "resolution=merge-duplicates,return=representation"
      });
      return toHeroModel(rows?.[0] || { setting_value: normalized.imageUrl });
    } catch (error) {
      if (!isMissingSiteSettingsTableError(error)) {
        throw error;
      }
    }

    const rows = await dbRequest({
      table: "gallery_photos",
      method: "POST",
      query: { on_conflict: "id" },
      body: {
        id: HERO_IMAGE_SETTING_ID,
        title: "Hero Image Setting",
        image_url: normalized.imageUrl,
        position: 9999,
        created_at: new Date().toISOString()
      },
      prefer: "resolution=merge-duplicates,return=representation"
    });
    return toHeroModel(rows?.[0] || { image_url: normalized.imageUrl });
  }

  const store = getStore();
  const index = store.galleryPhotos.findIndex((photo) => String(photo.id) === HERO_IMAGE_SETTING_ID);
  const nextValue = {
    id: HERO_IMAGE_SETTING_ID,
    title: "Hero Image Setting",
    imageUrl: normalized.imageUrl,
    position: 9999,
    createdAt: new Date().toISOString()
  };
  if (index === -1) {
    store.galleryPhotos.push(nextValue);
  } else {
    store.galleryPhotos[index] = {
      ...store.galleryPhotos[index],
      ...nextValue
    };
  }
  return toHeroModel(nextValue);
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
    return rows.map(toGalleryModel).filter((photo) => String(photo.id) !== HERO_IMAGE_SETTING_ID);
  }

  const store = getStore();
  return [...store.galleryPhotos]
    .filter((photo) => String(photo.id) !== HERO_IMAGE_SETTING_ID)
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

async function listStudentsOverview() {
  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();
    const supportsStudentPhone = await hasStudentPhoneColumn();

    const students = await dbRequest({
      table: "students",
      method: "GET",
      query: {
        select: supportsStudentPhone ? "id,full_name,email,phone,created_at" : "id,full_name,email,created_at",
        order: "created_at.desc"
      },
      prefer: null
    });

    return students.map((student) => ({
      studentId: Number(student.id),
      fullName: student.full_name,
      email: student.email,
      phone: supportsStudentPhone ? student.phone || "" : "",
      createdAt: student.created_at
    }));
  }

  const store = getStore();
  return [...store.students]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((student) => ({
      studentId: Number(student.id),
      fullName: student.fullName,
      email: student.email,
      phone: student.phone || "",
      createdAt: student.createdAt
    }));
}

module.exports = {
  createGalleryPhoto,
  createNotification,
  deleteGalleryPhoto,
  deleteNotification,
  getHeroImage,
  listGalleryPhotos,
  listNotifications,
  listStudentsOverview,
  parsePositiveId,
  updateHeroImage,
  updateGalleryPhoto
};
