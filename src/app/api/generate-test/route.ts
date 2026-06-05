import { NextRequest, NextResponse } from 'next/server';
import { generateMockQuestions } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, count } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Missing subject or topic' }, { status: 400 });
    }

    // Call dynamic questions compiler helper
    const questions = await generateMockQuestions(subject, topic, count || 25);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('API mock generator error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
