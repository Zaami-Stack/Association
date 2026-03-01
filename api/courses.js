const { getCourses } = require("./_association");
const { json, methodNotAllowed, parseUrl } = require("./_utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET"]);
    }

    const url = parseUrl(req);
    const courses = await getCourses({
      languageId: url.searchParams.get("languageId"),
      search: url.searchParams.get("search")
    });

    return json(res, 200, courses);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

