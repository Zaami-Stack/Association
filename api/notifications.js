const { requireRole } = require("./_auth");
const { createNotification, listNotifications } = require("./_dashboard");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("./_utils");

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

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

