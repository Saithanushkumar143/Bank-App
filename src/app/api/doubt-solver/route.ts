import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

const getClientSupabase = (token?: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || '';
    const supabaseToken = (session.user as any).supabaseAccessToken;

    // 2. Rate Limiting: Max 20 chatbot questions per user per 15 minutes
    let ip = "127.0.0.1";
    try {
      ip = req.headers.get("x-forwarded-for")?.split(',')[0].trim() || (req as any).ip || "127.0.0.1";
    } catch (e) {
      console.warn("Failed to retrieve client IP for rate limit:", e);
    }
    
    const limitKey = `chatbot:${userId || ip}`;
    const rateLimit = await checkRateLimit(limitKey, 20, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many questions. Please try again in ${rateLimit.timeLeftMinutes} minutes.`, code: "RATE_LIMIT_EXCEEDED" },
        { status: 429 }
      );
    }

    // 3. Initialize Gemini API client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured on the server.", code: "CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 4. Call Gemini with strict system instructions and context
    const systemPrompt = `
      You are an expert, friendly, and encouraging AI banking exam tutor for Indian Banking Exams (SBI PO, IBPS PO, RBI Grade B, NABARD Grade A, LIC AAO).
      
      CRITICAL RULES:
      1. You must ONLY answer questions, concepts, formulas, shortcuts, and syllabus doubts related to Indian Banking Exams.
      2. The allowed subjects are:
         - Quantitative Aptitude (math, formulas, shortcuts, calculations)
         - Reasoning Ability (puzzles, syllogisms, logic)
         - English Language (grammar, vocabulary, comprehension)
         - General Awareness (Indian economy, banking terminology, RBI updates, current affairs, government schemes)
         - Computer Awareness (networking, security, hardware, software concepts)
      3. If the user asks anything outside of these exam topics (e.g. asking you to write software code, translate general text, talk about films, games, or off-topic general knowledge), you MUST politely decline.
         Example response: "I'm designed to help you prepare for Indian Banking Exams. Let's get back to topics like Quantitative Aptitude, Reasoning, or Banking Awareness! What topic would you like to discuss next?"
      4. Provide clear, structured, step-by-step mathematical or logical breakdowns. Use bullet points and clean formatting to make it easy to read.
      
      User Question: "${question}"
    `;

    const result = await model.generateContent(systemPrompt);
    const botResponse = result.response.text().trim();

    // 5. Connect typed Supabase client using user token to satisfy RLS policies
    const client = getClientSupabase(supabaseToken);

    // Save chat log to public.doubts table
    const { data: dbDoubt, error: dbError } = await client
      .from('doubts')
      .insert({
        user_id: userId,
        question: question.trim(),
        answer: botResponse
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to save doubt chat history:", dbError.message);
    }

    return NextResponse.json({
      success: true,
      doubt: dbDoubt || {
        user_id: userId,
        question: question.trim(),
        answer: botResponse,
        created_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Doubt solver endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to solve doubt", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
