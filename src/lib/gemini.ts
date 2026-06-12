import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateWaterfallQuestions } from './question-generator';

const apiKey = process.env.GEMINI_API_KEY || '';
export const isGeminiConfigured = !!apiKey;

const apiKeySecondary = process.env.GEMINI_API_KEY_SECONDARY || '';
export const isGeminiSecondaryConfigured = !!apiKeySecondary;

const groqApiKey = process.env.GROQ_API_KEY || '';
export const isGroqConfigured = !!groqApiKey && !groqApiKey.includes('PLACEHOLDER');

export const genAI = isGeminiConfigured ? new GoogleGenerativeAI(apiKey) : null;
export const genAISecondary = isGeminiSecondaryConfigured ? new GoogleGenerativeAI(apiKeySecondary) : null;

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

// Wrapper function to direct all question requests to the dynamic waterfall generator
export async function generateMockQuestions(
  subject: string,
  topic: string,
  count: number = 25,
  level: number = 1
): Promise<Question[]> {
  const result = await generateWaterfallQuestions(subject, topic, count, level);
  return result as Question[];
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

export async function filterCurrentAffairs(rawNewsList: RawNewsItem[]): Promise<RawNewsItem[]> {
  if (!genAI) {
    return rawNewsList.filter(item => {
      const text = `${item.title} ${item.content || item.summary || ''}`.toLowerCase();
      return text.includes('bank') || text.includes('rbi') || text.includes('economy') || text.includes('finance') || text.includes('budget') || text.includes('gdp') || text.includes('loan') || text.includes('government') || text.includes('sebi') || text.includes('policy') || text.includes('rate');
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `
      Given this list of news articles, filter out any that are irrelevant to a candidate preparing for Indian Banking Exams (SBI PO, IBPS PO, RBI Grade B).
      Prioritize Banking News, Economy News, RBI Updates, Government Schemes, Appointments, Awards, Summits, and Reports & Indexes.
      
      Articles JSON: ${JSON.stringify(rawNewsList)}
      
      Return a clean JSON array containing ONLY the filtered articles. Maintain their original object structures.
      Do not wrap in \`\`\`json \`\`\`. Output ONLY the raw JSON string.
    `;
    const result = await model.generateContent(prompt);
    const cleanText = result.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error filtering news with Gemini:', error);
    return rawNewsList.slice(0, 10);
  }
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

export async function scrapeNotificationsWithGemini(): Promise<ScrapedNotification[]> {
  if (!genAI) {
    throw new Error("Gemini API not configured");
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `
    You are an expert banking careers scanner.
    Generate/extract the real-world, actual examination notifications for the current year (2026) for the following five organizations in India:
    - SBI (Probationary Officers - SBI PO 2026)
    - IBPS (Probationary Officers - IBPS PO CRP XIV)
    - RBI (Grade B Officers 2026)
    - NABARD (Assistant Manager Grade A 2026)
    - LIC (Assistant Administrative Officers - LIC AAO 2026)

    For each organization, output:
    - id: string (e.g. 'notif_sbi_scraped_2026')
    - organization: string (SBI, IBPS, RBI, NABARD, LIC)
    - title: string (the official title of the recruitment)
    - pdfUrl: string (official career pdf link, or a realistic URL on their domain)
    - vacancyCount: number (actual or estimated vacancy count announced)
    - eligibility: string (eligibility requirements)
    - importantDates: object containing:
      - notificationRelease: YYYY-MM-DD
      - registrationStart: YYYY-MM-DD
      - registrationEnd: YYYY-MM-DD
      - feeDeadline: YYYY-MM-DD
      - admitCardRelease: YYYY-MM-DD
      - examDate: YYYY-MM-DD (Phase 1 / Prelims date)
      - resultDate: YYYY-MM-DD
      - interviewDate: YYYY-MM-DD
      - finalSelectionDate: YYYY-MM-DD
    - officialWebsite: string (official website URL)

    Return the output as a valid JSON array of notifications.
    Do not include markdown tags like \`\`\`json \`\`\`. Output ONLY the raw JSON.
  `;
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanText);
}

export async function scrapeCurrentAffairsWithGemini(): Promise<RawNewsItem[]> {
  if (!genAI) {
    throw new Error("Gemini API not configured");
  }
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `
    You are an expert financial and banking news scanner.
    Generate/extract 5 high-quality, actual or highly realistic banking, economy, and financial current affairs articles relevant for Indian Banking Exams (SBI PO, IBPS PO, RBI Grade B) in the current year (2026).
    The categories must be chosen from: 'Banking News', 'Economy News', 'RBI Updates', 'Government Schemes', 'Appointments', 'Awards', 'Summits', 'Reports & Indexes', 'National News', 'International News'.

    For each article, output:
    - id: string (deterministic, e.g. 'ca_gemini_2026_1', 'ca_gemini_2026_2', etc.)
    - category: string
    - title: string (professional, exam-focused title)
    - content: string (detailed news description)
    - summary: string (brief 1-2 sentence summary)
    - publishedAt: string (ISO date string in 2026)
    - sourceUrl: string (official website or news source link)

    Return the output as a valid JSON array of articles.
    Do not include markdown tags like \`\`\`json \`\`\`. Output ONLY the raw JSON.
  `;
  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const cleanText = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanText);
}
