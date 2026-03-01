const { requireRole } = require("../../lib/auth");
const { listStudentsOverview } = require("../../lib/dashboard");
const { json, methodNotAllowed } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET"]);
    }

    const user = requireRole(req, res, ["admin"]);
    if (!user) {
      return;
    }

    const students = await listStudentsOverview();
    return json(res, 200, students);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};
