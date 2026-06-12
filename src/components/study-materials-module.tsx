'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, Handnote } from '@/lib/store';
import { 
  BookMarked, 
  BookOpen, 
  Video, 
  Download, 
  HelpCircle, 
  Bookmark,
  ExternalLink,
  Heart,
  Loader,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Award,
  Sparkles,
  FileText
} from 'lucide-react';

// Sample content database for dynamic Reading Mode simulation (to avoid blank screens or CSP iframe blocks)
const SIMULATED_PAPERS_CONTENT: Record<string, string[]> = {
  'pyp_1': [
    "--- SECTION I: QUANTITATIVE APTITUDE ---\n\nQ1. A man can row 6 km/h in still water. If the speed of the current is 2 km/h, it takes him 3 hours to row to a place and come back. How far is the place?\nOptions:\n(a) 8 km  (b) 6 km  (c) 12 km  (d) 10 km\n\nExplanation:\nDownstream speed = 6 + 2 = 8 km/h\nUpstream speed = 6 - 2 = 4 km/h\nLet distance be d. d/8 + d/4 = 3 => 3d/8 = 3 => d = 8 km. (Correct Option: a)",
    "Q2. A sum of money doubles itself at compound interest in 15 years. In how many years will it become 8 times?\nOptions:\n(a) 30 years  (b) 45 years  (c) 60 years  (d) 75 years\n\nExplanation:\nSince the money doubles in 15 years, it will quadruple (4x) in 30 years and octuple (8x) in 45 years (2^3 = 8 => 3 * 15 = 45 years). (Correct Option: b)",
    "--- SECTION II: REASONING Ability ---\n\nQ3. Statements: All doors are keys. Some keys are locks.\nConclusions:\nI. Some doors are locks is a possibility.\nII. No lock is a door.\nOptions:\n(a) Only I follows  (b) Only II follows  (c) Both I and II follow  (d) Neither follows\n\nExplanation:\nSince there is no direct negative relation between doors and locks, the possibility in Conclusion I is always true. Conclusion II is not definitely true. (Correct Option: a)"
  ],
  'pyp_2': [
    "--- SECTION I: ENGLISH LANGUAGE ---\n\nQ1. Direction: Spot the error in the sentence: 'Scarcely had he gone out than it began to rain heavily.'\nOptions:\n(a) Scarcely had he  (b) gone out  (c) than it began  (d) to rain heavily\n\nExplanation:\nThe adverbial phrase 'scarcely' must be followed by 'when' or 'before' instead of 'than'. Thus, option (c) is incorrect. (Correct Option: c)",
    "Q2. Fill in the blank: The accused was charge _______ committing the bank robbery.\nOptions:\n(a) with  (b) of  (c) for  (d) on\n\nExplanation:\nThe verb 'charged' takes the preposition 'with'. Option (a) is correct. (Correct Option: a)"
  ],
  'pyp_3': [
    "--- SECTION I: GENERAL AWARENESS ---\n\nQ1. What is the primary function of the Reserve Bank of India's Monetary Policy Committee (MPC)?\nOptions:\n(a) Regulate Stock Markets  (b) Formulate monetary policy rates like repo rate\n(c) Issue currency banknotes  (d) Audit public sector banks\n\nExplanation:\nMPC is primarily responsible for setting the benchmark interest rates (Repo, Reverse Repo) to control inflation while supporting growth. (Correct Option: b)",
    "Q2. SWIFT banking network's first letter 'S' stands for:\nOptions:\n(a) Secured  (b) Standard  (c) Society  (d) Systems\n\nExplanation:\nSWIFT stands for Society for Worldwide Interbank Financial Telecommunication. (Correct Option: c)"
  ],
  'mod_1': [
    "--- SBI PO 2026 MODEL TEST 1 (MAINS) ---\n\nQ1. A, B, and C started a business with investments in the ratio 4:5:6. After 6 months, C withdrew half of his capital. If the total annual profit is Rs. 48,000, find the share of C.\nOptions:\n(a) Rs. 16,000  (b) Rs. 15,000  (c) Rs. 14,400  (d) Rs. 18,000\n\nExplanation:\nRatio of shares:\nA: 4 * 12 = 48\nB: 5 * 12 = 60\nC: (6 * 6) + (3 * 6) = 36 + 18 = 54\nRatio = 48 : 60 : 54 => 8 : 10 : 9\nC's share = 9/27 * 48000 = Rs. 16,000. (Correct Option: a)"
  ],
  'mod_2': [
    "--- IBPS PO 2026 PRELIMS MODEL PAPER ---\n\nQ1. If x^2 - 7x + 12 = 0 and y^2 - 9y + 20 = 0, establish the relation between x and y.\nOptions:\n(a) x < y  (b) x > y  (c) x <= y  (d) x >= y\n\nExplanation:\nx factors: (x-3)(x-4) = 0 => x = 3, 4\ny factors: (y-4)(y-5) = 0 => y = 4, 5\nComparing x and y, x is always less than or equal to y (x <= y). (Correct Option: c)"
  ],
  'mod_3': [
    "--- RBI GRADE B 2026 PHASE I MODEL ---\n\nQ1. Under Priority Sector Lending (PSL) guidelines, what percentage of ANBC must domestic commercial banks lend to agriculture?\nOptions:\n(a) 18%  (b) 10%  (c) 40%  (d) 7.5%\n\nExplanation:\nWithin the 40% overall PSL target, domestic commercial banks are mandated to allocate 18% of ANBC to agriculture. (Correct Option: a)"
  ]
};

export default function StudyMaterialsModule() {
  const { roadmapStructure, currentUser, userProfiles, toggleBookmark, toggleLikeFormula, setActiveTestTopic } = useAppStore();
  const [activeTab, setActiveTab] = useState<'Syllabus' | 'PYP' | 'Model' | 'Cheatcodes'>('Syllabus');
  const [activeSubject, setActiveSubject] = useState<'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'>('Quantitative Aptitude');

  // Reading Mode States
  const [readingDoc, setReadingDoc] = useState<{ id: string; title: string; type: string; content: string[] } | null>(null);
  const [readingTheme, setReadingTheme] = useState<'sepia' | 'light' | 'dark'>('sepia');
  const [fontSize, setFontSize] = useState<number>(14);
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Dynamic Handnotes/Cheatcodes States
  const [dynamicHandnotes, setDynamicHandnotes] = useState<Handnote[]>([]);
  const [loadingHandnotes, setLoadingHandnotes] = useState<boolean>(false);
  const [pageHandnotes, setPageHandnotes] = useState<number>(1);

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { bookmarks: { roadmapTopics: [] }, likedFormulas: [] };
  const bookmarkedTopics = profile.bookmarks.roadmapTopics || [];
  const likedFormulas = profile.likedFormulas || [];

  const subjects: ('Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness')[] = [
    'Quantitative Aptitude',
    'Reasoning',
    'English',
    'General Awareness',
    'Computer Awareness'
  ];

  // Fetch initial dynamic handnotes on subject or tab change
  useEffect(() => {
    if (activeTab === 'Cheatcodes') {
      setDynamicHandnotes([]);
      setPageHandnotes(1);
      fetchDynamicHandnotes(activeSubject, true);
    }
  }, [activeTab, activeSubject]);

  const fetchDynamicHandnotes = async (subject: string, reset = false) => {
    setLoadingHandnotes(true);
    try {
      const response = await fetch('/api/generate-handnotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, count: 5 })
      });
      if (response.ok) {
        const data = await response.json();
        setDynamicHandnotes(prev => reset ? data.handnotes : [...prev, ...data.handnotes]);
        setPageHandnotes(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error fetching handnotes:', err);
    } finally {
      setLoadingHandnotes(false);
    }
  };

  // Syllabus Notes List
  const currentTopics = roadmapStructure.filter(t => t.subject === activeSubject);

  const subjectBooks: Record<string, string[]> = {
    'Quantitative Aptitude': [
      'Quantitative Aptitude by R.S. Aggarwal',
      'Fast Track Objective Arithmetic by Rajesh Verma'
    ],
    'Reasoning': [
      'A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal',
      'Analytical Reasoning by M.K. Pandey'
    ],
    'English': [
      'Objective General English by S.P. Bakshi',
      'Word Power Made Easy by Norman Lewis'
    ],
    'General Awareness': [
      'Lucent General Knowledge',
      'Arihant General Knowledge'
    ],
    'Computer Awareness': [
      'Objective Computer Awareness by Arihant'
    ]
  };

  // PYP and Model Paper static arrays
  const pyPapers = [
    { id: 'pyp_1', title: 'SBI PO 2025 Preliminary Exam Paper (with Solutions)', url: 'https://bank.sbi/careers/po2025_solutions.pdf', size: '2.4 MB', year: '2025' },
    { id: 'pyp_2', title: 'IBPS PO 2024 Preliminary Exam Paper (with Solutions)', url: 'https://www.ibps.in/wp-content/uploads/PO_XIV_2024_solutions.pdf', size: '2.1 MB', year: '2024' },
    { id: 'pyp_3', title: 'RBI Grade B 2025 Phase I Memory-Based Paper', url: 'https://www.rbi.org.in/careers/gradeb2025_paper.pdf', size: '3.1 MB', year: '2025' }
  ];

  const modelPapers = [
    { id: 'mod_1', title: 'SBI PO 2026 Model Practice Paper 1 (Mains Standard)', url: 'https://bank.sbi/careers/po2026_model1.pdf', size: '1.8 MB', difficulty: 'Hard' },
    { id: 'mod_2', title: 'IBPS PO 2026 Model Practice Paper 1 (Prelims Standard)', url: 'https://www.ibps.in/wp-content/uploads/PO_XIV_Model1.pdf', size: '1.5 MB', difficulty: 'Medium' },
    { id: 'mod_3', title: 'RBI Grade B 2026 Phase I Model Paper', url: 'https://www.rbi.org.in/careers/gradeb2026_model.pdf', size: '2.8 MB', difficulty: 'Extremely Hard' }
  ];

  // Start reading mode
  const handleReadOnline = (id: string, title: string, type: string, notesContent?: string) => {
    let pages = ["No content available."];
    if (notesContent) {
      // Split notes into paragraphs as pages
      pages = notesContent.split('\n\n').filter(p => p.trim());
    } else {
      pages = SIMULATED_PAPERS_CONTENT[id] || ["Simulated Exam Paper content - Page 1\n\nNo PDF viewer plugin loaded."];
    }

    setReadingDoc({
      id,
      title,
      type,
      content: pages
    });
    setCurrentPage(0);
  };

  const handleStartPracticeTest = () => {
    if (!readingDoc) return;
    setReadingDoc(null);
    // Redirect to mock tests with active topic set
    setActiveTestTopic({
      subject: activeSubject,
      topic: readingDoc.title.includes('Level') ? 'Syllabus Chapter' : readingDoc.title
    });
  };

  // Render Inline Document Reader (Reading Mode)
  if (readingDoc) {
    const themeStyles = 
      readingTheme === 'sepia' 
        ? 'bg-amber-50/70 text-amber-900 border-amber-200' 
        : readingTheme === 'dark'
        ? 'bg-slate-900 text-slate-100 border-slate-800'
        : 'bg-white text-slate-800 border-slate-200';

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans flex flex-col justify-between">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
          <button 
            onClick={() => setReadingDoc(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Exit Reading Mode
          </button>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Theme picker */}
            <div className="flex p-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold">
              {(['sepia', 'light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setReadingTheme(t)}
                  className={`px-2.5 py-1.5 rounded-lg capitalize cursor-pointer ${
                    readingTheme === t 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Font size zoom */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-xl">
              <button onClick={() => setFontSize(prev => Math.max(11, prev - 1))} className="p-1 text-slate-500 hover:bg-slate-50 rounded"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="text-[10px] font-bold w-6 text-center text-slate-650 dark:text-slate-300">{fontSize}px</span>
              <button onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="p-1 text-slate-500 hover:bg-slate-50 rounded"><ZoomIn className="h-3.5 w-3.5" /></button>
            </div>

            <button
              onClick={handleStartPracticeTest}
              className="px-3.5 py-1.8 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 cursor-pointer transition shadow"
            >
              <Award className="h-3.5 w-3.5" /> Start Practice Test
            </button>
          </div>
        </div>

        {/* Reading Pane */}
        <div className={`flex-1 border rounded-2xl p-6 md:p-8 font-serif leading-relaxed max-w-3xl mx-auto w-full transition shadow-md ${themeStyles}`} style={{ fontSize: `${fontSize}px` }}>
          <div className="mb-6 pb-3 border-b border-current/20 flex justify-between items-start text-xs font-sans font-bold uppercase tracking-wider opacity-60">
            <span>{readingDoc.type} Document</span>
            <span>Page {currentPage + 1} of {readingDoc.content.length}</span>
          </div>

          <h3 className="font-sans font-bold text-xl md:text-2xl mb-6 leading-tight border-b border-current/10 pb-4">
            {readingDoc.title}
          </h3>

          <div className="whitespace-pre-wrap font-medium">
            {readingDoc.content[currentPage]}
          </div>
        </div>

        {/* Page navigation footer */}
        <div className="max-w-3xl mx-auto w-full flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
          <button 
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            Previous
          </button>
          <span>Page {currentPage + 1} of {readingDoc.content.length}</span>
          <button 
            disabled={currentPage === readingDoc.content.length - 1}
            onClick={() => setCurrentPage(prev => Math.min(readingDoc.content.length - 1, prev + 1))}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            Next Page
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      
      {/* Header section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BookMarked className="h-6 w-6 text-blue-600" /> Syllabus Study Materials
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Subject-wise handnotes, dynamic AI cheatcodes, mock model papers, and previous year papers
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-bold mb-6 overflow-x-auto w-full md:w-max">
        {(['Syllabus', 'PYP', 'Model', 'Cheatcodes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab === 'Syllabus' ? 'Syllabus Notes' : tab === 'PYP' ? 'Previous Year Papers' : tab === 'Model' ? 'Model Practice Papers' : 'Cheatcodes & Handnotes'}
          </button>
        ))}
      </div>

      {/* Subject Filter Tabs (Always visible for subject indexing) */}
      {activeTab !== 'PYP' && activeTab !== 'Model' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubject(sub)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                activeSubject === sub
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* TAB CONTENT RENDERING */}

      {activeTab === 'Syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Core Topics List (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {currentTopics.map((topic) => (
              <div 
                key={topic.id}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-150"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-805 dark:text-white text-base leading-tight mb-1">
                      {topic.name}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Topic Level: Chapter {topic.level}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReadOnline(topic.id, topic.name, 'Syllabus Notes', topic.notes)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer"
                    >
                      Read Online
                    </button>
                    <button
                      onClick={() => toggleBookmark('roadmapTopics', topic.id)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition border ${
                        bookmarkedTopics.includes(topic.id)
                          ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-755 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${bookmarkedTopics.includes(topic.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Core Revision Notes:</h4>
                    <p className="text-xs text-slate-605 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/35 p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-850 line-clamp-2">
                      {topic.notes}
                    </p>
                  </div>

                  {/* Additional Helpers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Videos */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-blue-500" /> Video Tutorials
                      </h5>
                      <div className="space-y-1.5">
                        {topic.videoLinks.map((vid, idx) => (
                          <a
                            key={idx}
                            href={vid.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-605 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-900 transition font-bold"
                          >
                            <span className="truncate max-w-[150px]">{vid.title}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Practice Info */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-green-500" /> Practical Resources
                      </h5>
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-900/35 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-550 flex flex-col justify-between h-[52px]">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-500">Practice questions:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{topic.practiceQuestionsCount} problems</span>
                        </div>
                        <span className="text-[9px] text-slate-450 font-medium">Standard exam complexity syllabus matching.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Books List (1 Column) */}
          <div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24">
              <h3 className="font-bold text-slate-850 dark:text-white text-base mb-3.5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" /> Recommended Books
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Standard study curriculum suggested by top teachers and qualifiers for the banking examinations.
              </p>

              <div className="space-y-3.5">
                {subjectBooks[activeSubject].map((book, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                    <div className="text-xs font-bold text-slate-705 dark:text-slate-200 leading-snug">
                      {book}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50/40 dark:bg-slate-900/20 rounded-2xl border border-blue-100/50 dark:border-slate-800/50 text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                Available at standard e-commerce stores. Verify updated editions for current patterns.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIOUS YEAR PAPERS TAB */}
      {activeTab === 'PYP' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pyPapers.map((paper) => (
            <div 
              key={paper.id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold rounded uppercase">
                    Year: {paper.year}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{paper.size}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight mb-4 flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" /> {paper.title}
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReadOnline(paper.id, paper.title, 'Previous Year Paper')}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-55 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Read Online
                </button>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition shadow"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODEL PRACTICE PAPERS TAB */}
      {activeTab === 'Model' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelPapers.map((paper) => (
            <div 
              key={paper.id} 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold rounded uppercase">
                    Difficulty: {paper.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{paper.size}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight mb-4 flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" /> {paper.title}
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReadOnline(paper.id, paper.title, 'Model Practice Paper')}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-55 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Read Online
                </button>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition shadow"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DYNAMIC CHEATCODES & HANDNOTES TAB */}
      {activeTab === 'Cheatcodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Handnotes Grid List (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-750 dark:text-white text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blue-550" /> Dynamic Formula Flashcards
              </h3>
              <button 
                onClick={() => fetchDynamicHandnotes(activeSubject, true)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Randomize Formulas
              </button>
            </div>

            {dynamicHandnotes.length === 0 && loadingHandnotes ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 text-xs">
                <Loader className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                <span>Generating dynamic handnotes via AI...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicHandnotes.map((hn) => {
                  const isLiked = likedFormulas.some(f => f.id === hn.id);
                  return (
                    <div 
                      key={hn.id} 
                      className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2.5">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-extrabold rounded uppercase tracking-wider">
                            Topic: {hn.topic}
                          </span>
                          <button
                            onClick={() => toggleLikeFormula(hn)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition ${
                              isLiked 
                                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-550'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                          </button>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-white leading-snug mb-2">
                          {hn.title}
                        </h4>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed whitespace-pre-line mb-3">
                          {hn.content}
                        </div>
                      </div>

                      {hn.shortcut && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-start gap-1">
                          <span className="text-blue-600 dark:text-blue-400 uppercase font-extrabold text-[8px] mt-0.5 mr-1 flex-shrink-0">Shortcut Tip:</span>
                          <span className="leading-normal">{hn.shortcut}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Infinite Load More button */}
                <div className="pt-4 text-center">
                  <button
                    onClick={() => fetchDynamicHandnotes(activeSubject, false)}
                    disabled={loadingHandnotes}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer transition shadow"
                  >
                    {loadingHandnotes ? (
                      <>
                        <Loader className="h-3.5 w-3.5 animate-spin" /> Compiling more notes...
                      </>
                    ) : (
                      <>
                        Load More Dynamic Cheatcodes (Page {pageHandnotes})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Cheat Sheet Sidebar (1 Column) */}
          <div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24 space-y-4">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Saved Cheat Sheet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Your custom revision sheet. Click the heart on any card to save it for immediate access.
                </p>
              </div>

              {likedFormulas.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                  No liked formulas yet.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {likedFormulas.map((f) => (
                    <div 
                      key={f.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl relative group"
                    >
                      <div className="flex justify-between items-start gap-3 mb-1.5">
                        <span className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {f.subject.split(' ')[0]}
                        </span>
                        <button
                          onClick={() => toggleLikeFormula(f)}
                          className="text-rose-550 opacity-80 hover:opacity-100 transition absolute top-2.5 right-2.5"
                        >
                          <Heart className="h-3.5 w-3.5 fill-rose-550 text-rose-500" />
                        </button>
                      </div>
                      <h4 className="font-bold text-xs text-slate-750 dark:text-slate-250 leading-snug mb-1 pr-6">{f.title}</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 line-clamp-2 leading-relaxed">{f.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
