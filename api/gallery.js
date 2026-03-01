const { requireRole } = require("../lib/auth");
const {
  createGalleryPhoto,
  deleteGalleryPhoto,
  listGalleryPhotos,
  updateGalleryPhoto
} = require("../lib/dashboard");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const photos = await listGalleryPhotos();
      return json(res, 200, photos);
    }

    if (req.method === "POST") {
      const user = requireRole(req, res, ["admin"]);
      if (!user) {
        return;
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return json(res, 400, { message: "invalid JSON body" });
      }

      const photo = await createGalleryPhoto(body);
      return json(res, 201, photo);
    }

    if (req.method === "PATCH") {
      const user = requireRole(req, res, ["admin"]);
      if (!user) {
        return;
      }

      const url = parseUrl(req);
      const photoId = String(url.searchParams.get("id") || "").trim();
      if (!photoId) {
        return json(res, 400, { message: "id query param is required" });
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return json(res, 400, { message: "invalid JSON body" });
      }

      const photo = await updateGalleryPhoto(photoId, body);
      return json(res, 200, photo);
    }

    if (req.method === "DELETE") {
      const user = requireRole(req, res, ["admin"]);
      if (!user) {
        return;
      }

      const url = parseUrl(req);
      const photoId = String(url.searchParams.get("id") || "").trim();
      if (!photoId) {
        return json(res, 400, { message: "id query param is required" });
      }

      const removed = await deleteGalleryPhoto(photoId);
      return json(res, 200, { ok: true, removed });
    }

    return methodNotAllowed(res, ["GET", "POST", "PATCH", "DELETE"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};
