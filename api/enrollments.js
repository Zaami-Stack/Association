const {
  createEnrollment,
  getEnrollmentProgress,
  parsePositiveId,
  listEnrollmentsByEmail,
  updateEnrollmentProgress
} = require("../lib/association");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("../lib/utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = parseUrl(req);
      const enrollmentIdRaw = url.searchParams.get("enrollmentId");
      if (enrollmentIdRaw !== null) {
        const enrollmentId = parsePositiveId(enrollmentIdRaw);
        if (!enrollmentId) {
          return json(res, 400, { message: "Invalid enrollment id" });
        }
        const progress = await getEnrollmentProgress(enrollmentId);
        return json(res, 200, progress);
      }

      const email = url.searchParams.get("email");
      const enrollments = await listEnrollmentsByEmail(email);
      return json(res, 200, enrollments);
    }

    if (req.method === "POST") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return json(res, 400, { message: "invalid JSON body" });
      }

      const result = await createEnrollment(body);
      return json(res, 201, result);
    }

    if (req.method === "PATCH") {
      const url = parseUrl(req);
      const enrollmentIdRaw = url.searchParams.get("enrollmentId");
      const enrollmentId = parsePositiveId(enrollmentIdRaw);
      if (!enrollmentId) {
        return json(res, 400, { message: "Invalid enrollment id" });
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return json(res, 400, { message: "invalid JSON body" });
      }

      const updated = await updateEnrollmentProgress(enrollmentId, body?.lessonId, body?.completed);
      return json(res, 200, updated);
    }

    return methodNotAllowed(res, ["GET", "POST", "PATCH"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};
