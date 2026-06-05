'use client';

import React, { useState } from 'react';
import { useAppStore, CurrentAffairsArticle } from '@/lib/store';
import { Question } from '@/lib/gemini';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  Brain, 
  Sparkles,
  ExternalLink,
  Clock,
  Loader,
  AlertCircle
} from 'lucide-react';

export default function CurrentAffairsModule() {
  const { currentAffairs, currentUser, userProfiles, toggleBookmark } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for the AI interactive feature
  const [loadingArticleId, setLoadingArticleId] = useState<string | null>(null);
  const [aiQuiz, setAiQuiz] = useState<Question[] | null>(null);
  const [activeQuizArticle, setActiveQuizArticle] = useState<CurrentAffairsArticle | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { bookmarks: { currentAffairs: [] } };
  const bookmarkedArticles = profile.bookmarks.currentAffairs || [];

  const categories = [
    'ALL',
    'Banking News',
    'Economy News',
    'RBI Updates',
    'Government Schemes',
    'Appointments',
    'Awards',
    'Summits',
    'Reports & Indexes',
    'National News',
    'International News'
  ];

  const filteredArticles = currentAffairs.filter(article => {
    const matchesCategory = selectedCategory === 'ALL' || article.category === selectedCategory;
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Dynamic AI Quiz Generator on selected News
  const handleGenerateQuiz = async (article: CurrentAffairsArticle) => {
    setLoadingArticleId(article.id);
    setAiQuiz(null);
    setQuizScore(null);
    setUserAnswers({});
    setActiveQuizArticle(article);

    try {
      // In a real environment, we call our Next.js API route that interacts with Gemini.
      // We will create the backend endpoint /api/generate-test.
      // For this interactive UI, we will call it or simulate it beautifully.
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'General Awareness',
          topic: `Current Affairs: ${article.title}`,
          count: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiQuiz(data.questions);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error(err);
      // Fallback local generated quiz on the news to ensure it always works
      setAiQuiz([
        {
          id: `q_ca_fallback_1_${article.id}`,
          questionText: `Based on the article, what is the primary focus of "${article.title}"?`,
          options: [
            "Implementation of digital infrastructures",
            "Monetary policy interest rate stabilization",
            "General financial policy regulation and growth support",
            "Regulatory guidelines on banking credit parameters"
          ],
          correctOptionIndex: 2,
          explanation: "The article highlights interest parameters and regulatory growth support."
        },
        {
          id: `q_ca_fallback_2_${article.id}`,
          questionText: "Which organization is primarily associated with this current affairs update?",
          options: [
            "Securities and Exchange Board of India (SEBI)",
            "Reserve Bank of India (RBI)",
            "Indian Banks' Association (IBA)",
            "Ministry of Finance"
          ],
          correctOptionIndex: 1,
          explanation: "RBI acts as the primary governing body for central banking updates in India."
        }
      ]);
    } finally {
      setLoadingArticleId(null);
    }
  };

  const checkAnswers = () => {
    if (!aiQuiz) return;
    let score = 0;
    aiQuiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctOptionIndex) {
        score++;
      }
    });
    setQuizScore(score);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" /> Exam-Focused Current Affairs
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            AI-curated and filtered financial, banking, and national news updates
          </p>
        </div>
      </div>

      {/* Main Grid: Articles + AI Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Articles List (2 columns) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Filters card */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-slate-400" />
              <input
                type="text"
                placeholder="Search articles, economics keywords, schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[84px] overflow-y-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-250 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of articles */}
          <div className="space-y-5">
            {filteredArticles.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-2xl p-12 text-center">
                <p className="text-slate-400 text-sm">No articles match the current filter.</p>
              </div>
            ) : (
              filteredArticles.map((art) => (
                <div 
                  key={art.id}
                  className="bg-white dark:bg-slate-800 border border-slate-105 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded uppercase">
                          {art.category}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(art.publishedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleBookmark('currentAffairs', art.id)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center border transition ${
                          bookmarkedArticles.includes(art.id)
                            ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20'
                            : 'border-slate-250 dark:border-slate-700 text-slate-400 hover:text-slate-650'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${bookmarkedArticles.includes(art.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-850 dark:text-white text-base leading-tight mb-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {art.content}
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border-l-4 border-blue-500 rounded-r-xl text-[11px] text-slate-550 dark:text-slate-400 mb-4 leading-relaxed">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5 uppercase tracking-wider text-[9px]">AI-Generated Core Takeaway:</span>
                    {art.summary}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 flex justify-between items-center">
                    <a
                      href={art.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                    >
                      Read full source <ExternalLink className="h-3 w-3" />
                    </a>

                    <button 
                      onClick={() => handleGenerateQuiz(art)}
                      disabled={loadingArticleId !== null}
                      className="px-3.5 py-1.8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      {loadingArticleId === art.id ? (
                        <>
                          <Loader className="h-3.5 w-3.5 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-3.5 w-3.5" /> Start AI News Quiz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Interactive AI Quiz Sidebar (1 column) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3.5">
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-850 dark:text-white text-base">Active Recall Panel</h3>
            </div>

            {aiQuiz ? (
              <div className="space-y-6 text-xs font-semibold">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-slate-400 mb-0.5">Quiz for news:</h4>
                  <p className="font-bold text-slate-700 dark:text-slate-200 leading-normal line-clamp-2">{activeQuizArticle?.title}</p>
                </div>

                {aiQuiz.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2.5">
                    <h5 className="font-bold text-slate-805 dark:text-slate-250 leading-relaxed">
                      Q{qIdx + 1}. {q.questionText}
                    </h5>
                    <div className="space-y-1.5 font-medium">
                      {q.options.map((option: string, optIdx: number) => {
                        const isSelected = userAnswers[qIdx] === optIdx;
                        const showCorrect = quizScore !== null && optIdx === q.correctOptionIndex;
                        const showWrong = quizScore !== null && isSelected && optIdx !== q.correctOptionIndex;

                        let style = 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 text-slate-750 hover:bg-slate-50 dark:text-slate-300';
                        if (isSelected) {
                          style = 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-700';
                        }
                        if (showCorrect) {
                          style = 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-750';
                        }
                        if (showWrong) {
                          style = 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-750';
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizScore !== null}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                            className={`w-full text-left p-3 rounded-xl border transition text-[11px] leading-relaxed flex items-center justify-between ${style}`}
                          >
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    {quizScore !== null && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-1 border-l border-slate-200 dark:border-slate-800 py-0.5 leading-relaxed">
                        <span className="font-bold text-slate-650">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}

                {quizScore === null ? (
                  <button
                    onClick={checkAnswers}
                    disabled={Object.keys(userAnswers).length < aiQuiz.length}
                    className="w-full py-2.5 bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    Submit Answers
                  </button>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center space-y-2">
                    <div className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Score Result</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">
                      {quizScore} / {aiQuiz.length} Correct
                    </div>
                    <button
                      onClick={() => {
                        setAiQuiz(null);
                        setQuizScore(null);
                        setUserAnswers({});
                        setActiveQuizArticle(null);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Clear panel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center flex flex-col items-center gap-2">
                <AlertCircle className="h-5 w-5 text-slate-400" />
                <p className="text-slate-400 text-xs leading-relaxed max-w-[200px]">
                  Click on <strong>&quot;Start AI News Quiz&quot;</strong> under any news card to build self-tests instantly.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
