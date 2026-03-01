const { requireRole } = require("../lib/auth");
const { getHeroImage, updateHeroImage } = require("../lib/dashboard");
const { json, methodNotAllowed, readJsonBody } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const hero = await getHeroImage();
      return json(res, 200, hero);
    }

    if (req.method === "PATCH") {
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

      const updated = await updateHeroImage(body);
      return json(res, 200, updated);
    }

    return methodNotAllowed(res, ["GET", "PATCH"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};
