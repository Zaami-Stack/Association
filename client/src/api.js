const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
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
  return request(`/courses?courseId=${encodeURIComponent(String(courseId))}`);
}

function getGalleryPhotos() {
  return request("/gallery");
}

function createGalleryPhoto(payload) {
  return request("/gallery", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function updateGalleryPhoto(photoId, payload) {
  return request(`/gallery?id=${encodeURIComponent(String(photoId))}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

function deleteGalleryPhoto(photoId) {
  return request(`/gallery?id=${encodeURIComponent(String(photoId))}`, {
    method: "DELETE"
  });
}

function getNotifications(limit = 20) {
  return request(`/notifications?limit=${encodeURIComponent(String(limit))}`);
}

function createNotification(payload) {
  return request("/notifications", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function deleteNotification(notificationId) {
  return request(`/notifications?id=${encodeURIComponent(String(notificationId))}`, {
    method: "DELETE"
  });
}

function getAdminStudents() {
  return request("/admin/students");
}

function getSession() {
  return request("/auth");
}

function login(payload) {
  return request("/auth?action=login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function signup(payload) {
  return request("/auth?action=signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function logout() {
  return request("/auth?action=logout", {
    method: "POST",
    body: JSON.stringify({})
  });
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
  return request(`/enrollments?enrollmentId=${encodeURIComponent(String(enrollmentId))}`);
}

function updateLessonProgress(enrollmentId, lessonId, completed) {
  return request(`/enrollments?enrollmentId=${encodeURIComponent(String(enrollmentId))}`, {
    method: "PATCH",
    body: JSON.stringify({ lessonId, completed })
  });
}

export {
  createGalleryPhoto,
  createNotification,
  enrollStudent,
  deleteGalleryPhoto,
  deleteNotification,
  getAdminStudents,
  getCourseDetails,
  getCourses,
  getEnrollmentProgress,
  getGalleryPhotos,
  getLanguages,
  getNotifications,
  getSession,
  getStats,
  getStudentEnrollments,
  login,
  logout,
  signup,
  updateGalleryPhoto,
  updateLessonProgress
};
