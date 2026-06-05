import { create } from 'zustand';

// Predefined accounts
export const PREDEFINED_ACCOUNTS = [
  { email: 'yegotisaithanushkumar143@gmail.com', name: 'Thanush' },
  { email: 'vyshnavirayapudi86@gmail.com', name: 'Vyshnavi Rayapudi' }
];

export interface ExamNotification {
  id: string;
  organization: string; // SBI, IBPS, RBI, NABARD, LIC, etc.
  title: string;
  pdfUrl: string;
  vacancyCount: number;
  eligibility: string;
  importantDates: {
    notificationRelease: string;
    registrationStart: string;
    registrationEnd: string;
    feeDeadline: string;
    admitCardRelease: string;
    examDate: string;
    resultDate: string;
    interviewDate?: string;
    finalSelectionDate?: string;
  };
  officialWebsite: string;
  created_at: string;
}

export interface JobVacancy {
  id: string;
  organization: string;
  title: string;
  vacancyCount: number;
  eligibility: string;
  salary: string;
  applyDeadline: string;
  officialNotificationLink: string;
  created_at: string;
}

export interface CurrentAffairsArticle {
  id: string;
  category: 'Banking News' | 'Economy News' | 'RBI Updates' | 'Government Schemes' | 'Appointments' | 'Awards' | 'Summits' | 'Reports & Indexes' | 'National News' | 'International News';
  title: string;
  content: string;
  summary: string;
  publishedAt: string;
  sourceUrl: string;
}

export interface RoadmapTopic {
  id: string;
  subject: 'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness';
  name: string;
  notes: string;
  practiceQuestionsCount: number;
  recommendedBooks: string[];
  videoLinks: { title: string; url: string }[];
  completionStatus: 'Locked' | 'Learning' | 'Practicing' | 'Completed';
  level: number; // For level game
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  targetExams: string[];
  enableBrowserNotifications: boolean;
  enableGoogleCalendarSync: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  type: '30_days' | '10_days' | '2_days' | '1_day';
  triggered: boolean;
}

export interface MockTestHistory {
  testId: string;
  title: string;
  type: 'Full-Length' | 'Subject' | 'Topic';
  subject?: string;
  topic?: string;
  scorePct: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattemptedQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  isCleared: boolean;
}

export interface UserProfileState {
  email: string;
  bookmarks: {
    notifications: string[]; // ids
    jobs: string[]; // ids
    currentAffairs: string[]; // ids
    roadmapTopics: string[]; // ids
  };
  roadmapProgress: Record<string, 'Locked' | 'Learning' | 'Practicing' | 'Completed'>;
  unlockedLevels: {
    'Full-Length': number; // unlocked level (e.g. 1, 2, 3...)
    'Quantitative Aptitude': number;
    'Reasoning': number;
    'English': number;
    'General Awareness': number;
    'Computer Awareness': number;
  };
  mockTestHistory: MockTestHistory[];
  reminders: Reminder[];
  preferences: UserPreferences;
}

interface AppState {
  // Authentication
  currentUser: { email: string; name: string } | null;
  userProfiles: Record<string, UserProfileState>; // Keyed by email
  
  // Database tables (Global Shared Data)
  notifications: ExamNotification[];
  jobs: JobVacancy[];
  currentAffairs: CurrentAffairsArticle[];
  roadmapStructure: Omit<RoadmapTopic, 'completionStatus'>[];

  // Sync state
  lastSyncedAt: string | null;
  isSyncing: boolean;

  // Active topic test selection
  activeTestTopic: { subject: string; topic: string } | null;
  setActiveTestTopic: (topic: { subject: string; topic: string } | null) => void;

  // Actions
  login: (email: string) => boolean;
  logout: () => void;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  toggleTheme: () => void;
  
  // Dynamic bookmarks
  toggleBookmark: (type: 'notifications' | 'jobs' | 'currentAffairs' | 'roadmapTopics', id: string) => void;
  
  // Roadmap update
  updateRoadmapTopicStatus: (topicId: string, status: 'Locked' | 'Learning' | 'Practicing' | 'Completed') => void;
  
  // Mock Test result submission (Level game logic)
  submitMockTestResult: (result: Omit<MockTestHistory, 'completedAt'>) => void;
  
  // Scraper Actions
  syncData: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'triggered'>) => void;
  removeReminder: (id: string) => void;
  clearUserProfileData: (email: string) => void;
}

// Initial state helpers
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  targetExams: ['SBI PO', 'IBPS PO'],
  enableBrowserNotifications: true,
  enableGoogleCalendarSync: false
};

const getInitialProfile = (email: string): UserProfileState => ({
  email,
  bookmarks: {
    notifications: [],
    jobs: [],
    currentAffairs: [],
    roadmapTopics: []
  },
  roadmapProgress: {},
  unlockedLevels: {
    'Full-Length': 1,
    'Quantitative Aptitude': 1,
    'Reasoning': 1,
    'English': 1,
    'General Awareness': 1,
    'Computer Awareness': 1
  },
  mockTestHistory: [],
  reminders: [],
  preferences: DEFAULT_PREFERENCES
});

const DEFAULT_NOTIFICATIONS: ExamNotification[] = [
  {
    id: 'notif_1',
    organization: 'IBPS',
    title: 'IBPS PO/MT-XIV Recruitment Notification 2026',
    pdfUrl: 'https://www.ibps.in/wp-content/uploads/Detailed_Advt_PO_XIV.pdf',
    vacancyCount: 4455,
    eligibility: 'Graduation in any discipline from a recognized University.',
    importantDates: {
      notificationRelease: '2026-08-01',
      registrationStart: '2026-08-02',
      registrationEnd: '2026-08-22',
      feeDeadline: '2026-08-22',
      admitCardRelease: '2026-10-05',
      examDate: '2026-10-18',
      resultDate: '2026-11-15',
      interviewDate: '2026-12-10',
      finalSelectionDate: '2027-04-01'
    },
    officialWebsite: 'https://www.ibps.in',
    created_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'notif_2',
    organization: 'SBI',
    title: 'Recruitment of Probationary Officers (SBI PO 2026)',
    pdfUrl: 'https://bank.sbi/careers/po2026.pdf',
    vacancyCount: 2000,
    eligibility: 'Graduation in any discipline. Final year students can also apply.',
    importantDates: {
      notificationRelease: '2026-09-05',
      registrationStart: '2026-09-07',
      registrationEnd: '2026-09-27',
      feeDeadline: '2026-09-27',
      admitCardRelease: '2026-11-01',
      examDate: '2026-11-20',
      resultDate: '2026-12-15',
      interviewDate: '2027-02-05',
      finalSelectionDate: '2027-03-15'
    },
    officialWebsite: 'https://bank.sbi/careers',
    created_at: '2026-06-03T11:00:00Z'
  },
  {
    id: 'notif_3',
    organization: 'RBI',
    title: 'RBI Grade B Officer Recruitment Notification 2026',
    pdfUrl: 'https://www.rbi.org.in/careers/gradeb2026.pdf',
    vacancyCount: 291,
    eligibility: 'Minimum 60% marks in Graduation, 12th, and 10th standard.',
    importantDates: {
      notificationRelease: '2026-07-15',
      registrationStart: '2026-07-17',
      registrationEnd: '2026-08-07',
      feeDeadline: '2026-08-07',
      admitCardRelease: '2026-08-30',
      examDate: '2026-09-08',
      resultDate: '2026-10-01',
      interviewDate: '2026-11-10',
      finalSelectionDate: '2026-12-24'
    },
    officialWebsite: 'https://www.rbi.org.in',
    created_at: '2026-06-04T09:00:00Z'
  }
];

const DEFAULT_JOBS: JobVacancy[] = [
  {
    id: 'job_1',
    organization: 'IBPS',
    title: 'Probationary Officer (PO/MT)',
    vacancyCount: 4455,
    eligibility: 'Degree in any discipline',
    salary: '₹57,000 - ₹65,000 / month (gross)',
    applyDeadline: '2026-08-22',
    officialNotificationLink: 'https://www.ibps.in',
    created_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'job_2',
    organization: 'SBI',
    title: 'Probationary Officer (PO)',
    vacancyCount: 2000,
    eligibility: 'Graduation in any discipline',
    salary: '₹62,000 - ₹68,000 / month (gross)',
    applyDeadline: '2026-09-27',
    officialNotificationLink: 'https://bank.sbi/careers',
    created_at: '2026-06-03T11:00:00Z'
  },
  {
    id: 'job_3',
    organization: 'RBI',
    title: 'Grade B Officer (General/DEPR/DSIM)',
    vacancyCount: 291,
    eligibility: 'Bachelor Degree with minimum 60% marks',
    salary: '₹1,08,000 / month (gross starting)',
    applyDeadline: '2026-08-07',
    officialNotificationLink: 'https://www.rbi.org.in',
    created_at: '2026-06-04T09:00:00Z'
  }
];

const DEFAULT_CURRENT_AFFAIRS: CurrentAffairsArticle[] = [
  {
    id: 'ca_1',
    category: 'RBI Updates',
    title: 'RBI Keeps Repo Rate Unchanged at 6.50% in MPC Meeting',
    content: 'The Reserve Bank of India’s Monetary Policy Committee (MPC) decided to keep the policy repo rate unchanged at 6.50% for the eighth consecutive time. The decision was taken with a 4:2 majority to remain focused on withdrawal of accommodation to ensure that inflation progressively aligns with the target, while supporting growth. CPI inflation is projected at 4.5% for FY26.',
    summary: 'RBI MPC retains repo rate at 6.50% to align CPI inflation (projected at 4.5% for FY26) with the target while promoting economic growth.',
    publishedAt: '2026-06-04T12:00:00Z',
    sourceUrl: 'https://www.rbi.org.in'
  },
  {
    id: 'ca_2',
    category: 'Banking News',
    title: 'SBI Launches Digital Rupee (eRupee) Integration for Merchants',
    content: 'State Bank of India has announced the integration of the Central Bank Digital Currency (CBDC) - eRupee - with merchant payments. This will allow SBI customers to scan any UPI QR code and pay directly using their Digital Rupee wallet. The initiative aims to drive CBDC adoption and promote digital transactions.',
    summary: 'SBI integrates Digital Rupee wallet with UPI QR codes, allowing seamless eRupee transactions across UPI merchant networks.',
    publishedAt: '2026-06-02T10:30:00Z',
    sourceUrl: 'https://bank.sbi'
  },
  {
    id: 'ca_3',
    category: 'Economy News',
    title: 'Indias GDP Growth for FY26 Projected at 7.2% by RBI',
    content: 'In its latest policy meet, the Reserve Bank of India raised India’s real GDP growth projection for the financial year 2025-26 (FY26) to 7.2% from the earlier estimate of 7.0%. The central bank cited strong domestic economic activity, recovery in rural demand, and sustained momentum in manufacturing and services as key drivers.',
    summary: 'RBI revised India’s GDP growth projection for FY26 upwards to 7.2% (from 7.0%), driven by strong domestic manufacturing and rural demand.',
    publishedAt: '2026-06-03T15:00:00Z',
    sourceUrl: 'https://www.rbi.org.in'
  }
];

// Complete Roadmap topics structure for IBPS PO Syllabus (45 Chapters total)
const ROADMAP_TOPICS_LIST: Omit<RoadmapTopic, 'completionStatus'>[] = [
  // Quant (17 topics)
  { id: 'q_1', subject: 'Quantitative Aptitude', name: 'Number System', notes: 'Core concepts of HCF, LCM, Divisibility Rules, Prime numbers, Remainders and Unit Digit.', practiceQuestionsCount: 150, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Number System Masterclass', url: 'https://youtube.com/results?search_query=Number+System+banking+exam' }], level: 1 },
  { id: 'q_2', subject: 'Quantitative Aptitude', name: 'Simplification', notes: 'Speed math methods, VBODMAS rules, squares (1-30), cubes (1-20), and surds & indices.', practiceQuestionsCount: 200, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Simplification Shortcuts', url: 'https://youtube.com/results?search_query=Simplification+banking+exam' }], level: 2 },
  { id: 'q_3', subject: 'Quantitative Aptitude', name: 'Approximation', notes: 'Rounding decimal values to nearest integers, estimating calculations for speedy solving.', practiceQuestionsCount: 180, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Approximation Techniques', url: 'https://youtube.com/results?search_query=Approximation+banking+exam' }], level: 3 },
  { id: 'q_4', subject: 'Quantitative Aptitude', name: 'Percentage', notes: 'Fraction-to-percentage conversions, percentage increase/decrease, salary, and election problems.', practiceQuestionsCount: 160, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Percentage Concepts', url: 'https://youtube.com/results?search_query=Percentage+banking+exam' }], level: 4 },
  { id: 'q_5', subject: 'Quantitative Aptitude', name: 'Ratio & Proportion', notes: 'Ratio comparison, duplicate ratio, mean/third/fourth proportion, and partnership share rules.', practiceQuestionsCount: 150, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Ratio and Proportion class', url: 'https://youtube.com/results?search_query=Ratio+Proportion+banking+exam' }], level: 5 },
  { id: 'q_6', subject: 'Quantitative Aptitude', name: 'Average', notes: 'Consecutive number averages, age-based questions, and weighted average calculations.', practiceQuestionsCount: 140, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Averages shortcuts', url: 'https://youtube.com/results?search_query=Average+banking+exam' }], level: 6 },
  { id: 'q_7', subject: 'Quantitative Aptitude', name: 'Profit & Loss', notes: 'CP, SP, MP, discount, successive discounts, markup percentage, and dishonest dealer tricks.', practiceQuestionsCount: 190, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Profit and Loss tricks', url: 'https://youtube.com/results?search_query=Profit+Loss+banking+exam' }], level: 7 },
  { id: 'q_8', subject: 'Quantitative Aptitude', name: 'Simple Interest', notes: 'SI = PRT/105, rate/time changes, principal sums, and simple installments concepts.', practiceQuestionsCount: 120, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Simple Interest class', url: 'https://youtube.com/results?search_query=Simple+Interest+banking+exam' }], level: 8 },
  { id: 'q_9', subject: 'Quantitative Aptitude', name: 'Compound Interest', notes: 'CI formulas, half-yearly/quarterly compound interest, CI and SI difference shortcut formulas.', practiceQuestionsCount: 130, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Compound Interest tricks', url: 'https://youtube.com/results?search_query=Compound+Interest+banking+exam' }], level: 9 },
  { id: 'q_10', subject: 'Quantitative Aptitude', name: 'Time & Work', notes: 'Worker efficiency, man-days, work sharing wages, and pipes & cisterns leak questions.', practiceQuestionsCount: 170, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Time and Work course', url: 'https://youtube.com/results?search_query=Time+Work+banking+exam' }], level: 10 },
  { id: 'q_11', subject: 'Quantitative Aptitude', name: 'Time Speed Distance', notes: 'Relative speed, trains crossing, boats & streams (upstream/downstream), and circular track races.', practiceQuestionsCount: 180, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'TSD and Boats Class', url: 'https://youtube.com/results?search_query=Time+Speed+Distance+banking+exam' }], level: 11 },
  { id: 'q_12', subject: 'Quantitative Aptitude', name: 'Mensuration', notes: 'Areas & volumes of 2D/3D shapes including cuboid, cylinder, cone, sphere, circles, and polygons.', practiceQuestionsCount: 150, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Mensuration Formulas', url: 'https://youtube.com/results?search_query=Mensuration+banking+exam' }], level: 12 },
  { id: 'q_13', subject: 'Quantitative Aptitude', name: 'Probability', notes: 'Basic definitions, coin tosses, multi-dice throws, playing cards distributions, and ball picks.', practiceQuestionsCount: 110, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Probability Basics', url: 'https://youtube.com/results?search_query=Probability+banking+exam' }], level: 13 },
  { id: 'q_14', subject: 'Quantitative Aptitude', name: 'Permutation & Combination', notes: 'Factorials, circular arrangements, selecting groups, and constraints (vowels together, etc.).', practiceQuestionsCount: 120, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'P and C masterclass', url: 'https://youtube.com/results?search_query=Permutation+Combination+banking+exam' }], level: 14 },
  { id: 'q_15', subject: 'Quantitative Aptitude', name: 'Data Interpretation', notes: 'Comprehensive analysis of bar charts, pie graphs, tables, line graphs, caselets, and radar DI.', practiceQuestionsCount: 300, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'DI complete guide', url: 'https://youtube.com/results?search_query=Data+Interpretation+banking+exam' }], level: 15 },
  { id: 'q_16', subject: 'Quantitative Aptitude', name: 'Number Series', notes: 'Arithmetic, geometric, double difference, and square/cube patterns for missing & wrong numbers.', practiceQuestionsCount: 160, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Number Series tricks', url: 'https://youtube.com/results?search_query=Number+Series+banking+exam' }], level: 16 },
  { id: 'q_17', subject: 'Quantitative Aptitude', name: 'Quadratic Equations', notes: 'Factorization methods, comparing root values (x vs y relationships, CND cases).', practiceQuestionsCount: 150, recommendedBooks: ['Quantitative Aptitude by R.S. Aggarwal', 'Fast Track Objective Arithmetic by Rajesh Verma'], videoLinks: [{ title: 'Quadratic roots speed method', url: 'https://youtube.com/results?search_query=Quadratic+Equations+banking+exam' }], level: 17 },

  // Reasoning (11 topics)
  { id: 'r_1', subject: 'Reasoning', name: 'Coding Decoding', notes: 'Letter shifts, reverse coding, Chinese coding decoding logic, and condition-based coding.', practiceQuestionsCount: 120, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Coding Decoding tricks', url: 'https://youtube.com/results?search_query=Coding+Decoding+banking+exam' }], level: 1 },
  { id: 'r_2', subject: 'Reasoning', name: 'Blood Relations', notes: 'Family tree charts, coded relations (A+B means A is mother), and relation-pointing puzzles.', practiceQuestionsCount: 110, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Blood Relation charts', url: 'https://youtube.com/results?search_query=Blood+Relations+banking+exam' }], level: 2 },
  { id: 'r_3', subject: 'Reasoning', name: 'Direction Sense', notes: 'Distance calculations, Pythagoras theorem applications, shadow-related angles, and coded directions.', practiceQuestionsCount: 100, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Direction Sense masterclass', url: 'https://youtube.com/results?search_query=Direction+Sense+banking+exam' }], level: 3 },
  { id: 'r_4', subject: 'Reasoning', name: 'Syllogism', notes: 'Venn diagrams, "Only a few" cases, possibility deductions, and "Either-Or" logical rules.', practiceQuestionsCount: 150, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Syllogism Only A Few', url: 'https://youtube.com/results?search_query=Syllogism+banking+exam' }], level: 4 },
  { id: 'r_5', subject: 'Reasoning', name: 'Inequalities', notes: 'Mathematical statement logic (>, <, =, >=, <=), coded inequalities, and either-or situations.', practiceQuestionsCount: 130, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Inequality shortcuts', url: 'https://youtube.com/results?search_query=Inequalities+banking+exam' }], level: 5 },
  { id: 'r_6', subject: 'Reasoning', name: 'Order Ranking', notes: 'Left/right position swaps, comparison orders (A is taller than B but shorter than C), height/weight sorting.', practiceQuestionsCount: 110, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Order Ranking tricks', url: 'https://youtube.com/results?search_query=Order+Ranking+banking+exam' }], level: 6 },
  { id: 'r_7', subject: 'Reasoning', name: 'Seating Arrangement', notes: 'Linear arrangements (single/double row), circular, square, and triangular tables with in/out facing directions.', practiceQuestionsCount: 250, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Seating Arrangement course', url: 'https://youtube.com/results?search_query=Seating+Arrangement+banking+exam' }], level: 7 },
  { id: 'r_8', subject: 'Reasoning', name: 'Puzzles', notes: 'Floor-based puzzles, box puzzles, date/month scheduling, flat-floor configurations, and multi-variable puzzles.', practiceQuestionsCount: 300, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Puzzle cracking methods', url: 'https://youtube.com/results?search_query=Puzzles+banking+exam' }], level: 8 },
  { id: 'r_9', subject: 'Reasoning', name: 'Input Output', notes: 'Machine steps, shifting vs sorting methods, double shifts, alphabetical orders, and mathematical operations.', practiceQuestionsCount: 140, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Input Output tricks', url: 'https://youtube.com/results?search_query=Input+Output+banking+exam' }], level: 9 },
  { id: 'r_10', subject: 'Reasoning', name: 'Data Sufficiency', notes: 'Deciding if statement (1) or statement (2) alone or together is sufficient to answer multi-topic questions.', practiceQuestionsCount: 150, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Data Sufficiency guide', url: 'https://youtube.com/results?search_query=Data+Sufficiency+banking+exam' }], level: 10 },
  { id: 'r_11', subject: 'Reasoning', name: 'Critical Reasoning', notes: 'Statement & Assumption, Cause & Effect, Course of Action, Strong & Weak Arguments, and Inferences.', practiceQuestionsCount: 160, recommendedBooks: ['A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal', 'Analytical Reasoning by M.K. Pandey'], videoLinks: [{ title: 'Critical Reasoning logic', url: 'https://youtube.com/results?search_query=Critical+Reasoning+banking+exam' }], level: 11 },

  // English (7 topics)
  { id: 'e_1', subject: 'English', name: 'Grammar', notes: 'Rules of Nouns, Pronouns, Subject-Verb Agreement, Adverbs, Adjectives, Prepositions, and Conjunctions.', practiceQuestionsCount: 200, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'Grammar rules', url: 'https://youtube.com/results?search_query=English+Grammar+banking+exam' }], level: 1 },
  { id: 'e_2', subject: 'English', name: 'Vocabulary', notes: 'Synonyms, antonyms, root words, phrasal verbs, idioms, double fillers, and spelling checks.', practiceQuestionsCount: 180, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'Vocabulary building', url: 'https://youtube.com/results?search_query=English+Vocabulary+banking+exam' }], level: 2 },
  { id: 'e_3', subject: 'English', name: 'Reading Comprehension', notes: 'Skimming techniques, passage structure, tone detection, direct vs indirect questions, and vocabulary in context.', practiceQuestionsCount: 150, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'RC skim and scan method', url: 'https://youtube.com/results?search_query=Reading+Comprehension+banking+exam' }], level: 3 },
  { id: 'e_4', subject: 'English', name: 'Cloze Test', notes: 'Context clue identification, grammatical fitting of options, vocabulary elimination strategies.', practiceQuestionsCount: 140, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'Cloze Test tips', url: 'https://youtube.com/results?search_query=Cloze+Test+banking+exam' }], level: 4 },
  { id: 'e_5', subject: 'English', name: 'Error Detection', notes: 'Identifying grammatical errors in multi-part sentences, spotting correct sentence segments.', practiceQuestionsCount: 170, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'Error Spotting methods', url: 'https://youtube.com/results?search_query=Error+Detection+banking+exam' }], level: 5 },
  { id: 'e_6', subject: 'English', name: 'Para Jumbles', notes: 'Sentence linkage rules, finding introductory and concluding statements, keyword pairings.', practiceQuestionsCount: 130, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'Para Jumbles shortcuts', url: 'https://youtube.com/results?search_query=Para+Jumbles+banking+exam' }], level: 6 },
  { id: 'e_7', subject: 'English', name: 'Sentence Improvement', notes: 'Replacing underlined segments with grammatically superior options, no-correction required cases.', practiceQuestionsCount: 150, recommendedBooks: ['Objective General English by S.P. Bakshi', 'Word Power Made Easy by Norman Lewis'], videoLinks: [{ title: 'Sentence Improvement rules', url: 'https://youtube.com/results?search_query=Sentence+Improvement+banking+exam' }], level: 7 },

  // General Awareness (5 topics)
  { id: 'g_1', subject: 'General Awareness', name: 'Banking Awareness', notes: 'History of banking, banking structure in India, types of accounts, bank services, and Basel norms.', practiceQuestionsCount: 220, recommendedBooks: ['Lucent General Knowledge', 'Arihant General Knowledge'], videoLinks: [{ title: 'Banking Awareness class', url: 'https://youtube.com/results?search_query=Banking+Awareness+banking+exam' }], level: 1 },
  { id: 'g_2', subject: 'General Awareness', name: 'Economy', notes: 'FDI, FII, Union Budget, Economic Survey, inflation (WPI/CPI), national income, fiscal policy, and trade.', practiceQuestionsCount: 180, recommendedBooks: ['Lucent General Knowledge', 'Arihant General Knowledge'], videoLinks: [{ title: 'Indian Economy fundamentals', url: 'https://youtube.com/results?search_query=Economy+banking+exam' }], level: 2 },
  { id: 'g_3', subject: 'General Awareness', name: 'Current Affairs', notes: 'AI-filtered exam relevant affairs of the last 6 months - national, international, agreements, and news.', practiceQuestionsCount: 300, recommendedBooks: ['Lucent General Knowledge', 'Arihant General Knowledge'], videoLinks: [{ title: 'Current Affairs monthly digest', url: 'https://youtube.com/results?search_query=Current+Affairs+banking+exam' }], level: 3 },
  { id: 'g_4', subject: 'General Awareness', name: 'RBI Functions', notes: 'RBI structure, Monetary Policy Committee (MPC) instruments (Repo, Reverse Repo, MSF, SLR, CRR), currency management.', practiceQuestionsCount: 150, recommendedBooks: ['Lucent General Knowledge', 'Arihant General Knowledge'], videoLinks: [{ title: 'RBI Monetary Policy instruments', url: 'https://youtube.com/results?search_query=RBI+Functions+banking+exam' }], level: 4 },
  { id: 'g_5', subject: 'General Awareness', name: 'Financial Terms', notes: 'Definition of IPO, Yield, Capital Gains, Mutual Funds, Libor, Swaps, Bonds, derivatives, and trade terms.', practiceQuestionsCount: 140, recommendedBooks: ['Lucent General Knowledge', 'Arihant General Knowledge'], videoLinks: [{ title: 'Financial Terms dictionary', url: 'https://youtube.com/results?search_query=Financial+Terms+banking+exam' }], level: 5 },

  // Computer Awareness (5 topics)
  { id: 'c_1', subject: 'Computer Awareness', name: 'Hardware', notes: 'CPU components, input/output devices, types of memory (RAM, ROM, Cache, Registers), and storage structures.', practiceQuestionsCount: 100, recommendedBooks: ['Objective Computer Awareness by Arihant'], videoLinks: [{ title: 'Computer Hardware MCQ', url: 'https://youtube.com/results?search_query=Computer+Hardware+banking+exam' }], level: 1 },
  { id: 'c_2', subject: 'Computer Awareness', name: 'Software', notes: 'System software (compilers, interpreters), application software, utility packages, and programming languages.', practiceQuestionsCount: 90, recommendedBooks: ['Objective Computer Awareness by Arihant'], videoLinks: [{ title: 'Computer Software basics', url: 'https://youtube.com/results?search_query=Computer+Software+banking+exam' }], level: 2 },
  { id: 'c_3', subject: 'Computer Awareness', name: 'Operating Systems', notes: 'Functions of OS, process scheduling, memory management, types of OS (Windows, Linux, Unix, Mobile OS).', practiceQuestionsCount: 110, recommendedBooks: ['Objective Computer Awareness by Arihant'], videoLinks: [{ title: 'Operating Systems guide', url: 'https://youtube.com/results?search_query=Operating+Systems+banking+exam' }], level: 3 },
  { id: 'c_4', subject: 'Computer Awareness', name: 'Networking', notes: 'OSI layers models, TCP/IP, network topologies (star, mesh, ring), hardware (modem, hub, switch, router), and IP classes.', practiceQuestionsCount: 120, recommendedBooks: ['Objective Computer Awareness by Arihant'], videoLinks: [{ title: 'Computer Networking class', url: 'https://youtube.com/results?search_query=Computer+Networking+banking+exam' }], level: 4 },
  { id: 'c_5', subject: 'Computer Awareness', name: 'Cyber Security', notes: 'Malware categories (viruses, worms, trojans), firewalls, cryptography (symmetric/asymmetric keys), phishing, and cyber laws.', practiceQuestionsCount: 130, recommendedBooks: ['Objective Computer Awareness by Arihant'], videoLinks: [{ title: 'Cyber Security guidelines', url: 'https://youtube.com/results?search_query=Cyber+Security+banking+exam' }], level: 5 }
];

// Helper functions for date operations
const subtractDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const generateSmartReminders = (profile: UserProfileState, notifications: ExamNotification[]): Reminder[] => {
  const targetExams = profile.preferences.targetExams || [];
  const autoReminders: Reminder[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Filter notifications that match the user's target exams
  const matchedNotifications = notifications.filter(notif => 
    targetExams.some(exam => 
      notif.title.toLowerCase().includes(exam.toLowerCase()) || 
      notif.organization.toLowerCase() === exam.toLowerCase().split(' ')[0].toLowerCase()
    )
  );

  matchedNotifications.forEach(notif => {
    const dates = notif.importantDates;
    const dateEntries = Object.entries(dates) as [string, string | undefined][];

    dateEntries.forEach(([eventKey, dateStr]) => {
      if (!dateStr) return;

      const eventLabel = eventKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase()); // e.g. "examDate" -> "Exam Date"

      const intervals: { type: '30_days' | '10_days' | '2_days' | '1_day'; days: number }[] = [
        { type: '30_days', days: 30 },
        { type: '10_days', days: 10 },
        { type: '2_days', days: 2 },
        { type: '1_day', days: 1 }
      ];

      intervals.forEach(({ type, days }) => {
        const reminderDate = subtractDays(dateStr, days);
        // Only generate reminder if the event is in the future
        // and the reminder date is in the future or is today
        if (dateStr >= today && reminderDate >= today) {
          autoReminders.push({
            id: `rem_auto_${notif.id}_${eventKey}_${days}d`,
            title: `[Smart Reminder] ${notif.organization} ${eventLabel} is in ${days} days!`,
            date: reminderDate,
            type: type,
            triggered: false
          });
        }
      });
    });
  });

  // Keep manually created reminders and merge with new automatic ones, avoiding duplicate IDs
  const manualReminders = profile.reminders.filter(r => !r.id.startsWith('rem_auto_'));
  
  // Merge and return
  return [...manualReminders, ...autoReminders];
};

export const useAppStore = create<AppState>((set, get) => {
  // Client-side initialization loading from localstorage
  const isClient = typeof window !== 'undefined';
  
  const initialProfiles: Record<string, UserProfileState> = {};
  let initialUser: { email: string; name: string } | null = null;

  if (isClient) {
    try {
      const activeUserStr = localStorage.getItem('banking_companion_active_user');
      if (activeUserStr) {
        initialUser = JSON.parse(activeUserStr);
      }
      
      PREDEFINED_ACCOUNTS.forEach(acc => {
        const stored = localStorage.getItem(`banking_companion_state_${acc.email.replace(/[@.]/g, '_')}`);
        if (stored) {
          initialProfiles[acc.email] = JSON.parse(stored);
        } else {
          initialProfiles[acc.email] = getInitialProfile(acc.email);
        }
      });
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  }

  // If no profiles loaded, use defaults
  PREDEFINED_ACCOUNTS.forEach(acc => {
    if (!initialProfiles[acc.email]) {
      initialProfiles[acc.email] = getInitialProfile(acc.email);
    }
  });

  return {
    currentUser: initialUser,
    userProfiles: initialProfiles,
    notifications: DEFAULT_NOTIFICATIONS,
    jobs: DEFAULT_JOBS,
    currentAffairs: DEFAULT_CURRENT_AFFAIRS,
    roadmapStructure: ROADMAP_TOPICS_LIST,
    lastSyncedAt: isClient ? localStorage.getItem('banking_companion_last_synced') : null,
    isSyncing: false,
    activeTestTopic: null,

    setActiveTestTopic: (topic) => set({ activeTestTopic: topic }),

    toggleTheme: () => {
      const { currentUser, userProfiles, updateUserPreferences } = get();
      if (!currentUser) return;
      const currentTheme = userProfiles[currentUser.email]?.preferences?.theme || 'light';
      updateUserPreferences({ theme: currentTheme === 'light' ? 'dark' : 'light' });
    },

    login: (email: string) => {
      const account = PREDEFINED_ACCOUNTS.find(acc => acc.email.toLowerCase() === email.toLowerCase());
      if (account) {
        // Generate automatic reminders on login
        const state = get();
        const profile = state.userProfiles[account.email];
        if (profile) {
          const updatedReminders = generateSmartReminders(profile, state.notifications);
          const updatedProfile = {
            ...profile,
            reminders: updatedReminders
          };
          const updatedProfiles = {
            ...state.userProfiles,
            [account.email]: updatedProfile
          };
          set({ userProfiles: updatedProfiles });
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `banking_companion_state_${account.email.replace(/[@.]/g, '_')}`,
              JSON.stringify(updatedProfile)
            );
          }
        }

        set({ currentUser: account });
        if (typeof window !== 'undefined') {
          localStorage.setItem('banking_companion_active_user', JSON.stringify(account));
        }
        return true;
      }
      return false;
    },

    logout: () => {
      set({ currentUser: null });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('banking_companion_active_user');
      }
    },

    updateUserPreferences: (prefs) => {
      const { currentUser, userProfiles, notifications } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const updatedPrefs = {
        ...profile.preferences,
        ...prefs
      };

      // Create a temp profile to generate new reminders
      const tempProfile = {
        ...profile,
        preferences: updatedPrefs
      };
      
      const updatedReminders = generateSmartReminders(tempProfile, notifications);

      const updatedProfile = {
        ...profile,
        preferences: updatedPrefs,
        reminders: updatedReminders
      };

      const updatedProfiles = {
        ...userProfiles,
        [userEmail]: updatedProfile
      };

      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
          JSON.stringify(updatedProfile)
        );
      }
    },

    toggleBookmark: (type, id) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const currentList = profile.bookmarks[type];
      
      const newList = currentList.includes(id)
        ? currentList.filter(item => item !== id)
        : [...currentList, id];

      const updatedProfile = {
        ...profile,
        bookmarks: {
          ...profile.bookmarks,
          [type]: newList
        }
      };

      const updatedProfiles = {
        ...userProfiles,
        [userEmail]: updatedProfile
      };

      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
          JSON.stringify(updatedProfile)
        );
      }
    },

    updateRoadmapTopicStatus: (topicId, status) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      
      const updatedProfile = {
        ...profile,
        roadmapProgress: {
          ...profile.roadmapProgress,
          [topicId]: status
        }
      };

      const updatedProfiles = {
        ...userProfiles,
        [userEmail]: updatedProfile
      };

      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
          JSON.stringify(updatedProfile)
        );
      }
    },

    submitMockTestResult: (result) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      
      // Calculate isCleared (score >= 60%)
      const isCleared = result.scorePct >= 60;
      const completedTest: MockTestHistory = {
        ...result,
        completedAt: new Date().toISOString(),
        isCleared
      };

      // Update test history
      const newHistory = [completedTest, ...profile.mockTestHistory];

      // Update level unlocking logic: If cleared, unlock next level
      const updatedUnlockedLevels = { ...profile.unlockedLevels };
      const updatedRoadmapProgress = { ...profile.roadmapProgress };

      if (isCleared) {
        if (result.type === 'Topic' && result.topic) {
          // Find topic in roadmapStructure matching the topic name
          const matchTopic = get().roadmapStructure.find(
            t => t.name.toLowerCase() === result.topic?.toLowerCase() && t.subject === result.subject
          );
          if (matchTopic) {
            updatedRoadmapProgress[matchTopic.id] = 'Completed';
          }
        } else {
          const testType = result.type;
          const testCategory = testType === 'Full-Length' ? 'Full-Length' : (result.subject || 'Full-Length');
          
          // Find the current level that was just cleared
          // Level tests will have titles like "Level 1 Test", "Level 2 Test", etc.
          const match = result.title.match(/Level\s+(\d+)/i);
          if (match) {
            const clearedLevelNum = parseInt(match[1]);
            const currentUnlocked = updatedUnlockedLevels[testCategory as keyof typeof updatedUnlockedLevels] || 1;
            if (clearedLevelNum === currentUnlocked) {
              updatedUnlockedLevels[testCategory as keyof typeof updatedUnlockedLevels] = currentUnlocked + 1;
            }
          }
        }
      }

      // Automatically sync reminders if they set notifications
      const newReminders = [...profile.reminders];
      if (result.type === 'Full-Length' && isCleared) {
        newReminders.push({
          id: `reminder_${Date.now()}`,
          title: `Congratulations! Unlocked Level ${updatedUnlockedLevels['Full-Length']} Mock Test`,
          date: new Date().toISOString(),
          type: '1_day',
          triggered: false
        });
      }

      const updatedProfile = {
        ...profile,
        mockTestHistory: newHistory,
        unlockedLevels: updatedUnlockedLevels,
        roadmapProgress: updatedRoadmapProgress,
        reminders: newReminders
      };

      const updatedProfiles = {
        ...userProfiles,
        [userEmail]: updatedProfile
      };

      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
          JSON.stringify(updatedProfile)
        );
      }
    },

    syncData: async () => {
      set({ isSyncing: true });
      try {
        // Dynamic Scraping Engine Trigger (represented here, fetches latest values from endpoints)
        const response = await fetch(`/api/cron-sync?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          
          const currentNotifications = get().notifications;
          const newNotifs = data.notifications || [];
          const mergedNotifications = [...newNotifs, ...currentNotifications.filter(c => !newNotifs.some((n: ExamNotification) => n.id === c.id))];

          const currentJobs = get().jobs;
          const newJobs = data.jobs || [];
          const mergedJobs = [...newJobs, ...currentJobs.filter(c => !newJobs.some((j: JobVacancy) => j.id === c.id))];

          const currentCA = get().currentAffairs;
          const newCA = data.currentAffairs || [];
          const mergedCA = [...newCA, ...currentCA.filter(c => !newCA.some((a: CurrentAffairsArticle) => a.id === c.id))];

          set({
            notifications: mergedNotifications,
            jobs: mergedJobs,
            currentAffairs: mergedCA,
            lastSyncedAt: new Date().toISOString()
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('banking_companion_last_synced', new Date().toISOString());
          }

          // Regenerate smart reminders for active user with new notifications
          const { currentUser, userProfiles } = get();
          if (currentUser) {
            const userEmail = currentUser.email;
            const profile = userProfiles[userEmail];
            if (profile) {
              const updatedReminders = generateSmartReminders(profile, mergedNotifications);
              const updatedProfile = {
                ...profile,
                reminders: updatedReminders
              };
              const updatedProfiles = {
                ...userProfiles,
                [userEmail]: updatedProfile
              };
              set({ userProfiles: updatedProfiles });
              localStorage.setItem(
                `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
                JSON.stringify(updatedProfile)
              );
            }
          }
        }
      } catch (err) {
        console.error('Real-time sync failed, keeping current local values.', err);
      } finally {
        set({ isSyncing: false });
      }
    },

    addReminder: (reminder) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];

      const newReminder: Reminder = {
        ...reminder,
        id: `reminder_${Date.now()}`,
        triggered: false
      };

      const updatedProfile = {
        ...profile,
        reminders: [...profile.reminders, newReminder]
      };

      const updatedProfiles = {
        ...userProfiles,
        [userEmail]: updatedProfile
      };

      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
          JSON.stringify(updatedProfile)
        );
      }
    },

    removeReminder: (id) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];

      const updatedProfile = {
        ...profile,
        reminders: profile.reminders.filter(r => r.id !== id)
      };

      const updatedProfiles = {
        ...userProfiles,
        [userEmail]: updatedProfile
      };

      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${userEmail.replace(/[@.]/g, '_')}`,
          JSON.stringify(updatedProfile)
        );
      }
    },

    clearUserProfileData: (email) => {
      const state = get();
      const initialProfile = getInitialProfile(email);
      const updatedProfiles = {
        ...state.userProfiles,
        [email]: initialProfile
      };
      set({ userProfiles: updatedProfiles });
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `banking_companion_state_${email.replace(/[@.]/g, '_')}`,
          JSON.stringify(initialProfile)
        );
      }
    }
  };
});
