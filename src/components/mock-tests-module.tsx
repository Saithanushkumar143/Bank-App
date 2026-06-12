'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore, MockTestHistory, getMilestoneInfo } from '@/lib/store';
import { generateMockQuestions, Question } from '@/lib/gemini';
import { 
  Award, 
  Lock, 
  Unlock, 
  Play, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  BrainCircuit,
  Loader
} from 'lucide-react';

export default function MockTestsModule() {
  const { 
    currentUser, 
    userProfiles, 
    submitMockTestResult,
    activeTestTopic,
    setActiveTestTopic,
    roadmapStructure
  } = useAppStore();
  
  const email = currentUser?.email || '';
  const profile = userProfiles[email] || {
    unlockedLevels: { 
      'Full-Length': 1, 
      'Quantitative Aptitude': 1, 
      'Reasoning': 1,
      'English': 1,
      'General Awareness': 1,
      'Computer Awareness': 1
    },
    mockTestHistory: []
  };

  // Test type and active category/subject
  const [activeTestType, setActiveTestType] = useState<'Full-Length' | 'Subject' | 'Topic'>('Full-Length');
  const [activeCategory, setActiveCategory] = useState<'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'>('Quantitative Aptitude');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // Exam taking state
  const [isExamActive, setIsExamActive] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentTestConfig, setCurrentTestConfig] = useState<{
    type: 'Full-Length' | 'Subject' | 'Topic';
    subject?: string;
    topic?: string;
    level?: number;
  } | null>(null);
  
  // Timer & runner state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [runnerSectionFilter, setRunnerSectionFilter] = useState<'ALL' | 'Quant' | 'Reasoning' | 'English' | 'GA' | 'Computer'>('ALL');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Result display state
  const [examResult, setExamResult] = useState<{
    scorePct: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattemptedQuestions: number;
    timeSpentSeconds: number;
    isCleared: boolean;
  } | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);

  // Sync test selection from store if redirected from roadmap
  useEffect(() => {
    if (activeTestTopic) {
      const topic = activeTestTopic;
      setActiveTestTopic(null);
      setTimeout(() => {
        setActiveTestType('Topic');
        setActiveCategory(topic.subject as 'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness');
        setSelectedTopic(topic.topic);
      }, 0);
    }
  }, [activeTestTopic, setActiveTestTopic]);

  const unlockedLevel = activeTestType === 'Full-Length' 
    ? (profile.unlockedLevels['Full-Length'] || 1)
    : (profile.unlockedLevels[activeCategory] || 1);

  const milestone = getMilestoneInfo(unlockedLevel);
  const levelsCount = Math.max(10, unlockedLevel + 2);
  const levels = Array.from({ length: levelsCount }, (_, i) => i + 1); // Open-ended levels based on progress

  const availableTopics = roadmapStructure.filter(t => t.subject === activeCategory);

  // Automatically set selected topic if none selected for active subject
  useEffect(() => {
    if (availableTopics.length > 0 && !availableTopics.some(t => t.name === selectedTopic)) {
      const defaultTopic = availableTopics[0].name;
      setTimeout(() => {
        setSelectedTopic(defaultTopic);
      }, 0);
    }
  }, [activeCategory, availableTopics, selectedTopic]);

  const handleStartExam = async (options: {
    type: 'Full-Length' | 'Subject' | 'Topic';
    subject?: string;
    topic?: string;
    level?: number;
  }) => {
    const levelParam = options.level || 1;
    setSelectedLevel(levelParam);
    setSelectedTopic(options.topic || '');
    setCurrentTestConfig(options);
    setLoadingQuestions(true);
    setIsExamActive(false);
    setExamResult(null);
    setAnswers({});
    setMarkedForReview([]);
    setCurrentQuestionIndex(0);
    setRunnerSectionFilter('ALL');
    
    // 60 minutes for 100-Q Full-Length, 20 minutes for 25-Q Subject/Topic tests
    const durationSeconds = options.type === 'Full-Length' ? 3600 : 1200;
    setTimeLeft(durationSeconds);

    if (options.type === 'Full-Length') {
      try {
        const subjectsList = [
          { name: 'Quantitative Aptitude', count: 30, code: 'Quant' },
          { name: 'Reasoning', count: 30, code: 'Reasoning' },
          { name: 'English', count: 20, code: 'English' },
          { name: 'General Awareness', count: 10, code: 'GA' },
          { name: 'Computer Awareness', count: 10, code: 'Computer' }
        ];

        // Concurrently fetch each subject's questions
        const fetchPromises = subjectsList.map(async (sub) => {
          const res = await fetch('/api/generate-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: sub.name,
              topic: `Level ${levelParam} Full-Length Mock`,
              count: sub.count,
              level: levelParam
            })
          });
          if (!res.ok) throw new Error(`Failed to fetch ${sub.name}`);
          const data = await res.json();
          return data.questions.map((q: any) => ({ ...q, subject: sub.code }));
        });

        const results = await Promise.all(fetchPromises);
        const mergedQuestions = results.flat();
        
        if (mergedQuestions.length > 0) {
          setQuestions(mergedQuestions);
          setIsExamActive(true);
        } else {
          throw new Error('No questions generated');
        }
      } catch (err) {
        console.error('Error starting Full-Length exam, using offline fallback', err);
        const fallbackQs = await generateMockQuestions('Full-Length', `Level ${levelParam} Mock Test`, 100, levelParam);
        setQuestions(fallbackQs);
        setIsExamActive(true);
      } finally {
        setLoadingQuestions(false);
      }
      return;
    }

    // Single-Subject or Topic test (25 questions)
    const subjectParam = options.type === 'Topic' ? (options.subject || 'Quantitative Aptitude') : (options.subject || 'Quantitative Aptitude');
    const topicParam = options.type === 'Topic' ? (options.topic || '') : `Level ${levelParam} Mock Test`;

    try {
      const response = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subjectParam,
          topic: topicParam,
          count: 25,
          level: levelParam
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setIsExamActive(true);
      } else {
        throw new Error('Failed to fetch from server');
      }
    } catch (err) {
      console.error('Error starting exam, using client side backup questions', err);
      // Fallback local generator in case API server fails
      const fallbackQs = await generateMockQuestions(subjectParam, topicParam, 25, levelParam);
      setQuestions(fallbackQs);
      setIsExamActive(true);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentTestConfig) return;

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    questions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (userAns === undefined) {
        unattempted++;
      } else if (userAns === q.correctOptionIndex) {
        correct++;
      } else {
        wrong++;
      }
    });

    const scorePct = Math.round((correct / questions.length) * 100);
    const timeSpentSeconds = 1200 - timeLeft;
    const isCleared = scorePct >= 60; // 60% passing

    const resultSummary = {
      scorePct,
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattemptedQuestions: unattempted,
      timeSpentSeconds,
      isCleared
    };

    setExamResult(resultSummary);
    setIsExamActive(false);

    // Save mock test result to store
    submitMockTestResult({
      testId: `test_${Date.now()}`,
      title: currentTestConfig.type === 'Topic' 
        ? `${currentTestConfig.topic} Topic Quiz` 
        : `${currentTestConfig.type === 'Full-Length' ? 'Full-Length' : currentTestConfig.subject} Level ${currentTestConfig.level} Exam`,
      type: currentTestConfig.type,
      subject: currentTestConfig.subject,
      topic: currentTestConfig.topic,
      scorePct,
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattemptedQuestions: unattempted,
      timeSpentSeconds,
      isCleared
    });
  }, [questions, answers, timeLeft, currentTestConfig, submitMockTestResult]);

  const handleAutoSubmit = useCallback(() => {
    submitExam();
  }, [submitExam]);

  // Start Timer when exam starts
  useEffect(() => {
    if (isExamActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamActive, timeLeft, handleAutoSubmit]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleRetake = () => {
    if (currentTestConfig) {
      handleStartExam(currentTestConfig);
    }
  };

  const handleBackToMenu = () => {
    setExamResult(null);
    setShowSolutions(false);
  };

  const subjectsList = [
    'Quantitative Aptitude',
    'Reasoning',
    'English',
    'General Awareness',
    'Computer Awareness'
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      
      {/* Dynamic Loader Panel */}
      {loadingQuestions && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-50 p-6 text-center">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-sm flex flex-col items-center">
            <Loader className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2 justify-center">
              <BrainCircuit className="h-5 w-5 text-indigo-400" /> Compiling AI Test Pool
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini is dynamically generating 25 exam-style MCQs for {selectedTopic || (activeTestType === 'Full-Length' ? 'Full-Length' : activeCategory)} Mock Test. Please wait.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {!isExamActive && !examResult ? (
        // Level / Test Selection Screen
        <>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" /> Mock Test Prep Center
                </h2>
                {/* Milestone Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${milestone.color} shadow-sm transition`}>
                  <span>{milestone.badge}</span>
                  <span>{milestone.rank}</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                Lock and unlock exam levels by scoring 60% or higher. Take topic-specific quizzes procedurally compiled by AI.
              </p>
            </div>

            {/* Test Type selector */}
            <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold w-full md:w-auto overflow-x-auto">
              {(['Full-Length', 'Subject', 'Topic'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTestType(type)}
                  className={`px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer flex-1 md:flex-none ${
                    activeTestType === type
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {type === 'Full-Length' ? 'Full-Length' : type === 'Subject' ? 'Subject Tests' : 'Topic Tests'}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-selectors (Subject picker for Subject & Topic Tests) */}
          {activeTestType !== 'Full-Length' && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {subjectsList.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveCategory(sub)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition cursor-pointer ${
                    activeCategory === sub
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Level Cards Grid for Full-Length or Subject Tests */}
          {activeTestType !== 'Topic' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {levels.map((lvl) => {
                const isLocked = lvl > unlockedLevel;
                const isCleared = profile.mockTestHistory.some(
                  h => h.title === (activeTestType === 'Full-Length' 
                    ? `Full-Length Level ${lvl} Exam` 
                    : `${activeCategory} Level ${lvl} Exam`) && h.isCleared
                );

                return (
                  <div 
                    key={lvl}
                    className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition ${
                      isLocked 
                        ? 'border-slate-100 dark:border-slate-800/80 opacity-70' 
                        : 'border-slate-200 dark:border-slate-850 hover:border-blue-400 dark:hover:border-blue-900 shadow-md'
                    }`}
                  >
                    {isCleared && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
                        Cleared
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Level {lvl}</span>
                        {isLocked ? <Lock className="h-4 w-4 text-slate-400" /> : <Unlock className="h-4 w-4 text-blue-500" />}
                      </div>

                      <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-tight mb-2">
                        {activeTestType === 'Full-Length' ? 'Full-Length' : activeCategory.split(' ')[0]} Level {lvl}
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed mb-4 font-semibold">
                        {isLocked 
                          ? 'Locked. Complete previous level.' 
                          : '25 MCQs • 20 Mins • Dynamic AI set'
                        }
                      </p>
                    </div>

                    {!isLocked ? (
                      <button
                        onClick={() => handleStartExam({
                          type: activeTestType,
                          subject: activeTestType === 'Subject' ? activeCategory : undefined,
                          level: lvl
                        })}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow-md shadow-blue-500/10"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Start Test
                      </button>
                    ) : (
                      <div className="w-full text-center py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs font-bold rounded-xl">
                        Locked
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Topic Tests view
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850 p-6 md:p-8 rounded-2xl shadow-md">
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mx-auto">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Procedural Topic Quizzer</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Select a targeted chapter from the {activeCategory} syllabus below. We will compile 25 mock questions specifically for it.
                </p>
              </div>

              {availableTopics.length === 0 ? (
                <div className="text-center p-6 text-slate-400 text-xs">No roadmap topics defined for this subject.</div>
              ) : (
                <div className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 mb-1.5">Select Syllabus Chapter</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      {availableTopics.map(topic => (
                        <option key={topic.id} value={topic.name}>
                          {topic.name} (Chapter {topic.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTopic && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1">Revision Chapter Focus:</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                        {availableTopics.find(t => t.name === selectedTopic)?.notes || 'Syllabus chapter notes.'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartExam({
                      type: 'Topic',
                      subject: activeCategory,
                      topic: selectedTopic
                    })}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs shadow-lg shadow-blue-500/10"
                  >
                    <Play className="h-4 w-4 fill-current" /> Compile AI Topic Test (25 Qs)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : isExamActive ? (
        // Exam Taking Screen
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[500px]">
          
          {/* Question Display panel */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 p-4 md:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            {/* Runner Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6 text-xs font-semibold">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">
                  {currentTestConfig?.type === 'Topic' ? currentTestConfig.topic : `${currentTestConfig?.type === 'Full-Length' ? 'Full-Length' : currentTestConfig?.subject} Level ${selectedLevel}`} Exam
                </h3>
                <span className="text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl">
                <Timer className="h-4 w-4 animate-pulse" />
                <span className="font-bold tracking-wider">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 space-y-6">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed">
                {questions[currentQuestionIndex]?.questionText}
              </h4>

              {/* Options List */}
              <div className="space-y-3 font-medium">
                {questions[currentQuestionIndex]?.options.map((option, idx) => {
                  const isSelected = answers[currentQuestionIndex] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQuestionIndex]: idx }))}
                      className={`w-full text-left p-4 border rounded-xl transition text-xs leading-relaxed flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-750'
                          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40 text-slate-750 dark:text-slate-350 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Runner Navigation Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 rounded-xl font-bold flex items-center justify-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setAnswers(prev => {
                      const copy = { ...prev };
                      delete copy[currentQuestionIndex];
                      return copy;
                    });
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-700 rounded-xl font-bold"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setMarkedForReview(prev => 
                      prev.includes(currentQuestionIndex) 
                        ? prev.filter(i => i !== currentQuestionIndex)
                        : [...prev, currentQuestionIndex]
                    );
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 border rounded-xl font-bold ${
                    markedForReview.includes(currentQuestionIndex)
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                  }`}
                >
                  Mark Review
                </button>
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={submitExam}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper Question Map Sidebar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4">Question Progress Map</h3>
              
              {currentTestConfig?.type === 'Full-Length' && (
                <div className="flex flex-wrap gap-1 mb-4 text-[9px] font-bold">
                  {(['ALL', 'Quant', 'Reasoning', 'English', 'GA', 'Computer'] as const).map(sec => (
                    <button
                      key={sec}
                      onClick={() => setRunnerSectionFilter(sec)}
                      className={`px-2 py-1 rounded transition cursor-pointer flex-1 text-center ${
                        runnerSectionFilter === sec 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-750'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-5 gap-2 text-xs">
                {questions.map((q, idx) => {
                  // Subject section filtering for 100-Q Mock
                  const qSubject = (q as any).subject || '';
                  if (currentTestConfig?.type === 'Full-Length' && runnerSectionFilter !== 'ALL' && qSubject !== runnerSectionFilter) {
                    return null;
                  }

                  const isCurrent = currentQuestionIndex === idx;
                  const isAnswered = answers[idx] !== undefined;
                  const isMarked = markedForReview.includes(idx);

                  let colorStyle = 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-slate-400';
                  if (isAnswered) {
                    colorStyle = 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/20';
                  }
                  if (isMarked) {
                    colorStyle = 'bg-indigo-50 border-indigo-300 text-indigo-600';
                  }
                  if (isCurrent) {
                    colorStyle = 'border-blue-600 ring-2 ring-blue-500/20 text-blue-600 font-bold bg-white';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 w-full rounded-xl border flex items-center justify-center transition cursor-pointer font-bold ${colorStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend info */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 space-y-2 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-emerald-500" /> Answered</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-indigo-500" /> Marked for Review</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-slate-200 dark:bg-slate-700" /> Unattempted</div>
              
              <button 
                onClick={submitExam}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold text-center mt-4 transition cursor-pointer"
              >
                Quit and Submit
              </button>
            </div>
          </div>

        </div>
      ) : (
        // Exam Result Screen
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850 p-6 md:p-8 rounded-2xl shadow-lg font-sans">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-150">
              {examResult!.isCleared ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              ) : (
                <XCircle className="h-10 w-10 text-rose-500" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {examResult!.isCleared ? 'Congratulations! Cleared' : 'Test Failed (Needs >= 60%)'}
            </h2>
            <p className="text-xs text-slate-500 max-w-[300px] mx-auto leading-relaxed font-semibold">
              {examResult!.isCleared 
                ? `You cleared the test and updated your roadmap progression metrics!`
                : 'Review the detailed solution sheets, study notes, and retry the test to advance.'
              }
            </p>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl mb-8 text-center text-xs font-bold">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/30">
              <span className="text-slate-400 block mb-0.5">Final Score</span>
              <span className="text-xl text-slate-800 dark:text-white font-extrabold">{examResult!.scorePct}%</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/30">
              <span className="text-slate-400 block mb-0.5">Correct Answers</span>
              <span className="text-xl text-emerald-600 font-extrabold">{examResult!.correctAnswers}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/30">
              <span className="text-slate-400 block mb-0.5">Wrong Answers</span>
              <span className="text-xl text-rose-600 font-extrabold">{examResult!.wrongAnswers}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/30">
              <span className="text-slate-400 block mb-0.5">Time taken</span>
              <span className="text-xl text-indigo-600 font-extrabold">{formatTime(examResult!.timeSpentSeconds)}</span>
            </div>
          </div>

          {/* Detailed Solutions Panel Toggle */}
          {showSolutions ? (
            <div className="space-y-6 pt-4 border-t border-slate-150 dark:border-slate-700/50 mb-6 max-h-[400px] overflow-y-auto pr-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">Detailed Answers Review</h3>
              
              {questions.map((q, qIdx) => {
                const userAns = answers[qIdx];
                const isCorrect = userAns === q.correctOptionIndex;
                return (
                  <div key={qIdx} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-850 text-xs">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                      Q{qIdx + 1}. {q.questionText}
                    </h5>
                    <div className="space-y-1 font-medium">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectOpt = oIdx === q.correctOptionIndex;
                        const isUserSelected = oIdx === userAns;

                        let style = 'bg-slate-50 dark:bg-slate-900/20 text-slate-550 border-slate-100 dark:border-slate-850';
                        if (isUserSelected) {
                          style = isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20';
                        } else if (isCorrectOpt) {
                          style = 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20';
                        }

                        return (
                          <div key={oIdx} className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-center justify-between ${style}`}>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-555 font-medium pl-1.5 border-l border-slate-250 dark:border-slate-750 py-0.5 leading-relaxed">
                      <span className="font-bold text-slate-600 dark:text-slate-400">Explanation:</span> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => setShowSolutions(true)}
              className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-xs font-bold transition mb-6"
            >
              Review Test Questions & Explanations
            </button>
          )}

          {/* Exit Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBackToMenu}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              Back to Prep Menu
            </button>
            <button
              onClick={handleRetake}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retake Quiz
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
