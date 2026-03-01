const { requireRole } = require("../_auth");
const { deleteNotification } = require("../_dashboard");
const { json, methodNotAllowed } = require("../_utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "DELETE") {
      return methodNotAllowed(res, ["DELETE"]);
    }

    const user = requireRole(req, res, ["admin"]);
    if (!user) {
      return;
    }

    const notificationId = Array.isArray(req.query?.notificationId)
      ? req.query.notificationId[0]
      : req.query?.notificationId;
    if (!notificationId) {
      return json(res, 400, { message: "notification id is required" });
    }

    const removed = await deleteNotification(notificationId);
    return json(res, 200, { ok: true, removed });
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

