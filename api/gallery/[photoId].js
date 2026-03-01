const { requireRole } = require("../_auth");
const { deleteGalleryPhoto, updateGalleryPhoto } = require("../_dashboard");
const { json, methodNotAllowed, readJsonBody } = require("../_utils");

module.exports = async function handler(req, res) {
  try {
    const photoId = Array.isArray(req.query?.photoId) ? req.query.photoId[0] : req.query?.photoId;
    if (!photoId) {
      return json(res, 400, { message: "photo id is required" });
    }

    const user = requireRole(req, res, ["admin"]);
    if (!user) {
      return;
    }

    if (req.method === "PATCH") {
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
      const removed = await deleteGalleryPhoto(photoId);
      return json(res, 200, { ok: true, removed });
    }

    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

