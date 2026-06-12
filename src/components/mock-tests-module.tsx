'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore, MockTestHistory, getMilestoneInfo } from '@/lib/store';
import { generateMockQuestions, Question } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';
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
  Loader,
  AlertTriangle,
  Flag,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { checkRateLimit } from '@/lib/rate-limit';

const EXAM_PATTERNS = {
  'IBPS PO Prelims': {
    totalTime: 3600,
    sections: [
      { name: 'English Language', subject: 'English', questions: 30, timeSeconds: 1200 },
      { name: 'Quantitative Aptitude', subject: 'Quantitative Aptitude', questions: 35, timeSeconds: 1200 },
      { name: 'Reasoning Ability', subject: 'Reasoning', questions: 35, timeSeconds: 1200 }
    ],
    negativeMarking: 0.25,
    passingPct: 35
  },
  'SBI PO Prelims': {
    totalTime: 3600,
    sections: [
      { name: 'English Language', subject: 'English', questions: 30, timeSeconds: 1200 },
      { name: 'Quantitative Aptitude', subject: 'Quantitative Aptitude', questions: 35, timeSeconds: 1200 },
      { name: 'Reasoning Ability', subject: 'Reasoning', questions: 35, timeSeconds: 1200 }
    ],
    negativeMarking: 0.25,
    passingPct: 35
  },
  'RBI Grade B Phase 1': {
    totalTime: 7200,
    sections: [
      { name: 'General Awareness', subject: 'General Awareness', questions: 80, timeSeconds: null },
      { name: 'English', subject: 'English', questions: 30, timeSeconds: null },
      { name: 'Quantitative Aptitude', subject: 'Quantitative Aptitude', questions: 30, timeSeconds: null },
      { name: 'Reasoning', subject: 'Reasoning', questions: 60, timeSeconds: null }
    ],
    negativeMarking: 0.25,
    passingPct: 30
  },
  'NABARD Grade A': {
    totalTime: 7200,
    sections: [
      { name: 'English Language', subject: 'English', questions: 40, timeSeconds: null },
      { name: 'Quantitative Aptitude', subject: 'Quantitative Aptitude', questions: 20, timeSeconds: null },
      { name: 'Reasoning Ability', subject: 'Reasoning', questions: 20, timeSeconds: null },
      { name: 'General Awareness', subject: 'General Awareness', questions: 20, timeSeconds: null },
      { name: 'Computer Awareness', subject: 'Computer Awareness', questions: 20, timeSeconds: null }
    ],
    negativeMarking: 0.25,
    passingPct: 30
  },
  'Custom': {
    totalTime: 1200,
    sections: [],
    negativeMarking: 0.25,
    passingPct: 35
  }
};

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

  const client = getClientSupabase(currentUser?.supabaseAccessToken);

  // Resume state check
  const [hasResumeOption, setHasResumeOption] = useState(false);

  // Config State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [negativeMarkingVal, setNegativeMarkingVal] = useState<number>(-0.25);
  const [selectedExamPattern, setSelectedExamPattern] = useState<keyof typeof EXAM_PATTERNS>('IBPS PO Prelims');
  const [sectionalTimerEnabled, setSectionalTimerEnabled] = useState(true);
  const [configDifficulty, setConfigDifficulty] = useState<number>(1);
  
  // Custom Mini Test Config State
  const [customSubjects, setCustomSubjects] = useState<string[]>(['Quantitative Aptitude']);
  const [customTopics, setCustomTopics] = useState<Record<string, string[]>>({});
  const [questionsPerTopic, setQuestionsPerTopic] = useState<number>(10);
  const [customTimeLimit, setCustomTimeLimit] = useState<number>(20); // minutes

  // Active Menu Tabs
  const [activeTestType, setActiveTestType] = useState<'Full-Length' | 'Subject' | 'Topic' | 'Custom'>('Full-Length');
  const [activeCategory, setActiveCategory] = useState<'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'>('Quantitative Aptitude');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  // Exam Active State
  const [isExamActive, setIsExamActive] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(1200); 
  const [sectionTimeLeft, setSectionTimeLeft] = useState<Record<string, number>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  
  // Active config metadata
  const [activeConfig, setActiveConfig] = useState<{
    dbSessionId: string;
    type: 'Full-Length' | 'Subject' | 'Topic' | 'Custom';
    title: string;
    subject?: string;
    topic?: string;
    level: number;
    negativeMarking: number;
    sectionalTimer: boolean;
    patternName: string;
  } | null>(null);

  // Result display state
  const [examResult, setExamResult] = useState<{
    scorePct: number;
    rawScore: number;
    maxScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattemptedQuestions: number;
    timeSpentSeconds: number;
    isCleared: boolean;
    sectionalScores: Record<string, { correct: number; wrong: number; score: number; cleared: boolean; targetPct: number }>;
    percentile: number;
  } | null>(null);
  
  const [showSolutions, setShowSolutions] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('wrong_answer');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeSession = sessionStorage.getItem('active_test_session');
      if (activeSession) {
        setHasResumeOption(true);
      }
    }
  }, []);

  // Sync test selection from store if redirected from roadmap
  useEffect(() => {
    if (activeTestTopic) {
      const topic = activeTestTopic;
      setActiveTestTopic(null);
      setTimeout(() => {
        setActiveTestType('Topic');
        setActiveCategory(topic.subject as any);
        setSelectedTopic(topic.topic);
      }, 0);
    }
  }, [activeTestTopic, setActiveTestTopic]);

  const unlockedLevel = activeTestType === 'Full-Length' 
    ? (profile.unlockedLevels['Full-Length'] || 1)
    : (profile.unlockedLevels[activeCategory] || 1);

  const milestone = getMilestoneInfo(unlockedLevel);
  const levelsCount = Math.max(10, unlockedLevel + 2);
  const levels = Array.from({ length: levelsCount }, (_, i) => i + 1);

  const availableTopics = roadmapStructure.filter(t => t.subject === activeCategory);

  useEffect(() => {
    if (availableTopics.length > 0 && !availableTopics.some(t => t.name === selectedTopic)) {
      setSelectedTopic(availableTopics[0].name);
    }
  }, [activeCategory, availableTopics, selectedTopic]);

  // Handle Resuming Test
  const handleResumeTest = () => {
    try {
      const savedSession = sessionStorage.getItem('active_test_session');
      const savedAnswers = sessionStorage.getItem('active_test_answers');
      const savedMarked = sessionStorage.getItem('active_test_marked');
      const savedIndex = sessionStorage.getItem('active_test_index');
      const savedTime = sessionStorage.getItem('active_test_time');
      const savedSectionTime = sessionStorage.getItem('active_test_section_time');

      if (savedSession) {
        const config = JSON.parse(savedSession);
        setActiveConfig(config);
        setQuestions(config.questions);
        setAnswers(savedAnswers ? JSON.parse(savedAnswers) : {});
        setMarkedForReview(savedMarked ? JSON.parse(savedMarked) : []);
        setCurrentQuestionIndex(savedIndex ? parseInt(savedIndex) : 0);
        setTimeLeft(savedTime ? parseInt(savedTime) : 1200);
        setSectionTimeLeft(savedSectionTime ? JSON.parse(savedSectionTime) : {});
        
        setIsExamActive(true);
        setHasResumeOption(false);
      }
    } catch (e) {
      console.error("Failed to resume test session:", e);
      sessionStorage.clear();
      setHasResumeOption(false);
    }
  };

  // Pre-test setup trigger
  const triggerPreTestConfig = (type: 'Full-Length' | 'Subject' | 'Topic' | 'Custom') => {
    setActiveTestType(type as any);
    if (type === 'Full-Length') {
      setSelectedExamPattern('IBPS PO Prelims');
      setSectionalTimerEnabled(true);
    } else {
      setSelectedExamPattern('Custom');
      setSectionalTimerEnabled(false);
    }
    setShowConfigModal(true);
  };

  // Create test session row and fetch questions
  const startExam = async () => {
    setShowConfigModal(false);
    setLoadingQuestions(true);
    setExamResult(null);
    setAnswers({});
    setMarkedForReview([]);
    setCurrentQuestionIndex(0);
    setCurrentSectionIndex(0);

    const title = activeTestType === 'Topic' 
      ? `${selectedTopic} Topic Quiz`
      : activeTestType === 'Subject'
        ? `${activeCategory} Subject Test`
        : activeTestType === 'Custom'
          ? 'Custom Mini Test'
          : `${selectedExamPattern} Level ${configDifficulty} Exam`;

    try {
      let fetchedQuestions: Question[] = [];
      let durationSeconds = 1200; // default 20 mins

      // Generate test session ID beforehand
      const { data: sessionData, error: sessionErr } = await client
        .from('test_sessions')
        .insert({
          user_id: currentUser?.id || '',
          title,
          type: activeTestType === 'Custom' ? 'Custom' : activeTestType,
          subject: activeTestType !== 'Full-Length' ? activeCategory : null,
          topic: activeTestType === 'Topic' ? selectedTopic : null,
          level: configDifficulty,
          total_questions: activeTestType === 'Full-Length' ? 100 : 25,
          negative_marking: negativeMarkingVal !== 0,
          negative_value: Math.abs(negativeMarkingVal),
          sectional_timer: sectionalTimerEnabled,
          is_completed: false
        })
        .select()
        .single();

      if (sessionErr) throw new Error(sessionErr.message);

      const dbSessionId = sessionData.id;

      if (activeTestType === 'Full-Length') {
        const pattern = EXAM_PATTERNS[selectedExamPattern];
        durationSeconds = pattern.totalTime;

        // Concurrently fetch each section's questions
        const fetchPromises = pattern.sections.map(async (sec) => {
          const res = await fetch('/api/generate-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: sec.subject,
              topic: `Level ${configDifficulty} Mock`,
              count: sec.questions,
              level: configDifficulty
            })
          });
          if (!res.ok) throw new Error(`Failed to fetch ${sec.subject}`);
          const data = await res.json();
          return data.questions.map((q: any) => ({ ...q, subjectSection: sec.name }));
        });

        const results = await Promise.all(fetchPromises);
        fetchedQuestions = results.flat();
      } else if (activeTestType === 'Custom') {
        durationSeconds = customTimeLimit * 60;
        
        // Fetch custom mini test questions
        const fetchPromises = customSubjects.flatMap(sub => {
          const topics = customTopics[sub] || [];
          return topics.map(async (top) => {
            const res = await fetch('/api/generate-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subject: sub,
                topic: top,
                count: questionsPerTopic,
                level: configDifficulty
              })
            });
            if (!res.ok) return [];
            const data = await res.json();
            return data.questions.map((q: any) => ({ ...q, subjectSection: sub }));
          });
        });

        const results = await Promise.all(fetchPromises);
        fetchedQuestions = results.flat();
      } else {
        // Subject or Topic quiz
        const subjectParam = activeCategory;
        const topicParam = activeTestType === 'Topic' ? selectedTopic : `Level ${configDifficulty} Mock Test`;

        const response = await fetch('/api/generate-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subjectParam,
            topic: topicParam,
            count: 25,
            level: configDifficulty
          })
        });

        if (!response.ok) throw new Error("Failed to fetch questions");
        const data = await response.json();
        fetchedQuestions = data.questions;
      }

      if (fetchedQuestions.length === 0) throw new Error("Failed to load questions");

      // Set up sectional timers mapping
      const initialSectionTime: Record<string, number> = {};
      if (activeTestType === 'Full-Length') {
        const pattern = EXAM_PATTERNS[selectedExamPattern];
        pattern.sections.forEach(sec => {
          if (sec.timeSeconds) {
            initialSectionTime[sec.name] = sec.timeSeconds;
          }
        });
      }

      const activeConfigObj = {
        dbSessionId,
        type: activeTestType === 'Custom' ? 'Custom' as const : activeTestType,
        title,
        subject: activeTestType !== 'Full-Length' ? activeCategory : undefined,
        topic: activeTestType === 'Topic' ? selectedTopic : undefined,
        level: configDifficulty,
        negativeMarking: negativeMarkingVal,
        sectionalTimer: sectionalTimerEnabled,
        patternName: selectedExamPattern,
        questions: fetchedQuestions
      };

      setActiveConfig(activeConfigObj);
      setQuestions(fetchedQuestions);
      setTimeLeft(durationSeconds);
      setSectionTimeLeft(initialSectionTime);
      setIsExamActive(true);

      // Persist to sessionStorage
      sessionStorage.setItem('active_test_session', JSON.stringify(activeConfigObj));
      sessionStorage.setItem('active_test_answers', JSON.stringify({}));
      sessionStorage.setItem('active_test_marked', JSON.stringify([]));
      sessionStorage.setItem('active_test_index', '0');
      sessionStorage.setItem('active_test_time', durationSeconds.toString());
      sessionStorage.setItem('active_test_section_time', JSON.stringify(initialSectionTime));

    } catch (err) {
      console.error(err);
      alert("Failed to start the test. Please check API config or keys.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Smart Weakness Auto-Test builder
  const startWeaknessAutoTest = async () => {
    setLoadingQuestions(true);
    try {
      // Query attempts to find weakest topics
      const { data: attempts, error } = await client
        .from('question_attempts')
        .select('is_correct, question_id, questions(topic, subject)')
        .eq('user_id', currentUser?.id || '');

      if (error) throw new Error(error.message);

      // Process and find weakest topics
      const topicStats: Record<string, { total: number; correct: number; subject: string }> = {};
      attempts?.forEach((att: any) => {
        if (att.questions) {
          const key = att.questions.topic;
          if (!topicStats[key]) {
            topicStats[key] = { total: 0, correct: 0, subject: att.questions.subject };
          }
          topicStats[key].total++;
          if (att.is_correct) {
            topicStats[key].correct++;
          }
        }
      });

      const sortedWeakest = Object.entries(topicStats)
        .map(([topic, stat]) => ({
          topic,
          subject: stat.subject,
          accuracy: stat.correct / stat.total
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5); // top 5 weakest

      if (sortedWeakest.length === 0) {
        alert("Not enough attempt history to determine weak areas. Please practice some mock tests first!");
        setLoadingQuestions(false);
        return;
      }

      // Build a 30-question custom test from the weakest topics
      const qPerTopic = Math.ceil(30 / sortedWeakest.length);
      const fetchPromises = sortedWeakest.map(async (w) => {
        const res = await fetch('/api/generate-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: w.subject,
            topic: w.topic,
            count: qPerTopic,
            level: 5 // Default medium difficulty
          })
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.questions.map((q: any) => ({ ...q, subjectSection: w.subject }));
      });

      const results = await Promise.all(fetchPromises);
      const fetchedQs = results.flat().slice(0, 30);

      // Create test session
      const { data: sessionData, error: sessionErr } = await client
        .from('test_sessions')
        .insert({
          user_id: currentUser?.id || '',
          title: "Smart Weakness Auto-Test",
          type: 'Custom',
          total_questions: fetchedQs.length,
          negative_marking: true,
          negative_value: 0.25,
          sectional_timer: false,
          is_completed: false
        })
        .select()
        .single();

      if (sessionErr) throw new Error(sessionErr.message);

      const activeConfigObj = {
        dbSessionId: sessionData.id,
        type: 'Custom' as const,
        title: "Smart Weakness Auto-Test",
        level: 5,
        negativeMarking: -0.25,
        sectionalTimer: false,
        patternName: 'Custom',
        questions: fetchedQs
      };

      setActiveConfig(activeConfigObj);
      setQuestions(fetchedQs);
      setTimeLeft(1800); // 30 minutes
      setIsExamActive(true);

      sessionStorage.setItem('active_test_session', JSON.stringify(activeConfigObj));
      sessionStorage.setItem('active_test_answers', JSON.stringify({}));
      sessionStorage.setItem('active_test_marked', JSON.stringify([]));
      sessionStorage.setItem('active_test_index', '0');
      sessionStorage.setItem('active_test_time', '1800');
      sessionStorage.setItem('active_test_section_time', '{}');

    } catch (e) {
      console.error(e);
      alert("Failed to build Smart Weakness Test.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Keyboard navigation & inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExamActive) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'm' || e.key === 'M') {
        setMarkedForReview(prev => 
          prev.includes(currentQuestionIndex) 
            ? prev.filter(i => i !== currentQuestionIndex)
            : [...prev, currentQuestionIndex]
        );
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = parseInt(e.key) - 1;
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optIdx }));
      } else if (e.key === 's' || e.key === 'S') {
        if (confirm("Are you sure you want to submit the exam?")) {
          submitExam();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExamActive, questions.length, currentQuestionIndex]);

  // Synchronize state changes to sessionStorage
  useEffect(() => {
    if (isExamActive) {
      sessionStorage.setItem('active_test_answers', JSON.stringify(answers));
      sessionStorage.setItem('active_test_marked', JSON.stringify(markedForReview));
      sessionStorage.setItem('active_test_index', currentQuestionIndex.toString());
      sessionStorage.setItem('active_test_time', timeLeft.toString());
      sessionStorage.setItem('active_test_section_time', JSON.stringify(sectionTimeLeft));
    }
  }, [answers, markedForReview, currentQuestionIndex, timeLeft, sectionTimeLeft, isExamActive]);

  // Upsert attempt record immediately on answer change
  const handleAnswerSelect = async (optIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optIdx }));
    
    if (activeConfig && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex];
      const isCorrect = optIdx === q.correctOptionIndex;
      
      try {
        await client
          .from('question_attempts')
          .upsert({
            session_id: activeConfig.dbSessionId,
            user_id: currentUser?.id || '',
            question_id: q.id,
            selected_index: optIdx,
            is_correct: isCorrect,
            time_spent_seconds: 0 // Will compile total time spent later
          }, { onConflict: 'session_id,question_id' }); // Unique identifier combo
      } catch (err) {
        console.error("Failed to persist attempt:", err);
      }
    }
  };

  const handleMarkReview = async () => {
    const isMarked = markedForReview.includes(currentQuestionIndex);
    const updated = isMarked
      ? markedForReview.filter(i => i !== currentQuestionIndex)
      : [...markedForReview, currentQuestionIndex];
      
    setMarkedForReview(updated);

    if (activeConfig && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex];
      try {
        await client
          .from('question_attempts')
          .upsert({
            session_id: activeConfig.dbSessionId,
            user_id: currentUser?.id || '',
            question_id: q.id,
            is_marked_for_review: !isMarked
          }, { onConflict: 'session_id,question_id' });
      } catch (err) {
        console.error("Failed to update marked status:", err);
      }
    }
  };

  // Submit mock test session
  const submitExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!activeConfig) return;

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    // Section scores mapping
    const sectionStats: Record<string, { total: number; correct: number; score: number }> = {};

    questions.forEach((q, idx) => {
      const sectionName = (q as any).subjectSection || activeConfig.subject || 'Full-Length';
      if (!sectionStats[sectionName]) {
        sectionStats[sectionName] = { total: 0, correct: 0, score: 0 };
      }
      sectionStats[sectionName].total++;

      const userAns = answers[idx];
      if (userAns === undefined) {
        unattempted++;
      } else if (userAns === q.correctOptionIndex) {
        correct++;
        sectionStats[sectionName].correct++;
      } else {
        wrong++;
      }
    });

    // Score calculations
    const penalty = Math.abs(activeConfig.negativeMarking);
    const rawScore = correct - (wrong * penalty);
    const scorePct = Number(Math.max(0, (rawScore / questions.length) * 100).toFixed(2));
    
    // Total duration spent
    const totalDuration = activeConfig.type === 'Full-Length' 
      ? EXAM_PATTERNS[activeConfig.patternName as keyof typeof EXAM_PATTERNS].totalTime 
      : activeConfig.type === 'Custom'
        ? customTimeLimit * 60
        : 1200;
        
    const timeSpentSeconds = totalDuration - timeLeft;

    // Sectional cutoffs
    let allSectionsCleared = true;
    const sectionalScores: Record<string, { correct: number; wrong: number; score: number; cleared: boolean; targetPct: number }> = {};

    if (activeConfig.type === 'Full-Length') {
      const pattern = EXAM_PATTERNS[activeConfig.patternName as keyof typeof EXAM_PATTERNS];
      
      pattern.sections.forEach(sec => {
        const stats = sectionStats[sec.name] || { total: 0, correct: 0 };
        const secWrong = stats.total - stats.correct; // including unattempted for section
        const secScore = stats.correct - (secWrong * penalty);
        const secPct = (secScore / sec.questions) * 100;
        const cleared = secPct >= pattern.passingPct;
        
        if (!cleared) allSectionsCleared = false;
        
        sectionalScores[sec.name] = {
          correct: stats.correct,
          wrong: secWrong,
          score: Number(secScore.toFixed(2)),
          cleared,
          targetPct: pattern.passingPct
        };
      });
    }

    const overallPassPct = activeConfig.type === 'Full-Length' 
      ? EXAM_PATTERNS[activeConfig.patternName as keyof typeof EXAM_PATTERNS].passingPct
      : 60; // default 60% for Subject/Topic

    const overallCleared = scorePct >= overallPassPct;
    const isCleared = overallCleared && allSectionsCleared;

    // Fetch Percentile rank compared to other completed sessions
    let percentile = 90.00; // default/dummy fallback
    try {
      const { count: worseCount } = await client
        .from('test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('type', activeConfig.type)
        .eq('level', activeConfig.level)
        .eq('is_completed', true)
        .lt('score_pct', scorePct);

      const { count: totalCount } = await client
        .from('test_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('type', activeConfig.type)
        .eq('level', activeConfig.level)
        .eq('is_completed', true);

      if (totalCount && totalCount > 0) {
        percentile = Number(((worseCount || 0) / totalCount * 100).toFixed(2));
      }
    } catch (e) {
      console.warn("Failed to fetch percentile ranking:", e);
    }

    const resultSummary = {
      scorePct,
      rawScore: Number(rawScore.toFixed(2)),
      maxScore: questions.length,
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattemptedQuestions: unattempted,
      timeSpentSeconds,
      isCleared,
      sectionalScores,
      percentile
    };

    setExamResult(resultSummary);
    setIsExamActive(false);

    // Save mock test result to store (updates store & Supabase database tables)
    await submitMockTestResult({
      testId: activeConfig.dbSessionId,
      title: activeConfig.title,
      type: activeConfig.type,
      subject: activeConfig.subject,
      topic: activeConfig.topic,
      level: activeConfig.level,
      scorePct,
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattemptedQuestions: unattempted,
      timeSpentSeconds,
      isCleared
    });

    // If failed, automatically add this topic/incorrect questions to spaced repetition queue!
    if (!isCleared) {
      try {
        const wrongQs = questions.filter((_, idx) => answers[idx] !== undefined && answers[idx] !== questions[idx].correctOptionIndex);
        for (const wq of wrongQs) {
          await client.from('spaced_repetition').upsert({
            user_id: currentUser?.id || '',
            item_id: wq.id,
            item_type: 'question',
            easiness_factor: 2.5,
            interval_days: 1,
            repetition_count: 0,
            next_review_date: new Date().toISOString().split('T')[0]
          }, { onConflict: 'user_id,item_id,item_type' });
        }
      } catch (err) {
        console.warn("Spaced repetition queue error:", err);
      }
    }

    // Clear session storage
    sessionStorage.removeItem('active_test_session');
    sessionStorage.removeItem('active_test_answers');
    sessionStorage.removeItem('active_test_marked');
    sessionStorage.removeItem('active_test_index');
    sessionStorage.removeItem('active_test_time');
    sessionStorage.removeItem('active_test_section_time');
  }, [questions, answers, timeLeft, activeConfig, submitMockTestResult, customTimeLimit, currentUser]);

  const handleAutoSubmit = useCallback(() => {
    submitExam();
  }, [submitExam]);

  // Sectional Timer or standard Timer decrement logic
  useEffect(() => {
    if (isExamActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        // Handle Sectional Timer Decrement
        if (activeConfig?.sectionalTimer && activeConfig.type === 'Full-Length') {
          const sections = EXAM_PATTERNS[activeConfig.patternName as keyof typeof EXAM_PATTERNS].sections;
          const currentSection = sections[currentSectionIndex];
          
          setSectionTimeLeft(prev => {
            const currentSecTime = prev[currentSection.name] || 0;
            if (currentSecTime <= 1) {
              // Time's up for current section! Advance to next section or submit
              if (currentSectionIndex < sections.length - 1) {
                // Advance section index
                setCurrentSectionIndex(prevIdx => prevIdx + 1);
                // Find first question index of the next section
                let firstQIndex = 0;
                for (let i = 0; i < currentSectionIndex + 1; i++) {
                  firstQIndex += sections[i].questions;
                }
                setCurrentQuestionIndex(firstQIndex);
              } else {
                // Last section finished, auto submit
                clearInterval(timerRef.current!);
                handleAutoSubmit();
              }
              return { ...prev, [currentSection.name]: 0 };
            }
            return { ...prev, [currentSection.name]: currentSecTime - 1 };
          });
        }

        // Global Timer Decrement
        setTimeLeft(prev => {
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
  }, [isExamActive, timeLeft, handleAutoSubmit, activeConfig, currentSectionIndex]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleRetake = () => {
    if (activeConfig) {
      startExam();
    }
  };

  const handleBackToMenu = () => {
    setExamResult(null);
    setShowSolutions(false);
  };

  // Handle Question Reporting
  const handleReportQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingQuestionId) return;

    try {
      const { error } = await client
        .from('question_reports')
        .insert({
          question_id: reportingQuestionId,
          user_id: currentUser?.id || '',
          reason: reportReason as any,
          description: reportDescription,
          status: 'pending'
        });

      if (error) throw new Error(error.message);
      
      setReportSuccess(true);
      setTimeout(() => {
        setReportingQuestionId(null);
        setReportDescription('');
        setReportSuccess(false);
      }, 2000);
    } catch (err: any) {
      alert("Failed to submit question report: " + err.message);
    }
  };

  const subjectsList = [
    'Quantitative Aptitude',
    'Reasoning',
    'English',
    'General Awareness',
    'Computer Awareness'
  ] as const;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-6 min-h-screen font-sans transition-all duration-300 ${
      focusMode && isExamActive ? 'bg-slate-950 text-slate-100 p-2 md:p-4' : 'bg-slate-50 dark:bg-slate-900/60'
    }`}>
      
      {/* Dynamic Loader Panel */}
      {loadingQuestions && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center text-white z-50 p-6 text-center">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-200">
            <Loader className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2 justify-center">
              <BrainCircuit className="h-5 w-5 text-indigo-400" /> Preparing Mock Exam
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically generating fresh exam-style questions from AI Waterfall and checking database cache...
            </p>
          </div>
        </div>
      )}

      {/* Resume Option Banner */}
      {hasResumeOption && !isExamActive && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 text-blue-800 dark:text-blue-300 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-xs font-semibold">
              <p className="font-bold">Active Session Detected</p>
              <p className="text-slate-500 dark:text-slate-450 font-normal">You have an ongoing mock test. Would you like to resume it?</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                sessionStorage.clear();
                setHasResumeOption(false);
              }}
              className="flex-1 sm:flex-none px-4 py-2 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-bold hover:bg-blue-100/30 cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleResumeTest}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-750">
              <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-600" /> Pre-Test Configuration
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              {/* Exam Pattern */}
              <div className="space-y-1">
                <label className="block text-slate-450">Exam Pattern</label>
                <select
                  value={selectedExamPattern}
                  onChange={(e) => setSelectedExamPattern(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(EXAM_PATTERNS).map(pat => (
                    <option key={pat} value={pat}>{pat}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-slate-455">Difficulty (Level 1-10)</label>
                  <span className="text-blue-600 font-extrabold">{configDifficulty}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={configDifficulty}
                  onChange={(e) => setConfigDifficulty(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Negative Marking */}
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-slate-800 dark:text-slate-200">Negative Marking</p>
                  <p className="text-[10px] text-slate-400 font-normal">Deduct penalty for wrong answers</p>
                </div>
                <div className="flex gap-1">
                  {[-0.25, -0.33, -0.50, 0].map(val => (
                    <button
                      key={val}
                      onClick={() => setNegativeMarkingVal(val)}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                        negativeMarkingVal === val
                          ? 'bg-blue-650 border-blue-650 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-55'
                      }`}
                    >
                      {val === 0 ? 'None' : `${val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sectional Timer Toggle */}
              {selectedExamPattern !== 'Custom' && (
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-slate-800 dark:text-slate-200">Sectional Timer Limits</p>
                    <p className="text-[10px] text-slate-400 font-normal">Enforce separate time limit per section</p>
                  </div>
                  <button
                    onClick={() => setSectionalTimerEnabled(!sectionalTimerEnabled)}
                    type="button"
                    className={`px-4 py-2 rounded-xl border font-bold transition cursor-pointer ${
                      sectionalTimerEnabled
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-350'
                    }`}
                  >
                    {sectionalTimerEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              )}

              {/* Custom Mini Test Configuration */}
              {activeTestType === 'Custom' && (
                <div className="border border-slate-100 dark:border-slate-700 p-4 rounded-2xl space-y-3">
                  <p className="font-bold text-slate-800 dark:text-white border-b pb-1.5">Custom Test Options</p>
                  
                  {/* Subjects Picker */}
                  <div className="space-y-1.5">
                    <label className="text-slate-450 block">Select Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {subjectsList.map(sub => {
                        const included = customSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              if (included) {
                                setCustomSubjects(customSubjects.filter(s => s !== sub));
                              } else {
                                setCustomSubjects([...customSubjects, sub]);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border font-bold text-[10px] transition cursor-pointer ${
                              included
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350'
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions slider per topic */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-slate-450">Questions per Subject</label>
                      <span className="text-blue-600 font-extrabold">{questionsPerTopic} Qs</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={questionsPerTopic}
                      onChange={(e) => setQuestionsPerTopic(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Custom Time Limit */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-slate-450">Total Time Limit</label>
                      <span className="text-blue-600 font-extrabold">{customTimeLimit} Mins</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={customTimeLimit}
                      onChange={(e) => setCustomTimeLimit(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={startExam}
              disabled={activeTestType === 'Custom' && customSubjects.length === 0}
              className="w-full py-3 bg-blue-650 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 transition shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <Play className="h-4 w-4 fill-current" /> Initialize Exam
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Content */}
      {!isExamActive && !examResult ? (
        // Test selection Dashboard
        <>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" /> Mock Test Prep Center
                </h2>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${milestone.color} shadow-sm transition`}>
                  <span>{milestone.badge}</span>
                  <span>{milestone.rank}</span>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                Lock and unlock exam levels by clearing cutoffs. Try our custom test builder or target specific weak areas.
              </p>
            </div>

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
                  {type === 'Full-Length' ? 'Full-Length' : type === 'Subject' ? 'Subject Tests' : 'Topic Quizzes'}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-selector for Subject quizzes */}
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

          {/* Levels grid for Full-Length & Subject tests */}
          {activeTestType !== 'Topic' ? (
            <div className="space-y-6">
              {/* Special Test Builders row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-100 dark:border-indigo-900/50 p-5 rounded-3xl space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-indigo-650" /> Custom Test Builder
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Mix and match subjects, select exact questions per topic, and set a custom time limit for personalized practice.
                  </p>
                  <button
                    onClick={() => triggerPreTestConfig('Custom')}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-550/15"
                  >
                    Build Custom Test
                  </button>
                </div>

                <div className="bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-100 dark:border-rose-900/50 p-5 rounded-3xl space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600" /> Smart Weakness Test
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Automatically scans your mock test answer attempts to find your 5 weakest topics and builds a 30-question diagnostic quiz.
                  </p>
                  <button
                    onClick={startWeaknessAutoTest}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-rose-500/15"
                  >
                    Start Smart Weakness Test
                  </button>
                </div>
              </div>

              {/* standard Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {levels.map((lvl) => {
                  const isLocked = lvl > unlockedLevel;
                  const isCleared = profile.mockTestHistory.some(
                    h => h.title.includes(`Level ${lvl}`) && h.isCleared
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
                          {activeTestType === 'Full-Length' ? 'Standard PO' : activeCategory.split(' ')[0]} Level {lvl}
                        </h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-4 font-semibold">
                          {isLocked 
                            ? 'Locked. Clear previous level.' 
                            : '25 MCQs • 20 Mins • Dynamic AI set'
                          }
                        </p>
                      </div>

                      {!isLocked ? (
                        <button
                          onClick={() => triggerPreTestConfig(activeTestType)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow-md shadow-blue-500/10"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" /> Configure Test
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
            </div>
          ) : (
            // Topic Quizzes selector
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850 p-6 md:p-8 rounded-2xl shadow-md">
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mx-auto">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Procedural Topic Quiz</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Select a targeted chapter from the syllabus below. We will compile 25 dynamic mock questions for it.
                </p>
              </div>

              {availableTopics.length === 0 ? (
                <div className="text-center p-6 text-slate-400 text-xs">No topics defined for this subject.</div>
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
                          {topic.name} (Level {topic.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTopic && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-1">Chapter Target Notes:</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed font-semibold">
                        {availableTopics.find(t => t.name === selectedTopic)?.notes || 'Syllabus chapter notes.'}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => triggerPreTestConfig('Topic')}
                    className="w-full py-3 bg-blue-650 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs shadow-lg shadow-blue-500/10"
                  >
                    <Play className="h-4 w-4 fill-current" /> Configure Topic Test (25 Qs)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : isExamActive ? (
        // Active test runner screen
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[500px]">
          
          {/* Main Question view */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 p-4 md:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6 text-xs font-semibold">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">{activeConfig?.title}</h3>
                <span className="text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Focus Mode button */}
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Toggle Focus Mode"
                >
                  {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                {/* Sectional or standard timer */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl">
                  <Timer className="h-4 w-4 animate-pulse" />
                  <span className="font-bold tracking-wider">
                    {activeConfig?.sectionalTimer && activeConfig.type === 'Full-Length'
                      ? formatTime(sectionTimeLeft[EXAM_PATTERNS[activeConfig.patternName as keyof typeof EXAM_PATTERNS].sections[currentSectionIndex].name] || 0)
                      : formatTime(timeLeft)
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Active section header if full length */}
            {activeConfig?.type === 'Full-Length' && (
              <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold uppercase rounded-lg">
                Active Section: {EXAM_PATTERNS[activeConfig.patternName as keyof typeof EXAM_PATTERNS].sections[currentSectionIndex].name}
              </div>
            )}

            {/* Question description */}
            <div className="flex-1 space-y-6">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed">
                {questions[currentQuestionIndex]?.questionText}
              </h4>

              {/* Options */}
              <div className="space-y-3 font-medium">
                {questions[currentQuestionIndex]?.options.map((option, idx) => {
                  const isSelected = answers[currentQuestionIndex] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
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

            {/* Stepper Navigation */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-330 disabled:opacity-40 rounded-xl font-bold flex items-center justify-center gap-1"
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
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-750 rounded-xl font-bold"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleMarkReview}
                  className={`flex-1 sm:flex-none px-4 py-2 border rounded-xl font-bold ${
                    markedForReview.includes(currentQuestionIndex)
                      ? 'border-indigo-650 bg-indigo-50 text-indigo-650'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-55'
                  }`}
                >
                  {markedForReview.includes(currentQuestionIndex) ? 'Unmark Review' : 'Mark for Review'}
                </button>
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to submit the exam?")) submitExam();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper map sidebar */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4">Question Progress Map</h3>
              
              <div className="grid grid-cols-5 gap-2 text-xs">
                {questions.map((q, idx) => {
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

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 space-y-2 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-emerald-500" /> Answered</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-indigo-500" /> Marked for Review</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded bg-slate-250 dark:bg-slate-700" /> Unattempted</div>
              
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to quit and submit?")) submitExam();
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold text-center mt-4 transition cursor-pointer"
              >
                Quit and Submit
              </button>
            </div>
          </div>

        </div>
      ) : (
        // Exam detailed result screen
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850 p-6 md:p-8 rounded-2xl shadow-lg font-sans space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-150">
              {examResult!.isCleared ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              ) : (
                <XCircle className="h-10 w-10 text-rose-500" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {examResult!.isCleared ? 'Test Cleared!' : 'Test Failed (Did not clear cutoffs)'}
            </h2>
            
            {/* Almost there state */}
            {!examResult!.isCleared && examResult!.scorePct >= 55 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-[11px] font-semibold max-w-md mx-auto">
                🔥 Almost there! You scored {examResult!.scorePct}% (within 5% of passing). Keep reviewing, you will clear it next time!
              </div>
            )}
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs font-bold">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-750">
              <span className="text-slate-400 block mb-0.5">Final Score</span>
              <span className="text-lg text-slate-800 dark:text-white font-extrabold">{examResult!.rawScore} / {examResult!.maxScore}</span>
              <span className="text-[10px] text-slate-450 block mt-0.5">({examResult!.scorePct}%)</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-750">
              <span className="text-slate-400 block mb-0.5">Correct Answers</span>
              <span className="text-lg text-emerald-600 font-extrabold">+{examResult!.correctAnswers}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-750">
              <span className="text-slate-400 block mb-0.5">Wrong Answers</span>
              <span className="text-lg text-rose-600 font-extrabold">-{examResult!.wrongAnswers}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-750">
              <span className="text-slate-400 block mb-0.5">Percentile Rank</span>
              <span className="text-lg text-indigo-600 font-extrabold">Top {Number(100 - examResult!.percentile).toFixed(1)}%</span>
            </div>
          </div>

          {/* Sectional Cutoffs Breakdown */}
          {Object.keys(examResult!.sectionalScores).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Sectional Cutoffs & Breakdown</h3>
              <div className="border border-slate-100 dark:border-slate-750 rounded-2xl overflow-hidden text-xs font-semibold">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-750 text-slate-450 text-[10px] uppercase font-bold">
                      <th className="p-3">Section</th>
                      <th className="p-3">Scored</th>
                      <th className="p-3">Target Pct</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {Object.entries(examResult!.sectionalScores).map(([secName, scoreVal]) => (
                      <tr key={secName} className="dark:text-slate-200">
                        <td className="p-3">{secName}</td>
                        <td className="p-3">{scoreVal.score} pts ({Number((scoreVal.correct / (scoreVal.correct + scoreVal.wrong) * 100) || 0).toFixed(0)}% acc)</td>
                        <td className="p-3">{scoreVal.targetPct}%</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            scoreVal.cleared 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          }`}>
                            {scoreVal.cleared ? 'CLEARED ✓' : 'FAILED ✗'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report Question Modal/Popover */}
          {reportingQuestionId && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <form onSubmit={handleReportQuestionSubmit} className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl space-y-4 shadow-2xl text-xs font-semibold">
                <h4 className="font-bold text-sm text-slate-850 dark:text-white">Report Question Error</h4>
                {reportSuccess ? (
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Report submitted successfully. Thank you!
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-450 block">Reason for Report</label>
                      <select 
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="wrong_answer">Wrong Answer Key</option>
                        <option value="unclear_question">Unclear Question Statement</option>
                        <option value="wrong_options">Malformed / Wrong Options</option>
                        <option value="calculation_error">Calculation / Formula Error</option>
                        <option value="other">Other Issue</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-450 block">Description (Max 200 chars)</label>
                      <textarea
                        required
                        maxLength={200}
                        placeholder="Explain the error in detail..."
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none h-24"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setReportingQuestionId(null)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl cursor-pointer"
                      >
                        Submit Report
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          {/* Solutions solutions review */}
          {showSolutions ? (
            <div className="space-y-6 pt-4 border-t border-slate-150 dark:border-slate-700/50 max-h-[400px] overflow-y-auto pr-2">
              <h3 className="font-bold text-slate-850 dark:text-white text-sm">Detailed Solutions Review</h3>
              
              {questions.map((q, qIdx) => {
                const userAns = answers[qIdx];
                const isCorrect = userAns === q.correctOptionIndex;
                return (
                  <div key={q.id || qIdx} className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-850 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                        Q{qIdx + 1}. {q.questionText}
                      </h5>
                      <button
                        onClick={() => setReportingQuestionId(q.id || `q_${qIdx}`)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="Report Question Error"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                      <span className="font-bold text-slate-655 dark:text-slate-400">Explanation:</span> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => setShowSolutions(true)}
              className="w-full py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-xs font-bold transition"
            >
              Review Test Questions & Explanations
            </button>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-750">
            <button
              onClick={handleBackToMenu}
              className="flex-grow py-3 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              Back to Prep Menu
            </button>
            <button
              onClick={handleRetake}
              className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer transition flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
