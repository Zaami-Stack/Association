const { getCourseDetails, getCourses, parsePositiveId } = require("../lib/association");
const { json, methodNotAllowed, parseUrl } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET"]);
    }

    const url = parseUrl(req);
    const courseId = url.searchParams.get("courseId");
    if (courseId !== null) {
      const normalizedCourseId = parsePositiveId(courseId);
      if (!normalizedCourseId) {
        return json(res, 400, { message: "Invalid course id" });
      }
      const details = await getCourseDetails(normalizedCourseId);
      return json(res, 200, details);
    }

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
