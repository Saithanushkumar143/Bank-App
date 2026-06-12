import { NextRequest, NextResponse } from 'next/server';
import { generateMockQuestions } from '@/lib/gemini';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const generateTestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  count: z.number().int().min(5).max(100).default(25),
  level: z.number().int().min(1).max(10).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateTestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { subject, topic, count, level } = parsed.data;

    // Rate Limiting: Max 15 test generation requests per IP per 15 minutes
    let ip = "127.0.0.1";
    try {
      ip = req.headers.get("x-forwarded-for")?.split(',')[0].trim() || (req as any).ip || "127.0.0.1";
    } catch (e) {
      console.warn("Failed to retrieve client IP:", e);
    }

    const limitKey = `ai_gen:${ip}`;
    const rateLimit = await checkRateLimit(limitKey, 15, 15 * 60 * 1000); // 15 requests per 15 mins

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many test generations. Please try again in ${rateLimit.timeLeftMinutes} minutes.`, code: "RATE_LIMIT_EXCEEDED" },
        { status: 429 }
      );
    }

    // Call dynamic waterfall question generator
    const questions = await generateMockQuestions(subject, topic, count, level);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('API mock generator error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test questions', code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
