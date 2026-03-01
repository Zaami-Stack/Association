const { getEnrollmentProgress, parsePositiveId, updateEnrollmentProgress } = require("../../_association");
const { json, methodNotAllowed, readJsonBody } = require("../../_utils");

module.exports = async function handler(req, res) {
  try {
    const enrollmentIdRaw = Array.isArray(req.query?.enrollmentId)
      ? req.query.enrollmentId[0]
      : req.query?.enrollmentId;
    const enrollmentId = parsePositiveId(enrollmentIdRaw);
    if (!enrollmentId) {
      return json(res, 400, { message: "Invalid enrollment id" });
    }

    if (req.method === "GET") {
      const progress = await getEnrollmentProgress(enrollmentId);
      return json(res, 200, progress);
    }

    if (req.method === "PATCH") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        return json(res, 400, { message: "invalid JSON body" });
      }

      const updated = await updateEnrollmentProgress(enrollmentId, body?.lessonId, body?.completed);
      return json(res, 200, updated);
    }

    return methodNotAllowed(res, ["GET", "PATCH"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

