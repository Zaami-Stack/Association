const { dbRequest, ensureSeedAssociationData, isDatabaseConfigured, toInFilter } = require("./_db");
const { getStore } = require("./_store");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsePositiveId(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseBoolean(value) {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return null;
}

function parseKeyPhrases(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function nextNumericId(rows) {
  const max = rows.reduce((acc, row) => Math.max(acc, Number(row.id) || 0), 0);
  return max + 1;
}

function normalizeCourseFilter(filters = {}) {
  const languageId = filters.languageId !== undefined ? parsePositiveId(filters.languageId) : null;
  const search = String(filters.search || "")
    .trim()
    .toLowerCase();
  return { languageId, search };
}

function applyCourseFilter(courses, { languageId, search }) {
  return courses.filter((course) => {
    const languageMatch = !languageId || Number(course.languageId) === languageId;
    const searchMatch =
      !search ||
      String(course.title || "")
        .toLowerCase()
        .includes(search) ||
      String(course.description || "")
        .toLowerCase()
        .includes(search);
    return languageMatch && searchMatch;
  });
}

async function getStats() {
  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const [languages, courses, lessons, students] = await Promise.all([
      dbRequest({ table: "languages", method: "GET", query: { select: "id" }, prefer: null }),
      dbRequest({ table: "courses", method: "GET", query: { select: "id" }, prefer: null }),
      dbRequest({ table: "lessons", method: "GET", query: { select: "id" }, prefer: null }),
      dbRequest({ table: "students", method: "GET", query: { select: "id" }, prefer: null })
    ]);

    return {
      languages: languages.length,
      courses: courses.length,
      lessons: lessons.length,
      students: students.length
    };
  }

  const store = getStore();
  return {
    languages: store.languages.length,
    courses: store.courses.length,
    lessons: store.lessons.length,
    students: store.students.length
  };
}

async function getLanguages() {
  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const [languages, courses] = await Promise.all([
      dbRequest({
        table: "languages",
        method: "GET",
        query: { select: "id,name,description", order: "name.asc" },
        prefer: null
      }),
      dbRequest({
        table: "courses",
        method: "GET",
        query: { select: "id,language_id" },
        prefer: null
      })
    ]);

    const countsByLanguage = new Map();
    for (const course of courses) {
      const key = Number(course.language_id);
      countsByLanguage.set(key, (countsByLanguage.get(key) || 0) + 1);
    }

    return languages.map((language) => ({
      id: Number(language.id),
      name: language.name,
      description: language.description || "",
      courseCount: countsByLanguage.get(Number(language.id)) || 0
    }));
  }

  const store = getStore();
  return [...store.languages]
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((language) => ({
      ...language,
      courseCount: store.courses.filter((course) => Number(course.languageId) === Number(language.id))
        .length
    }));
}

async function getCourses(filters = {}) {
  const normalizedFilters = normalizeCourseFilter(filters);

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const [courses, languages, lessons] = await Promise.all([
      dbRequest(
        {
          table: "courses",
          method: "GET",
          query: {
            select: "id,language_id,title,level,duration_weeks,description,image_url,created_at",
            order: "id.asc"
          },
          prefer: null
        }
      ),
      dbRequest({
        table: "languages",
        method: "GET",
        query: { select: "id,name" },
        prefer: null
      }),
      dbRequest({
        table: "lessons",
        method: "GET",
        query: { select: "id,course_id" },
        prefer: null
      })
    ]);

    const languageMap = new Map(languages.map((row) => [Number(row.id), row.name]));
    const lessonCountByCourse = new Map();
    for (const lesson of lessons) {
      const key = Number(lesson.course_id);
      lessonCountByCourse.set(key, (lessonCountByCourse.get(key) || 0) + 1);
    }

    const normalizedCourses = courses.map((course) => ({
      id: Number(course.id),
      languageId: Number(course.language_id),
      title: course.title,
      level: course.level,
      durationWeeks: Number(course.duration_weeks),
      description: course.description || "",
      imageUrl: course.image_url || "",
      languageName: languageMap.get(Number(course.language_id)) || "Unknown",
      lessonCount: lessonCountByCourse.get(Number(course.id)) || 0,
      createdAt: course.created_at || null
    }));

    return applyCourseFilter(normalizedCourses, normalizedFilters);
  }

  const store = getStore();
  const languageMap = new Map(store.languages.map((language) => [Number(language.id), language.name]));
  const lessonCountByCourse = new Map();
  for (const lesson of store.lessons) {
    const key = Number(lesson.courseId);
    lessonCountByCourse.set(key, (lessonCountByCourse.get(key) || 0) + 1);
  }

  const courses = store.courses.map((course) => ({
    ...course,
    languageName: languageMap.get(Number(course.languageId)) || "Unknown",
    lessonCount: lessonCountByCourse.get(Number(course.id)) || 0
  }));

  return applyCourseFilter(courses, normalizedFilters);
}

async function getCourseDetails(courseId) {
  const normalizedCourseId = parsePositiveId(courseId);
  if (!normalizedCourseId) {
    const error = new Error("Invalid course id");
    error.status = 400;
    throw error;
  }

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const courseRows = await dbRequest({
      table: "courses",
      method: "GET",
      query: {
        select: "id,language_id,title,level,duration_weeks,description,image_url,created_at",
        id: `eq.${normalizedCourseId}`,
        limit: 1
      },
      prefer: null
    });

    if (!Array.isArray(courseRows) || courseRows.length === 0) {
      const error = new Error("Course not found");
      error.status = 404;
      throw error;
    }

    const course = courseRows[0];
    const [languageRows, lessonRows] = await Promise.all([
      dbRequest({
        table: "languages",
        method: "GET",
        query: { select: "id,name", id: `eq.${course.language_id}`, limit: 1 },
        prefer: null
      }),
      dbRequest({
        table: "lessons",
        method: "GET",
        query: {
          select: "id,title,summary,lesson_order,key_phrases",
          course_id: `eq.${normalizedCourseId}`,
          order: "lesson_order.asc"
        },
        prefer: null
      })
    ]);

    return {
      id: Number(course.id),
      languageId: Number(course.language_id),
      title: course.title,
      level: course.level,
      durationWeeks: Number(course.duration_weeks),
      description: course.description || "",
      imageUrl: course.image_url || "",
      languageName: languageRows[0]?.name || "Unknown",
      createdAt: course.created_at || null,
      lessons: lessonRows.map((lesson) => ({
        lessonId: Number(lesson.id),
        title: lesson.title,
        summary: lesson.summary || "",
        lessonOrder: Number(lesson.lesson_order),
        keyPhrases: parseKeyPhrases(lesson.key_phrases)
      }))
    };
  }

  const store = getStore();
  const course = store.courses.find((item) => Number(item.id) === normalizedCourseId);
  if (!course) {
    const error = new Error("Course not found");
    error.status = 404;
    throw error;
  }

  const language = store.languages.find((item) => Number(item.id) === Number(course.languageId));
  const lessons = store.lessons
    .filter((lesson) => Number(lesson.courseId) === normalizedCourseId)
    .sort((a, b) => Number(a.lessonOrder) - Number(b.lessonOrder))
    .map((lesson) => ({
      lessonId: Number(lesson.id),
      title: lesson.title,
      summary: lesson.summary || "",
      lessonOrder: Number(lesson.lessonOrder),
      keyPhrases: Array.isArray(lesson.keyPhrases) ? lesson.keyPhrases : []
    }));

  return {
    ...course,
    languageName: language?.name || "Unknown",
    lessons
  };
}

function normalizeEnrollmentPayload(body) {
  const fullName = String(body?.fullName || "").trim();
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const courseId = parsePositiveId(body?.courseId);

  if (fullName.length < 2) {
    const error = new Error("fullName must be at least 2 characters");
    error.status = 400;
    throw error;
  }

  if (!EMAIL_REGEX.test(email)) {
    const error = new Error("email is invalid");
    error.status = 400;
    throw error;
  }

  if (!courseId) {
    const error = new Error("courseId must be a positive integer");
    error.status = 400;
    throw error;
  }

  return { fullName, email, courseId };
}

async function createEnrollment(body) {
  const payload = normalizeEnrollmentPayload(body);

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const courseRows = await dbRequest({
      table: "courses",
      method: "GET",
      query: { select: "id,title", id: `eq.${payload.courseId}`, limit: 1 },
      prefer: null
    });

    if (!Array.isArray(courseRows) || courseRows.length === 0) {
      const error = new Error("Course not found");
      error.status = 404;
      throw error;
    }

    await dbRequest({
      table: "students",
      method: "POST",
      query: { on_conflict: "email" },
      body: {
        full_name: payload.fullName,
        email: payload.email
      },
      prefer: "resolution=merge-duplicates,return=representation"
    });

    const studentRows = await dbRequest({
      table: "students",
      method: "GET",
      query: { select: "id,full_name,email", email: `eq.${payload.email}`, limit: 1 },
      prefer: null
    });

    const studentRow = studentRows[0];
    const enrollmentRows = await dbRequest({
      table: "enrollments",
      method: "GET",
      query: {
        select: "id,enrolled_at",
        student_id: `eq.${studentRow.id}`,
        course_id: `eq.${payload.courseId}`,
        limit: 1
      },
      prefer: null
    });

    let enrollmentRow = enrollmentRows[0];
    if (!enrollmentRow) {
      const createdEnrollmentRows = await dbRequest({
        table: "enrollments",
        method: "POST",
        body: {
          student_id: studentRow.id,
          course_id: payload.courseId
        }
      });
      enrollmentRow = createdEnrollmentRows[0];
    }

    const lessonRows = await dbRequest({
      table: "lessons",
      method: "GET",
      query: { select: "id", course_id: `eq.${payload.courseId}` },
      prefer: null
    });

    if (lessonRows.length > 0) {
      await dbRequest({
        table: "lesson_progress",
        method: "POST",
        query: { on_conflict: "enrollment_id,lesson_id" },
        body: lessonRows.map((lesson) => ({
          enrollment_id: enrollmentRow.id,
          lesson_id: lesson.id
        })),
        prefer: "resolution=ignore-duplicates,return=minimal"
      });
    }

    return {
      enrollmentId: Number(enrollmentRow.id),
      enrolledAt: enrollmentRow.enrolled_at,
      student: {
        id: Number(studentRow.id),
        fullName: studentRow.full_name,
        email: studentRow.email
      },
      course: {
        id: Number(courseRows[0].id),
        title: courseRows[0].title
      }
    };
  }

  const store = getStore();
  const course = store.courses.find((item) => Number(item.id) === Number(payload.courseId));
  if (!course) {
    const error = new Error("Course not found");
    error.status = 404;
    throw error;
  }

  let student = store.students.find((item) => item.email === payload.email);
  if (!student) {
    student = {
      id: nextNumericId(store.students),
      fullName: payload.fullName,
      email: payload.email,
      createdAt: new Date().toISOString()
    };
    store.students.push(student);
  } else {
    student.fullName = payload.fullName;
  }

  let enrollment = store.enrollments.find(
    (item) => Number(item.studentId) === Number(student.id) && Number(item.courseId) === Number(course.id)
  );
  if (!enrollment) {
    enrollment = {
      id: nextNumericId(store.enrollments),
      studentId: student.id,
      courseId: course.id,
      enrolledAt: new Date().toISOString()
    };
    store.enrollments.push(enrollment);
  }

  const lessons = store.lessons.filter((lesson) => Number(lesson.courseId) === Number(course.id));
  for (const lesson of lessons) {
    const exists = store.lessonProgress.some(
      (progress) =>
        Number(progress.enrollmentId) === Number(enrollment.id) && Number(progress.lessonId) === Number(lesson.id)
    );
    if (!exists) {
      store.lessonProgress.push({
        id: nextNumericId(store.lessonProgress),
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        isCompleted: false,
        completedAt: null
      });
    }
  }

  return {
    enrollmentId: enrollment.id,
    enrolledAt: enrollment.enrolledAt,
    student,
    course: {
      id: course.id,
      title: course.title
    }
  };
}

function validateEmail(email) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    const error = new Error("Valid email query param is required");
    error.status = 400;
    throw error;
  }

  return normalizedEmail;
}

async function listEnrollmentsByEmail(email) {
  const normalizedEmail = validateEmail(email);

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const studentRows = await dbRequest({
      table: "students",
      method: "GET",
      query: { select: "id", email: `eq.${normalizedEmail}`, limit: 1 },
      prefer: null
    });

    const student = studentRows[0];
    if (!student) {
      return [];
    }

    const enrollmentRows = await dbRequest({
      table: "enrollments",
      method: "GET",
      query: {
        select: "id,course_id,enrolled_at",
        student_id: `eq.${student.id}`,
        order: "enrolled_at.desc"
      },
      prefer: null
    });

    if (enrollmentRows.length === 0) {
      return [];
    }

    const courseIds = [...new Set(enrollmentRows.map((row) => Number(row.course_id)))];
    const enrollmentIds = enrollmentRows.map((row) => Number(row.id));

    const [courseRows, languageRows, progressRows] = await Promise.all([
      dbRequest({
        table: "courses",
        method: "GET",
        query: {
          select: "id,language_id,title,level,duration_weeks",
          id: toInFilter(courseIds)
        },
        prefer: null
      }),
      dbRequest({
        table: "languages",
        method: "GET",
        query: { select: "id,name" },
        prefer: null
      }),
      dbRequest({
        table: "lesson_progress",
        method: "GET",
        query: {
          select: "enrollment_id,is_completed",
          enrollment_id: toInFilter(enrollmentIds)
        },
        prefer: null
      })
    ]);

    const courseMap = new Map(courseRows.map((course) => [Number(course.id), course]));
    const languageMap = new Map(languageRows.map((language) => [Number(language.id), language.name]));
    const progressTotals = new Map();

    for (const progress of progressRows) {
      const key = Number(progress.enrollment_id);
      const current = progressTotals.get(key) || { total: 0, completed: 0 };
      current.total += 1;
      if (Boolean(progress.is_completed)) {
        current.completed += 1;
      }
      progressTotals.set(key, current);
    }

    return enrollmentRows.map((enrollment) => {
      const course = courseMap.get(Number(enrollment.course_id));
      const totals = progressTotals.get(Number(enrollment.id)) || { total: 0, completed: 0 };
      return {
        enrollmentId: Number(enrollment.id),
        courseId: Number(enrollment.course_id),
        courseTitle: course?.title || "Unknown course",
        level: course?.level || "Beginner",
        durationWeeks: Number(course?.duration_weeks || 0),
        languageName: languageMap.get(Number(course?.language_id)) || "Unknown",
        enrolledAt: enrollment.enrolled_at,
        totalLessons: totals.total,
        completedLessons: totals.completed,
        completionRate: totals.total ? Math.round((totals.completed / totals.total) * 100) : 0
      };
    });
  }

  const store = getStore();
  const student = store.students.find((item) => item.email === normalizedEmail);
  if (!student) {
    return [];
  }

  const languageMap = new Map(store.languages.map((language) => [Number(language.id), language.name]));
  return store.enrollments
    .filter((enrollment) => Number(enrollment.studentId) === Number(student.id))
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
    .map((enrollment) => {
      const course = store.courses.find((item) => Number(item.id) === Number(enrollment.courseId));
      const progressRows = store.lessonProgress.filter(
        (progress) => Number(progress.enrollmentId) === Number(enrollment.id)
      );
      const totalLessons = progressRows.length;
      const completedLessons = progressRows.filter((progress) => Boolean(progress.isCompleted)).length;
      return {
        enrollmentId: Number(enrollment.id),
        courseId: Number(enrollment.courseId),
        courseTitle: course?.title || "Unknown course",
        level: course?.level || "Beginner",
        durationWeeks: Number(course?.durationWeeks || 0),
        languageName: languageMap.get(Number(course?.languageId)) || "Unknown",
        enrolledAt: enrollment.enrolledAt,
        totalLessons,
        completedLessons,
        completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
      };
    });
}

async function getEnrollmentProgress(enrollmentId) {
  const normalizedEnrollmentId = parsePositiveId(enrollmentId);
  if (!normalizedEnrollmentId) {
    const error = new Error("Invalid enrollment id");
    error.status = 400;
    throw error;
  }

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const enrollmentRows = await dbRequest({
      table: "enrollments",
      method: "GET",
      query: {
        select: "id,student_id,course_id,enrolled_at",
        id: `eq.${normalizedEnrollmentId}`,
        limit: 1
      },
      prefer: null
    });

    const enrollment = enrollmentRows[0];
    if (!enrollment) {
      const error = new Error("Enrollment not found");
      error.status = 404;
      throw error;
    }

    const [studentRows, courseRows, languageRows, lessonRows, progressRows] = await Promise.all([
      dbRequest({
        table: "students",
        method: "GET",
        query: { select: "id,full_name,email", id: `eq.${enrollment.student_id}`, limit: 1 },
        prefer: null
      }),
      dbRequest({
        table: "courses",
        method: "GET",
        query: {
          select: "id,language_id,title,level",
          id: `eq.${enrollment.course_id}`,
          limit: 1
        },
        prefer: null
      }),
      dbRequest({ table: "languages", method: "GET", query: { select: "id,name" }, prefer: null }),
      dbRequest({
        table: "lessons",
        method: "GET",
        query: {
          select: "id,title,summary,lesson_order,key_phrases",
          course_id: `eq.${enrollment.course_id}`,
          order: "lesson_order.asc"
        },
        prefer: null
      }),
      dbRequest({
        table: "lesson_progress",
        method: "GET",
        query: {
          select: "lesson_id,is_completed,completed_at",
          enrollment_id: `eq.${normalizedEnrollmentId}`
        },
        prefer: null
      })
    ]);

    const student = studentRows[0];
    const course = courseRows[0];
    const languageMap = new Map(languageRows.map((row) => [Number(row.id), row.name]));
    const progressMap = new Map(
      progressRows.map((row) => [
        Number(row.lesson_id),
        { isCompleted: Boolean(row.is_completed), completedAt: row.completed_at || null }
      ])
    );

    const lessons = lessonRows.map((lesson) => {
      const progress = progressMap.get(Number(lesson.id)) || {
        isCompleted: false,
        completedAt: null
      };
      return {
        lessonId: Number(lesson.id),
        title: lesson.title,
        summary: lesson.summary || "",
        lessonOrder: Number(lesson.lesson_order),
        keyPhrases: parseKeyPhrases(lesson.key_phrases),
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt
      };
    });

    const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
    const totalLessons = lessons.length;

    return {
      enrollment: {
        enrollmentId: Number(enrollment.id),
        enrolledAt: enrollment.enrolled_at,
        studentId: Number(student?.id || 0),
        studentName: student?.full_name || "",
        studentEmail: student?.email || "",
        courseId: Number(course?.id || 0),
        courseTitle: course?.title || "",
        courseLevel: course?.level || "Beginner",
        languageName: languageMap.get(Number(course?.language_id)) || "Unknown"
      },
      totals: {
        totalLessons,
        completedLessons,
        completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
      },
      lessons
    };
  }

  const store = getStore();
  const enrollment = store.enrollments.find((item) => Number(item.id) === normalizedEnrollmentId);
  if (!enrollment) {
    const error = new Error("Enrollment not found");
    error.status = 404;
    throw error;
  }

  const student = store.students.find((item) => Number(item.id) === Number(enrollment.studentId));
  const course = store.courses.find((item) => Number(item.id) === Number(enrollment.courseId));
  const language = store.languages.find((item) => Number(item.id) === Number(course?.languageId));

  const lessons = store.lessons
    .filter((lesson) => Number(lesson.courseId) === Number(course?.id))
    .sort((a, b) => Number(a.lessonOrder) - Number(b.lessonOrder))
    .map((lesson) => {
      const progress = store.lessonProgress.find(
        (item) =>
          Number(item.enrollmentId) === Number(enrollment.id) && Number(item.lessonId) === Number(lesson.id)
      );
      return {
        lessonId: Number(lesson.id),
        title: lesson.title,
        summary: lesson.summary || "",
        lessonOrder: Number(lesson.lessonOrder),
        keyPhrases: Array.isArray(lesson.keyPhrases) ? lesson.keyPhrases : [],
        isCompleted: Boolean(progress?.isCompleted),
        completedAt: progress?.completedAt || null
      };
    });

  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
  const totalLessons = lessons.length;

  return {
    enrollment: {
      enrollmentId: Number(enrollment.id),
      enrolledAt: enrollment.enrolledAt,
      studentId: Number(student?.id || 0),
      studentName: student?.fullName || "",
      studentEmail: student?.email || "",
      courseId: Number(course?.id || 0),
      courseTitle: course?.title || "",
      courseLevel: course?.level || "Beginner",
      languageName: language?.name || "Unknown"
    },
    totals: {
      totalLessons,
      completedLessons,
      completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
    },
    lessons
  };
}

async function updateEnrollmentProgress(enrollmentId, lessonId, completedInput) {
  const normalizedEnrollmentId = parsePositiveId(enrollmentId);
  const normalizedLessonId = parsePositiveId(lessonId);
  const completed = parseBoolean(completedInput);

  if (!normalizedEnrollmentId) {
    const error = new Error("Invalid enrollment id");
    error.status = 400;
    throw error;
  }

  if (!normalizedLessonId) {
    const error = new Error("lessonId must be a positive integer");
    error.status = 400;
    throw error;
  }

  if (completed === null) {
    const error = new Error("completed must be true or false");
    error.status = 400;
    throw error;
  }

  if (isDatabaseConfigured()) {
    await ensureSeedAssociationData();

    const existingRows = await dbRequest({
      table: "lesson_progress",
      method: "GET",
      query: {
        select: "id",
        enrollment_id: `eq.${normalizedEnrollmentId}`,
        lesson_id: `eq.${normalizedLessonId}`,
        limit: 1
      },
      prefer: null
    });

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      const error = new Error("Progress record not found");
      error.status = 404;
      throw error;
    }

    await dbRequest({
      table: "lesson_progress",
      method: "PATCH",
      query: {
        enrollment_id: `eq.${normalizedEnrollmentId}`,
        lesson_id: `eq.${normalizedLessonId}`
      },
      body: {
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      },
      prefer: "return=minimal"
    });
  } else {
    const store = getStore();
    const progress = store.lessonProgress.find(
      (item) =>
        Number(item.enrollmentId) === normalizedEnrollmentId && Number(item.lessonId) === normalizedLessonId
    );
    if (!progress) {
      const error = new Error("Progress record not found");
      error.status = 404;
      throw error;
    }
    progress.isCompleted = completed;
    progress.completedAt = completed ? new Date().toISOString() : null;
  }

  return getEnrollmentProgress(normalizedEnrollmentId);
}

module.exports = {
  getStats,
  getLanguages,
  getCourses,
  getCourseDetails,
  createEnrollment,
  listEnrollmentsByEmail,
  getEnrollmentProgress,
  updateEnrollmentProgress,
  parsePositiveId
};

