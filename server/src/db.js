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
    name: "Primaire CNED",
    description: "Accompagnement quotidien des eleves du primaire inscrits au CNED."
  },
  {
    id: 2,
    name: "College CNED",
    description: "Suivi structure des eleves du college inscrits au CNED."
  },
  {
    id: 3,
    name: "Ateliers Complementaires",
    description: "Ateliers creatifs, jeux educatifs et expression orale en petits groupes."
  }
];

const courseSeeds = [
  {
    id: 1,
    languageId: 1,
    title: "Accompagnement Journalier Primaire",
    level: "Beginner",
    durationWeeks: 36,
    description:
      "Accueil en journee du lundi au vendredi avec suivi individualise des cours CNED.",
    imageUrl:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    languageId: 2,
    title: "Accompagnement Journalier College",
    level: "Intermediate",
    durationWeeks: 36,
    description:
      "Encadrement pedagogique bienveillant pour les collegiens avec objectifs hebdomadaires clairs.",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    languageId: 2,
    title: "Petits Groupes d'Apprentissage",
    level: "Intermediate",
    durationWeeks: 20,
    description:
      "Travail en groupes restreints pour renforcer la methode, la regularite et la comprehension.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    languageId: 3,
    title: "Ateliers Creatifs et Jeux Educatifs",
    level: "Beginner",
    durationWeeks: 16,
    description:
      "Activites complementaires pour stimuler la curiosite, l'imagination et l'envie d'apprendre.",
    imageUrl:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 5,
    languageId: 3,
    title: "Expression Orale et Confiance",
    level: "Intermediate",
    durationWeeks: 16,
    description:
      "Expression orale guidee pour aider chaque eleve a prendre la parole avec confiance.",
    imageUrl:
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80"
  }
];

const lessonSeeds = [
  {
    courseId: 1,
    title: "Organisation de la Journee",
    summary: "Structurer le rythme de travail du lundi au vendredi.",
    lessonOrder: 1,
    keyPhrases: ["Routine stable", "Objectifs clairs", "Cadre serein"]
  },
  {
    courseId: 1,
    title: "Suivi Individualise CNED",
    summary: "Adapter les supports et les exercices au besoin de chaque eleve.",
    lessonOrder: 2,
    keyPhrases: ["Accompagnement cible", "Progression continue", "Feedback regulier"]
  },
  {
    courseId: 1,
    title: "Autonomie et Concentration",
    summary: "Installer des habitudes d'apprentissage solides et efficaces.",
    lessonOrder: 3,
    keyPhrases: ["Gestion du temps", "Attention active", "Confiance"]
  },
  {
    courseId: 2,
    title: "Planification Hebdomadaire",
    summary: "Organiser les matieres CNED avec un planning clair.",
    lessonOrder: 1,
    keyPhrases: ["Priorites", "Regularite", "Etapes"]
  },
  {
    courseId: 2,
    title: "Soutien Pedagogique Cible",
    summary: "Renforcer les points difficiles avec un encadrement bienveillant.",
    lessonOrder: 2,
    keyPhrases: ["Methodologie", "Acquis solides", "Suivi de proximite"]
  },
  {
    courseId: 2,
    title: "Preparation des Evaluations",
    summary: "Consolider les acquis avant les controles et evaluations CNED.",
    lessonOrder: 3,
    keyPhrases: ["Revision active", "Entrainer", "Reussir"]
  },
  {
    courseId: 3,
    title: "Groupes Restreints Efficaces",
    summary: "Favoriser l'entraide et l'attention dans des petits groupes.",
    lessonOrder: 1,
    keyPhrases: ["Interaction", "Ecoute", "Dynamique positive"]
  },
  {
    courseId: 3,
    title: "Entraide et Methode",
    summary: "Mettre en place des techniques simples pour mieux apprendre.",
    lessonOrder: 2,
    keyPhrases: ["Methodes de travail", "Cooperation", "Regularite"]
  },
  {
    courseId: 3,
    title: "Consolidation des Acquis",
    summary: "Verifier les competences et renforcer les bases.",
    lessonOrder: 3,
    keyPhrases: ["Ancrage", "Progression", "Maitrise"]
  },
  {
    courseId: 4,
    title: "Atelier Creatif du Mercredi",
    summary: "Stimuler l'imagination avec des activites manuelles et artistiques.",
    lessonOrder: 1,
    keyPhrases: ["Creativite", "Expression", "Motivation"]
  },
  {
    courseId: 4,
    title: "Jeux Educatifs Thematique",
    summary: "Apprendre autrement avec des jeux adaptes a l'age des eleves.",
    lessonOrder: 2,
    keyPhrases: ["Ludique", "Memoire", "Participation"]
  },
  {
    courseId: 4,
    title: "Projets Nature et Culture",
    summary: "Ouvrir les eleves sur le monde, la nature et les savoirs.",
    lessonOrder: 3,
    keyPhrases: ["Curiosite", "Observation", "Decouverte"]
  },
  {
    courseId: 5,
    title: "Prise de Parole Guidee",
    summary: "Encourager les eleves a s'exprimer dans un cadre rassurant.",
    lessonOrder: 1,
    keyPhrases: ["S'exprimer", "Ecouter", "Prendre confiance"]
  },
  {
    courseId: 5,
    title: "Expression Orale en Groupe",
    summary: "Pratiquer l'oral avec des activites collectives et jeux de role.",
    lessonOrder: 2,
    keyPhrases: ["Echange", "Fluidite", "Interaction"]
  },
  {
    courseId: 5,
    title: "Communication Confiante",
    summary: "Developper une communication claire et positive au quotidien.",
    lessonOrder: 3,
    keyPhrases: ["Aisance", "Clarte", "Confiance durable"]
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
      phone TEXT NOT NULL DEFAULT '',
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

  await db.exec(`
    ALTER TABLE students ADD COLUMN phone TEXT NOT NULL DEFAULT '';
  `).catch((error) => {
    if (!String(error?.message || "").includes("duplicate column name")) {
      throw error;
    }
  });
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
