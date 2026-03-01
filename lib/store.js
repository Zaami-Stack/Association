const { randomUUID } = require("node:crypto");

const seedLanguages = [
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

const seedCourses = [
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

const seedLessons = [
  {
    id: 1,
    courseId: 1,
    title: "Organisation de la Journee",
    summary: "Structurer le rythme de travail du lundi au vendredi.",
    lessonOrder: 1,
    keyPhrases: ["Routine stable", "Objectifs clairs", "Cadre serein"]
  },
  {
    id: 2,
    courseId: 1,
    title: "Suivi Individualise CNED",
    summary: "Adapter les supports et les exercices au besoin de chaque eleve.",
    lessonOrder: 2,
    keyPhrases: ["Accompagnement cible", "Progression continue", "Feedback regulier"]
  },
  {
    id: 3,
    courseId: 1,
    title: "Autonomie et Concentration",
    summary: "Installer des habitudes d'apprentissage solides et efficaces.",
    lessonOrder: 3,
    keyPhrases: ["Gestion du temps", "Attention active", "Confiance"]
  },
  {
    id: 4,
    courseId: 2,
    title: "Planification Hebdomadaire",
    summary: "Organiser les matieres CNED avec un planning clair.",
    lessonOrder: 1,
    keyPhrases: ["Priorites", "Regularite", "Etapes"]
  },
  {
    id: 5,
    courseId: 2,
    title: "Soutien Pedagogique Cible",
    summary: "Renforcer les points difficiles avec un encadrement bienveillant.",
    lessonOrder: 2,
    keyPhrases: ["Methodologie", "Acquis solides", "Suivi de proximite"]
  },
  {
    id: 6,
    courseId: 2,
    title: "Preparation des Evaluations",
    summary: "Consolider les acquis avant les controles et evaluations CNED.",
    lessonOrder: 3,
    keyPhrases: ["Revision active", "Entrainer", "Reussir"]
  },
  {
    id: 7,
    courseId: 3,
    title: "Groupes Restreints Efficaces",
    summary: "Favoriser l'entraide et l'attention dans des petits groupes.",
    lessonOrder: 1,
    keyPhrases: ["Interaction", "Ecoute", "Dynamique positive"]
  },
  {
    id: 8,
    courseId: 3,
    title: "Entraide et Methode",
    summary: "Mettre en place des techniques simples pour mieux apprendre.",
    lessonOrder: 2,
    keyPhrases: ["Methodes de travail", "Cooperation", "Regularite"]
  },
  {
    id: 9,
    courseId: 3,
    title: "Consolidation des Acquis",
    summary: "Verifier les competences et renforcer les bases.",
    lessonOrder: 3,
    keyPhrases: ["Ancrage", "Progression", "Maitrise"]
  },
  {
    id: 10,
    courseId: 4,
    title: "Atelier Creatif du Mercredi",
    summary: "Stimuler l'imagination avec des activites manuelles et artistiques.",
    lessonOrder: 1,
    keyPhrases: ["Creativite", "Expression", "Motivation"]
  },
  {
    id: 11,
    courseId: 4,
    title: "Jeux Educatifs Thematique",
    summary: "Apprendre autrement avec des jeux adaptes a l'age des eleves.",
    lessonOrder: 2,
    keyPhrases: ["Ludique", "Memoire", "Participation"]
  },
  {
    id: 12,
    courseId: 4,
    title: "Projets Nature et Culture",
    summary: "Ouvrir les eleves sur le monde, la nature et les savoirs.",
    lessonOrder: 3,
    keyPhrases: ["Curiosite", "Observation", "Decouverte"]
  },
  {
    id: 13,
    courseId: 5,
    title: "Prise de Parole Guidee",
    summary: "Encourager les eleves a s'exprimer dans un cadre rassurant.",
    lessonOrder: 1,
    keyPhrases: ["S'exprimer", "Ecouter", "Prendre confiance"]
  },
  {
    id: 14,
    courseId: 5,
    title: "Expression Orale en Groupe",
    summary: "Pratiquer l'oral avec des activites collectives et jeux de role.",
    lessonOrder: 2,
    keyPhrases: ["Echange", "Fluidite", "Interaction"]
  },
  {
    id: 15,
    courseId: 5,
    title: "Communication Confiante",
    summary: "Developper une communication claire et positive au quotidien.",
    lessonOrder: 3,
    keyPhrases: ["Aisance", "Clarte", "Confiance durable"]
  }
];

const seedGalleryPhotos = [
  {
    id: "gallery-1",
    title: "Conversation Circle",
    imageUrl:
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
    position: 1,
    createdAt: "2026-02-10T10:00:00.000Z"
  },
  {
    id: "gallery-2",
    title: "Team Practice",
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    position: 2,
    createdAt: "2026-02-10T10:01:00.000Z"
  },
  {
    id: "gallery-3",
    title: "Spanish Workshop",
    imageUrl:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
    position: 3,
    createdAt: "2026-02-10T10:02:00.000Z"
  },
  {
    id: "gallery-4",
    title: "Fluency Lab",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    position: 4,
    createdAt: "2026-02-10T10:03:00.000Z"
  },
  {
    id: "gallery-5",
    title: "Business English",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    position: 5,
    createdAt: "2026-02-10T10:04:00.000Z"
  },
  {
    id: "gallery-6",
    title: "French Foundations",
    imageUrl:
      "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80",
    position: 6,
    createdAt: "2026-02-10T10:05:00.000Z"
  }
];

const seedNotifications = [
  {
    id: "note-1",
    title: "Spanish A1 batch opens Monday",
    message: "New beginner cohort starts this Monday. Enrollment is now open.",
    createdAt: "2026-02-20T11:00:00.000Z"
  },
  {
    id: "note-2",
    title: "English speaking workshop this week",
    message: "Interactive speaking practice with coaches on Thursday evening.",
    createdAt: "2026-02-21T09:30:00.000Z"
  },
  {
    id: "note-3",
    title: "Enrollment deadline update posted",
    message: "Late registrations for current cycle close this Friday at 6 PM.",
    createdAt: "2026-02-22T15:15:00.000Z"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStore() {
  if (!globalThis.__ASSOCIATION_STORE__) {
    globalThis.__ASSOCIATION_STORE__ = {
      languages: clone(seedLanguages),
      courses: clone(seedCourses),
      lessons: clone(seedLessons),
      students: [],
      enrollments: [],
      lessonProgress: [],
      users: [],
      galleryPhotos: clone(seedGalleryPhotos),
      notifications: clone(seedNotifications)
    };
  }

  return globalThis.__ASSOCIATION_STORE__;
}

function createId(size = 12) {
  return randomUUID().replace(/-/g, "").slice(0, size);
}

module.exports = {
  seedLanguages,
  seedCourses,
  seedLessons,
  seedGalleryPhotos,
  seedNotifications,
  getStore,
  createId
};
