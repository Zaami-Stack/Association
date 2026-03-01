const { getLanguages } = require("./_association");
const { json, methodNotAllowed } = require("./_utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET"]);
    }

    const languages = await getLanguages();
    return json(res, 200, languages);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

