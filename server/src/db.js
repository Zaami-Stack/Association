import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.join(__dirname, "data", "association.sqlite");

const languageSeeds = [
  {
    id: 1,
    name: "English",
    description: "Build strong grammar, communication, and pronunciation."
  },
  {
    id: 2,
    name: "Spanish",
    description: "Learn practical Spanish for travel, work, and daily life."
  },
  {
    id: 3,
    name: "French",
    description: "Master foundational French with modern speaking practice."
  }
];

const courseSeeds = [
  {
    id: 1,
    languageId: 1,
    title: "English Foundations",
    level: "Beginner",
    durationWeeks: 8,
    description: "Start from zero and build confidence in speaking and writing English.",
    imageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    languageId: 1,
    title: "Business English Communication",
    level: "Intermediate",
    durationWeeks: 10,
    description: "Professional English for meetings, emails, and workplace presentations.",
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    languageId: 2,
    title: "Spanish for Daily Life",
    level: "Beginner",
    durationWeeks: 8,
    description: "Essential Spanish vocabulary and grammar for real conversations.",
    imageUrl:
      "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    languageId: 2,
    title: "Spanish Conversation Club",
    level: "Intermediate",
    durationWeeks: 6,
    description: "Conversation-focused practice to improve fluency and listening speed.",
    imageUrl:
      "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 5,
    languageId: 3,
    title: "French Essentials",
    level: "Beginner",
    durationWeeks: 8,
    description: "A complete beginner path for reading, speaking, and understanding French.",
    imageUrl:
      "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1200&q=80"
  }
];

const lessonSeeds = [
  {
    courseId: 1,
    title: "Greetings and Introductions",
    summary: "Learn greetings, self-introductions, and polite classroom English.",
    lessonOrder: 1,
    keyPhrases: ["Hello, my name is...", "Nice to meet you", "How are you?"]
  },
  {
    courseId: 1,
    title: "Daily Activities",
    summary: "Describe routines using present simple verbs and time expressions.",
    lessonOrder: 2,
    keyPhrases: ["I wake up at...", "I usually...", "In the morning"]
  },
  {
    courseId: 1,
    title: "Basic Questions",
    summary: "Ask and answer common questions in real-life situations.",
    lessonOrder: 3,
    keyPhrases: ["Where do you live?", "What do you do?", "Can you help me?"]
  },
  {
    courseId: 2,
    title: "Professional Introductions",
    summary: "Introduce yourself in a business meeting with confidence.",
    lessonOrder: 1,
    keyPhrases: ["I work as...", "My responsibilities include...", "Our team focuses on..."]
  },
  {
    courseId: 2,
    title: "Business Emails",
    summary: "Write clear and polite email messages for clients and teammates.",
    lessonOrder: 2,
    keyPhrases: ["I hope you are doing well", "Please find attached", "Looking forward to..."]
  },
  {
    courseId: 2,
    title: "Presenting Ideas",
    summary: "Structure business presentations and speak with clear transitions.",
    lessonOrder: 3,
    keyPhrases: ["First, I will cover...", "As you can see", "To summarize"]
  },
  {
    courseId: 3,
    title: "Saludos Basicos",
    summary: "Use common Spanish greetings and polite expressions.",
    lessonOrder: 1,
    keyPhrases: ["Hola, me llamo...", "Mucho gusto", "Como estas?"]
  },
  {
    courseId: 3,
    title: "Compras y Comida",
    summary: "Order food, ask prices, and shop with useful vocabulary.",
    lessonOrder: 2,
    keyPhrases: ["Cuanto cuesta?", "Quiero...", "La cuenta, por favor"]
  },
  {
    courseId: 3,
    title: "Moverse en la Ciudad",
    summary: "Ask for directions and use transport vocabulary confidently.",
    lessonOrder: 3,
    keyPhrases: ["Donde esta...?", "A la derecha", "Necesito un taxi"]
  },
  {
    courseId: 4,
    title: "Hablar de Opiniones",
    summary: "Express personal opinions and agree/disagree politely.",
    lessonOrder: 1,
    keyPhrases: ["Pienso que...", "Estoy de acuerdo", "No estoy seguro"]
  },
  {
    courseId: 4,
    title: "Historias y Experiencias",
    summary: "Practice conversational past tense in group activities.",
    lessonOrder: 2,
    keyPhrases: ["La semana pasada...", "Cuando era nino/a...", "Fue increible"]
  },
  {
    courseId: 4,
    title: "Debates Guiados",
    summary: "Build fluency through role-play and mini debate sessions.",
    lessonOrder: 3,
    keyPhrases: ["En mi opinion...", "Por otro lado", "En conclusion"]
  },
  {
    courseId: 5,
    title: "Bonjour et Presentation",
    summary: "Learn French greetings, pronunciation basics, and introductions.",
    lessonOrder: 1,
    keyPhrases: ["Bonjour", "Je m'appelle...", "Comment ca va?"]
  },
  {
    courseId: 5,
    title: "Vie Quotidienne",
    summary: "Discuss simple routines with useful verbs and time words.",
    lessonOrder: 2,
    keyPhrases: ["Je me leve", "Je travaille", "Le soir"]
  },
  {
    courseId: 5,
    title: "Questions Utiles",
    summary: "Ask practical questions for travel and social situations.",
    lessonOrder: 3,
    keyPhrases: ["Ou est...?", "Pouvez-vous m'aider?", "Combien ca coute?"]
  }
];

async function createSchema(db) {
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS languages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY,
      language_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('Beginner', 'Intermediate', 'Advanced')),
      duration_weeks INTEGER NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      lesson_order INTEGER NOT NULL,
      key_phrases TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (course_id, lesson_order),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enrollment_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
      completed_at TEXT,
      UNIQUE (enrollment_id, lesson_id),
      FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );
  `);
}

async function seedDatabase(db) {
  await db.exec("BEGIN");
  try {
    for (const language of languageSeeds) {
      await db.run(
        `INSERT INTO languages (id, name, description) VALUES (?, ?, ?)`,
        language.id,
        language.name,
        language.description
      );
    }

    for (const course of courseSeeds) {
      await db.run(
        `
          INSERT INTO courses
            (id, language_id, title, level, duration_weeks, description, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        course.id,
        course.languageId,
        course.title,
        course.level,
        course.durationWeeks,
        course.description,
        course.imageUrl
      );
    }

    for (const lesson of lessonSeeds) {
      await db.run(
        `
          INSERT INTO lessons
            (course_id, title, summary, lesson_order, key_phrases)
          VALUES (?, ?, ?, ?, ?)
        `,
        lesson.courseId,
        lesson.title,
        lesson.summary,
        lesson.lessonOrder,
        JSON.stringify(lesson.keyPhrases)
      );
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function initDb() {
  const dbPath = process.env.DB_PATH?.trim() || defaultDbPath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await createSchema(db);
  const existing = await db.get("SELECT COUNT(*) AS count FROM languages");
  if (existing?.count === 0) {
    await seedDatabase(db);
  }

  return db;
}

export { initDb };

