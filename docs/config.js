// Doubt Desk settings. Edit this file to change subjects or connect the database.
window.DOUBT_DESK_CONFIG = {
  // Site title shown in the header
  title: "RGUKT Spark",

  // Paste your Firebase web app config here (Firebase console > Project settings > Your apps).
  firebase: {
    apiKey: "AIzaSyBulu10AZTsX2dWS7IWkMhpRrfyxoiyvyE",
    authDomain: "doubt-desk-e6f39.firebaseapp.com",
    projectId: "doubt-desk-e6f39",
    storageBucket: "doubt-desk-e6f39.firebasestorage.app",
    messagingSenderId: "530725630149",
    appId: "1:530725630149:web:02a51823f13de09ebdc0ac",
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
