const { json, methodNotAllowed } = require("../lib/utils");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  return json(res, 200, {
    status: "ok",
    service: "association-language-api",
    timestamp: new Date().toISOString()
  });
};

