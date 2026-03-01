const { randomUUID } = require("node:crypto");

const seedLanguages = [
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

const seedCourses = [
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

const seedLessons = [
  {
    id: 1,
    courseId: 1,
    title: "Greetings and Introductions",
    summary: "Learn greetings, self-introductions, and polite classroom English.",
    lessonOrder: 1,
    keyPhrases: ["Hello, my name is...", "Nice to meet you", "How are you?"]
  },
  {
    id: 2,
    courseId: 1,
    title: "Daily Activities",
    summary: "Describe routines using present simple verbs and time expressions.",
    lessonOrder: 2,
    keyPhrases: ["I wake up at...", "I usually...", "In the morning"]
  },
  {
    id: 3,
    courseId: 1,
    title: "Basic Questions",
    summary: "Ask and answer common questions in real-life situations.",
    lessonOrder: 3,
    keyPhrases: ["Where do you live?", "What do you do?", "Can you help me?"]
  },
  {
    id: 4,
    courseId: 2,
    title: "Professional Introductions",
    summary: "Introduce yourself in a business meeting with confidence.",
    lessonOrder: 1,
    keyPhrases: ["I work as...", "My responsibilities include...", "Our team focuses on..."]
  },
  {
    id: 5,
    courseId: 2,
    title: "Business Emails",
    summary: "Write clear and polite email messages for clients and teammates.",
    lessonOrder: 2,
    keyPhrases: ["I hope you are doing well", "Please find attached", "Looking forward to..."]
  },
  {
    id: 6,
    courseId: 2,
    title: "Presenting Ideas",
    summary: "Structure business presentations and speak with clear transitions.",
    lessonOrder: 3,
    keyPhrases: ["First, I will cover...", "As you can see", "To summarize"]
  },
  {
    id: 7,
    courseId: 3,
    title: "Saludos Basicos",
    summary: "Use common Spanish greetings and polite expressions.",
    lessonOrder: 1,
    keyPhrases: ["Hola, me llamo...", "Mucho gusto", "Como estas?"]
  },
  {
    id: 8,
    courseId: 3,
    title: "Compras y Comida",
    summary: "Order food, ask prices, and shop with useful vocabulary.",
    lessonOrder: 2,
    keyPhrases: ["Cuanto cuesta?", "Quiero...", "La cuenta, por favor"]
  },
  {
    id: 9,
    courseId: 3,
    title: "Moverse en la Ciudad",
    summary: "Ask for directions and use transport vocabulary confidently.",
    lessonOrder: 3,
    keyPhrases: ["Donde esta...?", "A la derecha", "Necesito un taxi"]
  },
  {
    id: 10,
    courseId: 4,
    title: "Hablar de Opiniones",
    summary: "Express personal opinions and agree/disagree politely.",
    lessonOrder: 1,
    keyPhrases: ["Pienso que...", "Estoy de acuerdo", "No estoy seguro"]
  },
  {
    id: 11,
    courseId: 4,
    title: "Historias y Experiencias",
    summary: "Practice conversational past tense in group activities.",
    lessonOrder: 2,
    keyPhrases: ["La semana pasada...", "Cuando era nino/a...", "Fue increible"]
  },
  {
    id: 12,
    courseId: 4,
    title: "Debates Guiados",
    summary: "Build fluency through role-play and mini debate sessions.",
    lessonOrder: 3,
    keyPhrases: ["En mi opinion...", "Por otro lado", "En conclusion"]
  },
  {
    id: 13,
    courseId: 5,
    title: "Bonjour et Presentation",
    summary: "Learn French greetings, pronunciation basics, and introductions.",
    lessonOrder: 1,
    keyPhrases: ["Bonjour", "Je m'appelle...", "Comment ca va?"]
  },
  {
    id: 14,
    courseId: 5,
    title: "Vie Quotidienne",
    summary: "Discuss simple routines with useful verbs and time words.",
    lessonOrder: 2,
    keyPhrases: ["Je me leve", "Je travaille", "Le soir"]
  },
  {
    id: 15,
    courseId: 5,
    title: "Questions Utiles",
    summary: "Ask practical questions for travel and social situations.",
    lessonOrder: 3,
    keyPhrases: ["Ou est...?", "Pouvez-vous m'aider?", "Combien ca coute?"]
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
