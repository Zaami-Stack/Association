const { requireRole } = require("../lib/auth");
const { createNotification, deleteNotification, listNotifications } = require("../lib/dashboard");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = parseUrl(req);
      const limit = Number(url.searchParams.get("limit") || 20);
      const notifications = await listNotifications(limit);
      return json(res, 200, notifications);
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

      const created = await createNotification(body);
      return json(res, 201, created);
    }

    if (req.method === "DELETE") {
      const user = requireRole(req, res, ["admin"]);
      if (!user) {
        return;
      }

      const url = parseUrl(req);
      const notificationId = String(url.searchParams.get("id") || "").trim();
      if (!notificationId) {
        return json(res, 400, { message: "id query param is required" });
      }

      const removed = await deleteNotification(notificationId);
      return json(res, 200, { ok: true, removed });
    }

    return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};
