// Curated, college-specific content taken from each college's OFFICIAL website. Add one entry per college (key = the college's link name).
// Anything you leave out falls back to the preset for that type of college (engineering, medical, agriculture, law, degree...).
// Example:
//   "acharya-nagarjuna-university": {
//     source: "https://www.nagarjunauniversity.ac.in/",           // where the information came from
//     subjects: ["Mathematics", "Physics", "Chemistry", "Botany", "Zoology", "Computer Science", "Commerce", "Other"],
//     clubs: ["NSS", "NCC", "Literary Club", "Cultural", "Sports", "Other"],
//     ideas: ["Project", "Research", "Campus life", "Social impact", "Other"],
//     exam: "APPSC / Competitive exams",
//     bot: false
//   }
window.COLLEGE_DATA = {
  // Acharya Nagarjuna University (Guntur). Official site: 10 faculties, 39 departments, 67 courses. Colleges named there: Arts, Commerce and Law; Engineering and Technology (B.Tech CSE, ECE, EEE; M.Tech; MCA); Sciences.
  // Departments seen on the official site: Computer Science and Engineering, Electronics and Communication, Electrical and Electronics, Psychology, Sanskrit, International Business (MBA), Mahayana Buddhist Studies.
  // Maths, Physics and Chemistry are included as the usual basics of the Sciences college (to be confirmed against the department pages).
  "anu": {
    source: "https://www.nagarjunauniversity.ac.in/",
    subjects: ["Computer Science", "Electronics and Communication", "Electrical and Electronics", "MCA", "Mathematics", "Physics", "Chemistry", "Psychology", "Business Administration", "Commerce", "Law", "English", "Sanskrit", "Buddhist Studies", "Other"],
    clubs: ["NSS / NCC", "Literary", "Cultural", "Sports", "Coding Club", "Research Society", "Other"],
    exam: "Competitive exams",
    bot: false
  },
  // Andhra University (Visakhapatnam). Official course pages list: College of Arts and Commerce (21 departments), College of Science and Technology, College of Engineering,
  // College of Pharmaceutical Sciences and Dr. B.R. Ambedkar College of Law.
  "andhra-university": {
    source: "https://www.andhrauniversity.edu.in/academics/courses-offered.html",
    subjects: ["Applied Mathematics", "Biochemistry", "Biotechnology", "Botany", "Environmental Sciences", "Geography", "Geology", "Economics", "Commerce and Management", "Education", "English", "History and Archaeology", "Political Science", "Sociology", "Telugu", "Hindi", "Journalism and Mass Comm", "Library Science", "Social Work", "Law", "Pharmacy", "Engineering", "Other"],
    clubs: ["Music and Dance", "Theatre Arts", "Yoga", "Literary", "NSS / NCC", "Cultural", "Sports", "Research Society", "Other"],
    exam: "Competitive exams",
    bot: false
  }
};
