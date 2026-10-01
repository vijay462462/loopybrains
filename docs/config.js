// Doubt Desk settings. Edit this file to change subjects or connect the database.
window.DOUBT_DESK_CONFIG = {
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
  privateClass: true,

  // Caption under the title. Add more lines to rotate between them every 5 seconds.
  captions: [
    "One doubt. Many minds. Zero fear.",
  ],

  // Subjects shown in the Doubts tab, in this order.
  subjects: ["DLD", "CS", "DSP", "PRV", "AEC", "CN", "CO & D", "CS-2", "RFME"],

  // Exam countdown shown at the top. Add one line per exam, date as YYYY-MM-DD, e.g.
  // { name: "DSP Mid-1", date: "2026-10-15" },
  exams: [
  ],

  // Verified mentors (for example IIT students or alumni). Each mentor opens the board, taps their
  // name, and sends you the mentor ID shown there. Add one line per mentor:
  // { id: "d-1234abcd-....", name: "Priya, IIT Madras" },
  mentors: [
  ],

  // Search words for each subject's IIT NPTEL course and lectures (Learn panel and "Ask IIT experts").
  learn: {
    "DLD": "Digital Circuits", "DSP": "Digital Signal Processing", "CN": "Computer Networks",
    "AEC": "Analog Electronic Circuits", "CS": "Control Systems", "CS-2": "Communication Systems",
    "PRV": "Probability and Random Processes", "RFME": "Microwave Engineering", "CO & D": "Computer Organization and Architecture",
  },

  // Categories shown in the Ideas tab.
  ideaCategories: ["Project", "Startup", "Research", "Campus life", "Social impact", "Other"],
};
