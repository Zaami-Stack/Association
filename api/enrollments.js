const { createEnrollment, listEnrollmentsByEmail } = require("./_association");
const { json, methodNotAllowed, parseUrl, readJsonBody } = require("./_utils");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = parseUrl(req);
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

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    return json(res, Number(error.status || 500), {
      message: error.message || "internal server error"
    });
  }
};

