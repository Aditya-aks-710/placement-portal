export type PlacementType = "placed" | "unplaced" | "internship" | "pending";

export interface Position {
  id?: string;
  title: string;
  type: "internship" | "full-time";
  startDate?: string;
  endDate?: string;
  stipend?: string;
  ctc?: string;
}

export interface Company {
  id?: string;
  name: string;
  role: string;
  package: string;
  stipend?: string;
  fullTimePackage?: string;
  converted?: boolean;
  conversionType?: string;
  conversionDate?: string;
  joinDate: string;
  endDate?: string;
  type: "full-time" | "internship";
  duration?: string;
  logo?: string;
  positions?: Position[];
}

export interface InterviewExperience {
  company: string;
  rounds: {
    name: string;
    description: string;
    tips: string;
  }[];
  overallTips: string;
  difficulty: "Easy" | "Medium" | "Hard";
  rating: number;
  placedHere?: boolean;
}

export interface Education {
  id?: string;
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface Student {
  id: string;
  regno?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  branch: string;
  batch: string;
  status: PlacementType;
  currentCompany?: Company;
  pastCompanies: Company[];
  interviewExperiences: InterviewExperience[];
  education: Education[];
  skills: string[];
  linkedin?: string;
  github?: string;
  bio: string;
}

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Arjun Mehta",
    email: "arjun.mehta@college.edu",
    phone: "+91 98765 43210",
    avatar: "",
    branch: "Computer Science",
    batch: "2024",
    status: "placed",
    currentCompany: {
      name: "Google",
      role: "Software Engineer",
      package: "₹45 LPA",
      joinDate: "Jul 2024",
      type: "full-time",
    },
    pastCompanies: [
      {
        name: "Microsoft",
        role: "SDE Intern",
        package: "₹80K/month",
        joinDate: "May 2023",
        endDate: "Jul 2023",
        type: "internship",
        duration: "3 months",
      },
    ],
    interviewExperiences: [
      {
        company: "Google",
        rounds: [
          { name: "Online Assessment", description: "2 DSA problems on HackerRank. Medium-Hard level.", tips: "Practice graph and DP problems." },
          { name: "Technical Round 1", description: "System design for URL shortener and 1 coding problem.", tips: "Think aloud, communicate your approach." },
          { name: "Technical Round 2", description: "Advanced DSA + OS concepts.", tips: "Brush up on OS and networking basics." },
          { name: "HR Round", description: "Behavioral questions about teamwork and leadership.", tips: "Use STAR method for answers." },
        ],
        overallTips: "Focus on DSA fundamentals. Google values problem-solving approach over just getting the answer.",
        difficulty: "Hard",
        rating: 5,
      },
    ],
    education: [
      { degree: "B.Tech Computer Science", institution: "IIT Delhi", year: "2020-2024", grade: "9.2 CGPA" },
      { degree: "12th CBSE", institution: "Delhi Public School", year: "2020", grade: "95.4%" },
      { degree: "10th CBSE", institution: "Delhi Public School", year: "2018", grade: "96.2%" },
    ],
    skills: ["Java", "Python", "React", "System Design", "DSA", "Machine Learning"],
    linkedin: "linkedin.com/in/arjunmehta",
    github: "github.com/arjunmehta",
    bio: "Passionate software engineer with expertise in distributed systems and full-stack development.",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya.sharma@college.edu",
    phone: "+91 98765 43211",
    avatar: "",
    branch: "Computer Science",
    batch: "2024",
    status: "placed",
    currentCompany: {
      name: "Amazon",
      role: "SDE-1",
      package: "₹38 LPA",
      joinDate: "Aug 2024",
      type: "full-time",
    },
    pastCompanies: [],
    interviewExperiences: [
      {
        company: "Amazon",
        rounds: [
          { name: "Online Assessment", description: "2 coding problems + work simulation.", tips: "Amazon focuses on leadership principles." },
          { name: "Technical Round", description: "Coding + system design basics.", tips: "Know your projects well." },
          { name: "Bar Raiser", description: "Deep behavioral + technical mix.", tips: "Prepare STAR stories for all LPs." },
        ],
        overallTips: "Amazon heavily weighs leadership principles. Prepare stories for each one.",
        difficulty: "Medium",
        rating: 4,
      },
    ],
    education: [
      { degree: "B.Tech Computer Science", institution: "IIT Delhi", year: "2020-2024", grade: "8.8 CGPA" },
      { degree: "12th CBSE", institution: "Kendriya Vidyalaya", year: "2020", grade: "93.2%" },
    ],
    skills: ["C++", "Java", "AWS", "React", "Node.js"],
    linkedin: "linkedin.com/in/priyasharma",
    bio: "Full-stack developer passionate about cloud computing and scalable systems.",
  },
  {
    id: "3",
    name: "Rahul Verma",
    email: "rahul.verma@college.edu",
    phone: "+91 98765 43212",
    avatar: "",
    branch: "Electronics",
    batch: "2024",
    status: "placed",
    currentCompany: {
      name: "Microsoft",
      role: "Software Engineer",
      package: "₹42 LPA",
      joinDate: "Jul 2024",
      type: "full-time",
    },
    pastCompanies: [
      {
        name: "Adobe",
        role: "Research Intern",
        package: "₹60K/month",
        joinDate: "Jan 2023",
        endDate: "Apr 2023",
        type: "internship",
        duration: "4 months",
      },
    ],
    interviewExperiences: [
      {
        company: "Microsoft",
        rounds: [
          { name: "Online Test", description: "3 coding problems on Codility.", tips: "Focus on efficiency." },
          { name: "Group Fly Round", description: "Solve a problem on paper in 45 min.", tips: "Write clean, structured code." },
          { name: "Technical Interview", description: "Deep dive into DSA and system design.", tips: "Practice trees and graphs." },
        ],
        overallTips: "Microsoft values clean code and clear communication.",
        difficulty: "Hard",
        rating: 4,
      },
    ],
    education: [
      { degree: "B.Tech Electronics", institution: "IIT Delhi", year: "2020-2024", grade: "9.0 CGPA" },
    ],
    skills: ["Python", "C++", "Azure", "Machine Learning", "Signal Processing"],
    bio: "Electronics engineer turned software developer with a keen interest in AI/ML.",
  },
  {
    id: "4",
    name: "Sneha Patel",
    email: "sneha.patel@college.edu",
    phone: "+91 98765 43213",
    avatar: "",
    branch: "Computer Science",
    batch: "2024",
    status: "internship",
    currentCompany: {
      name: "Flipkart",
      role: "SDE Intern",
      package: "₹75K/month",
      joinDate: "Jan 2024",
      type: "internship",
      duration: "6 months",
    },
    pastCompanies: [],
    interviewExperiences: [
      {
        company: "Flipkart",
        rounds: [
          { name: "Coding Test", description: "3 problems on HackerEarth.", tips: "Time management is key." },
          { name: "Technical Interview", description: "DSA + DBMS concepts.", tips: "Revise SQL queries and normalization." },
        ],
        overallTips: "Flipkart values practical problem-solving skills.",
        difficulty: "Medium",
        rating: 4,
      },
    ],
    education: [
      { degree: "B.Tech Computer Science", institution: "IIT Delhi", year: "2020-2024", grade: "8.5 CGPA" },
    ],
    skills: ["Java", "Spring Boot", "React", "MySQL", "Docker"],
    bio: "Backend developer with a passion for building scalable microservices.",
  },
  {
    id: "5",
    name: "Vikram Singh",
    email: "vikram.singh@college.edu",
    phone: "+91 98765 43214",
    avatar: "",
    branch: "Mechanical",
    batch: "2024",
    status: "unplaced",
    pastCompanies: [],
    interviewExperiences: [],
    education: [
      { degree: "B.Tech Mechanical", institution: "IIT Delhi", year: "2020-2024", grade: "7.8 CGPA" },
    ],
    skills: ["AutoCAD", "SolidWorks", "Python", "MATLAB"],
    bio: "Mechanical engineering student exploring opportunities in core and IT sectors.",
  },
  {
    id: "6",
    name: "Ananya Gupta",
    email: "ananya.gupta@college.edu",
    phone: "+91 98765 43215",
    avatar: "",
    branch: "Computer Science",
    batch: "2024",
    status: "placed",
    currentCompany: {
      name: "Goldman Sachs",
      role: "Analyst",
      package: "₹35 LPA",
      joinDate: "Jul 2024",
      type: "full-time",
    },
    pastCompanies: [
      {
        name: "Morgan Stanley",
        role: "Summer Analyst",
        package: "₹1.5L/month",
        joinDate: "May 2023",
        endDate: "Jul 2023",
        type: "internship",
        duration: "2 months",
      },
    ],
    interviewExperiences: [
      {
        company: "Goldman Sachs",
        rounds: [
          { name: "HackerRank Test", description: "5 MCQs + 2 coding problems.", tips: "Focus on core CS concepts." },
          { name: "Technical Round", description: "DSA, DBMS, and OOPs.", tips: "Be thorough with DBMS normalization." },
          { name: "HR Round", description: "Why finance? Career goals.", tips: "Research the company well." },
        ],
        overallTips: "Goldman values strong fundamentals and a genuine interest in finance.",
        difficulty: "Medium",
        rating: 4,
      },
    ],
    education: [
      { degree: "B.Tech Computer Science", institution: "IIT Delhi", year: "2020-2024", grade: "9.1 CGPA" },
    ],
    skills: ["Java", "Python", "SQL", "Data Analysis", "Financial Modeling"],
    linkedin: "linkedin.com/in/ananyagupta",
    bio: "Aspiring quant with a blend of CS and finance expertise.",
  },
  {
    id: "7",
    name: "Karan Joshi",
    email: "karan.joshi@college.edu",
    phone: "+91 98765 43216",
    avatar: "",
    branch: "Information Technology",
    batch: "2024",
    status: "placed",
    currentCompany: {
      name: "Infosys",
      role: "Systems Engineer",
      package: "₹8 LPA",
      joinDate: "Sep 2024",
      type: "full-time",
    },
    pastCompanies: [],
    interviewExperiences: [
      {
        company: "Infosys",
        rounds: [
          { name: "InfyTQ Test", description: "Aptitude + coding on InfyTQ platform.", tips: "Practice aptitude regularly." },
          { name: "Interview", description: "HR + light technical questions.", tips: "Be confident and clear." },
        ],
        overallTips: "Infosys process is straightforward. Focus on aptitude and communication.",
        difficulty: "Easy",
        rating: 3,
      },
    ],
    education: [
      { degree: "B.Tech IT", institution: "IIT Delhi", year: "2020-2024", grade: "8.2 CGPA" },
    ],
    skills: ["Java", "SQL", "HTML/CSS", "JavaScript"],
    bio: "IT enthusiast looking to grow in enterprise software development.",
  },
  {
    id: "8",
    name: "Meera Nair",
    email: "meera.nair@college.edu",
    phone: "+91 98765 43217",
    avatar: "",
    branch: "Computer Science",
    batch: "2024",
    status: "placed",
    currentCompany: {
      name: "Adobe",
      role: "Member of Technical Staff",
      package: "₹40 LPA",
      joinDate: "Jul 2024",
      type: "full-time",
    },
    pastCompanies: [],
    interviewExperiences: [
      {
        company: "Adobe",
        rounds: [
          { name: "Online Test", description: "Aptitude + 3 coding problems.", tips: "Adobe loves creative problem solvers." },
          { name: "Technical Round 1", description: "DSA focus with live coding.", tips: "Think about edge cases." },
          { name: "Technical Round 2", description: "System design + projects discussion.", tips: "Know your projects inside out." },
        ],
        overallTips: "Adobe values creativity and innovation. Show your passion for building products.",
        difficulty: "Hard",
        rating: 5,
      },
    ],
    education: [
      { degree: "B.Tech Computer Science", institution: "IIT Delhi", year: "2020-2024", grade: "9.4 CGPA" },
    ],
    skills: ["C++", "Python", "React", "TypeScript", "UI/UX Design"],
    linkedin: "linkedin.com/in/meeranair",
    github: "github.com/meeranair",
    bio: "Creative technologist passionate about building beautiful, user-centric products.",
  },
  {
    id: "9",
    name: "Aditya Kumar",
    email: "aditya.kumar@college.edu",
    phone: "+91 98765 43218",
    avatar: "",
    branch: "Electrical",
    batch: "2024",
    status: "unplaced",
    pastCompanies: [],
    interviewExperiences: [],
    education: [
      { degree: "B.Tech Electrical", institution: "IIT Delhi", year: "2020-2024", grade: "7.5 CGPA" },
    ],
    skills: ["MATLAB", "Python", "Circuit Design", "Embedded Systems"],
    bio: "Electrical engineering student with interest in embedded systems and IoT.",
  },
  {
    id: "10",
    name: "Riya Kapoor",
    email: "riya.kapoor@college.edu",
    phone: "+91 98765 43219",
    avatar: "",
    branch: "Computer Science",
    batch: "2023",
    status: "placed",
    currentCompany: {
      name: "Uber",
      role: "Software Engineer",
      package: "₹48 LPA",
      joinDate: "Aug 2023",
      type: "full-time",
    },
    pastCompanies: [
      {
        name: "Google",
        role: "STEP Intern",
        package: "₹1.2L/month",
        joinDate: "May 2022",
        endDate: "Jul 2022",
        type: "internship",
        duration: "3 months",
      },
    ],
    interviewExperiences: [
      {
        company: "Uber",
        rounds: [
          { name: "Phone Screen", description: "1 medium coding problem.", tips: "Practice string and array problems." },
          { name: "Onsite Round 1", description: "System design for ride-matching.", tips: "Study real-time systems." },
          { name: "Onsite Round 2", description: "DSA + behavioral.", tips: "Be structured in approach." },
        ],
        overallTips: "Uber values practical engineering skills. Think about scale and reliability.",
        difficulty: "Hard",
        rating: 5,
      },
    ],
    education: [
      { degree: "B.Tech Computer Science", institution: "IIT Delhi", year: "2019-2023", grade: "9.3 CGPA" },
    ],
    skills: ["Go", "Python", "Kubernetes", "System Design", "Distributed Systems"],
    linkedin: "linkedin.com/in/riyakapoor",
    bio: "Systems engineer with expertise in distributed computing and microservices.",
  },
];
