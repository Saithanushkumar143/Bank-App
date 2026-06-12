export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject?: string;
  topic?: string;
  difficulty?: number;
}

export interface RawNewsItem {
  id: string;
  category: string;
  title: string;
  content: string;
  summary: string;
  publishedAt: string;
  sourceUrl: string;
}

export interface ScrapedNotification {
  id: string;
  organization: string;
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
  created_at?: string;
}
