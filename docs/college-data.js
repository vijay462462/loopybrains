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
  },
  // ---- batch 2 (from the official sites, via search limited to each official domain) ----
  // Sri Venkateswara University (Tirupati): 54 departments, colleges of Arts, Sciences, Commerce-Management-Computer Science, Pharmacy and Engineering (B.Tech in Chemical, Civil, EEE, ECE, Mechanical, CSE).
  "svu": {
    source: "https://svuniversity.edu.in/",
    subjects: ["Computer Science", "Electronics and Communication", "Electrical and Electronics", "Mechanical", "Civil", "Chemical Engineering", "Economics", "English", "Sanskrit", "Telugu", "History", "Law", "Microbiology", "Commerce and Management", "Pharmacy", "Other"],
    exam: "Competitive exams", bot: false
  },
  // Acharya N.G. Ranga Agricultural University (Guntur): B.Sc (Hons) Agriculture departments, plus colleges of Agricultural Engineering, Food Science and Technology, and Community Science.
  "angrau": {
    source: "https://angrau.ac.in/",
    subjects: ["Agronomy", "Genetics and Plant Breeding", "Soil Science", "Biochemistry", "Entomology", "Agricultural Economics", "Agricultural Engineering", "Crop Physiology", "Plant Pathology", "Horticulture", "Extension Education", "Agricultural Statistics", "Animal Husbandry", "Food Science", "Community Science", "Other"],
    exam: "ICAR / JRF", bot: false
  },
  // Damodaram Sanjivayya National Law University (Visakhapatnam): 5-year BA LLB (Hons), 3-year LLB, LLM in three specialisations, PhD/LLD; centre for IPR and technology, arbitration journal.
  // The first eight subjects are the standard LLB papers (not listed individually on the pages seen).
  "dsnlu": {
    source: "https://dsnlu.ac.in/",
    subjects: ["Constitutional Law", "Contract Law", "Criminal Law", "Torts", "Jurisprudence", "Property Law", "Family Law", "Company Law", "Corporate and Commercial Law", "Criminal and Security Law", "IPR and Technology Law", "Arbitration", "Legal English", "Other"],
    exam: "CLAT / Judiciary", bot: false
  },
  // Dr. NTR University of Health Sciences (Vijayawada): MBBS, BDS, BPT, B.Sc Nursing, paramedical, Ayurveda, Unani, Homeopathy, Naturopathy; about 271 affiliated colleges.
  "ntruhs": {
    source: "http://ntruhs.ap.nic.in/",
    subjects: ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine", "Community Medicine", "Medicine", "Surgery", "OBG", "Pediatrics", "Dental Sciences", "Physiotherapy", "Nursing", "Paramedical", "Ayurveda", "Homeopathy", "Other"],
    exam: "NEET PG / NEXT", bot: false
  },
  // Krishna University (Machilipatnam): B.Tech (Civil, CSE, ECE, EEE, IT, Mechanical), M.Sc/M.Pharmacy/MBA/MCA/M.Tech, BA combinations, Kuchipudi dance courses.
  "krishna-university": {
    source: "http://www.krishnauniversity.ac.in/Academics/Courses.aspx",
    subjects: ["Computer Science", "Electronics", "Civil Engineering", "Mechanical", "Electrical and Electronics", "Information Technology", "Pharmacy", "Biotechnology", "Chemistry", "Botany", "Zoology", "Physics", "Mathematics", "Statistics", "Economics", "Commerce", "MBA", "English", "Telugu", "Journalism", "Psychology", "Political Science", "History", "Social Work", "Kuchipudi Dance", "Other"],
    exam: "Competitive exams", bot: false
  },
  // Adikavi Nannaya University (Rajamahendravaram): College of Science and Technology M.Sc programmes, University College of Engineering (CSE, ECE, Civil, Mechanical, EIE, IT), MBA, MCA, BCA, Law, Education.
  "aknu": {
    source: "https://www.aknu.edu.in/UCST/ucst-courses.php",
    subjects: ["Computer Science", "Electronics and Communication", "Civil", "Mechanical", "Information Technology", "Mathematics", "Physics", "Chemistry", "Botany", "Zoology", "Biochemistry", "Biotechnology", "Geology", "Aquaculture", "MBA", "MCA", "BCA", "Law", "Education", "Other"],
    exam: "Competitive exams", bot: false
  }
};
