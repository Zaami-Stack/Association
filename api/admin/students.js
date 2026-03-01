const { requireRole } = require("../_auth");
const { listStudentsOverview } = require("../_dashboard");
const { json, methodNotAllowed } = require("../_utils");

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

