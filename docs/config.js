// Doubt Desk settings. Edit this file to change subjects or connect the database.
window.DOUBT_DESK_CONFIG = {
  // Product name shown across the app. Change it here to rename everything.
  brand: "Loopy Brains",

  // Loopy Brains Plus (optional paid plan). Keep enabled:false until payments are set up (see PREMIUM.md).
  // monthly / yearly are prices in rupees; functionsUrl is the address of the deployed payment functions.
  // Photos. To stop misuse the app is camera-only for photos in doubts, answers and stories, and profile photos are off (avatars are used).
  // Set gallery: true to allow choosing existing pictures, and profilePhoto: true to allow profile photos again.
  media: { gallery: false, profilePhoto: false },
  // App Check: paste the reCAPTCHA v3 SITE key (public) from Firebase console > App Check. Leave empty until you have registered the app (steps in APPCHECK.md).
  requirePhone: false,   // true = also verify a mobile number by SMS code. SMS needs the paid Firebase Blaze plan (about 6 rupees per code), so it is off.
  requireSignup: "post",   // "post" = anyone can browse, use Loopy AI and Loop Bot; sign-up (e-mail + password) is asked only when posting. "boot" = block everyone at the door. false = off.
  appCheck: { siteKey: "6LcDueEtAAAAACnpgxodE6KX1rQ6PZg1gGSrhxC6", provider: "enterprise" },   // provider: "v3" (reCAPTCHA v3) or "enterprise" (Google Cloud Fraud Defense / reCAPTCHA Enterprise)
  // Surprise offers for Loopy AI credits. Add one line per offer. from and to are dates (India time). The offer adds extra credits to every student while it runs.
  // Example: { id: "festival", title: "Festival offer", text: "Extra credits all weekend", bonusDay: 10, bonusWeek: 20, from: "2026-10-20", to: "2026-10-25" }
  brainOffers: [],
  // Background push alerts (needs the push function deployed). Paste the Web Push certificate key from Firebase console > Project settings > Cloud Messaging. It is a public key, safe to publish.
  push: { vapidKey: "" },
  plus: { enabled: false, weekly: 19, semester: 149, monthly: 49, yearly: 399, functionsUrl: "",
    // Launch offer on the yearly plan until the date below (also set OFFER in functions/index.js). Set offer: null to remove it.
    offer: { label: "Founding student offer", yearly: 299, until: "2026-12-31" },
    trialDays: 7 },

  // true = show the About and welcome steps after the opening screen on EVERY visit (good for testing). Set to false before launch.
  welcomeEveryVisit: false,

  // Shown on the About screen when someone joins. Fill these in: they build trust. Leave a value empty to hide it.
  about: { founder: "Vijay M", college: "", email: "v.bhaskar462@gmail.com" },

  // Site title shown in the header
  title: "Loopy Brains",

  // Paste your Firebase web app config here (Firebase console > Project settings > Your apps).
  firebase: {
    apiKey: "AIzaSyBulu10AZTsX2dWS7IWkMhpRrfyxoiyvyE",
    authDomain: "doubt-desk-e6f39.firebaseapp.com",
    projectId: "doubt-desk-e6f39",
    storageBucket: "doubt-desk-e6f39.firebasestorage.app",
    messagingSenderId: "530725630149",
    appId: "1:530725630149:web:02a51823f13de09ebdc0ac",
  },

  // Supabase (optional). Fill BOTH to switch the whole app from Firebase to Supabase.
  // Project URL and the "anon public" key: Supabase dashboard > Project Settings > API.
  // The anon key is meant to be public; security comes from the Row Level Security in supabase/schema.sql.
  supabase: {
    url: "",
    anonKey: "",
  },

  // Private class: when true, students must enter the class code to read or post.
  // The code itself is set only in the Firebase rules, never in this public file.
  privateClass: false,

  // Caption under the title. Add more lines to rotate between them every 5 seconds.
  captions: [
    "Designed for RGUKTians.",
    "Ask boldly. Answer together. Innovate endlessly.",
    "Doubt today. Discover tomorrow.",
    "RGUKT students, think, build, ignite.",
    "Every doubt you ask today is a concept you own tomorrow.",
    "Great engineers ask the questions others skip.",
  ],

  campuses: ["NUZVID", "ONGOLE", "RKVALLEY", "SRIKAKULAM"],

  // Clubs shown in the Clubs tab. Add or rename clubs here.
  clubs: [
    "Coding Club", "Computer Science", "AI/ML", "Robotics", "Electronics",
    "Civil Designers", "Mech Makers", "Startup Cell",
    "Research Society", "Cultural", "Sports", "Other",
  ],

  // Subjects shown in the Doubts tab, in this order.
  // ECE subjects
  subjects: ["DLD", "CS", "DSP", "PRV", "AEC", "CN", "CO & D", "CS-2", "RFME",
             // CSE subjects
             "DS & A", "OS", "DBMS", "OOP", "TOC", "CD", "SE", "Python", "Maths",
             // Civil subjects
             "SOM", "FM", "Struct", "Geo", "Trans", "Env", "Survey",
             // Mech subjects
             "Thermo", "FM-M", "MD", "MOM", "Mfg", "HT", "IC Eng",
             // EEE subjects
             "Circuits", "EM", "PS", "PE", "Control", "EMS", "PQ"],

  // Exam countdown shown at the top. Add one line per exam, date as YYYY-MM-DD, e.g.
  // { name: "DSP Mid-1", date: "2026-10-15" },
  exams: [
  ],

  // Verified mentors (for example IIT students or alumni). Each mentor opens the board, taps their
  // name, and sends you the mentor ID shown there. Add one line per mentor:
  // { id: "d-1234abcd-....", name: "Priya, IIT Madras" },
  mentors: [
  ],

  // Alumni admins: phones or computers allowed to approve Alumni Connect profiles and jobs.
  // Each admin opens Profile (Me), taps "Are you an IIT mentor?", copies the ID and sends it to you.
  // Add one line per admin: { id: "d-1234abcd-....", name: "Admin name" },
  // While this list is empty, approval is switched off and every alumni profile is shown.
  admins: [
  ],

  // Search words for each subject's IIT NPTEL course and lectures (Learn panel and "Ask IIT experts").
  learn: {
    // ECE
    "DLD": "Digital Circuits", "DSP": "Digital Signal Processing", "CN": "Computer Networks",
    "AEC": "Analog Electronic Circuits", "CS": "Control Systems", "CS-2": "Communication Systems",
    "PRV": "Probability and Random Processes", "RFME": "Microwave Engineering", "CO & D": "Computer Organization and Architecture",
    // CSE
    "DS & A": "Data Structures and Algorithms", "OS": "Operating Systems",
    "DBMS": "Database Management Systems", "OOP": "Programming in Java Object Oriented Programming",
    "TOC": "Theory of Computation Automata", "CD": "Compiler Design",
    "SE": "Software Engineering", "Python": "Python for Data Science",
    "Maths": "Discrete Mathematics Engineering",
    // Civil
    "SOM": "Strength of Materials Mechanics of Solids",
    "FM": "Fluid Mechanics Hydraulics",
    "Struct": "Structural Analysis",
    "Geo": "Geotechnical Engineering Soil Mechanics",
    "Trans": "Transportation Engineering Highway",
    "Env": "Environmental Engineering Water Treatment",
    "Survey": "Surveying Civil Engineering",
    // Mech
    "Thermo": "Engineering Thermodynamics",
    "FM-M": "Fluid Mechanics and Machinery",
    "MD": "Machine Design",
    "MOM": "Mechanics of Materials Strength",
    "Mfg": "Manufacturing Technology Processes",
    "HT": "Heat Transfer",
    "IC Eng": "Internal Combustion Engines",
    // EEE
    "Circuits": "Electrical Circuit Analysis",
    "EM": "Electrical Machines AC DC",
    "PS": "Power Systems Transmission Distribution",
    "PE": "Power Electronics Converters",
    "Control": "Control Systems Engineering",
    "EMS": "Electrical Measurements Instrumentation",
    "PQ": "Power Quality Power Electronics",
  },

  // Categories shown in the Ideas tab.
  ideaCategories: ["Mini Project", "Major Project", "Startup", "Research", "Campus life", "Social impact", "Other"],
};
