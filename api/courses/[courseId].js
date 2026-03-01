const { getCourseDetails, parsePositiveId } = require("../_association");
const { json, methodNotAllowed } = require("../_utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET"]);
    }

    const courseId = Array.isArray(req.query?.courseId) ? req.query.courseId[0] : req.query?.courseId;
    const normalizedCourseId = parsePositiveId(courseId);
    if (!normalizedCourseId) {
      return json(res, 400, { message: "Invalid course id" });
    }

    const details = await getCourseDetails(normalizedCourseId);
    return json(res, 200, details);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

