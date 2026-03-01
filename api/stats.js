const { getStats } = require("./_association");
const { json, methodNotAllowed } = require("./_utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET"]);
    }

    const stats = await getStats();
    return json(res, 200, stats);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

