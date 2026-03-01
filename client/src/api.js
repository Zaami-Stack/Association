const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const error = new Error(errorPayload.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function getStats() {
  return request("/stats");
}

function getLanguages() {
  return request("/languages");
}

function getCourses(filters = {}) {
  const params = new URLSearchParams();

  if (filters.languageId && filters.languageId !== "all") {
    params.set("languageId", String(filters.languageId));
  }
  if (filters.search) {
    params.set("search", String(filters.search));
  }

  const query = params.toString();
  return request(`/courses${query ? `?${query}` : ""}`);
}

function getCourseDetails(courseId) {
  return request(`/courses/${courseId}`);
}

function enrollStudent(payload) {
  return request("/enrollments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function getStudentEnrollments(email) {
  const params = new URLSearchParams({ email });
  return request(`/enrollments?${params.toString()}`);
}

function getEnrollmentProgress(enrollmentId) {
  return request(`/enrollments/${enrollmentId}/progress`);
}

function updateLessonProgress(enrollmentId, lessonId, completed) {
  return request(`/enrollments/${enrollmentId}/progress`, {
    method: "PATCH",
    body: JSON.stringify({ lessonId, completed })
  });
}

export {
  enrollStudent,
  getCourseDetails,
  getCourses,
  getEnrollmentProgress,
  getLanguages,
  getStats,
  getStudentEnrollments,
  updateLessonProgress
};

