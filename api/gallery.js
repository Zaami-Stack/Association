const { requireRole } = require("./_auth");
const { createGalleryPhoto, listGalleryPhotos } = require("./_dashboard");
const { json, methodNotAllowed, readJsonBody } = require("./_utils");

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

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

