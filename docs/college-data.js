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
  },
  // RGUKT Basara (Telangana): the Telangana campus of the Rajiv Gandhi University of Knowledge Technologies (separate from RGUKT AP).
  // Branches below are the usual engineering branches of the RGUKT system; confirm against the official Basara site before launch.
  "rgukt-basara": {
    source: "https://www.rgukt.ac.in/",
    subjects: ["Computer Science", "Electronics and Communication", "Electrical and Electronics", "Mechanical", "Civil", "Chemical Engineering", "Metallurgical and Materials", "Maths", "Physics", "Chemistry", "English", "Other"],
    clubs: ["Coding Club", "Robotics", "Cultural", "Sports", "NSS", "Literary", "Other"], exam: "GATE", bot: false
  },
  // ---- batch 3 (official sites, via search limited to each official domain; branch lists as published there) ----
  // JNTU Kakinada: B.Tech in Civil, EEE, Mechanical, ECE, CSE, CSE (AI and ML), Petroleum, Chemical, Food Engineering; B.Pharmacy.
  "jntuk": {
    source: "https://dfur.jntuk.edu.in/courses",
    subjects: ["Civil", "Electrical and Electronics", "Mechanical", "Electronics and Communication", "Computer Science", "CSE (AI and ML)", "Petroleum Engineering", "Chemical Engineering", "Food Engineering", "Pharmacy", "Other"],
    exam: "GATE", bot: false
  },
  // JNTU Anantapur: constituent colleges offer Civil, EEE, Mechanical, ECE, CSE, Chemical (Anantapur), Biotechnology (Pulivendula); other branches exist at other campuses.
  "jntua": {
    source: "https://www.jntua.ac.in/b-tech/",
    subjects: ["Civil", "Electrical and Electronics", "Mechanical", "Electronics and Communication", "Computer Science", "Chemical Engineering", "Biotechnology", "Information Technology", "Aeronautical", "Other"],
    exam: "GATE", bot: false
  },
  // Sri Krishnadevaraya University: College of Engineering and Technology (Civil, CSE, EEE, ECE, Mechanical) plus Arts and Sciences departments.
  "sku": {
    source: "http://www.skuniversity.ac.in/academics-faculties.html",
    subjects: ["Civil", "Computer Science", "Electrical and Electronics", "Electronics and Communication", "Mechanical", "Mathematics", "Physics", "Chemistry", "Botany", "Zoology", "Economics", "English", "Telugu", "Commerce", "Pharmacy", "Other"],
    exam: "Competitive exams", bot: false
  },
  // IIT Tirupati B.Tech: Chemical, Civil, CSE, Electrical, Engineering Physics (from 2024-25), Mechanical.
  "iit-tirupati": {
    source: "https://iittp.ac.in/admissions",
    subjects: ["Chemical Engineering", "Civil", "Computer Science", "Electrical", "Engineering Physics", "Mechanical", "Maths", "Physics", "Chemistry", "Other"],
    exam: "GATE", bot: false
  },
  // NIT Andhra Pradesh departments: CSE, Mechanical, Electrical, ECE, Metallurgical and Materials, Biotechnology, Chemical, Civil.
  "nit-andhra-pradesh": {
    source: "https://nitandhra.ac.in/",
    subjects: ["Computer Science", "Mechanical", "Electrical", "Electronics and Communication", "Metallurgical and Materials", "Biotechnology", "Chemical Engineering", "Civil", "Maths", "Physics", "Chemistry", "Other"],
    exam: "GATE", bot: false
  },
  // IIIT Sri City B.Tech: CSE, ECE, AI and Data Science.
  "iiit-sricity": {
    source: "https://iiits.ac.in/",
    subjects: ["Computer Science", "Electronics and Communication", "AI and Data Science", "Maths", "Physics", "Other"],
    exam: "GATE", bot: false
  },
  // VIT-AP: schools of Computer Science, Electronics, Mechanical, Advanced Sciences, Bio Sciences, Business, Law, Social Sciences and Humanities.
  "vit-ap": {
    source: "https://www.vitap.ac.in/allprograms",
    subjects: ["Computer Science", "CSE (AI and ML)", "CSE (Cyber Security)", "CSE (Data Analytics)", "Electronics and Communication", "Electrical and Electronics", "Mechanical", "Biotechnology", "Business", "Law", "Other"],
    exam: "GATE", bot: false
  },
  // ---- batch 4 (official sites; branch and department lists as published there) ----
  // JNTU-GV: B.Tech Civil, EEE, Mechanical, ECE, CSE, CST, CS and IT, CSE (IoT), ME (Robotics), AI and Data Science, Food Engineering, Pharmaceutical Engineering, Aerospace.
  "jntugv": {
    source: "https://daa.jntugv.edu.in/coursesoffered/",
    subjects: ["Civil", "Electrical and Electronics", "Mechanical", "Electronics and Communication", "Computer Science", "AI and Data Science", "Food Engineering", "Pharmaceutical Engineering", "Aerospace", "Other"],
    exam: "GATE", bot: false
  },
  // Rayalaseema University: colleges of Arts-Commerce-Management, Engineering (AI, CS, ECE, Civil, Mechanical) and Science.
  "rayalaseema-university": {
    source: "https://www.rayalaseemauniversity.ac.in/about-ruk.php",
    subjects: ["Computer Science", "Artificial Intelligence", "Electronics and Communication", "Civil", "Mechanical", "Biochemistry", "Biotechnology", "Botany", "Chemistry", "Mathematics", "Physics", "Zoology", "Statistics", "Commerce", "Economics", "English", "Telugu", "Business Management", "Other"],
    exam: "Competitive exams", bot: false
  },
  // Dravidian University (Kuppam): departments as listed; engineering college is described as being established (CSE, CSE AI and ML).
  "dravidian-university": {
    source: "https://www.dravidianuniversity.ac.in/engineering-college-2/",
    subjects: ["Biotechnology", "Chemistry", "Commerce and Management", "Computer Science", "Linguistics", "Education", "English", "Folklore and Tribal Studies", "History", "Kannada", "Library Science", "Tamil", "Telugu", "Tulu", "Other"],
    exam: "Competitive exams", bot: false
  },
  // SPMVV (women's university): Schools of Sciences, Social Sciences-Humanities-Management, Nursing, and Engineering and Technology.
  "spmvv": {
    source: "https://www.spmvv.ac.in/spmvv/",
    subjects: ["Home Science", "Psychology", "Biotechnology", "Bio Sciences and Sericulture", "Computer Applications (MCA)", "Education", "Nursing", "Engineering", "Management", "Other"],
    exam: "Competitive exams", bot: false
  },
  // SRM University AP: B.Tech in CSE, ECE, Mechanical, EEE, Civil; AI (AiTI) and Quantum Computing (QuTI) programmes.
  "srm-ap": {
    source: "https://www.srmap.edu.in/admission/seas-programmes/",
    subjects: ["Computer Science", "Electronics and Communication", "Mechanical", "Electrical and Electronics", "Civil", "Artificial Intelligence", "Quantum Computing", "Other"],
    exam: "GATE", bot: false
  },
  // GITAM Visakhapatnam School of Technology: AI and Data Science, Biotechnology, Civil, CSE, Electrical-Electronics-Communication, Mechanical, Robotics and AI.
  "gitam": {
    source: "https://www.gitam.edu/visakhapatnam/gitam-school-of-technology",
    subjects: ["Computer Science", "CSE (AI and ML)", "AI and Data Science", "Electronics and Communication", "Electrical and Computer", "VLSI Design", "Mechanical", "Robotics and AI", "Civil", "Biotechnology", "Biomedical", "Other"],
    exam: "GATE", bot: false
  },
  // KL University: B.Tech AI and DS, CSE, CSIT, ECE, EEE, IoT, Mechanical, Biotechnology, Civil.
  "klef": {
    source: "https://www.kluniversity.in/admissions/engineering-college/",
    subjects: ["AI and Data Science", "Computer Science", "Computer Science and IT", "Electronics and Communication", "Electrical and Electronics", "Internet of Things", "Mechanical", "Biotechnology", "Civil", "Other"],
    exam: "GATE", bot: false
  },
  // Vignan University (Vadlamudi) B.Tech list as published at vignan.ac.in/ug.php.
  "vignan": {
    source: "https://vignan.ac.in/ug.php",
    subjects: ["Computer Science", "CSE (AI and ML)", "CSE (Cyber Security)", "Information Technology", "Electronics and Communication", "Electrical and Electronics", "Mechanical", "Civil", "Chemical Engineering", "Biotechnology", "Biomedical", "Agricultural Engineering", "Food Processing", "Textile Technology", "Robotics and Automation", "Pharmacy", "Other"],
    exam: "GATE", bot: false
  },
  // Vikrama Simhapuri University (Nellore): Arts-Commerce-Management and Science and Technology faculties as listed on the official site.
  "vsu": {
    source: "http://www.simhapuriuniv.ac.in/",
    subjects: ["Education", "Business Management", "Tourism Management", "English", "Political Science", "Social Work", "Telugu", "Commerce", "Mathematics", "Physics", "Chemistry", "Biotechnology", "Computer Science", "Food Technology", "Marine Biology", "Microbiology", "Statistics", "Other"],
    exam: "Competitive exams", bot: false
  }
};
