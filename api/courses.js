const {
  createCourse,
  deleteCourse,
  getCourseDetails,
  getCourses,
  parsePositiveId,
  updateCourse
} = require("../lib/association");
const { requireRole } = require("../lib/auth");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
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

      const created = await createCourse(body);
      return json(res, 201, created);
    }

    if (req.method === "DELETE") {
      const user = requireRole(req, res, ["admin"]);
      if (!user) {
        return;
      }

      const url = parseUrl(req);
      const courseId = parsePositiveId(url.searchParams.get("id"));
      if (!courseId) {
        return json(res, 400, { message: "id query param is required" });
      }

      const removed = await deleteCourse(courseId);
      return json(res, 200, { ok: true, removed });
    }

    if (req.method === "PATCH") {
      const user = requireRole(req, res, ["admin"]);
      if (!user) {
        return;
      }

      const url = parseUrl(req);
      const courseId = parsePositiveId(url.searchParams.get("id"));
      if (!courseId) {
        return json(res, 400, { message: "id query param is required" });
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return json(res, 400, { message: "invalid JSON body" });
      }

      const updated = await updateCourse(courseId, body);
      return json(res, 200, updated);
    }

    if (req.method !== "GET") {
      return methodNotAllowed(res, ["GET", "POST", "PATCH", "DELETE"]);
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
