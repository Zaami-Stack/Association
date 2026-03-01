import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasClientBuild = fs.existsSync(clientIndexPath);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const port = Number(process.env.PORT || 4000);
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

function parsePositiveId(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function asBoolean(value) {
  if (value === true || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === 0 || value === "0") {
    return false;
  }
  return null;
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function buildEnrollmentProgress(db, enrollmentId) {
  const enrollment = await db.get(
    `
      SELECT
        e.id AS enrollmentId,
        e.enrolled_at AS enrolledAt,
        s.id AS studentId,
        s.full_name AS studentName,
        s.email AS studentEmail,
        c.id AS courseId,
        c.title AS courseTitle,
        c.level AS courseLevel,
        l.name AS languageName
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      JOIN languages l ON l.id = c.language_id
      WHERE e.id = ?
    `,
    enrollmentId
  );

  if (!enrollment) {
    return null;
  }

  const lessons = await db.all(
    `
      SELECT
        ls.id AS lessonId,
        ls.title,
        ls.summary,
        ls.lesson_order AS lessonOrder,
        ls.key_phrases AS keyPhrases,
        lp.is_completed AS isCompleted,
        lp.completed_at AS completedAt
      FROM lesson_progress lp
      JOIN lessons ls ON ls.id = lp.lesson_id
      WHERE lp.enrollment_id = ?
      ORDER BY ls.lesson_order ASC
    `,
    enrollmentId
  );

  const normalizedLessons = lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title,
    summary: lesson.summary,
    lessonOrder: lesson.lessonOrder,
    keyPhrases: parseJsonArray(lesson.keyPhrases),
    isCompleted: Boolean(lesson.isCompleted),
    completedAt: lesson.completedAt
  }));

  const totalLessons = normalizedLessons.length;
  const completedLessons = normalizedLessons.filter((lesson) => lesson.isCompleted).length;

  return {
    enrollment: {
      ...enrollment
    },
    totals: {
      totalLessons,
      completedLessons,
      completionRate: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
    },
    lessons: normalizedLessons
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "association-language-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/stats", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const stats = await db.get(`
      SELECT
        (SELECT COUNT(*) FROM languages) AS languages,
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM lessons) AS lessons,
        (SELECT COUNT(*) FROM students) AS students
    `);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

app.get("/api/languages", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const rows = await db.all(`
      SELECT
        l.id,
        l.name,
        l.description,
        COUNT(c.id) AS courseCount
      FROM languages l
      LEFT JOIN courses c ON c.language_id = l.id
      GROUP BY l.id
      ORDER BY l.name ASC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/courses", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { languageId, search = "" } = req.query;

    const conditions = [];
    const params = [];

    if (languageId !== undefined) {
      const parsedLanguageId = parsePositiveId(languageId);
      if (!parsedLanguageId) {
        return res.status(400).json({ message: "languageId must be a positive integer" });
      }
      conditions.push("c.language_id = ?");
      params.push(parsedLanguageId);
    }

    const normalizedSearch = String(search || "").trim().toLowerCase();
    if (normalizedSearch) {
      conditions.push("(LOWER(c.title) LIKE ? OR LOWER(c.description) LIKE ?)");
      params.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await db.all(
      `
        SELECT
          c.id,
          c.language_id AS languageId,
          c.title,
          c.level,
          c.duration_weeks AS durationWeeks,
          c.description,
          c.image_url AS imageUrl,
          l.name AS languageName,
          COUNT(ls.id) AS lessonCount
        FROM courses c
        JOIN languages l ON l.id = c.language_id
        LEFT JOIN lessons ls ON ls.course_id = c.id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.id ASC
      `,
      ...params
    );

    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/courses/:courseId", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const courseId = parsePositiveId(req.params.courseId);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await db.get(
      `
        SELECT
          c.id,
          c.language_id AS languageId,
          c.title,
          c.level,
          c.duration_weeks AS durationWeeks,
          c.description,
          c.image_url AS imageUrl,
          l.name AS languageName
        FROM courses c
        JOIN languages l ON l.id = c.language_id
        WHERE c.id = ?
      `,
      courseId
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lessons = await db.all(
      `
        SELECT
          id AS lessonId,
          title,
          summary,
          lesson_order AS lessonOrder,
          key_phrases AS keyPhrases
        FROM lessons
        WHERE course_id = ?
        ORDER BY lesson_order ASC
      `,
      courseId
    );

    return res.json({
      ...course,
      lessons: lessons.map((lesson) => ({
        ...lesson,
        keyPhrases: parseJsonArray(lesson.keyPhrases)
      }))
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/enrollments", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const fullName = String(req.body?.fullName || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const courseId = parsePositiveId(req.body?.courseId);

    if (fullName.length < 2) {
      return res.status(400).json({ message: "fullName must be at least 2 characters" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "email is invalid" });
    }
    if (!courseId) {
      return res.status(400).json({ message: "courseId must be a positive integer" });
    }

    const course = await db.get("SELECT id, title FROM courses WHERE id = ?", courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await db.run(
      `
        INSERT INTO students (full_name, email)
        VALUES (?, ?)
        ON CONFLICT(email) DO UPDATE SET full_name = excluded.full_name
      `,
      fullName,
      email
    );

    const student = await db.get("SELECT id, full_name AS fullName, email FROM students WHERE email = ?", email);

    await db.run("INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)", student.id, courseId);

    const enrollment = await db.get(
      `
        SELECT
          id AS enrollmentId,
          enrolled_at AS enrolledAt
        FROM enrollments
        WHERE student_id = ? AND course_id = ?
      `,
      student.id,
      courseId
    );

    await db.run(
      `
        INSERT OR IGNORE INTO lesson_progress (enrollment_id, lesson_id)
        SELECT ?, id
        FROM lessons
        WHERE course_id = ?
      `,
      enrollment.enrollmentId,
      courseId
    );

    return res.status(201).json({
      enrollmentId: enrollment.enrollmentId,
      enrolledAt: enrollment.enrolledAt,
      student,
      course
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/enrollments", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const email = String(req.query?.email || "")
      .trim()
      .toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Valid email query param is required" });
    }

    const rows = await db.all(
      `
        SELECT
          e.id AS enrollmentId,
          c.id AS courseId,
          c.title AS courseTitle,
          c.level,
          c.duration_weeks AS durationWeeks,
          l.name AS languageName,
          e.enrolled_at AS enrolledAt,
          COUNT(lp.id) AS totalLessons,
          COALESCE(SUM(lp.is_completed), 0) AS completedLessons
        FROM enrollments e
        JOIN students s ON s.id = e.student_id
        JOIN courses c ON c.id = e.course_id
        JOIN languages l ON l.id = c.language_id
        LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id
        WHERE s.email = ?
        GROUP BY e.id
        ORDER BY e.enrolled_at DESC
      `,
      email
    );

    return res.json(
      rows.map((row) => ({
        ...row,
        completionRate: row.totalLessons
          ? Math.round((row.completedLessons / row.totalLessons) * 100)
          : 0
      }))
    );
  } catch (error) {
    return next(error);
  }
});

app.get("/api/enrollments/:enrollmentId/progress", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const enrollmentId = parsePositiveId(req.params.enrollmentId);
    if (!enrollmentId) {
      return res.status(400).json({ message: "Invalid enrollment id" });
    }

    const payload = await buildEnrollmentProgress(db, enrollmentId);
    if (!payload) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/enrollments/:enrollmentId/progress", async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const enrollmentId = parsePositiveId(req.params.enrollmentId);
    const lessonId = parsePositiveId(req.body?.lessonId);
    const completed = asBoolean(req.body?.completed);

    if (!enrollmentId) {
      return res.status(400).json({ message: "Invalid enrollment id" });
    }
    if (!lessonId) {
      return res.status(400).json({ message: "lessonId must be a positive integer" });
    }
    if (completed === null) {
      return res.status(400).json({ message: "completed must be true or false" });
    }

    const progressRow = await db.get(
      `
        SELECT id
        FROM lesson_progress
        WHERE enrollment_id = ? AND lesson_id = ?
      `,
      enrollmentId,
      lessonId
    );

    if (!progressRow) {
      return res.status(404).json({ message: "Progress record not found" });
    }

    await db.run(
      `
        UPDATE lesson_progress
        SET
          is_completed = ?,
          completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE enrollment_id = ? AND lesson_id = ?
      `,
      completed ? 1 : 0,
      completed ? 1 : 0,
      enrollmentId,
      lessonId
    );

    const payload = await buildEnrollmentProgress(db, enrollmentId);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

if (hasClientBuild) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    return res.sendFile(clientIndexPath);
  });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "internal server error" });
});

async function bootstrap() {
  const db = await initDb();
  app.locals.db = db;
  app.listen(port, () => {
    console.log(`Association API running on http://localhost:${port}`);
  });
}

bootstrap();

