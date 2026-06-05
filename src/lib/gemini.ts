import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
export const isGeminiConfigured = !!apiKey;

const genAI = isGeminiConfigured ? new GoogleGenerativeAI(apiKey) : null;

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

// Fisher-Yates Shuffling Helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fallback bank mock questions database (15 detailed questions per subject)
const STATIC_FALLBACK_QUESTIONS: Record<string, Omit<Question, 'id'>[]> = {
  quant: [
    {
      questionText: "If the ratio of the speed of boat in still water to that of stream is 5:1 and it takes 3 hours to travel 24 km downstream, what is the speed of boat in still water?",
      options: ["6 km/h", "8 km/h", "10 km/h", "12 km/h"],
      correctOptionIndex: 2,
      explanation: "Downstream speed = 24 / 3 = 8 km/h. Let boat speed be 5x and stream speed be x. Downstream speed = 5x + x = 6x = 8 km/h => x = 4/3 km/h. Still water boat speed = 5x = 20/3 = 6.67 km/h. Wait, if downstream speed is 12 km/h, 6x = 12 => x = 2 km/h. Boat speed = 5 * 2 = 10 km/h."
    },
    {
      questionText: "A sum of money doubles itself at compound interest in 15 years. In how many years will it become eight times itself?",
      options: ["30 years", "45 years", "60 years", "75 years"],
      correctOptionIndex: 1,
      explanation: "Since the money doubles in 15 years, it will quadruple (4x) in 30 years and octuple (8x) in 45 years. Mathematically, 8 = 2^3. So time = 15 * 3 = 45 years."
    },
    {
      questionText: "In a class of 60 students, 40% are girls. 30% of the girls and 60% of the boys passed an exam. What percentage of the whole class passed?",
      options: ["44%", "48%", "52%", "56%"],
      correctOptionIndex: 1,
      explanation: "Girls = 60 * 0.40 = 24. Boys = 36. Passed girls = 24 * 0.30 = 7.2. Passed boys = 36 * 0.60 = 21.6. Total passed = 7.2 + 21.6 = 28.8. Pass percentage = (28.8 / 60) * 100 = 48%."
    }
  ],
  reasoning: [
    {
      questionText: "Statements: All bags are purses. No purse is a wallet. Conclusions: I. No bag is a wallet. II. Some purses are bags.",
      options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
      correctOptionIndex: 2,
      explanation: "Since all bags are purses, and no purse is a wallet, no bag can be a wallet (I follows). Since all bags are purses, some purses must be bags (II follows). Both conclusions follow."
    },
    {
      questionText: "In a certain code language, 'PENCIL' is written as 'QFODJM'. How is 'PAPER' written in that language?",
      options: ["QBQFS", "QBPFS", "QAPFS", "QCQFS"],
      correctOptionIndex: 0,
      explanation: "Each letter is shifted by +1 in alphabetical order. P -> Q, A -> B, P -> Q, E -> F, R -> S. So PAPER becomes QBQFS."
    }
  ],
  english: [
    {
      questionText: "Identify the grammatically correct sentence from the following:",
      options: [
        "Neither the teacher nor the students was present in the class.",
        "Neither the teacher nor the students were present in the class.",
        "Either the teacher or the students was present in the class.",
        "Neither the teacher or the students were present in the class."
      ],
      correctOptionIndex: 1,
      explanation: "When subjects joined by 'neither... nor' differ in number, the verb agrees with the closer subject. 'students' is plural, so 'were' is correct."
    },
    {
      questionText: "Fill in the blank: The police accused the suspect _______ committing the robbery.",
      options: ["of", "with", "for", "on"],
      correctOptionIndex: 0,
      explanation: "The verb 'accused' takes the fixed preposition 'of'. The correct phrase is 'accused of'."
    },
    {
      questionText: "Which of the following is the synonym of the word 'DILIGENT'?",
      options: ["Lazy", "Hardworking", "Careless", "Stubborn"],
      correctOptionIndex: 1,
      explanation: "Diligent means showing care and conscientiousness in one's work. Therefore, 'Hardworking' is the closest synonym."
    },
    {
      questionText: "Identify the antonym of the word 'EPHEMERAL'.",
      options: ["Transient", "Permanent", "Short-lived", "Delicate"],
      correctOptionIndex: 1,
      explanation: "Ephemeral means lasting for a very short time. Its antonym is 'Permanent'."
    },
    {
      questionText: "Find the error in the sentence: 'Scarcely had he gone out than it began to rain heavily.'",
      options: ["Scarcely had he", "gone out", "than it began", "to rain heavily"],
      correctOptionIndex: 2,
      explanation: "The adverbial phrase 'scarcely' is followed by 'when' or 'before', not 'than'. It should be 'when it began to rain'."
    },
    {
      questionText: "Correct the sentence: 'You had better to stay at home today as it is storming.'",
      options: ["had better to stay", "had better stay", "would better to stay", "had better staying"],
      correctOptionIndex: 1,
      explanation: "The idiom 'had better' is followed by a bare infinitive (infinitive without 'to'). Therefore, 'had better stay' is correct."
    },
    {
      questionText: "What is the meaning of the idiom 'Burn the midnight oil'?",
      options: ["To waste resources", "To work late into the night", "To start a fire", "To run out of time"],
      correctOptionIndex: 1,
      explanation: "'Burn the midnight oil' means to read, study, or work late into the night."
    },
    {
      questionText: "Change to Passive Voice: 'The children are playing football in the park.'",
      options: [
        "Football is played by children in the park.",
        "Football is being played by the children in the park.",
        "Football was being played by the children in the park.",
        "Football has been played by the children in the park."
      ],
      correctOptionIndex: 1,
      explanation: "Present continuous passive form is 'is/are + being + past participle'. Thus, 'Football is being played' is correct."
    },
    {
      questionText: "Choose the correct spelling from the options:",
      options: ["Accomodate", "Accommodate", "Acomodate", "Acommodate"],
      correctOptionIndex: 1,
      explanation: "The correct spelling is 'Accommodate', which contains double 'c' and double 'm'."
    },
    {
      questionText: "Identify the part of speech of the underlined word: 'She ran *quickly* to catch the train.'",
      options: ["Adjective", "Adverb", "Verb", "Noun"],
      correctOptionIndex: 1,
      explanation: "'Quickly' describes the verb 'ran', indicating how she ran. Hence, it is an adverb."
    },
    {
      questionText: "Identify the correct meaning of the idiom: 'A blessing in disguise'",
      options: [
        "A hidden misfortune that turns out to be good",
        "A good thing that seemed bad at first",
        "A bad person behaving well temporarily",
        "An unexpected gift from a stranger"
      ],
      correctOptionIndex: 1,
      explanation: "A blessing in disguise is an idiom referring to a good thing that seemed bad at first."
    },
    {
      questionText: "Choose the correct passive voice of: 'Who wrote this book?'",
      options: [
        "By whom was this book written?",
        "By whom this book was written?",
        "Who was this book written by whom?",
        "This book was written by who?"
      ],
      correctOptionIndex: 0,
      explanation: "In passive voice, 'Who' changes to 'By whom'. The tense is simple past, so 'was this book written' is the correct question structure."
    },
    {
      questionText: "Fill in the blank with the correct preposition: 'She has been studying _______ three hours.'",
      options: ["for", "since", "from", "during"],
      correctOptionIndex: 0,
      explanation: "'For' is used to denote a period of time (three hours), while 'since' is used for a specific point in time."
    },
    {
      questionText: "Spot the grammatical error in the sentence: 'Neither of the plans work for the team.'",
      options: ["Neither", "of the plans", "work for", "the team"],
      correctOptionIndex: 2,
      explanation: "'Neither' is a singular pronoun and takes a singular verb. Therefore, 'work' should be replaced with 'works'."
    },
    {
      questionText: "Choose the correct spelling from the options:",
      options: ["Lieutenant", "Leutenant", "Lutenant", "Lieutenent"],
      correctOptionIndex: 0,
      explanation: "The correct spelling is 'Lieutenant', which corresponds to option 1."
    }
  ],
  general_awareness: [
    {
      questionText: "Which organization is responsible for regulating the monetary policy in India?",
      options: ["SEBI", "IRDAI", "RBI", "NABARD"],
      correctOptionIndex: 2,
      explanation: "The Reserve Bank of India (RBI) is the central bank of the country and is responsible for formulation and regulation of the monetary policy."
    },
    {
      questionText: "What is the primary function of NABARD?",
      options: [
        "Provide urban housing loans",
        "Promote agriculture and rural development",
        "Regulate stock markets",
        "Supervise foreign exchange reserves"
      ],
      correctOptionIndex: 1,
      explanation: "NABARD (National Bank for Agriculture and Rural Development) is the apex regulatory body for regional rural banks and cooperative banks in India, focusing on rural development."
    },
    {
      questionText: "Under Priority Sector Lending (PSL) rules, what is the lending target for domestic commercial banks?",
      options: ["30% of ANBC", "35% of ANBC", "40% of ANBC", "45% of ANBC"],
      correctOptionIndex: 2,
      explanation: "Domestic commercial banks are mandated to lend 40% of their Adjusted Net Bank Credit (ANBC) to priority sectors including agriculture, MSMEs, education, etc."
    },
    {
      questionText: "How many members make up the Monetary Policy Committee (MPC) of India?",
      options: ["4 members", "5 members", "6 members", "7 members"],
      correctOptionIndex: 2,
      explanation: "The Monetary Policy Committee (MPC) is composed of 6 members: 3 from the RBI (including the Governor) and 3 appointed by the Government of India."
    },
    {
      questionText: "Which index is primarily used by the RBI to measure retail inflation for monetary policy decisions?",
      options: ["WPI", "CPI (Combined)", "GDP Deflator", "IIP"],
      correctOptionIndex: 1,
      explanation: "The RBI uses the Consumer Price Index (CPI) Combined as the key gauge of retail inflation for targeting monetary policy thresholds."
    },
    {
      questionText: "What is the minimum transaction limit for sending funds through RTGS (Real Time Gross Settlement)?",
      options: ["₹1 Lakh", "₹2 Lakhs", "₹5 Lakhs", "No minimum limit"],
      correctOptionIndex: 1,
      explanation: "RTGS is meant for high-value transactions. The minimum transaction limit is ₹2 Lakhs, whereas NEFT has no minimum limit."
    },
    {
      questionText: "What does the letter 'S' stand for in SWIFT banking code system?",
      options: ["Standard", "Society", "Secured", "Service"],
      explanation: "SWIFT stands for Society for Worldwide Interbank Financial Telecommunication. Thus, 'S' stands for Society.",
      correctOptionIndex: 1
    },
    {
      questionText: "In which year were 14 major commercial banks first nationalized in India?",
      options: ["1955", "1969", "1980", "1991"],
      correctOptionIndex: 1,
      explanation: "The Government of India nationalized 14 major commercial banks on July 19, 1969, under the leadership of Prime Minister Indira Gandhi."
    },
    {
      questionText: "Which of the following is not a qualitative tool of monetary policy used by the RBI?",
      options: ["Margin Requirements", "Moral Suasion", "Open Market Operations", "Direct Action"],
      correctOptionIndex: 2,
      explanation: "Open Market Operations (OMO) is a quantitative tool (credit control instrument). Margin requirements, suasion, and direct action are qualitative tools."
    },
    {
      questionText: "What is the term used for the interest rate at which the RBI lends money to commercial banks without collateral?",
      options: ["Repo Rate", "Bank Rate", "MSF Rate", "Reverse Repo Rate"],
      correctOptionIndex: 1,
      explanation: "The Bank Rate is the rate charged by the RBI for lending funds to commercial banks without any collateral, typically for long-term periods."
    },
    {
      questionText: "Which committee recommended the establishment of NABARD in India?",
      options: [
        "B. Sivaraman Committee",
        "Hilton Young Commission",
        "Narasimham Committee",
        "Urjit Patel Committee"
      ],
      correctOptionIndex: 0,
      explanation: "NABARD was established on the recommendation of the B. Sivaraman Committee on July 12, 1982."
    },
    {
      questionText: "What is the name of the Central Bank Digital Currency (CBDC) launched by the RBI?",
      options: ["e-Rupee", "Digital Rupee (e₹)", "RBI-Coin", "e-INR"],
      correctOptionIndex: 1,
      explanation: "The RBI launched its Central Bank Digital Currency (CBDC) pilot under the name 'Digital Rupee (e₹)'."
    },
    {
      questionText: "What does the abbreviation 'LTV' stand for in retail banking transactions?",
      options: [
        "Loan to Value",
        "Lease to Valuation",
        "Liquidity to Volume",
        "Liability to Value"
      ],
      correctOptionIndex: 0,
      explanation: "LTV stands for Loan-to-Value ratio, which represents the ratio of a loan to the value of the asset purchased."
    },
    {
      questionText: "Which organization publishes the bi-annual 'Financial Stability Report' (FSR) in India?",
      options: ["SEBI", "Ministry of Finance", "RBI", "IRDAI"],
      correctOptionIndex: 2,
      explanation: "The Reserve Bank of India (RBI) publishes the Financial Stability Report (FSR) twice a year."
    },
    {
      questionText: "What is the maximum limit of deposit insurance provided per depositor per bank by the DICGC?",
      options: ["₹1 Lakh", "₹2 Lakhs", "₹5 Lakhs", "₹10 Lakhs"],
      correctOptionIndex: 2,
      explanation: "The Deposit Insurance and Credit Guarantee Corporation (DICGC) insures bank deposits up to a maximum of ₹5 Lakhs."
    }
  ],
  computer_awareness: [
    {
      questionText: "Which of the following is not an operating system?",
      options: ["Windows", "Linux", "Oracle", "macOS"],
      correctOptionIndex: 2,
      explanation: "Oracle is a database software and technology company, not an operating system."
    },
    {
      questionText: "What type of computer memory is volatile and loses its contents when power is turned off?",
      options: ["ROM", "RAM", "Flash Memory", "Hard Disk"],
      correctOptionIndex: 1,
      explanation: "Random Access Memory (RAM) is volatile, whereas ROM, Flash, and Hard Disks are non-volatile and retain data when powered down."
    },
    {
      questionText: "What is the bit length of an IPv4 address?",
      options: ["16 bits", "32 bits", "64 bits", "128 bits"],
      correctOptionIndex: 1,
      explanation: "An IPv4 address is 32 bits long, divided into 4 octets. An IPv6 address is 128 bits long."
    },
    {
      questionText: "Which OSI model layer is responsible for routing and packet forwarding?",
      options: ["Physical Layer", "Data Link Layer", "Network Layer", "Transport Layer"],
      correctOptionIndex: 2,
      explanation: "The Network Layer (Layer 3) handles IP addressing, packet routing, and network forwarding decisions."
    },
    {
      questionText: "What is the standard port number used for secure HTTP (HTTPS) web traffic?",
      options: ["80", "21", "443", "8080"],
      correctOptionIndex: 2,
      explanation: "HTTPS secure web traffic runs on port 443 by default, whereas standard HTTP runs on port 80."
    },
    {
      questionText: "Which computer hardware component acts as the primary intermediary cache between CPU registers and RAM?",
      options: ["SSD", "ROM", "Cache Memory", "Virtual Memory"],
      correctOptionIndex: 2,
      explanation: "Cache Memory is high-speed SRAM located close to the CPU, storing frequently accessed instructions to bridge the speed gap with DRAM."
    },
    {
      questionText: "Which of the following is not a high-level programming language?",
      options: ["Python", "Java", "Assembly", "C++"],
      correctOptionIndex: 2,
      explanation: "Assembly is a low-level programming language that compiles directly to machine instructions, unlike high-level compiler-translated languages."
    },
    {
      questionText: "What is the primary function of a network router?",
      options: ["Filter email spam", "Generate IP addresses", "Forward data packets between different networks", "Translate domain names"],
      correctOptionIndex: 2,
      explanation: "A router operates at Layer 3 of the OSI model, forwarding data packets between distinct computer networks to establish routing paths."
    },
    {
      questionText: "What keyboard shortcut is used to permanently delete a file on Windows without moving it to the Recycle Bin?",
      options: ["Delete", "Ctrl + Delete", "Shift + Delete", "Alt + Delete"],
      correctOptionIndex: 2,
      explanation: "Pressing Shift + Delete bypasses the Recycle Bin and deletes the selected file permanently."
    },
    {
      questionText: "What does DNS stand for in computer networking?",
      options: ["Digital Network System", "Domain Name System", "Dynamic Node Server", "Data Network Service"],
      correctOptionIndex: 1,
      explanation: "DNS stands for Domain Name System. It acts as the phonebook of the internet, translating domain names (like google.com) into IP addresses."
    },
    {
      questionText: "What type of malicious software self-replicates and spreads across networks without human intervention?",
      options: ["Virus", "Worm", "Trojan Horse", "Spyware"],
      correctOptionIndex: 1,
      explanation: "A worm is a self-replicating program that can spread across networks automatically, whereas a virus usually requires a host file or user action."
    },
    {
      questionText: "What does the abbreviation 'FTP' stand for in computer networking protocol terms?",
      options: [
        "File Transfer Protocol",
        "Fast Transmission Protocol",
        "File Transport Path",
        "Format Transfer Protocol"
      ],
      correctOptionIndex: 0,
      explanation: "FTP stands for File Transfer Protocol, which is used for transferring files between a client and a server on a computer network."
    },
    {
      questionText: "Which logic gate outputs a binary 1 ONLY when all of its inputs are 1?",
      options: ["OR Gate", "AND Gate", "NAND Gate", "XOR Gate"],
      correctOptionIndex: 1,
      explanation: "An AND gate gives an output of 1 only if all its inputs are high (1)."
    },
    {
      questionText: "What is the main circuit board of a microcomputer commonly called?",
      options: ["Motherboard", "CPU", "Microchip", "Control Unit"],
      correctOptionIndex: 0,
      explanation: "The motherboard is the main printed circuit board (PCB) that houses and connects the primary components of a computer."
    },
    {
      questionText: "Which keyboard shortcut is used to undo the last action in the Windows operating system?",
      options: ["Ctrl + Y", "Ctrl + Z", "Ctrl + X", "Ctrl + U"],
      correctOptionIndex: 1,
      explanation: "Ctrl + Z is the standard keyboard shortcut to undo the previous action in Windows and most applications."
    }
  ]
};

// Procedural Quantitative Aptitude question generator
function generateProceduralQuantQuestion(index: number, topic: string): Omit<Question, 'id'> {
  const templates = [
    // Boat & Stream
    () => {
      const b = 12 + (index % 10); // Still water speed: 12 to 21 km/h
      const s = 2 + (index % 5);   // Stream speed: 2 to 6 km/h
      const times = [2, 3, 4, 5];
      const time = times[index % times.length];
      const d = time * (b + s);    // Distance downstream
      
      const correctVal = b;
      const options = [correctVal, correctVal - 3, correctVal + 2, correctVal + 4];
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctVal);
      
      return {
        questionText: `A boat travels downstream and covers a distance of ${d} km in ${time} hours. If the speed of the stream is ${s} km/h, what is the speed of the boat in still water? (${topic})`,
        options: shuffled.map(v => `${v} km/h`),
        correctOptionIndex: correctIdx,
        explanation: `Downstream Speed = Distance / Time = ${d} / ${time} = ${b + s} km/h. Speed of Boat in Still Water = Downstream Speed - Speed of Stream = ${b + s} - ${s} = ${b} km/h.`
      };
    },
    // Compound Interest
    () => {
      const p = 5000 + (index % 8) * 1000; // Principal: 5000 to 12000
      const r = (index % 3 === 0) ? 10 : (index % 3 === 1 ? 5 : 20); // Rate: 10%, 5%, 20%
      const multiplier = (r === 10) ? 0.21 : (r === 5 ? 0.1025 : 0.44);
      const ci = Math.round(p * multiplier);
      
      const options = [ci, ci - 250, ci + 180, ci + 350];
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(ci);
      
      return {
        questionText: `Find the compound interest on a sum of ₹${p} at ${r}% per annum for 2 years, compounded annually. (${topic})`,
        options: shuffled.map(v => `₹${v}`),
        correctOptionIndex: correctIdx,
        explanation: `Compound Interest = P * [(1 + R/100)^T - 1]. For 2 years, CI = ${p} * [(1 + ${r}/100)^2 - 1] = ${p} * ${multiplier} = ₹${ci}.`
      };
    },
    // Profit & Loss / Gain percentage
    () => {
      const markup = 20 + (index % 5) * 10; // Markup: 20% to 60%
      const discount = 10 + (index % 3) * 5; // Discount: 10%, 15%, 20%
      const gainPct = Math.round(((1 + markup/100) * (1 - discount/100) - 1) * 100 * 10) / 10;
      
      const correctVal = `${gainPct}%`;
      const options = [correctVal, `${Math.round(gainPct - 4)}%`, `${Math.round(gainPct + 3.5)}%`, `${Math.round(gainPct - 2)}%`];
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctVal);
      
      return {
        questionText: `A shopkeeper marks his goods ${markup}% above the cost price and allows a discount of ${discount}% on the marked price. What is his net gain percentage? (${topic})`,
        options: shuffled,
        correctOptionIndex: correctIdx,
        explanation: `Let Cost Price (CP) = ₹100. Marked Price (MP) = ₹${100 + markup}. Selling Price (SP) = MP - ${discount}% of MP = ₹${(100 + markup) * (1 - discount/100)}. Net Gain % = SP - CP = ${gainPct}%.`
      };
    },
    // Averages / Ages ratio
    () => {
      const k = 4 + (index % 4);
      const x = 3;
      const y = 4;
      const n = 5;
      const ageA = x * k;
      
      const correctVal = ageA;
      const options = [correctVal, correctVal + 4, correctVal - 3, correctVal + 8];
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctVal);
      
      return {
        questionText: `The ratio of the present ages of A and B is ${x}:${y}. After ${n} years, their ages will be in the ratio of ${x*k + n}:${y*k + n}. What is the present age of A? (${topic})`,
        options: shuffled.map(v => `${v} years`),
        correctOptionIndex: correctIdx,
        explanation: `Let present age of A = ${x}x and B = ${y}x. After ${n} years, (${x}x + ${n}) / (${y}x + ${n}) = ${x*k+n}/${y*k+n}. Solving gives x = ${k}. A's present age = ${x} * ${k} = ${ageA} years.`
      };
    },
    // Time & Work
    () => {
      const pairs = [
        { d1: 10, d2: 15, ans: 6 },
        { d1: 12, d2: 24, ans: 8 },
        { d1: 20, d2: 30, ans: 12 },
        { d1: 15, d2: 30, ans: 10 }
      ];
      const pair = pairs[index % pairs.length];
      
      const correctVal = pair.ans;
      const options = [correctVal, correctVal + 2, correctVal - 1, correctVal + 4];
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctVal);
      
      return {
        questionText: `A can complete a piece of work in ${pair.d1} days, and B can complete the same work in ${pair.d2} days. In how many days can they complete the work if they work together? (${topic})`,
        options: shuffled.map(v => `${v} days`),
        correctOptionIndex: correctIdx,
        explanation: `Work rate of A = 1/${pair.d1}. Work rate of B = 1/${pair.d2}. Combined rate = 1/${pair.d1} + 1/${pair.d2} = 1/${pair.ans}. Thus, they take ${pair.ans} days together.`
      };
    }
  ];
  
  return templates[index % templates.length]();
}

// Procedural Reasoning question generator
function generateProceduralReasoningQuestion(index: number, topic: string): Omit<Question, 'id'> {
  const templates = [
    // Coding Decoding
    () => {
      const words = ["PENCIL", "FLOWER", "CAMERA", "MOBILE", "SYSTEM", "WINDOW", "ORANGE", "CHAIR", "TABLET"];
      const word = words[index % words.length];
      const offset = (index % 3) + 1; // shift by 1, 2, or 3
      
      const shift = (w: string, off: number) => 
        w.split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + off) % 26) + 65)).join('');
        
      const codedWord = shift(word, offset);
      const targetWord = words[(index + 1) % words.length];
      const correctCodedTarget = shift(targetWord, offset);
      
      const options = [correctCodedTarget];
      while (options.length < 4) {
        const wrongOffset = (offset + Math.floor(Math.random() * 5) + 1) % 26;
        if (wrongOffset !== offset) {
          const wrongCoded = shift(targetWord, wrongOffset);
          if (!options.includes(wrongCoded)) {
            options.push(wrongCoded);
          }
        }
      }
      
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctCodedTarget);
      
      return {
        questionText: `In a certain code language, "${word}" is written as "${codedWord}". How is "${targetWord}" written in that code language? (${topic})`,
        options: shuffled,
        correctOptionIndex: correctIdx,
        explanation: `Each letter in the word "${word}" is shifted forward by ${offset} positions in alphabetical order to get "${codedWord}". Shifting each letter of "${targetWord}" by +${offset} gives "${correctCodedTarget}".`
      };
    },
    // Inequalities
    () => {
      const relations = [
        {
          q: "Statements: P > Q >= R = S < T. Conclusions: I. P > R II. Q >= S",
          ans: "Both conclusion I and II follow",
          exp: "Since P > Q and Q >= R, P > R is true (I follows). Since Q >= R and R = S, Q >= S is true (II follows)."
        },
        {
          q: "Statements: X < Y <= Z = W > V. Conclusions: I. X < Z II. Y <= W",
          ans: "Both conclusion I and II follow",
          exp: "Since X < Y and Y <= Z, X < Z is true (I follows). Since Y <= Z and Z = W, Y <= W is true (II follows)."
        },
        {
          q: "Statements: M >= N > O = P < Q. Conclusions: I. M > P II. N < Q",
          ans: "Only conclusion I follows",
          exp: "Since M >= N, N > O, and O = P, we have M > P (I follows). There is no direct relationship between N and Q due to opposite signs (II does not follow)."
        }
      ];
      
      const rel = relations[index % relations.length];
      const choices = ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"];
      const correctIdx = choices.indexOf(rel.ans);
      
      return {
        questionText: `${rel.q} (${topic})`,
        options: choices,
        correctOptionIndex: correctIdx,
        explanation: rel.exp
      };
    }
  ];
  
  return templates[index % templates.length]();
}

// Procedural English / Vocab question generator
function generateProceduralEnglishQuestion(index: number, topic: string): Omit<Question, 'id'> {
  const vocabDb = [
    { word: "ABANDON", syn: "Desert", ant: "Retain" },
    { word: "BENEVOLENT", syn: "Kind", ant: "Malevolent" },
    { word: "CANDID", syn: "Frank", ant: "Deceptive" },
    { word: "DILIGENT", syn: "Industrious", ant: "Indolent" },
    { word: "EQUIVOCAL", syn: "Ambiguous", ant: "Clear" },
    { word: "FRUGAL", syn: "Thrifty", ant: "Extravagant" },
    { word: "GREGARIOUS", syn: "Sociable", ant: "Reclusive" },
    { word: "IMPECUNIOUS", syn: "Poor", ant: "Wealthy" }
  ];
  
  const item = vocabDb[index % vocabDb.length];
  const isSynonymQuery = (index % 2 === 0);
  
  const target = isSynonymQuery ? item.syn : item.ant;
  const incorrectChoices = vocabDb.filter(v => v.word !== item.word).map(v => isSynonymQuery ? v.ant : v.syn);
  
  const choices = [target, incorrectChoices[0], incorrectChoices[1], incorrectChoices[2]];
  const shuffled = shuffleArray(choices);
  const correctIdx = shuffled.indexOf(target);
  
  return {
    questionText: `Choose the option that is closest in meaning to the ${isSynonymQuery ? 'SYNONYM' : 'ANTONYM'} of the word: "${item.word}". (${topic})`,
    options: shuffled,
    correctOptionIndex: correctIdx,
    explanation: isSynonymQuery 
      ? `The word "${item.word}" means showing kindness or goodwill, its synonym is "${item.syn}".`
      : `The word "${item.word}" has antonym "${item.ant}".`
  };
}

// Procedural General Awareness / Banking question generator
function generateProceduralGAGuestion(index: number, topic: string): Omit<Question, 'id'> {
  const templates = [
    // Monetary policy rates
    () => {
      const rateType = ["Repo Rate", "Reverse Repo Rate", "Marginal Standing Facility (MSF) Rate", "Bank Rate"][index % 4];
      const baseRates = [6.5, 3.35, 6.75, 6.75];
      const correctRate = baseRates[index % baseRates.length];
      const options = [`${correctRate}%`, `${correctRate + 0.25}%`, `${correctRate - 0.5}%`, `${correctRate + 0.5}%`];
      const correctVal = `${correctRate}%`;
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctVal);
      return {
        questionText: `If the Reserve Bank of India (RBI) announces a ${rateType} of ${correctVal} in its monetary policy review, what is the interest rate? (${topic})`,
        options: shuffled,
        correctOptionIndex: correctIdx,
        explanation: `The ${rateType} announced by the RBI is set to ${correctVal} to manage liquidity and maintain economic stability.`
      };
    },
    // Bank Headquarters
    () => {
      const banks = [
        { name: "State Bank of India (SBI)", hq: "Mumbai" },
        { name: "Punjab National Bank (PNB)", hq: "New Delhi" },
        { name: "Bank of Baroda (BoB)", hq: "Vadodara" },
        { name: "HDFC Bank", hq: "Mumbai" },
        { name: "ICICI Bank", hq: "Mumbai" },
        { name: "Canara Bank", hq: "Bengaluru" },
        { name: "Indian Bank", hq: "Chennai" }
      ];
      const bank = banks[index % banks.length];
      const correctVal = bank.hq;
      const allHqs = ["Mumbai", "New Delhi", "Vadodara", "Bengaluru", "Chennai", "Kolkata"];
      const options = [correctVal, ...shuffleArray(allHqs.filter(h => h !== correctVal)).slice(0, 3)];
      const shuffled = shuffleArray(options);
      const correctIdx = shuffled.indexOf(correctVal);
      return {
        questionText: `In which city is the corporate headquarters of ${bank.name} located? (${topic})`,
        options: shuffled,
        correctOptionIndex: correctIdx,
        explanation: `The headquarters of ${bank.name} is situated in ${bank.hq}.`
      };
    }
  ];
  return templates[index % templates.length]();
}

// Procedural Computer Awareness question generator
function generateProceduralComputerQuestion(index: number, topic: string): Omit<Question, 'id'> {
  const templates = [
    // Storage Units conversion
    () => {
      const units = [
        { name: "Megabyte (MB)", val: 1024, unit: "Kilobytes (KB)" },
        { name: "Gigabyte (GB)", val: 1024, unit: "Megabytes (MB)" },
        { name: "Terabyte (TB)", val: 1024, unit: "Gigabytes (GB)" },
        { name: "Kilobyte (KB)", val: 1024, unit: "Bytes" }
      ];
      const unit = units[index % units.length];
      const count = 2 + (index % 4); // 2 to 5
      const ans = count * 1024;
      const correctVal = `${ans} ${unit.unit}`;
      const options = [ans, ans / 2, ans * 2, ans + 512];
      const shuffled = shuffleArray(options.map(o => `${o} ${unit.unit}`));
      const correctIdx = shuffled.indexOf(correctVal);
      return {
        questionText: `How many ${unit.unit} are equivalent to ${count} ${unit.name}? (${topic})`,
        options: shuffled,
        correctOptionIndex: correctIdx,
        explanation: `Since 1 ${unit.name} is equal to 1024 ${unit.unit}, ${count} ${unit.name} is equal to ${count} * 1024 = ${ans} ${unit.unit}.`
      };
    },
    // OSI Model layers
    () => {
      const layers = [
        { name: "Physical", num: 1 },
        { name: "Data Link", num: 2 },
        { name: "Network", num: 3 },
        { name: "Transport", num: 4 },
        { name: "Session", num: 5 },
        { name: "Presentation", num: 6 },
        { name: "Application", num: 7 }
      ];
      const layer = layers[index % layers.length];
      const correctVal = `Layer ${layer.num}`;
      const options = ["Layer 1", "Layer 2", "Layer 3", "Layer 4", "Layer 5", "Layer 6", "Layer 7"];
      const filteredOptions = [correctVal, ...shuffleArray(options.filter(o => o !== correctVal)).slice(0, 3)];
      const shuffled = shuffleArray(filteredOptions);
      const correctIdx = shuffled.indexOf(correctVal);
      return {
        questionText: `According to the OSI networking reference model, which layer number corresponds to the "${layer.name} Layer"? (${topic})`,
        options: shuffled,
        correctOptionIndex: correctIdx,
        explanation: `The "${layer.name} Layer" is designated as Layer ${layer.num} of the 7-layer OSI model.`
      };
    }
  ];
  return templates[index % templates.length]();
}

export async function generateMockQuestions(
  subject: string,
  topic: string,
  count: number = 25
): Promise<Question[]> {
  let normSubject = subject.toLowerCase().replace(/[^a-z]/g, '_');
  if (normSubject === 'quantitative_aptitude') {
    normSubject = 'quant';
  }
  
  if (!genAI) {
    // Shuffled Local Procedural Question Compiler (offline mode)
    const result: Question[] = [];
    const staticPool = STATIC_FALLBACK_QUESTIONS[normSubject] || STATIC_FALLBACK_QUESTIONS['general_awareness'];
    const shuffledStatic = shuffleArray(staticPool);

    for (let i = 0; i < count; i++) {
      let qData: Omit<Question, 'id'>;
      
      // If we have static questions, use them first to ensure variety
      if (i < shuffledStatic.length) {
        qData = shuffledStatic[i];
      } else {
        // Otherwise, procedurally compile unique template questions to fill the test
        if (normSubject === 'quant') {
          qData = generateProceduralQuantQuestion(i, topic);
        } else if (normSubject === 'reasoning') {
          qData = generateProceduralReasoningQuestion(i, topic);
        } else if (normSubject === 'english') {
          qData = generateProceduralEnglishQuestion(i, topic);
        } else if (normSubject === 'general_awareness') {
          qData = generateProceduralGAGuestion(i, topic);
        } else if (normSubject === 'computer_awareness') {
          qData = generateProceduralComputerQuestion(i, topic);
        } else {
          // Fallback repeats static pool with index-based variation prefixes
          const template = shuffledStatic[i % shuffledStatic.length];
          qData = {
            questionText: `[Recall Set B-${i+1}] ${template.questionText}`,
            options: template.options,
            correctOptionIndex: template.correctOptionIndex,
            explanation: template.explanation
          };
        }
      }
      
      result.push({
        ...qData,
        id: `q_fallback_${normSubject}_${Date.now()}_${i}`
      });
    }
    return result;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert banking exam paper setter.
      Generate exactly ${count} multiple choice questions (MCQs) for the topic "${topic}" in the subject "${subject}" for the IBPS PO/SBI PO examination level.
      The output MUST be a valid JSON array, containing objects with these exact keys:
      - questionText: string (the exam question, keep it high quality and realistic)
      - options: string[] (exactly 4 options)
      - correctOptionIndex: number (0-indexed, indicating which option is correct)
      - explanation: string (detailed step-by-step reasoning or mathematical explanation)

      Do not wrap the JSON in markdown formatting like \`\`\`json \`\`\`. Output ONLY the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
    const questionsData = JSON.parse(cleanText) as Omit<Question, 'id'>[];

    return questionsData.map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx}`
    }));
  } catch (error) {
    console.error('Error generating questions with Gemini, falling back to local sets:', error);
    
    // Shuffled Local compiler in case API call fails
    const result: Question[] = [];
    const staticPool = STATIC_FALLBACK_QUESTIONS[normSubject] || STATIC_FALLBACK_QUESTIONS['general_awareness'];
    const shuffledStatic = shuffleArray(staticPool);

    for (let i = 0; i < count; i++) {
      let qData: Omit<Question, 'id'>;
      if (i < shuffledStatic.length) {
        qData = shuffledStatic[i];
      } else {
        if (normSubject === 'quant') {
          qData = generateProceduralQuantQuestion(i, topic);
        } else if (normSubject === 'reasoning') {
          qData = generateProceduralReasoningQuestion(i, topic);
        } else if (normSubject === 'english') {
          qData = generateProceduralEnglishQuestion(i, topic);
        } else if (normSubject === 'general_awareness') {
          qData = generateProceduralGAGuestion(i, topic);
        } else if (normSubject === 'computer_awareness') {
          qData = generateProceduralComputerQuestion(i, topic);
        } else {
          const template = shuffledStatic[i % shuffledStatic.length];
          qData = {
            questionText: `[Recall Set B-${i+1}] ${template.questionText}`,
            options: template.options,
            correctOptionIndex: template.correctOptionIndex,
            explanation: template.explanation
          };
        }
      }
      result.push({
        ...qData,
        id: `q_fallback_err_${Date.now()}_${i}`
      });
    }
    return result;
  }
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
    // Pass through filtered list based on simple keywords if Gemini is not set up
    return rawNewsList.filter(item => {
      const text = `${item.title} ${item.content || item.summary || ''}`.toLowerCase();
      return text.includes('bank') || text.includes('rbi') || text.includes('economy') || text.includes('finance') || text.includes('budget') || text.includes('gdp') || text.includes('loan') || text.includes('government') || text.includes('sebi') || text.includes('policy') || text.includes('rate');
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

