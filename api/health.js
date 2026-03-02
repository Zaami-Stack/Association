const { json, methodNotAllowed } = require("../lib/utils");
const { isDatabaseConfigured } = require("../lib/db");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const databaseConfigured = isDatabaseConfigured();

  return json(res, 200, {
    status: "ok",
    service: "association-language-api",
    timestamp: new Date().toISOString(),
    persistence: databaseConfigured ? "supabase" : "in-memory-fallback",
    databaseConfigured
  });
};

