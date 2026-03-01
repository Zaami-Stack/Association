import { useEffect, useMemo, useState } from "react";
import { enrollStudent, getCourses, getLanguages, getStats } from "./api";

const initialEnrollForm = {
  fullName: "",
  email: "",
  courseId: ""
};

const galleryPhotos = [
  {
    src: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
    title: "Conversation Circle"
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    title: "Team Practice"
  },
  {
    src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
    title: "Spanish Workshop"
  },
  {
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    title: "Fluency Lab"
  },
  {
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    title: "Business English"
  },
  {
    src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80",
    title: "French Foundations"
  }
];

const navNotifications = [
  { id: 1, title: "Spanish A1 batch opens Monday", time: "Today" },
  { id: 2, title: "English speaking workshop this week", time: "2h ago" },
  { id: 3, title: "Enrollment deadline update posted", time: "1d ago" }
];

function App() {
  const [stats, setStats] = useState({
    languages: 0,
    courses: 0,
    lessons: 0,
    students: 0
  });
  const [languages, setLanguages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [search, setSearch] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [enrollForm, setEnrollForm] = useState(initialEnrollForm);
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

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
    void refreshCatalog();
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
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function refreshCatalog() {
    setLoadingCatalog(true);
    setCatalogError("");
    try {
      const [statsData, languageData, courseData] = await Promise.all([
        getStats(),
        getLanguages(),
        getCourses()
      ]);
      setStats(statsData);
      setLanguages(languageData);
      setCourses(courseData);
    } catch (error) {
      setCatalogError(error.message || "Unable to load data.");
    } finally {
      setLoadingCatalog(false);
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
      await refreshCatalog();
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

  return (
    <div className="page">
      <header className="header">
        <div className="container nav">
          <div className="logo">
            Association <span>Academy</span>
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
                <span className="notif-badge">{navNotifications.length}</span>
              </button>

              {notifOpen ? (
                <div className="notif-menu">
                  <div className="notif-menu-title">Notifications</div>
                  {navNotifications.map((note) => (
                    <article key={note.id} className="notif-item">
                      <p>{note.title}</p>
                      <span>{note.time}</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="container hero-content">
          <p className="hero-tag">Global communication starts here</p>
          <h1>
            Learn Spanish, English, and more with your new full-stack
            <span> Association Web Platform</span>
          </h1>
          <p className="hero-desc">
            Explore structured courses, enroll students, and track lesson progress with a complete
            backend + frontend + database workflow.
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
                key={photo.title}
                className={`gallery-card ${index === 0 ? "gallery-card-featured" : ""}`}
              >
                <img src={photo.src} alt={photo.title} loading="lazy" />
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
              Use this form to register a student with email and name. The backend will create the
              student and enrollment record in the database.
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

      <footer className="footer">
        <div className="container">
          <p>Association Language Academy | Full-stack language learning platform.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

