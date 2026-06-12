import { NextRequest, NextResponse } from "next/server";
import { generateMockQuestions } from "@/lib/gemini";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Pick a random topic from our 45 roadmap topics
    const store = useAppStore.getState();
    const topics = store.roadmapStructure;
    
    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: "Syllabus topics structure not loaded" }, { status: 500 });
    }

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const randomDifficulty = Math.floor(Math.random() * 10) + 1; // 1 to 10

    // Check how many questions we currently have in the DB for this topic and difficulty
    const { count, error } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("subject", randomTopic.subject)
      .eq("topic", randomTopic.name)
      .eq("difficulty", randomDifficulty);

    if (error) {
      throw new Error(error.message);
    }

    const currentCount = count || 0;
    const targetCount = 50;

    if (currentCount >= targetCount) {
      return NextResponse.json({
        message: `Already seeded. ${currentCount} questions exist for Subject: ${randomTopic.subject}, Topic: ${randomTopic.name}, Level: ${randomDifficulty}`
      });
    }

    // Generate a batch of 10 questions to prevent API timeout
    const batchSize = Math.min(10, targetCount - currentCount);
    console.log(`Cron Seed: Generating ${batchSize} questions for ${randomTopic.subject} -> ${randomTopic.name} (Level ${randomDifficulty})`);

    // generateMockQuestions calls our waterfall generator, which automatically handles similarity check and DB inserts
    const questions = await generateMockQuestions(
      randomTopic.subject,
      randomTopic.name,
      batchSize,
      randomDifficulty
    );

    return NextResponse.json({
      success: true,
      seededCount: questions.length,
      subject: randomTopic.subject,
      topic: randomTopic.name,
      difficulty: randomDifficulty,
      currentTotal: currentCount + questions.length
    });
  } catch (error: any) {
    console.error("Cron seed questions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run cron question seeding", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
