import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Handnote {
  id: string;
  title: string;
  content: string;
  shortcut: string;
  topic: string;
  subject: string;
}

// Fallback high-yield handnotes if API calls are offline or keys not configured
const LOCAL_FALLBACK_HANDNOTES: Record<string, Omit<Handnote, 'id' | 'subject'>[]> = {
  'Quantitative Aptitude': [
    {
      title: "Speed Math: Fraction to Percentage Conversion",
      content: "Memorize: 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.67%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/11 = 9.09%, 1/12 = 8.33%, 1/15 = 6.67%, 1/20 = 5%.",
      shortcut: "Convert SP / CP ratios directly to profit/loss percentage without using actual numbers.",
      topic: "Percentage"
    },
    {
      title: "Simple & Compound Interest Difference Formula",
      content: "For 2 years: Difference (D) = P * (R / 100)^2.\nFor 3 years: Difference (D) = P * (R / 100)^2 * (3 + R / 100).",
      shortcut: "Directly substitute Difference and Rate to find Principal in under 15 seconds.",
      topic: "Compound Interest"
    },
    {
      title: "Average Speed Formula",
      content: "When distances traveled are equal: Average Speed = (2 * x * y) / (x + y), where x and y are individual speeds.",
      shortcut: "Do not calculate individual times. Apply direct harmonic mean for equal distance ratios.",
      topic: "Time Speed Distance"
    }
  ],
  'Reasoning': [
    {
      title: "Coded Inequality Priority Orders",
      content: "Priority 1: > or <\nPriority 2: >= or <=\nPriority 3: =",
      shortcut: "If relations have opposite directions (e.g. > and <) between two variables, the relationship is instantly 'Cannot be determined'.",
      topic: "Inequalities"
    },
    {
      title: "Syllogism: 'Only a few' logical mapping",
      content: "'Only a few A are B' means: 1. Some A are B (True). 2. Some A are NOT B (True).",
      shortcut: "Draw double lines for 'Some NOT' relation. Remember 'All A can never be B' is always True under this condition.",
      topic: "Syllogism"
    }
  ],
  'English': [
    {
      title: "Rule of Scarcely / Hardly / No Sooner",
      content: "- 'Hardly/Scarcely' is followed by 'when/before' (Not 'than').\n- 'No Sooner' is followed by 'than'.",
      shortcut: "Check the conjunction immediately when you see Scarcely or No Sooner in error spotting questions.",
      topic: "Grammar"
    },
    {
      title: "Parallelism Rule",
      content: "Items in a list or comparison must be in the same grammatical form (e.g. 'He likes swimming, running, and cycling' NOT 'swimming, running, and to cycle').",
      shortcut: "Check verbs surrounding coordinating conjunctions ('and', 'or', 'but') for identical tense structures.",
      topic: "Error Detection"
    }
  ],
  'General Awareness': [
    {
      title: "Monetary Policy Committee (MPC) Key Rates",
      content: "Repo Rate: Interest rate at which RBI lends money to commercial banks.\nReverse Repo Rate: Interest rate at which RBI borrows from banks.\nBank Rate: Long term lending rate without collateral.",
      shortcut: "Repo Rate is always higher than Reverse Repo. MSF rate is generally aligned with the Bank Rate.",
      topic: "RBI Functions"
    },
    {
      title: "Priority Sector Lending (PSL) Targets",
      content: "Commercial banks must direct 40% of Adjusted Net Bank Credit (ANBC) to priority sectors (Agriculture, MSMEs, Education, Housing, Social Infrastructure, Renewable Energy).",
      shortcut: "Regional Rural Banks (RRBs) and Small Finance Banks have a higher target of 75% ANBC.",
      topic: "Banking Awareness"
    }
  ],
  'Computer Awareness': [
    {
      title: "OSI Reference Model Layers",
      content: "7 Layers: Application, Presentation, Session, Transport, Network, Data Link, Physical. (Mnemonic: All People Seem To Need Data Processing).",
      shortcut: "Router operates at Layer 3 (Network). Switch operates at Layer 2 (Data Link). Hub operates at Layer 1 (Physical).",
      topic: "Networking"
    },
    {
      title: "IP Addressing Class Ranges",
      content: "Class A: 1.0.0.0 - 126.0.0.0 (Netmask: 255.0.0.0)\nClass B: 128.0.0.0 - 191.255.255.255\nClass C: 192.0.0.0 - 223.255.255.255\nClass D: 224.0.0.0 - 239.255.255.255 (Multicast)",
      shortcut: "Loopback address 127.0.0.1 is reserved for local host diagnostics and belongs to Class A.",
      topic: "Networking"
    }
  ]
};

export async function POST(req: NextRequest) {
  try {
    const { subject, count } = await req.json();
    const targetCount = count || 5;

    const keySecondary = process.env.GEMINI_API_KEY_SECONDARY || '';
    const keyPrimary = process.env.GEMINI_API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || '';

    let questionsData: Omit<Handnote, 'id' | 'subject'>[] = [];

    const prompt = `
      You are an expert banking examination educator for SBI PO, IBPS PO, and RBI Grade B.
      Generate exactly ${targetCount} high-yield cheatcodes, handnotes, formulas, or speed shortcuts for the subject "${subject}".
      Provide highly actionable, actual revision content for a candidate preparing for the exam.

      Each handnote must contain:
      - title: string (the name of the shortcut/formula/concept)
      - content: string (the actual mathematical formula, grammatical rule, or concept detail)
      - shortcut: string (a quick speed-math trick, mnemonic, or exam tip for memorizing/applying it)
      - topic: string (the chapter/topic name)

      The output MUST be a valid JSON object containing a single key "handnotes", which is an array of objects matching the fields above.
      Do not include markdown wrappers like \`\`\`json \`\`\`. Output ONLY the raw JSON string.
      Random seed: ${Math.random()} to ensure unique generation.
    `;

    // 1. Try Secondary Gemini API Key
    if (keySecondary) {
      try {
        const genAI = new GoogleGenerativeAI(keySecondary);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanText);
        questionsData = parsed.handnotes;
      } catch (err) {
        console.warn('Dynamic handnotes generation with secondary Gemini failed, attempting primary:', err);
      }
    }

    // 2. Try Primary Gemini API Key
    if (questionsData.length === 0 && keyPrimary) {
      try {
        const genAI = new GoogleGenerativeAI(keyPrimary);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanText);
        questionsData = parsed.handnotes;
      } catch (err) {
        console.warn('Dynamic handnotes generation with primary Gemini failed, attempting Groq:', err);
      }
    }

    // 3. Try Groq API (Llama 3)
    if (questionsData.length === 0 && groqKey && !groqKey.includes('PLACEHOLDER')) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.85,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.choices[0].message.content.trim();
          const cleanText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
          const parsed = JSON.parse(cleanText);
          questionsData = parsed.handnotes;
        }
      } catch (err) {
        console.warn('Dynamic handnotes generation with Groq failed:', err);
      }
    }

    // 4. Local fallback if APIs failed or are unconfigured
    if (questionsData.length === 0) {
      const pool = LOCAL_FALLBACK_HANDNOTES[subject] || LOCAL_FALLBACK_HANDNOTES['Quantitative Aptitude'];
      // Shuffle the pool and slice to return targetCount
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      questionsData = shuffled.slice(0, targetCount);
    }

    // Map output with stable IDs and subject category
    const handnotes: Handnote[] = questionsData.map((hn, idx) => ({
      ...hn,
      id: `hn_gen_${subject.toLowerCase().replace(/[^a-z]/g, '_')}_${Date.now()}_${idx}`,
      subject
    }));

    return NextResponse.json({ handnotes });
  } catch (error) {
    console.error('API generate-handnotes error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
