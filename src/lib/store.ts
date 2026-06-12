import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { env } from './env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const getClientSupabase = (token?: string) => {
  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export interface Handnote {
  id: string;
  title: string;
  content: string;
  shortcut: string;
  topic: string;
  subject: string;
}

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
  isVerified?: boolean;
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
  level: number;
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
  type: 'Full-Length' | 'Subject' | 'Topic' | 'Custom';
  subject?: string;
  topic?: string;
  level?: number;
  scorePct: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattemptedQuestions: number;
  timeSpentSeconds: number;
  completedAt: string;
  isCleared: boolean;
}

export interface Milestone {
  rank: string;
  badge: string;
  color: string;
  desc: string;
}

export function getMilestoneInfo(level: number): Milestone {
  if (level <= 2) {
    return {
      rank: "Novice Aspirant",
      badge: "🌱",
      color: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-450 border-slate-200 dark:border-slate-700",
      desc: "Starting out. Focus on learning basic topics."
    };
  } else if (level <= 5) {
    return {
      rank: "Competent Challenger",
      badge: "🎯",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900",
      desc: "Basic concepts mastered. Keep practicing level quizzes."
    };
  } else if (level <= 8) {
    return {
      rank: "Exam Ready (PO Level)",
      badge: "🏆",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-450 border-amber-250 dark:border-amber-900",
      desc: "Clearing competitive PO level questions. Ready for real mocks."
    };
  } else {
    return {
      rank: "Banking Master",
      badge: "👑",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400 border-purple-250 dark:border-purple-900",
      desc: "Highest mastery levels cleared. Excellent work!"
    };
  }
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
  roadmapTimeSpent?: Record<string, number>;
  unlockedLevels: {
    'Full-Length': number;
    'Quantitative Aptitude': number;
    'Reasoning': number;
    'English': number;
    'General Awareness': number;
    'Computer Awareness': number;
  };
  mockTestHistory: MockTestHistory[];
  reminders: Reminder[];
  preferences: UserPreferences;
  likedFormulas: Handnote[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  supabaseAccessToken?: string;
}

interface AppState {
  // PWA Install State
  canInstall: boolean;

  // Authentication & Session
  currentUser: SessionUser | null;
  setCurrentUser: (user: SessionUser | null) => Promise<void>;
  fetchUserData: () => Promise<void>;
  userProfiles: Record<string, UserProfileState>;
  
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
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  toggleTheme: () => void;
  
  // Dynamic bookmarks
  toggleBookmark: (type: 'notifications' | 'jobs' | 'currentAffairs' | 'roadmapTopics', id: string) => Promise<void>;
  
  // Roadmap update
  updateRoadmapTopicStatus: (topicId: string, status: 'Locked' | 'Learning' | 'Practicing' | 'Completed') => Promise<void>;
  logStudyTime: (topicId: string, minutes: number) => Promise<void>;
  
  // Mock Test result submission (Level game logic)
  submitMockTestResult: (result: Omit<MockTestHistory, 'completedAt'>) => Promise<void>;
  
  // Scraper Actions
  syncData: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'triggered'>) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  clearUserProfileData: (email: string) => Promise<void>;
  toggleLikeFormula: (formula: Handnote) => Promise<void>;

  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
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
  roadmapTimeSpent: {},
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
  preferences: DEFAULT_PREFERENCES,
  likedFormulas: []
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

// Helper to compute rolling reminders
const subtractDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const generateSmartReminders = (profile: UserProfileState, notifications: ExamNotification[]): Reminder[] => {
  const targetExams = profile.preferences.targetExams || [];
  const autoReminders: Reminder[] = [];
  const today = new Date().toISOString().split('T')[0];

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
        .replace(/^./, str => str.toUpperCase());

      const intervals: { type: '30_days' | '10_days' | '2_days' | '1_day'; days: number }[] = [
        { type: '30_days', days: 30 },
        { type: '10_days', days: 10 },
        { type: '2_days', days: 2 },
        { type: '1_day', days: 1 }
      ];

      intervals.forEach(({ type, days }) => {
        const reminderDate = subtractDays(dateStr, days);
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

  const manualReminders = profile.reminders.filter(r => !r.id.startsWith('rem_auto_'));
  return [...manualReminders, ...autoReminders];
};

export const useAppStore = create<AppState>((set, get) => {
  const isClient = typeof window !== 'undefined';
  
  let initialNotifications = DEFAULT_NOTIFICATIONS;
  let initialJobs = DEFAULT_JOBS;
  let initialCA = DEFAULT_CURRENT_AFFAIRS;

  if (isClient) {
    try {
      const storedNotifs = localStorage.getItem('banking_companion_notifications');
      if (storedNotifs) initialNotifications = JSON.parse(storedNotifs);
      const storedJobs = localStorage.getItem('banking_companion_jobs');
      if (storedJobs) initialJobs = JSON.parse(storedJobs);
      const storedCA = localStorage.getItem('banking_companion_current_affairs');
      if (storedCA) initialCA = JSON.parse(storedCA);
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  }

  return {
    canInstall: false,
    currentUser: null,
    userProfiles: {},
    notifications: initialNotifications,
    jobs: initialJobs,
    currentAffairs: initialCA,
    roadmapStructure: ROADMAP_TOPICS_LIST,
    lastSyncedAt: isClient ? localStorage.getItem('banking_companion_last_synced') : null,
    isSyncing: false,
    activeTestTopic: null,
    toast: null,

    setActiveTestTopic: (topic) => set({ activeTestTopic: topic }),

    setCurrentUser: async (user) => {
      set({ currentUser: user });
      if (user) {
        // Fetch detailed profile from Supabase normalized tables
        await get().fetchUserData();
      }
    },

    fetchUserData: async () => {
      const { currentUser } = get();
      if (!currentUser) return;
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      try {
        // Get user preferences
        let { data: dbPrefs } = await client
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
          
        if (!dbPrefs) {
          const defaultPrefs = {
            user_id: currentUser.id,
            theme: 'light' as const,
            enable_notifications: true,
            enable_calendar_sync: false,
            target_exams: ['SBI PO', 'IBPS PO']
          };
          await client.from('user_preferences').insert(defaultPrefs);
          dbPrefs = { ...defaultPrefs, updated_at: new Date().toISOString() };
        }

        // Fetch user levels
        const { data: dbLevels } = await client
          .from('user_levels')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch roadmap progress
        const { data: dbProgress } = await client
          .from('roadmap_progress')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch bookmarks
        const { data: dbBookmarks } = await client
          .from('bookmarks')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch reminders
        const { data: dbReminders } = await client
          .from('reminders')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch liked formulas
        const { data: dbFormulas } = await client
          .from('liked_formulas')
          .select('*')
          .eq('user_id', currentUser.id);

        // Fetch test history
        const { data: dbHistory } = await client
          .from('test_sessions')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false });

        // Build UserProfileState
        const unlockedLevels = {
          'Full-Length': 1,
          'Quantitative Aptitude': 1,
          'Reasoning': 1,
          'English': 1,
          'General Awareness': 1,
          'Computer Awareness': 1
        };
        dbLevels?.forEach(lvl => {
          if (lvl.category in unlockedLevels) {
            unlockedLevels[lvl.category as keyof typeof unlockedLevels] = lvl.unlocked_level;
          }
        });

        const roadmapProgress: Record<string, 'Locked' | 'Learning' | 'Practicing' | 'Completed'> = {};
        const roadmapTimeSpent: Record<string, number> = {};
        dbProgress?.forEach(prog => {
          roadmapProgress[prog.topic_id] = prog.status as any;
          roadmapTimeSpent[prog.topic_id] = prog.time_spent_minutes || 0;
        });

        const bookmarks = {
          notifications: [] as string[],
          jobs: [] as string[],
          currentAffairs: [] as string[],
          roadmapTopics: [] as string[]
        };
        dbBookmarks?.forEach(bm => {
          if (bm.type === 'notification') bookmarks.notifications.push(bm.reference_id);
          else if (bm.type === 'job') bookmarks.jobs.push(bm.reference_id);
          else if (bm.type === 'current_affair') bookmarks.currentAffairs.push(bm.reference_id);
          else if (bm.type === 'roadmap_topic') bookmarks.roadmapTopics.push(bm.reference_id);
        });

        const reminders = dbReminders?.map(rem => ({
          id: rem.id,
          title: rem.title,
          date: rem.target_date,
          type: (rem.alert_type || '1_day') as any,
          triggered: rem.is_triggered
        })) || [];

        const likedFormulas = dbFormulas?.map(f => ({
          id: f.formula_id,
          title: f.title,
          content: f.content,
          shortcut: f.shortcut || '',
          topic: f.topic,
          subject: f.subject
        })) || [];

        const mockTestHistory = dbHistory?.map(ts => ({
          testId: ts.id,
          title: ts.title,
          type: ts.type as any,
          subject: ts.subject || undefined,
          topic: ts.topic || undefined,
          scorePct: Number(ts.score_pct || 0),
          correctAnswers: ts.correct_answers || 0,
          wrongAnswers: ts.wrong_answers || 0,
          unattemptedQuestions: ts.unattempted || 0,
          timeSpentSeconds: ts.time_spent_seconds || 0,
          completedAt: ts.completed_at || new Date().toISOString(),
          isCleared: ts.is_cleared || false
        })) || [];

        const preferences = {
          theme: (dbPrefs.theme || 'light') as any,
          targetExams: dbPrefs.target_exams || [],
          enableBrowserNotifications: dbPrefs.enable_notifications,
          enableGoogleCalendarSync: dbPrefs.enable_calendar_sync
        };

        const updatedProfile = {
          email: currentUser.email,
          bookmarks,
          roadmapProgress,
          roadmapTimeSpent,
          unlockedLevels,
          mockTestHistory,
          reminders,
          preferences,
          likedFormulas
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [currentUser.email]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to load user profile details:", err);
      }
    },

    toggleTheme: () => {
      const { currentUser, userProfiles, updateUserPreferences } = get();
      if (!currentUser) return;
      const currentTheme = userProfiles[currentUser.email]?.preferences?.theme || 'light';
      updateUserPreferences({ theme: currentTheme === 'light' ? 'dark' : 'light' });
    },

    login: (email: string) => {
      return false; // Delegated to NextAuth login page
    },

    logout: () => {
      set({ currentUser: null });
      nextAuthSignOut({ callbackUrl: "/login" });
    },

    showToast: (message, type = 'info') => {
      set({ toast: { message, type } });
    },
    
    clearToast: () => {
      set({ toast: null });
    },

    updateUserPreferences: async (prefs) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      const updatedPrefs = {
        ...profile.preferences,
        ...prefs
      };

      try {
        const { error } = await client
          .from('user_preferences')
          .upsert({
            user_id: currentUser.id,
            theme: updatedPrefs.theme,
            enable_notifications: updatedPrefs.enableBrowserNotifications,
            enable_calendar_sync: updatedPrefs.enableGoogleCalendarSync,
            target_exams: updatedPrefs.targetExams,
            updated_at: new Date().toISOString()
          });

        if (error) throw new Error(error.message);

        // Update local state and regenerate auto smart reminders
        const tempProfile = { ...profile, preferences: updatedPrefs };
        const updatedReminders = generateSmartReminders(tempProfile, get().notifications);
        const updatedProfile = { ...tempProfile, reminders: updatedReminders };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to update user preferences:", err);
      }
    },

    toggleBookmark: async (type, id) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      const currentList = profile.bookmarks[type];
      const exists = currentList.includes(id);

      // Translate type to DB BookmarkType enum
      let dbType: 'notification' | 'job' | 'current_affair' | 'roadmap_topic' = 'notification';
      if (type === 'jobs') dbType = 'job';
      else if (type === 'currentAffairs') dbType = 'current_affair';
      else if (type === 'roadmapTopics') dbType = 'roadmap_topic';

      try {
        if (exists) {
          const { error } = await client
            .from('bookmarks')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('type', dbType)
            .eq('reference_id', id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await client
            .from('bookmarks')
            .insert({
              user_id: currentUser.id,
              type: dbType,
              reference_id: id
            });
          if (error) throw new Error(error.message);
        }

        const newList = exists
          ? currentList.filter(item => item !== id)
          : [...currentList, id];

        const updatedProfile = {
          ...profile,
          bookmarks: {
            ...profile.bookmarks,
            [type]: newList
          }
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to toggle bookmark:", err);
      }
    },

    updateRoadmapTopicStatus: async (topicId, status) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      try {
        const { error } = await client
          .from('roadmap_progress')
          .upsert({
            user_id: currentUser.id,
            topic_id: topicId,
            status,
            last_studied_at: new Date().toISOString()
          }, { onConflict: 'user_id,topic_id' });

        if (error) throw new Error(error.message);

        const updatedProfile = {
          ...profile,
          roadmapProgress: {
            ...profile.roadmapProgress,
            [topicId]: status
          }
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to update roadmap topic status:", err);
      }
    },

    logStudyTime: async (topicId, minutes) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      try {
        const { data } = await client
          .from('roadmap_progress')
          .select('time_spent_minutes, status')
          .eq('user_id', currentUser.id)
          .eq('topic_id', topicId)
          .maybeSingle();

        const currentMins = data?.time_spent_minutes || 0;
        const currentStatus = data?.status || 'Learning';

        const { error } = await client
          .from('roadmap_progress')
          .upsert({
            user_id: currentUser.id,
            topic_id: topicId,
            time_spent_minutes: currentMins + minutes,
            status: currentStatus,
            last_studied_at: new Date().toISOString()
          }, { onConflict: 'user_id,topic_id' });

        if (error) throw new Error(error.message);

        await get().fetchUserData();
      } catch (err) {
        console.error("Failed to log study time:", err);
      }
    },

    submitMockTestResult: async (result) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      // Level game logic and sectional cutoffs: score >= passingPct (cleared)
      const isCleared = result.isCleared; // passed in from test engine
      const completedTest: MockTestHistory = {
        ...result,
        completedAt: new Date().toISOString(),
        isCleared
      };

      try {
        // 1. Insert session record to Supabase
        const { data: dbSession, error: sessionErr } = await client
          .from('test_sessions')
          .insert({
            user_id: currentUser.id,
            title: result.title,
            type: result.type,
            subject: result.subject || null,
            topic: result.topic || null,
            level: result.level || 1,
            total_questions: result.correctAnswers + result.wrongAnswers + result.unattemptedQuestions,
            negative_marking: true, // defaults
            score_pct: result.scorePct,
            correct_answers: result.correctAnswers,
            wrong_answers: result.wrongAnswers,
            unattempted: result.unattemptedQuestions,
            time_spent_seconds: result.timeSpentSeconds,
            is_cleared: isCleared,
            is_completed: true,
            completed_at: completedTest.completedAt
          })
          .select()
          .single();

        if (sessionErr) throw new Error(sessionErr.message);

        // 2. Update level unlocking logic: If cleared, unlock next level
        const updatedUnlockedLevels = { ...profile.unlockedLevels };
        const updatedRoadmapProgress = { ...profile.roadmapProgress };

        if (isCleared) {
          if (result.type === 'Topic' && result.topic) {
            const matchTopic = get().roadmapStructure.find(
              t => t.name.toLowerCase() === result.topic?.toLowerCase() && t.subject === result.subject
            );
            if (matchTopic) {
              updatedRoadmapProgress[matchTopic.id] = 'Completed';
              // Sync completed status to DB
              await client
                .from('roadmap_progress')
                .upsert({
                  user_id: currentUser.id,
                  topic_id: matchTopic.id,
                  status: 'Completed',
                  last_studied_at: new Date().toISOString()
                }, { onConflict: 'user_id,topic_id' });
            }
          } else {
            const testType = result.type;
            const testCategory = testType === 'Full-Length' ? 'Full-Length' : (result.subject || 'Full-Length');
            
            const match = result.title.match(/Level\s+(\d+)/i);
            if (match) {
              const clearedLevelNum = parseInt(match[1]);
              const currentUnlocked = updatedUnlockedLevels[testCategory as keyof typeof updatedUnlockedLevels] || 1;
              if (clearedLevelNum === currentUnlocked) {
                const nextLvl = currentUnlocked + 1;
                updatedUnlockedLevels[testCategory as keyof typeof updatedUnlockedLevels] = nextLvl;
                
                // Sync user level to DB
                await client
                  .from('user_levels')
                  .upsert({
                    user_id: currentUser.id,
                    category: testCategory,
                    unlocked_level: nextLvl
                  }, { onConflict: 'user_id,category' });
              }
            }
          }
        }

        // Add auto reminder for level unlock if appropriate
        const newReminders = [...profile.reminders];
        if (result.type === 'Full-Length' && isCleared) {
          const remTitle = `Congratulations! Unlocked Level ${updatedUnlockedLevels['Full-Length']} Mock Test`;
          const remDate = new Date().toISOString().split('T')[0];
          
          const { data: dbRem } = await client
            .from('reminders')
            .insert({
              user_id: currentUser.id,
              title: remTitle,
              target_date: remDate,
              alert_type: '1_day',
              is_auto_generated: true
            })
            .select()
            .single();

          if (dbRem) {
            newReminders.push({
              id: dbRem.id,
              title: dbRem.title,
              date: dbRem.target_date,
              type: '1_day',
              triggered: false
            });
          }
        }

        const newHistory = [completedTest, ...profile.mockTestHistory];
        const updatedProfile = {
          ...profile,
          mockTestHistory: newHistory,
          unlockedLevels: updatedUnlockedLevels,
          roadmapProgress: updatedRoadmapProgress,
          reminders: newReminders
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to submit mock test result:", err);
      }
    },

    syncData: async () => {
      set({ isSyncing: true });
      try {
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
            localStorage.setItem('banking_companion_notifications', JSON.stringify(mergedNotifications));
            localStorage.setItem('banking_companion_jobs', JSON.stringify(mergedJobs));
            localStorage.setItem('banking_companion_current_affairs', JSON.stringify(mergedCA));
          }

          // Regenerate smart reminders for active user with new notifications
          const { currentUser, userProfiles } = get();
          if (currentUser) {
            const userEmail = currentUser.email;
            const profile = userProfiles[userEmail];
            if (profile) {
              const client = getClientSupabase(currentUser.supabaseAccessToken);
              const updatedReminders = generateSmartReminders(profile, mergedNotifications);
              
              // Find new auto reminders to save to DB
              const newAutoRems = updatedReminders.filter(ur => ur.id.startsWith('rem_auto_') && !profile.reminders.some(pr => pr.id === ur.id));
              for (const rem of newAutoRems) {
                await client.from('reminders').insert({
                  id: rem.id,
                  user_id: currentUser.id,
                  title: rem.title,
                  target_date: rem.date,
                  alert_type: rem.type,
                  is_auto_generated: true
                });
              }

              const updatedProfile = {
                ...profile,
                reminders: updatedReminders
              };
              
              set(state => ({
                userProfiles: {
                  ...state.userProfiles,
                  [userEmail]: updatedProfile
                }
              }));
              
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

    addReminder: async (reminder) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      try {
        const { data: dbRem, error } = await client
          .from('reminders')
          .insert({
            user_id: currentUser.id,
            title: reminder.title,
            target_date: reminder.date,
            alert_type: reminder.type,
            is_auto_generated: false
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        const newReminder: Reminder = {
          id: dbRem.id,
          title: dbRem.title,
          date: dbRem.target_date,
          type: (dbRem.alert_type || '1_day') as any,
          triggered: dbRem.is_triggered
        };

        const updatedProfile = {
          ...profile,
          reminders: [...profile.reminders, newReminder]
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to add reminder:", err);
      }
    },

    removeReminder: async (id) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      try {
        const { error } = await client
          .from('reminders')
          .delete()
          .eq('id', id);

        if (error) throw new Error(error.message);

        const updatedProfile = {
          ...profile,
          reminders: profile.reminders.filter(r => r.id !== id)
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to remove reminder:", err);
      }
    },

    clearUserProfileData: async (email) => {
      const { currentUser } = get();
      if (!currentUser) return;
      const client = getClientSupabase(currentUser.supabaseAccessToken);

      try {
        // Remove all user-specific data from DB
        await client.from('test_sessions').delete().eq('user_id', currentUser.id);
        await client.from('bookmarks').delete().eq('user_id', currentUser.id);
        await client.from('roadmap_progress').delete().eq('user_id', currentUser.id);
        await client.from('reminders').delete().eq('user_id', currentUser.id);
        await client.from('liked_formulas').delete().eq('user_id', currentUser.id);
        await client.from('user_levels').delete().eq('user_id', currentUser.id);

        const initialProfile = getInitialProfile(email);
        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [email]: initialProfile
          }
        }));
      } catch (err) {
        console.error("Failed to clear user profile data:", err);
      }
    },
    
    toggleLikeFormula: async (formula) => {
      const { currentUser, userProfiles } = get();
      if (!currentUser) return;

      const userEmail = currentUser.email;
      const profile = userProfiles[userEmail];
      const client = getClientSupabase(currentUser.supabaseAccessToken);
      
      const currentLikes = profile.likedFormulas || [];
      const exists = currentLikes.some(f => f.id === formula.id);

      try {
        if (exists) {
          const { error } = await client
            .from('liked_formulas')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('formula_id', formula.id);
          if (error) throw new Error(error.message);

          // Also remove from spaced repetition
          await client
            .from('spaced_repetition')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('item_id', formula.id)
            .eq('item_type', 'formula');
        } else {
          const { error } = await client
            .from('liked_formulas')
            .insert({
              user_id: currentUser.id,
              formula_id: formula.id,
              title: formula.title,
              content: formula.content,
              shortcut: formula.shortcut || null,
              topic: formula.topic,
              subject: formula.subject
            });
          if (error) throw new Error(error.message);

          // Also insert into spaced repetition queue
          await client
            .from('spaced_repetition')
            .upsert({
              user_id: currentUser.id,
              item_id: formula.id,
              item_type: 'formula',
              easiness_factor: 2.5,
              interval_days: 1,
              repetition_count: 0,
              next_review_date: new Date().toISOString().split('T')[0]
            }, { onConflict: 'user_id,item_id,item_type' });
        }

        const newLikes = exists
          ? currentLikes.filter(f => f.id !== formula.id)
          : [...currentLikes, formula];

        const updatedProfile = {
          ...profile,
          likedFormulas: newLikes
        };

        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [userEmail]: updatedProfile
          }
        }));
      } catch (err) {
        console.error("Failed to toggle liked formula:", err);
      }
    }
  };
});
