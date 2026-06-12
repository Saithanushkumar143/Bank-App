import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { env } from './env';

export interface GeneratedQuestion {
  id?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject?: string;
  topic?: string;
  difficulty?: number;
}

// Local Trigram Similarity function (simulating pg_trgm similarity in JavaScript)
export function getTrigramSimilarity(s1: string, s2: string): number {
  const getTrigrams = (str: string) => {
    const s = '  ' + str.toLowerCase().replace(/\s+/g, ' ') + '  ';
    const trigrams = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) {
      trigrams.add(s.slice(i, i + 3));
    }
    return trigrams;
  };
  const t1 = getTrigrams(s1);
  const t2 = getTrigrams(s2);
  if (t1.size === 0 || t2.size === 0) return 0;
  const intersection = new Set([...t1].filter(x => t2.has(x)));
  const union = new Set([...t1, ...t2]);
  return intersection.size / union.size;
}

// Check similarity against cached DB questions for the same topic
async function isDuplicateQuestion(newQuestionText: string, subject: string, topic: string): Promise<boolean> {
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('question_text')
    .eq('subject', subject)
    .eq('topic', topic);

  if (!existingQuestions) return false;

  for (const q of existingQuestions) {
    if (getTrigramSimilarity(q.question_text, newQuestionText) > 0.85) {
      return true;
    }
  }

  return false;
}

// Dynamic prompt helper
function getGenerationPrompt(subject: string, topic: string, count: number, level: number): string {
  const hardnessDesc = 
    level <= 3 ? "Easy: basic concepts, direct calculations, simple rules." :
    level <= 6 ? "Medium: double-step calculations, tricky exam patterns, common PO level." :
    level <= 8 ? "Hard: advanced formulas, multi-variable logic puzzles, higher vocabulary." :
    "Extremely Hard / SBI PO Mains Level: complex data sets, multi-variable constraints, dense reading.";

  return `
    You are an expert banking exam paper setter for SBI PO / IBPS PO / RBI Grade B.
    Generate exactly ${count} multiple choice questions (MCQs) for the topic "${topic}" in the subject "${subject}".
    The difficulty level is ${level} of 10 (${hardnessDesc}).

    CRITICAL RULES:
    1. The questions generated MUST belong ONLY to the specific topic "${topic}". Do not include questions from other topics.
    2. Double check that all questions directly test skills related to "${topic}".
    3. Vary numerical values, scenarios, and question formats to ensure they are unique.
    4. Random seed: ${Math.random()}.

    The output MUST be a valid JSON array, containing objects with these exact keys:
    - questionText: string (the exam question, keep it high quality and realistic)
    - options: string[] (exactly 4 options)
    - correctOptionIndex: number (0-indexed, indicating which option is correct)
    - explanation: string (detailed step-by-step reasoning or mathematical explanation)

    Do not wrap the JSON in markdown formatting like \`\`\`json \`\`\`. Output ONLY the raw JSON string.
  `;
}

// STEP 2 & 3: Gemini Generator
async function generateWithGemini(
  apiKey: string,
  subject: string,
  topic: string,
  count: number,
  level: number
): Promise<GeneratedQuestion[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = getGenerationPrompt(subject, topic, count, level);

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanText) as GeneratedQuestion[];
}

// STEP 4: Groq Generator
async function generateWithGroq(
  apiKey: string,
  subject: string,
  topic: string,
  count: number,
  level: number
): Promise<GeneratedQuestion[]> {
  const prompt = getGenerationPrompt(subject, topic, count, level);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content.trim();
  const cleanText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
  
  // Groq might respond with { "questions": [...] }
  const parsed = JSON.parse(cleanText);
  if (Array.isArray(parsed)) {
    return parsed as GeneratedQuestion[];
  } else if (parsed.questions && Array.isArray(parsed.questions)) {
    return parsed.questions as GeneratedQuestion[];
  }
  throw new Error("Invalid format returned from Groq");
}

// Main Waterfall Function
export async function generateWaterfallQuestions(
  subject: string,
  topic: string,
  count: number,
  level: number
): Promise<GeneratedQuestion[]> {
  let questions: GeneratedQuestion[] = [];
  let sourceUsed: 'gemini' | 'groq' | 'database' = 'gemini';

  // --- API ATTEMPTS FIRST ---

  // STEP 2: Gemini Primary
  if (env.GEMINI_API_KEY) {
    try {
      console.log(`Trying Gemini Primary for ${subject} - ${topic}...`);
      questions = await generateWithGemini(env.GEMINI_API_KEY, subject, topic, count, level);
      sourceUsed = 'gemini';
    } catch (e) {
      console.warn('Gemini Primary failed, trying Gemini Secondary:', e);
    }
  }

  // STEP 3: Gemini Secondary
  if (questions.length === 0 && env.GEMINI_API_KEY_SECONDARY) {
    try {
      console.log(`Trying Gemini Secondary for ${subject} - ${topic}...`);
      questions = await generateWithGemini(env.GEMINI_API_KEY_SECONDARY, subject, topic, count, level);
      sourceUsed = 'gemini';
    } catch (e) {
      console.warn('Gemini Secondary failed, trying Groq:', e);
    }
  }

  // STEP 4: Groq
  if (questions.length === 0 && env.GROQ_API_KEY) {
    try {
      console.log(`Trying Groq for ${subject} - ${topic}...`);
      questions = await generateWithGroq(env.GROQ_API_KEY, subject, topic, count, level);
      sourceUsed = 'groq';
    } catch (e) {
      console.warn('Groq failed, falling back to database questions:', e);
    }
  }

  // If API generation succeeded, save new unique questions to public.questions table
  if (questions.length > 0) {
    const savedQuestions: GeneratedQuestion[] = [];

    for (const q of questions) {
      const isDup = await isDuplicateQuestion(q.questionText, subject, topic);
      if (!isDup) {
        const { data, error } = await supabase
          .from('questions')
          .insert({
            subject: subject as any,
            topic,
            difficulty: level,
            question_text: q.questionText,
            options: q.options,
            correct_index: q.correctOptionIndex,
            explanation: q.explanation,
            source: sourceUsed,
            is_verified: false
          })
          .select()
          .single();

        if (!error && data) {
          savedQuestions.push({
            id: data.id,
            questionText: data.question_text,
            options: data.options as string[],
            correctOptionIndex: data.correct_index,
            explanation: data.explanation,
            subject: data.subject,
            topic: data.topic,
            difficulty: data.difficulty
          });
        }
      } else {
        // If it is a duplicate, we will still serve it, but not insert again
        savedQuestions.push(q);
      }
    }

    return savedQuestions;
  }

  // --- DATABASE FALLBACK ---
  console.log(`Fallback: Retrieving questions from Supabase public.questions table...`);
  const { data: dbQuestions, error: dbError } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', subject)
    .eq('topic', topic)
    .gte('difficulty', Math.max(1, level - 1))
    .lte('difficulty', Math.min(10, level + 1))
    .order('created_at', { ascending: false })
    .limit(count);

  if (dbError) {
    console.error("Database query fallback error:", dbError.message);
  }

  if (dbQuestions && dbQuestions.length > 0) {
    return dbQuestions.map((q: any) => ({
      id: q.id,
      questionText: q.question_text,
      options: q.options as string[],
      correctOptionIndex: q.correct_index,
      explanation: q.explanation,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty
    }));
  }

  throw new Error("Failed to generate or retrieve questions. Please try again.");
}

