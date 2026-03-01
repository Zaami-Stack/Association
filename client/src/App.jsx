import { useEffect, useMemo, useState } from "react";
import {
  createCourse,
  createGalleryPhoto,
  createNotification,
  deleteCourse,
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
  updateCourse,
  updateGalleryPhoto
} from "./api";

const initialEnrollForm = {
  fullName: "",
  email: "",
  phone: "",
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

const initialProgramForm = {
  languageId: "",
  title: "",
  level: "Beginner",
  durationWeeks: 12,
  description: "",
  imageUrl: ""
};

const HERO_IMAGE_URL = "/aaaaaaaaa.jfif";
const WHATSAPP_URL = "https://wa.me/212681222459";

const SUPPORTED_UI_LANGS = ["en", "fr", "es"];

const UI_COPY = {
  en: {
    language: "Language",
    nav: {
      home: "Home",
      about: "About",
      courses: "Courses",
      gallery: "Gallery",
      enroll: "Enroll",
      dashboard: "Dashboard",
      toggleMenu: "Toggle navigation menu"
    },
    auth: {
      loading: "Loading...",
      login: "Login",
      signUp: "Sign Up",
      logout: "Logout",
      loginTitle: "Login",
      loginSubtitle: "Use your account credentials.",
      signInLoading: "Signing in...",
      signUpTitle: "Sign Up",
      signUpSubtitle: "Create a student account.",
      signUpLoading: "Creating...",
      needAccount: "Need an account? Sign up",
      haveAccount: "Already have an account? Login",
      password: "Password",
      passwordMin: "Password (min 8 chars)",
      loginFailed: "Login failed.",
      signupFailed: "Signup failed."
    },
    notifications: {
      title: "Notifications",
      empty: "No notifications."
    },
    hero: {
      tag: "Global communication starts here",
      titleMain: "Succeed with CNED, with real support",
      titleAccent: "",
      desc: "We help students organize themselves, understand their lessons, and progress throughout the year. Languages are a plus, especially Darija.",
      cta: "Start Learning"
    },
    about: {
      city: "GHAZOUA",
      subtitle: "La maison du savoir",
      title: "CNED Support - Primary & Middle School",
      quote: '"We plant seeds for the future"',
      lead: "A caring space to learn differently",
      paragraph:
        "La Maison du Savoir supports primary and middle school students enrolled in CNED, in a calm, motivating, and personalized environment.",
      includesTitle: "Our support includes:",
      includes: [
        "Daytime welcome from Monday to Friday",
        "Guidance from a caring educational team",
        "Individual follow-up of CNED lessons",
        "Small groups for effective learning",
        "Complementary activities: creative workshops, educational games, oral expression"
      ],
      placeTitle: "A warm and inspiring place",
      placeText:
        "Located in Ghazoua (Km8, Sidi Kaouki road), La Maison du Savoir is a calm and bright space, ideal for focus and growth.",
      ending: "A place open to the world, nature, and knowledge."
    },
    stats: {
      programs: "Programs",
      courses: "Courses",
      lessons: "Lessons",
      students: "Students"
    },
    catalog: {
      heading: "Maison du Savoir Programs",
      subtitle:
        "CNED support for primary and middle school students, small groups, and complementary activities.",
      allPrograms: "All programs",
      searchPlaceholder: "Search a program...",
      loading: "Loading courses...",
      empty: "No courses match your current filter.",
      enrollBtn: "Enroll in this course",
      weeks: "weeks",
      lessons: "lessons"
    },
    gallery: {
      heading: "Learning Gallery",
      subtitle: "Snapshots from sessions, workshops, and student activities."
    },
    enroll: {
      heading: "Enroll a Student",
      subtitle: "Use this form to register a student with full name, email, and phone number.",
      fullName: "Full name",
      email: "Email",
      phone: "Phone number",
      saving: "Saving...",
      submit: "Create Enrollment",
      saved: (studentName, courseTitle) =>
        `Enrollment saved for ${studentName} in "${courseTitle}".`,
      failed: "Enrollment failed."
    },
    dashboard: {
      heading: "Admin Dashboard",
      subtitle: "Only admin can access this section.",
      manageGallery: "Manage Gallery",
      photoTitle: "Photo title",
      imageUrl: "Image URL",
      position: "Position",
      updatePhoto: "Update Photo",
      addPhoto: "Add Photo",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      manageNotifications: "Manage Notifications",
      notificationTitle: "Notification title",
      notificationMessage: "Notification message",
      publish: "Publish Notification",
      publishing: "Publishing...",
      managePrograms: "Manage Programs",
      programLanguage: "Program language",
      programTitle: "Program title",
      programLevel: "Program level",
      programDurationWeeks: "Duration (weeks)",
      programDescription: "Program description",
      programImageUrl: "Program image URL",
      addProgram: "Add Program",
      updateProgram: "Update Program",
      noPrograms: "No programs found.",
      contacts: "Student Contacts",
      refresh: "Refresh",
      loadingStudents: "Loading students...",
      noStudents: "No students found yet.",
      noPhone: "No phone provided",
      galleryUpdated: "Gallery photo updated.",
      galleryCreated: "Gallery photo created.",
      galleryRemoved: "Gallery photo removed.",
      gallerySaveError: "Could not save gallery photo.",
      galleryDeleteError: "Could not remove gallery photo.",
      notificationPublished: "Notification published.",
      notificationRemoved: "Notification removed.",
      notificationPublishError: "Could not publish notification.",
      notificationDeleteError: "Could not remove notification.",
      programCreated: "Program created.",
      programUpdated: "Program updated.",
      programRemoved: "Program removed.",
      programSaveError: "Could not create program.",
      programDeleteError: "Could not remove program."
    },
    common: {
      update: "Update",
      create: "Create"
    },
    errors: {
      loadData: "Unable to load data.",
      loadStudents: "Failed to load students."
    }
  },
  fr: {
    language: "Langue",
    nav: {
      home: "Accueil",
      about: "A propos",
      courses: "Programmes",
      gallery: "Galerie",
      enroll: "Inscription",
      dashboard: "Tableau de bord",
      toggleMenu: "Ouvrir le menu"
    },
    auth: {
      loading: "Chargement...",
      login: "Connexion",
      signUp: "Inscription",
      logout: "Deconnexion",
      loginTitle: "Connexion",
      loginSubtitle: "Utilisez vos identifiants.",
      signInLoading: "Connexion...",
      signUpTitle: "Inscription",
      signUpSubtitle: "Creer un compte etudiant.",
      signUpLoading: "Creation...",
      needAccount: "Pas de compte ? Inscrivez-vous",
      haveAccount: "Vous avez deja un compte ? Connexion",
      password: "Mot de passe",
      passwordMin: "Mot de passe (min 8 caracteres)",
      loginFailed: "Echec de connexion.",
      signupFailed: "Echec d'inscription."
    },
    notifications: {
      title: "Notifications",
      empty: "Aucune notification."
    },
    hero: {
      tag: "La communication globale commence ici",
      titleMain: "Réussir avec le CNED, avec un vrai accompagnement",
      titleAccent: "",
      desc: "Nous aidons les élèves à s'organiser, comprendre leurs cours et progresser tout au long de l'année. Les langues sont un plus, notamment la darija.",
      cta: "Commencer"
    },
    about: {
      city: "GHAZOUA",
      subtitle: "La maison du savoir",
      title: "Accompagnement CNED - Primaire & College",
      quote: '"Nous plantons des graines pour le futur"',
      lead: "Un cadre bienveillant pour apprendre autrement",
      paragraph:
        "La Maison du Savoir accompagne les eleves du primaire et du college inscrits au CNED, dans un environnement serein, stimulant et personnalise.",
      includesTitle: "Notre accompagnement comprend :",
      includes: [
        "Accueil en journee, du lundi au vendredi",
        "Encadrement par une equipe pedagogique bienveillante",
        "Suivi individualise des cours CNED",
        "Petits groupes pour un apprentissage efficace",
        "Activites complementaires : ateliers creatifs, jeux educatifs, expression orale"
      ],
      placeTitle: "Un lieu chaleureux et inspirant",
      placeText:
        "Situee a Ghazoua (Km8, route de Sidi Kaouki), La Maison du Savoir est un espace calme et lumineux, propice a la concentration et a l'epanouissement.",
      ending: "Un lieu ouvert sur le monde, la nature et les savoirs."
    },
    stats: {
      programs: "Programmes",
      courses: "Cours",
      lessons: "Lecons",
      students: "Eleves"
    },
    catalog: {
      heading: "Programmes Maison du Savoir",
      subtitle:
        "Accompagnement CNED primaire et college, petits groupes, et activites complementaires.",
      allPrograms: "Tous les programmes",
      searchPlaceholder: "Rechercher un programme...",
      loading: "Chargement des cours...",
      empty: "Aucun programme ne correspond au filtre.",
      enrollBtn: "Inscrire a ce cours",
      weeks: "semaines",
      lessons: "lecons"
    },
    gallery: {
      heading: "Galerie d'apprentissage",
      subtitle: "Moments des cours, ateliers et activites des eleves."
    },
    enroll: {
      heading: "Inscrire un eleve",
      subtitle: "Utilisez ce formulaire avec nom complet, email et numero de telephone.",
      fullName: "Nom complet",
      email: "Email",
      phone: "Numero de telephone",
      saving: "Enregistrement...",
      submit: "Creer l'inscription",
      saved: (studentName, courseTitle) =>
        `Inscription enregistree pour ${studentName} dans "${courseTitle}".`,
      failed: "Echec de l'inscription."
    },
    dashboard: {
      heading: "Tableau de bord Admin",
      subtitle: "Seul l'admin peut acceder a cette section.",
      manageGallery: "Gerer la galerie",
      photoTitle: "Titre de la photo",
      imageUrl: "URL de l'image",
      position: "Position",
      updatePhoto: "Mettre a jour",
      addPhoto: "Ajouter la photo",
      cancel: "Annuler",
      edit: "Modifier",
      delete: "Supprimer",
      manageNotifications: "Gerer les notifications",
      notificationTitle: "Titre de la notification",
      notificationMessage: "Message de la notification",
      publish: "Publier la notification",
      publishing: "Publication...",
      managePrograms: "Gerer les programmes",
      programLanguage: "Langue du programme",
      programTitle: "Titre du programme",
      programLevel: "Niveau du programme",
      programDurationWeeks: "Duree (semaines)",
      programDescription: "Description du programme",
      programImageUrl: "URL de l'image du programme",
      addProgram: "Ajouter le programme",
      updateProgram: "Mettre a jour le programme",
      noPrograms: "Aucun programme trouve.",
      contacts: "Contacts eleves",
      refresh: "Actualiser",
      loadingStudents: "Chargement des eleves...",
      noStudents: "Aucun eleve trouve.",
      noPhone: "Aucun telephone",
      galleryUpdated: "Photo de galerie mise a jour.",
      galleryCreated: "Photo de galerie creee.",
      galleryRemoved: "Photo de galerie supprimee.",
      gallerySaveError: "Impossible d'enregistrer la photo.",
      galleryDeleteError: "Impossible de supprimer la photo.",
      notificationPublished: "Notification publiee.",
      notificationRemoved: "Notification supprimee.",
      notificationPublishError: "Impossible de publier la notification.",
      notificationDeleteError: "Impossible de supprimer la notification.",
      programCreated: "Programme cree.",
      programUpdated: "Programme mis a jour.",
      programRemoved: "Programme supprime.",
      programSaveError: "Impossible de creer le programme.",
      programDeleteError: "Impossible de supprimer le programme."
    },
    common: {
      update: "Mettre a jour",
      create: "Creer"
    },
    errors: {
      loadData: "Impossible de charger les donnees.",
      loadStudents: "Impossible de charger les eleves."
    }
  },
  es: {
    language: "Idioma",
    nav: {
      home: "Inicio",
      about: "Acerca",
      courses: "Programas",
      gallery: "Galeria",
      enroll: "Inscripcion",
      dashboard: "Panel",
      toggleMenu: "Abrir menu"
    },
    auth: {
      loading: "Cargando...",
      login: "Iniciar sesion",
      signUp: "Registrarse",
      logout: "Cerrar sesion",
      loginTitle: "Iniciar sesion",
      loginSubtitle: "Usa tus credenciales.",
      signInLoading: "Entrando...",
      signUpTitle: "Registrarse",
      signUpSubtitle: "Crear cuenta de estudiante.",
      signUpLoading: "Creando...",
      needAccount: "No tienes cuenta? Registrate",
      haveAccount: "Ya tienes cuenta? Inicia sesion",
      password: "Contrasena",
      passwordMin: "Contrasena (min 8 caracteres)",
      loginFailed: "Error al iniciar sesion.",
      signupFailed: "Error al registrarse."
    },
    notifications: {
      title: "Notificaciones",
      empty: "Sin notificaciones."
    },
    hero: {
      tag: "La comunicacion global comienza aqui",
      titleMain: "Triunfar con el CNED, con un acompanamiento real",
      titleAccent: "",
      desc: "Ayudamos a los alumnos a organizarse, comprender sus clases y progresar durante todo el ano. Los idiomas son un plus, especialmente la darija.",
      cta: "Empezar"
    },
    about: {
      city: "GHAZOUA",
      subtitle: "La maison du savoir",
      title: "Acompanamiento CNED - Primaria y Colegio",
      quote: '"Sembramos semillas para el futuro"',
      lead: "Un espacio cercano para aprender de otra manera",
      paragraph:
        "La Maison du Savoir acompana a alumnos de primaria y colegio inscritos en CNED, en un entorno sereno, estimulante y personalizado.",
      includesTitle: "Nuestro acompanamiento incluye:",
      includes: [
        "Acogida durante el dia, de lunes a viernes",
        "Equipo pedagogico cercano y atento",
        "Seguimiento individual de cursos CNED",
        "Grupos pequenos para un aprendizaje eficaz",
        "Actividades complementarias: talleres creativos, juegos educativos, expresion oral"
      ],
      placeTitle: "Un lugar calido e inspirador",
      placeText:
        "Ubicada en Ghazoua (Km8, ruta de Sidi Kaouki), La Maison du Savoir es un espacio tranquilo y luminoso, ideal para la concentracion y el crecimiento.",
      ending: "Un lugar abierto al mundo, la naturaleza y el conocimiento."
    },
    stats: {
      programs: "Programas",
      courses: "Cursos",
      lessons: "Lecciones",
      students: "Alumnos"
    },
    catalog: {
      heading: "Programas Maison du Savoir",
      subtitle:
        "Acompanamiento CNED para primaria y colegio, grupos pequenos y actividades complementarias.",
      allPrograms: "Todos los programas",
      searchPlaceholder: "Buscar un programa...",
      loading: "Cargando cursos...",
      empty: "No hay programas para este filtro.",
      enrollBtn: "Inscribir en este curso",
      weeks: "semanas",
      lessons: "lecciones"
    },
    gallery: {
      heading: "Galeria de aprendizaje",
      subtitle: "Momentos de clases, talleres y actividades de estudiantes."
    },
    enroll: {
      heading: "Inscribir estudiante",
      subtitle: "Usa este formulario con nombre completo, email y telefono.",
      fullName: "Nombre completo",
      email: "Email",
      phone: "Telefono",
      saving: "Guardando...",
      submit: "Crear inscripcion",
      saved: (studentName, courseTitle) =>
        `Inscripcion guardada para ${studentName} en "${courseTitle}".`,
      failed: "La inscripcion fallo."
    },
    dashboard: {
      heading: "Panel de Admin",
      subtitle: "Solo el admin puede acceder a esta seccion.",
      manageGallery: "Gestionar galeria",
      photoTitle: "Titulo de foto",
      imageUrl: "URL de imagen",
      position: "Posicion",
      updatePhoto: "Actualizar foto",
      addPhoto: "Agregar foto",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      manageNotifications: "Gestionar notificaciones",
      notificationTitle: "Titulo de notificacion",
      notificationMessage: "Mensaje de notificacion",
      publish: "Publicar notificacion",
      publishing: "Publicando...",
      managePrograms: "Gestionar programas",
      programLanguage: "Idioma del programa",
      programTitle: "Titulo del programa",
      programLevel: "Nivel del programa",
      programDurationWeeks: "Duracion (semanas)",
      programDescription: "Descripcion del programa",
      programImageUrl: "URL de imagen del programa",
      addProgram: "Agregar programa",
      updateProgram: "Actualizar programa",
      noPrograms: "No hay programas.",
      contacts: "Contactos de estudiantes",
      refresh: "Actualizar",
      loadingStudents: "Cargando estudiantes...",
      noStudents: "Aun no hay estudiantes.",
      noPhone: "Sin telefono",
      galleryUpdated: "Foto de galeria actualizada.",
      galleryCreated: "Foto de galeria creada.",
      galleryRemoved: "Foto de galeria eliminada.",
      gallerySaveError: "No se pudo guardar la foto.",
      galleryDeleteError: "No se pudo eliminar la foto.",
      notificationPublished: "Notificacion publicada.",
      notificationRemoved: "Notificacion eliminada.",
      notificationPublishError: "No se pudo publicar la notificacion.",
      notificationDeleteError: "No se pudo eliminar la notificacion.",
      programCreated: "Programa creado.",
      programUpdated: "Programa actualizado.",
      programRemoved: "Programa eliminado.",
      programSaveError: "No se pudo crear el programa.",
      programDeleteError: "No se pudo eliminar el programa."
    },
    common: {
      update: "Actualizar",
      create: "Crear"
    },
    errors: {
      loadData: "No se pudieron cargar los datos.",
      loadStudents: "No se pudieron cargar los estudiantes."
    }
  }
};

function getInitialUiLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem("ui_language");
  return SUPPORTED_UI_LANGS.includes(saved) ? saved : "en";
}

function getDateLocale(uiLanguage) {
  if (uiLanguage === "fr") {
    return "fr-FR";
  }
  if (uiLanguage === "es") {
    return "es-ES";
  }
  return "en-US";
}

function formatDate(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function translateCourseLevel(level, uiLanguage) {
  const normalized = String(level || "").toLowerCase();

  if (uiLanguage === "fr") {
    if (normalized === "beginner") return "Debutant";
    if (normalized === "intermediate") return "Intermediaire";
    if (normalized === "advanced") return "Avance";
    return String(level || "");
  }

  if (uiLanguage === "es") {
    if (normalized === "beginner") return "Inicial";
    if (normalized === "intermediate") return "Intermedio";
    if (normalized === "advanced") return "Avanzado";
    return String(level || "");
  }

  return String(level || "");
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
  const [uiLanguage, setUiLanguage] = useState(getInitialUiLanguage);
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [adminStudents, setAdminStudents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [galleryForm, setGalleryForm] = useState(initialGalleryForm);
  const [editingPhotoId, setEditingPhotoId] = useState("");
  const [gallerySubmitting, setGallerySubmitting] = useState(false);
  const [notificationForm, setNotificationForm] = useState(initialNotificationForm);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);
  const [programForm, setProgramForm] = useState(initialProgramForm);
  const [editingProgramId, setEditingProgramId] = useState("");
  const [programSubmitting, setProgramSubmitting] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState("");

  const copy = useMemo(() => UI_COPY[uiLanguage] || UI_COPY.en, [uiLanguage]);
  const dateLocale = useMemo(() => getDateLocale(uiLanguage), [uiLanguage]);
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
    if (!programForm.languageId && languages.length > 0) {
      setProgramForm((previous) => ({
        ...previous,
        languageId: String(languages[0].id)
      }));
    }
  }, [languages, programForm.languageId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ui_language", uiLanguage);
    }
  }, [uiLanguage]);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setAuthOpen(false);
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function closeOnDesktop() {
      if (window.innerWidth > 760) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void refreshAdminStudents();
    } else {
      setAdminStudents([]);
      setAdminError("");
      setEditingProgramId("");
      setProgramForm(initialProgramForm);
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
      setCatalogError(error.message || copy.errors.loadData);
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
      setAdminError(error.message || copy.errors.loadStudents);
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
        phone: enrollForm.phone.trim(),
        courseId: Number(enrollForm.courseId)
      };
      const response = await enrollStudent(payload);
      setEnrollMessage(copy.enroll.saved(response.student.fullName, response.course.title));
      setEnrollForm((previous) => ({ ...previous, fullName: "", email: "", phone: "" }));
      await Promise.all([refreshPublicData(), isAdmin ? refreshAdminStudents() : Promise.resolve()]);
    } catch (error) {
      setEnrollMessage(error.message || copy.enroll.failed);
    } finally {
      setEnrollSubmitting(false);
    }
  }

  function jumpToEnroll(courseId) {
    setEnrollForm((previous) => ({ ...previous, courseId: String(courseId) }));
    setNotifOpen(false);
    setMenuOpen(false);
    const target = document.getElementById("enroll");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleNavClick() {
    setNotifOpen(false);
    setMenuOpen(false);
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthMessage("");
    setAuthOpen(true);
    setNotifOpen(false);
    setMenuOpen(false);
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
      setAuthMessage(error.message || copy.auth.loginFailed);
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
      setAuthMessage(error.message || copy.auth.signupFailed);
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
      setMenuOpen(false);
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
        setDashboardMessage(copy.dashboard.galleryUpdated);
      } else {
        await createGalleryPhoto(payload);
        setDashboardMessage(copy.dashboard.galleryCreated);
      }
      cancelPhotoEdit();
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || copy.dashboard.gallerySaveError);
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
      setDashboardMessage(copy.dashboard.galleryRemoved);
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || copy.dashboard.galleryDeleteError);
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
      setDashboardMessage(copy.dashboard.notificationPublished);
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || copy.dashboard.notificationPublishError);
    } finally {
      setNotificationSubmitting(false);
    }
  }

  async function handleDeleteNotification(notificationId) {
    setDashboardMessage("");
    try {
      await deleteNotification(notificationId);
      setDashboardMessage(copy.dashboard.notificationRemoved);
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || copy.dashboard.notificationDeleteError);
    }
  }

  function startEditProgram(course) {
    setEditingProgramId(String(course.id));
    setProgramForm({
      languageId: String(course.languageId),
      title: course.title,
      level: course.level,
      durationWeeks: Number(course.durationWeeks || 1),
      description: course.description || "",
      imageUrl: course.imageUrl || ""
    });
    setDashboardMessage("");
  }

  function cancelProgramEdit(clearMessage = true) {
    setEditingProgramId("");
    setProgramForm({
      ...initialProgramForm,
      languageId: languages[0] ? String(languages[0].id) : ""
    });
    if (clearMessage) {
      setDashboardMessage("");
    }
  }

  async function handleSaveProgram(event) {
    event.preventDefault();
    setProgramSubmitting(true);
    setDashboardMessage("");

    try {
      const payload = {
        languageId: Number(programForm.languageId),
        title: programForm.title.trim(),
        level: programForm.level,
        durationWeeks: Number(programForm.durationWeeks),
        description: programForm.description.trim(),
        imageUrl: programForm.imageUrl.trim()
      };

      if (editingProgramId) {
        await updateCourse(editingProgramId, payload);
        cancelProgramEdit(false);
        setDashboardMessage(copy.dashboard.programUpdated);
      } else {
        await createCourse(payload);
        cancelProgramEdit(false);
        setDashboardMessage(copy.dashboard.programCreated);
      }
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || copy.dashboard.programSaveError);
    } finally {
      setProgramSubmitting(false);
    }
  }

  async function handleDeleteProgram(courseId) {
    setDashboardMessage("");
    try {
      await deleteCourse(courseId);
      if (String(courseId) === editingProgramId) {
        cancelProgramEdit();
      }
      setDashboardMessage(copy.dashboard.programRemoved);
      await refreshPublicData();
    } catch (error) {
      setDashboardMessage(error.message || copy.dashboard.programDeleteError);
    }
  }

  return (
    <div className="page">
      {menuOpen ? (
        <div
          className="menu-backdrop"
          aria-hidden="true"
          onClick={() => {
            setMenuOpen(false);
            setNotifOpen(false);
          }}
        />
      ) : null}

      <header className="header">
        <div className="container nav">
          <div className="logo" aria-label="La Maison du Savoir">
            <div className="logo-text">La Maison du Savoir</div>
          </div>

          <div id="main-nav-panel" className={`nav-panel ${menuOpen ? "open" : ""}`}>
            <div className="nav-actions">
              <nav>
                <a href="#home" onClick={handleNavClick}>
                  {copy.nav.home}
                </a>
                <a href="#about" onClick={handleNavClick}>
                  {copy.nav.about}
                </a>
                <a href="#courses" onClick={handleNavClick}>
                  {copy.nav.courses}
                </a>
                <a href="#gallery" onClick={handleNavClick}>
                  {copy.nav.gallery}
                </a>
                <a href="#enroll" onClick={handleNavClick}>
                  {copy.nav.enroll}
                </a>
                {isAdmin ? (
                  <a href="#dashboard" onClick={handleNavClick}>
                    {copy.nav.dashboard}
                  </a>
                ) : null}
              </nav>

              <div className="lang-picker">
                <label htmlFor="ui-language" className="sr-only">
                  {copy.language}
                </label>
                <select
                  id="ui-language"
                  aria-label={copy.language}
                  value={uiLanguage}
                  onChange={(event) => setUiLanguage(event.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">Francais</option>
                  <option value="es">Espanol</option>
                </select>
              </div>

              <div className="auth-actions">
                {sessionLoading ? <span className="auth-chip">{copy.auth.loading}</span> : null}
                {!sessionLoading && !user ? (
                  <>
                    <button type="button" className="nav-small-btn" onClick={() => openAuth("login")}>
                      {copy.auth.login}
                    </button>
                    <button type="button" className="nav-small-btn alt" onClick={() => openAuth("signup")}>
                      {copy.auth.signUp}
                    </button>
                  </>
                ) : null}
                {!sessionLoading && user ? (
                  <>
                    <span className="auth-chip">{user.name || user.email}</span>
                    <button type="button" className="nav-small-btn alt" onClick={handleLogout}>
                      {copy.auth.logout}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="header-controls">
            <div className="notif-wrap">
              <button
                type="button"
                className="notif-btn"
                aria-label={copy.notifications.title}
                onClick={() => setNotifOpen((previous) => !previous)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
                </svg>
                <span className="notif-badge">{notifications.length}</span>
              </button>

              {notifOpen ? (
                <div className="notif-menu">
                  <div className="notif-menu-title">{copy.notifications.title}</div>
                  {notifications.length === 0 ? <p className="notif-empty">{copy.notifications.empty}</p> : null}
                  {notifications.map((note) => (
                    <article key={note.id} className="notif-item">
                      <p>{note.title}</p>
                      <span>{formatDate(note.createdAt, dateLocale)}</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className={`menu-toggle ${menuOpen ? "open" : ""}`}
              aria-label={copy.nav.toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="main-nav-panel"
              onClick={() => {
                setMenuOpen((previous) => !previous);
                setNotifOpen(false);
              }}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <section
        id="home"
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 76, 121, 0.8), rgba(11, 62, 97, 0.82)), url("${HERO_IMAGE_URL}")`
        }}
      >
        <div className="container hero-content">
          <p className="hero-tag">{copy.hero.tag}</p>
          <h1>
            {copy.hero.titleMain}
            {copy.hero.titleAccent ? <span>{copy.hero.titleAccent}</span> : null}
          </h1>
          <p className="hero-desc">{copy.hero.desc}</p>
          <a className="hero-btn" href="#courses" onClick={() => setNotifOpen(false)}>
            {copy.hero.cta}
          </a>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <div className="section-head">
            <h2>{copy.about.city}</h2>
            <p>{copy.about.subtitle}</p>
          </div>

          <article className="about-card">
            <h3>{copy.about.title}</h3>
            <p className="about-quote">{copy.about.quote}</p>
            <p className="about-lead">{copy.about.lead}</p>
            <p>{copy.about.paragraph}</p>

            <h4>{copy.about.includesTitle}</h4>
            <ul className="about-list">
              {copy.about.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h4>{copy.about.placeTitle}</h4>
            <p>{copy.about.placeText}</p>
            <p className="about-phone">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                0681222459
              </a>
            </p>
            <p className="about-end">{copy.about.ending}</p>
          </article>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-grid">
          <article className="stat-card">
            <strong>{stats.languages}</strong>
            <span>{copy.stats.programs}</span>
          </article>
          <article className="stat-card">
            <strong>{stats.courses}</strong>
            <span>{copy.stats.courses}</span>
          </article>
          <article className="stat-card">
            <strong>{stats.lessons}</strong>
            <span>{copy.stats.lessons}</span>
          </article>
          <article className="stat-card">
            <strong>{stats.students}</strong>
            <span>{copy.stats.students}</span>
          </article>
        </div>
      </section>

      <section id="courses" className="courses">
        <div className="container">
          <div className="section-head">
            <h2>{copy.catalog.heading}</h2>
            <p>{copy.catalog.subtitle}</p>
          </div>

          <div className="filters">
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
            >
              <option value="all">{copy.catalog.allPrograms}</option>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder={copy.catalog.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {catalogError ? <p className="status error">{catalogError}</p> : null}
          {loadingCatalog ? <p className="status">{copy.catalog.loading}</p> : null}

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
                      {translateCourseLevel(course.level, uiLanguage)} | {course.durationWeeks}{" "}
                      {copy.catalog.weeks} | {course.lessonCount} {copy.catalog.lessons}
                    </p>
                    <p>{course.description}</p>
                    <button type="button" onClick={() => jumpToEnroll(course.id)}>
                      {copy.catalog.enrollBtn}
                    </button>
                  </div>
                </article>
              ))}
              {!filteredCourses.length ? (
                <p className="status">{copy.catalog.empty}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section id="gallery" className="gallery">
        <div className="container">
          <div className="section-head">
            <h2>{copy.gallery.heading}</h2>
            <p>{copy.gallery.subtitle}</p>
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
            <h2>{copy.enroll.heading}</h2>
            <p>{copy.enroll.subtitle}</p>
          </div>
          <form className="enroll-form" onSubmit={handleEnrollSubmit}>
            <input
              type="text"
              placeholder={copy.enroll.fullName}
              value={enrollForm.fullName}
              onChange={(event) =>
                setEnrollForm((previous) => ({ ...previous, fullName: event.target.value }))
              }
              required
            />
            <input
              type="email"
              placeholder={copy.enroll.email}
              value={enrollForm.email}
              onChange={(event) =>
                setEnrollForm((previous) => ({ ...previous, email: event.target.value }))
              }
              required
            />
            <input
              type="tel"
              placeholder={copy.enroll.phone}
              value={enrollForm.phone}
              onChange={(event) =>
                setEnrollForm((previous) => ({ ...previous, phone: event.target.value }))
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
              {enrollSubmitting ? copy.enroll.saving : copy.enroll.submit}
            </button>
            {enrollMessage ? <p className="status">{enrollMessage}</p> : null}
          </form>
        </div>
      </section>

      {isAdmin ? (
        <section id="dashboard" className="dashboard">
          <div className="container">
            <div className="section-head">
              <h2>{copy.dashboard.heading}</h2>
              <p>{copy.dashboard.subtitle}</p>
            </div>
            {dashboardMessage ? <p className="status">{dashboardMessage}</p> : null}
            {adminError ? <p className="status error">{adminError}</p> : null}

            <div className="admin-grid">
              <article className="admin-card">
                <h3>{copy.dashboard.manageGallery}</h3>
                <form className="admin-form" onSubmit={handleSavePhoto}>
                  <input
                    type="text"
                    placeholder={copy.dashboard.photoTitle}
                    value={galleryForm.title}
                    onChange={(event) =>
                      setGalleryForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="url"
                    placeholder={copy.dashboard.imageUrl}
                    value={galleryForm.imageUrl}
                    onChange={(event) =>
                      setGalleryForm((previous) => ({ ...previous, imageUrl: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder={copy.dashboard.position}
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
                        ? copy.enroll.saving
                        : editingPhotoId
                          ? copy.dashboard.updatePhoto
                          : copy.dashboard.addPhoto}
                    </button>
                    {editingPhotoId ? (
                      <button type="button" className="secondary-btn" onClick={cancelPhotoEdit}>
                        {copy.dashboard.cancel}
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
                          {copy.dashboard.edit}
                        </button>
                        <button type="button" className="danger-btn" onClick={() => handleDeletePhoto(photo.id)}>
                          {copy.dashboard.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-card">
                <h3>{copy.dashboard.manageNotifications}</h3>
                <form className="admin-form" onSubmit={handleCreateNotification}>
                  <input
                    type="text"
                    placeholder={copy.dashboard.notificationTitle}
                    value={notificationForm.title}
                    onChange={(event) =>
                      setNotificationForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    required
                  />
                  <textarea
                    placeholder={copy.dashboard.notificationMessage}
                    value={notificationForm.message}
                    onChange={(event) =>
                      setNotificationForm((previous) => ({ ...previous, message: event.target.value }))
                    }
                  />
                  <button type="submit" disabled={notificationSubmitting}>
                    {notificationSubmitting ? copy.dashboard.publishing : copy.dashboard.publish}
                  </button>
                </form>
                <div className="admin-list">
                  {notifications.map((notification) => (
                    <div key={`admin-note-${notification.id}`} className="admin-row">
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{formatDate(notification.createdAt, dateLocale)}</p>
                      </div>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          {copy.dashboard.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-card">
                <h3>{copy.dashboard.managePrograms}</h3>
                <form className="admin-form" onSubmit={handleSaveProgram}>
                  <select
                    value={programForm.languageId}
                    onChange={(event) =>
                      setProgramForm((previous) => ({ ...previous, languageId: event.target.value }))
                    }
                    required
                  >
                    {languages.map((language) => (
                      <option key={`program-language-${language.id}`} value={language.id}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder={copy.dashboard.programTitle}
                    value={programForm.title}
                    onChange={(event) =>
                      setProgramForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    required
                  />
                  <select
                    value={programForm.level}
                    onChange={(event) =>
                      setProgramForm((previous) => ({ ...previous, level: event.target.value }))
                    }
                    required
                  >
                    <option value="Beginner">{translateCourseLevel("Beginner", uiLanguage)}</option>
                    <option value="Intermediate">{translateCourseLevel("Intermediate", uiLanguage)}</option>
                    <option value="Advanced">{translateCourseLevel("Advanced", uiLanguage)}</option>
                  </select>
                  <input
                    type="number"
                    placeholder={copy.dashboard.programDurationWeeks}
                    value={programForm.durationWeeks}
                    onChange={(event) =>
                      setProgramForm((previous) => ({
                        ...previous,
                        durationWeeks: Number(event.target.value || 1)
                      }))
                    }
                    min="1"
                    required
                  />
                  <textarea
                    placeholder={copy.dashboard.programDescription}
                    value={programForm.description}
                    onChange={(event) =>
                      setProgramForm((previous) => ({ ...previous, description: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="url"
                    placeholder={copy.dashboard.programImageUrl}
                    value={programForm.imageUrl}
                    onChange={(event) =>
                      setProgramForm((previous) => ({ ...previous, imageUrl: event.target.value }))
                    }
                    required
                  />
                  <div className="admin-form-actions">
                    <button type="submit" disabled={programSubmitting}>
                      {programSubmitting
                        ? copy.enroll.saving
                        : editingProgramId
                          ? copy.dashboard.updateProgram
                          : copy.dashboard.addProgram}
                    </button>
                    {editingProgramId ? (
                      <button type="button" className="secondary-btn" onClick={cancelProgramEdit}>
                        {copy.dashboard.cancel}
                      </button>
                    ) : null}
                  </div>
                </form>
                <div className="admin-list">
                  {courses.map((course) => (
                    <div key={`admin-course-${course.id}`} className="admin-row">
                      <div>
                        <strong>{course.title}</strong>
                        <p>
                          {course.languageName} | {translateCourseLevel(course.level, uiLanguage)} |{" "}
                          {course.durationWeeks} {copy.catalog.weeks}
                        </p>
                      </div>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => startEditProgram(course)}
                        >
                          {copy.dashboard.edit}
                        </button>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDeleteProgram(course.id)}
                        >
                          {copy.dashboard.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 ? <p className="status">{copy.dashboard.noPrograms}</p> : null}
                </div>
              </article>
            </div>

            <article className="admin-card student-card">
              <div className="student-head">
                <h3>{copy.dashboard.contacts}</h3>
                <button type="button" className="secondary-btn" onClick={() => refreshAdminStudents()}>
                  {copy.dashboard.refresh}
                </button>
              </div>
              {adminLoading ? <p className="status">{copy.dashboard.loadingStudents}</p> : null}
              {!adminLoading && adminStudents.length === 0 ? (
                <p className="status">{copy.dashboard.noStudents}</p>
              ) : null}
              <div className="student-list">
                {adminStudents.map((student) => (
                  <div key={`student-${student.studentId}`} className="student-row">
                    <div className="student-main">
                      <strong>{student.fullName}</strong>
                      <p>{student.email}</p>
                      <p>{student.phone || copy.dashboard.noPhone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <a
        className="whatsapp-float"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M19.11 17.23c-.3-.16-1.74-.86-2.01-.96-.27-.1-.47-.16-.67.16-.2.3-.77.96-.94 1.16-.17.2-.34.23-.64.08-.3-.16-1.24-.46-2.37-1.46-.88-.78-1.48-1.74-1.66-2.03-.17-.3-.02-.46.13-.62.13-.13.3-.34.44-.5.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.54-.08-.16-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.5.08-.77.38-.27.3-1.03 1-1.03 2.44 0 1.44 1.05 2.83 1.2 3.03.15.2 2.06 3.13 5.02 4.4.7.3 1.25.48 1.68.62.7.22 1.35.2 1.86.12.57-.08 1.74-.7 1.99-1.37.25-.66.25-1.24.17-1.36-.07-.12-.26-.2-.56-.35z" />
          <path d="M16 3.2A12.74 12.74 0 0 0 4.96 21.2L3.2 28.8l7.77-1.7A12.8 12.8 0 1 0 16 3.2zm0 23.28c-1.72 0-3.4-.45-4.87-1.3l-.35-.2-4.6 1 1.03-4.47-.23-.37a10.2 10.2 0 1 1 9.02 5.34z" />
        </svg>
      </a>

      <footer className="footer">
        <div className="container">
          <p>La Maison du Savoir</p>
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
                <h3>{copy.auth.loginTitle}</h3>
                <p>{copy.auth.loginSubtitle}</p>
                <form className="auth-form" onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder={copy.enroll.email}
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((previous) => ({ ...previous, email: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder={copy.auth.password}
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((previous) => ({ ...previous, password: event.target.value }))
                    }
                    required
                  />
                  <button type="submit" disabled={authSubmitting}>
                    {authSubmitting ? copy.auth.signInLoading : copy.auth.login}
                  </button>
                </form>
                <button type="button" className="auth-switch" onClick={() => setAuthMode("signup")}>
                  {copy.auth.needAccount}
                </button>
              </>
            ) : (
              <>
                <h3>{copy.auth.signUpTitle}</h3>
                <p>{copy.auth.signUpSubtitle}</p>
                <form className="auth-form" onSubmit={handleSignup}>
                  <input
                    type="text"
                    placeholder={copy.enroll.fullName}
                    value={signupForm.name}
                    onChange={(event) =>
                      setSignupForm((previous) => ({ ...previous, name: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder={copy.enroll.email}
                    value={signupForm.email}
                    onChange={(event) =>
                      setSignupForm((previous) => ({ ...previous, email: event.target.value }))
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder={copy.auth.passwordMin}
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((previous) => ({ ...previous, password: event.target.value }))
                    }
                    required
                  />
                  <button type="submit" disabled={authSubmitting}>
                    {authSubmitting ? copy.auth.signUpLoading : copy.auth.signUp}
                  </button>
                </form>
                <button type="button" className="auth-switch" onClick={() => setAuthMode("login")}>
                  {copy.auth.haveAccount}
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

