import { useEffect, useMemo, useState } from "react";
import {
  createGalleryPhoto,
  createNotification,
  deleteGalleryPhoto,
  deleteNotification,
  enrollStudent,
  getAdminStudents,
  getCourses,
  getGalleryPhotos,
  getLanguages,
  getNotifications,
  getSession,
  getStats,
  login,
  logout,
  signup,
  updateGalleryPhoto
} from "./api";

const initialEnrollForm = {
  fullName: "",
  email: "",
  courseId: ""
};

const initialLoginForm = {
  email: "",
  password: ""
};

const initialSignupForm = {
  name: "",
  email: "",
  password: ""
};

const initialGalleryForm = {
  title: "",
  imageUrl: "",
  position: 0
};

const initialNotificationForm = {
  title: "",
  message: ""
};

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function App() {
  const [stats, setStats] = useState({
    languages: 0,
    courses: 0,
    lessons: 0,
    students: 0
  });
  const [languages, setLanguages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [search, setSearch] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [authMessage, setAuthMessage] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [enrollForm, setEnrollForm] = useState(initialEnrollForm);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");

  const [notifOpen, setNotifOpen] = useState(false);

  const [adminStudents, setAdminStudents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [galleryForm, setGalleryForm] = useState(initialGalleryForm);
  const [editingPhotoId, setEditingPhotoId] = useState("");
  const [gallerySubmitting, setGallerySubmitting] = useState(false);
  const [notificationForm, setNotificationForm] = useState(initialNotificationForm);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState("");

  const isAdmin = user?.role === "admin";

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return courses.filter((course) => {
      const languageMatch =
        selectedLanguage === "all" || String(course.languageId) === String(selectedLanguage);
      const searchMatch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.description.toLowerCase().includes(normalizedSearch);
      return languageMatch && searchMatch;
    });
  }, [courses, search, selectedLanguage]);

  useEffect(() => {
    void refreshSession();
    void refreshPublicData();
  }, []);

  useEffect(() => {
    if (!enrollForm.courseId && courses.length > 0) {
      setEnrollForm((previous) => ({ ...previous, courseId: String(courses[0].id) }));
    }
  }, [courses, enrollForm.courseId]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setAuthOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void refreshAdminStudents();
    } else {
      setAdminStudents([]);
      setAdminError("");
      setDashboardMessage("");
    }
  }, [isAdmin]);

  async function refreshSession() {
    setSessionLoading(true);
    try {
      const payload = await getSession();
      setUser(payload?.authenticated ? payload.user : null);
    } catch {
      setUser(null);
    } finally {
      setSessionLoading(false);
    }
  }

  async function refreshPublicData() {
    setLoadingCatalog(true);
    setCatalogError("");
    try {
      const [statsData, languageData, courseData, galleryData, notificationsData] = await Promise.all([
        getStats(),
        getLanguages(),
        getCourses(),
        getGalleryPhotos(),
        getNotifications(10)
      ]);
      setStats(statsData);
      setLanguages(languageData);
      setCourses(courseData);
      setGalleryPhotos(Array.isArray(galleryData) ? galleryData : []);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error) {
      setCatalogError(error.message || "Unable to load data.");
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function refreshAdminStudents() {
    setAdminLoading(true);
    setAdminError("");
    try {
      const students = await getAdminStudents();
      setAdminStudents(Array.isArray(students) ? students : []);
    } catch (error) {
      setAdminStudents([]);
      setAdminError(error.message || "Failed to load students.");
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleEnrollSubmit(event) {
    event.preventDefault();
    setEnrollSubmitting(true);
    setEnrollMessage("");

    try {
      const payload = {
        fullName: enrollForm.fullName.trim(),
        email: enrollForm.email.trim().toLowerCase(),
        courseId: Number(enrollForm.courseId)
      };
      const response = await enrollStudent(payload);
      setEnrollMessage(
        `Enrollment saved for ${response.student.fullName} in "${response.course.title}".`
      );
      setEnrollForm((previous) => ({ ...previous, fullName: "", email: "" }));
      await Promise.all([refreshPublicData(), isAdmin ? refreshAdminStudents() : Promise.resolve()]);
    } catch (error) {
      setEnrollMessage(error.message || "Enrollment failed.");
    } finally {
      setEnrollSubmitting(false);
    }
  }

  function jumpToEnroll(courseId) {
    setEnrollForm((previous) => ({ ...previous, courseId: String(courseId) }));
    setNotifOpen(false);
    const target = document.getElementById("enroll");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthMessage("");
    setAuthOpen(true);
    setNotifOpen(false);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthMessage("");
    try {
      const response = await login({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password
      });
      setUser(response.user);
      setLoginForm(initialLoginForm);
      setAuthOpen(false);
    } catch (error) {
      setAuthMessage(error.message || "Login failed.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthMessage("");
    try {
      const response = await signup({
        name: signupForm.name.trim(),
        email: signupForm.email.trim().toLowerCase(),
        password: signupForm.password
      });
      setUser(response.user);
      setSignupForm(initialSignupForm);
      setAuthOpen(false);
    } catch (error) {
      setAuthMessage(error.message || "Signup failed.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    setDashboardMessage("");
    try {
      await logout();
    } finally {
      setUser(null);
      setNotifOpen(false);
    }
  }

  function startEditPhoto(photo) {
    setEditingPhotoId(photo.id);
    setGalleryForm({
      title: photo.title,
      imageUrl: photo.imageUrl,
      position: Number(photo.position || 0)
    });
    setDashboardMessage("");
  }

  function cancelPhotoEdit() {
    setEditingPhotoId("");
    setGalleryForm(initialGalleryForm);
    setDashboardMessage("");
  }

  async function handleSavePhoto(event) {
    event.preventDefault();
    setGallerySubmitting(true);
    setDashboardMessage("");
    try {
      const payload = {
        title: galleryForm.title.trim(),
        imageUrl: galleryForm.imageUrl.trim(),
        position: Number(galleryForm.position || 0)
      };

      if (editingPhotoId) {
        await updateGalleryPhoto(editingPhotoId, payload);
        setDashboardMessage("Gallery photo updated.");
      } else {
        await createGalleryPhoto(payload);
        setDashboardMessage("Gallery photo created.");
      }
      cancelPhotoEdit();
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || "Could not save gallery photo.");
    } finally {
      setGallerySubmitting(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    setDashboardMessage("");
    try {
      await deleteGalleryPhoto(photoId);
      if (editingPhotoId === photoId) {
        cancelPhotoEdit();
      }
      setDashboardMessage("Gallery photo removed.");
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || "Could not remove gallery photo.");
    }
  }

  async function handleCreateNotification(event) {
    event.preventDefault();
    setNotificationSubmitting(true);
    setDashboardMessage("");
    try {
      await createNotification({
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim()
      });
      setNotificationForm(initialNotificationForm);
      setDashboardMessage("Notification published.");
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || "Could not publish notification.");
    } finally {
      setNotificationSubmitting(false);
    }
  }

  async function handleDeleteNotification(notificationId) {
    setDashboardMessage("");
    try {
      await deleteNotification(notificationId);
      setDashboardMessage("Notification removed.");
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || "Could not remove notification.");
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="container nav">
          <div className="logo" aria-label="Maison de Savoir">
            <img src="/aaaaa.jfif" alt="Maison de Savoir logo" />
            <div className="logo-text">Maison de Savoir</div>
          </div>

          <div className="nav-actions">
            <nav>
              <a href="#home" onClick={() => setNotifOpen(false)}>
                Home
              </a>
              <a href="#courses" onClick={() => setNotifOpen(false)}>
                Courses
              </a>
              <a href="#gallery" onClick={() => setNotifOpen(false)}>
                Gallery
              </a>
              <a href="#enroll" onClick={() => setNotifOpen(false)}>
                Enroll
              </a>
              {isAdmin ? (
                <a href="#dashboard" onClick={() => setNotifOpen(false)}>
                  Dashboard
                </a>
              ) : null}
            </nav>

            <div className="notif-wrap">
              <button
                type="button"
                className="notif-btn"
                aria-label="Notifications"
                onClick={() => setNotifOpen((previous) => !previous)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
                </svg>
                <span className="notif-badge">{notifications.length}</span>
              </button>

              {notifOpen ? (
                <div className="notif-menu">
                  <div className="notif-menu-title">Notifications</div>
                  {notifications.length === 0 ? <p className="notif-empty">No notifications.</p> : null}
                  {notifications.map((note) => (
                    <article key={note.id} className="notif-item">
                      <p>{note.title}</p>
                      <span>{formatDate(note.createdAt)}</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="auth-actions">
              {sessionLoading ? <span className="auth-chip">Loading...</span> : null}
              {!sessionLoading && !user ? (
                <>
                  <button type="button" className="nav-small-btn" onClick={() => openAuth("login")}>
                    Login
                  </button>
                  <button type="button" className="nav-small-btn alt" onClick={() => openAuth("signup")}>
                    Sign Up
                  </button>
                </>
              ) : null}
              {!sessionLoading && user ? (
                <>
                  <span className="auth-chip">{user.name || user.email}</span>
                  <button type="button" className="nav-small-btn alt" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="container hero-content">
          <p className="hero-tag">Global communication starts here</p>
          <h1>
            Learn Spanish, English, and more
            <span> at Maison de Savoir</span>
          </h1>
          <p className="hero-desc">
            Explore structured courses, enroll students, and follow learning progress step by step.
          </p>
          <a className="hero-btn" href="#courses" onClick={() => setNotifOpen(false)}>
            Start Learning
          </a>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-grid">
          <article className="stat-card">
            <strong>{stats.languages}</strong>
            <span>Languages</span>
          </article>
          <article className="stat-card">
            <strong>{stats.courses}</strong>
            <span>Courses</span>
          </article>
          <article className="stat-card">
            <strong>{stats.lessons}</strong>
            <span>Lessons</span>
          </article>
          <article className="stat-card">
            <strong>{stats.students}</strong>
            <span>Students</span>
          </article>
        </div>
      </section>

      <section id="courses" className="courses">
        <div className="container">
          <div className="section-head">
            <h2>Language Courses</h2>
            <p>Choose a language track and enroll instantly.</p>
          </div>

          <div className="filters">
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
            >
              <option value="all">All languages</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search by course name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {catalogError ? <p className="status error">{catalogError}</p> : null}
          {loadingCatalog ? <p className="status">Loading courses...</p> : null}

          {!loadingCatalog ? (
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <article key={course.id} className="course-card">
                  <div
                    className="course-image"
                    style={{
                      backgroundImage: `linear-gradient(rgba(5, 29, 43, 0.58), rgba(8, 47, 64, 0.62)), url(${course.imageUrl})`
                    }}
                  >
                    <span className="pill">{course.languageName}</span>
                  </div>
                  <div className="course-content">
                    <h3>{course.title}</h3>
                    <p className="meta">
                      {course.level} | {course.durationWeeks} weeks | {course.lessonCount} lessons
                    </p>
                    <p>{course.description}</p>
                    <button type="button" onClick={() => jumpToEnroll(course.id)}>
                      Enroll in this course
                    </button>
                  </div>
                </article>
              ))}
              {!filteredCourses.length ? (
                <p className="status">No courses match your current filter.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section id="gallery" className="gallery">
        <div className="container">
          <div className="section-head">
            <h2>Learning Gallery</h2>
            <p>Snapshots from language sessions, workshops, and student activities.</p>
          </div>

          <div className="gallery-grid">
            {galleryPhotos.map((photo, index) => (
              <article
                key={photo.id}
                className={`gallery-card ${index === 0 ? "gallery-card-featured" : ""}`}
              >
                <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
                <div className="gallery-caption">{photo.title}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="enroll" className="enroll">
        <div className="container enroll-wrap">
          <div>
            <h2>Enroll a Student</h2>
            <p>
              Use this form to register a student with email and name, then connect them to the
              right course.
            </p>
          </div>
          <form className="enroll-form" onSubmit={handleEnrollSubmit}>
            <input
              type="text"
              placeholder="Full name"
              value={enrollForm.fullName}
              onChange={(event) =>
                setEnrollForm((previous) => ({ ...previous, fullName: event.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={enrollForm.email}
              onChange={(event) =>
                setEnrollForm((previous) => ({ ...previous, email: event.target.value }))
              }
              required
            />
            <select
              value={enrollForm.courseId}
              onChange={(event) =>
                setEnrollForm((previous) => ({ ...previous, courseId: event.target.value }))
              }
              required
            >
              {courses.map((course) => (
                <option key={`enroll-${course.id}`} value={course.id}>
                  {course.title} ({course.languageName})
                </option>
              ))}
            </select>
            <button type="submit" disabled={enrollSubmitting}>
              {enrollSubmitting ? "Saving..." : "Create Enrollment"}
            </button>
            {enrollMessage ? <p className="status">{enrollMessage}</p> : null}
          </form>
        </div>
      </section>

      {isAdmin ? (
        <section id="dashboard" className="dashboard">
          <div className="container">
            <div className="section-head">
              <h2>Admin Dashboard</h2>
              <p>Only admin can access this section.</p>
            </div>
            {dashboardMessage ? <p className="status">{dashboardMessage}</p> : null}
            {adminError ? <p className="status error">{adminError}</p> : null}

            <div className="admin-grid">
              <article className="admin-card">
                <h3>Manage Gallery</h3>
                <form className="admin-form" onSubmit={handleSavePhoto}>
                  <input
                    type="text"
                    placeholder="Photo title"
                    value={galleryForm.title}
                    onChange={(event) =>
                      setGalleryForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={galleryForm.imageUrl}
                    onChange={(event) =>
                      setGalleryForm((previous) => ({ ...previous, imageUrl: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Position"
                    value={galleryForm.position}
                    onChange={(event) =>
                      setGalleryForm((previous) => ({
                        ...previous,
                        position: Number(event.target.value || 0)
                      }))
                    }
                    min="0"
                  />
                  <div className="admin-form-actions">
                    <button type="submit" disabled={gallerySubmitting}>
                      {gallerySubmitting
                        ? "Saving..."
                        : editingPhotoId
                          ? "Update Photo"
                          : "Add Photo"}
                    </button>
                    {editingPhotoId ? (
                      <button type="button" className="secondary-btn" onClick={cancelPhotoEdit}>
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
                <div className="admin-list">
                  {galleryPhotos.map((photo) => (
                    <div key={`admin-photo-${photo.id}`} className="admin-row">
                      <div>
                        <strong>{photo.title}</strong>
                        <p>#{photo.position}</p>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="secondary-btn" onClick={() => startEditPhoto(photo)}>
                          Edit
                        </button>
                        <button type="button" className="danger-btn" onClick={() => handleDeletePhoto(photo.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-card">
                <h3>Manage Notifications</h3>
                <form className="admin-form" onSubmit={handleCreateNotification}>
                  <input
                    type="text"
                    placeholder="Notification title"
                    value={notificationForm.title}
                    onChange={(event) =>
                      setNotificationForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    required
                  />
                  <textarea
                    placeholder="Notification message"
                    value={notificationForm.message}
                    onChange={(event) =>
                      setNotificationForm((previous) => ({ ...previous, message: event.target.value }))
                    }
                  />
                  <button type="submit" disabled={notificationSubmitting}>
                    {notificationSubmitting ? "Publishing..." : "Publish Notification"}
                  </button>
                </form>
                <div className="admin-list">
                  {notifications.map((notification) => (
                    <div key={`admin-note-${notification.id}`} className="admin-row">
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{formatDate(notification.createdAt)}</p>
                      </div>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="admin-card student-card">
              <div className="student-head">
                <h3>Track Students</h3>
                <button type="button" className="secondary-btn" onClick={() => refreshAdminStudents()}>
                  Refresh
                </button>
              </div>
              {adminLoading ? <p className="status">Loading students...</p> : null}
              {!adminLoading && adminStudents.length === 0 ? (
                <p className="status">No students found yet.</p>
              ) : null}
              <div className="student-list">
                {adminStudents.map((student) => (
                  <div key={`student-${student.studentId}`} className="student-row">
                    <div className="student-main">
                      <strong>{student.fullName}</strong>
                      <p>{student.email}</p>
                    </div>
                    <div className="student-metrics">
                      <span>Enrollments: {student.enrollmentCount}</span>
                      <span>
                        Progress: {student.completedLessons}/{student.totalLessons} ({student.completionRate}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <footer className="footer">
        <div className="container">
          <p>Maison de Savoir | Language learning for every level.</p>
        </div>
      </footer>

      {authOpen ? (
        <div className="auth-modal-overlay" onClick={() => setAuthOpen(false)}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="auth-close" onClick={() => setAuthOpen(false)}>
              x
            </button>
            {authMode === "login" ? (
              <>
                <h3>Login</h3>
                <p>Use your account credentials.</p>
                <form className="auth-form" onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((previous) => ({ ...previous, email: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((previous) => ({ ...previous, password: event.target.value }))
                    }
                    required
                  />
                  <button type="submit" disabled={authSubmitting}>
                    {authSubmitting ? "Signing in..." : "Login"}
                  </button>
                </form>
                <button type="button" className="auth-switch" onClick={() => setAuthMode("signup")}>
                  Need an account? Sign up
                </button>
              </>
            ) : (
              <>
                <h3>Sign Up</h3>
                <p>Create a student account.</p>
                <form className="auth-form" onSubmit={handleSignup}>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={signupForm.name}
                    onChange={(event) =>
                      setSignupForm((previous) => ({ ...previous, name: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={signupForm.email}
                    onChange={(event) =>
                      setSignupForm((previous) => ({ ...previous, email: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (min 8 chars)"
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((previous) => ({ ...previous, password: event.target.value }))
                    }
                    required
                  />
                  <button type="submit" disabled={authSubmitting}>
                    {authSubmitting ? "Creating..." : "Sign Up"}
                  </button>
                </form>
                <button type="button" className="auth-switch" onClick={() => setAuthMode("login")}>
                  Already have an account? Login
                </button>
              </>
            )}
            {authMessage ? <p className="status error">{authMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
