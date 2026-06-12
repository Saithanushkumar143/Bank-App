'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import { 
  Brain, 
  HelpCircle, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  RefreshCw, 
  Sparkles, 
  Calendar,
  Flame,
  Check,
  Award
} from 'lucide-react';

interface ReviewItem {
  id: string; // spaced_repetition id
  item_id: string;
  item_type: 'question' | 'formula';
  easiness_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_date: string;
  
  // Loaded dynamically
  title?: string; // for formulas
  content?: string; // for formulas
  shortcut?: string; // for formulas
  question_text?: string; // for questions
  options?: string[]; // for questions
  correct_index?: number; // for questions
  explanation?: string; // for questions
  subject?: string;
  topic?: string;
}

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

export default function SpacedRepetitionModule() {
  const { currentUser } = useAppStore();
  const client = getClientSupabase(currentUser?.supabaseAccessToken);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Stats
  const [streak, setStreak] = useState(0);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'questions' | 'formulas'>('all');

  const fetchDueItems = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 1. Fetch due reviews
      const { data: repData, error: repError } = await client
        .from('spaced_repetition')
        .select('*')
        .eq('user_id', currentUser.id)
        .lte('next_review_date', todayStr);

      if (repError) throw new Error(repError.message);

      if (!repData || repData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // 2. Separate question and formula IDs
      const questionIds = repData.filter(r => r.item_type === 'question').map(r => r.item_id);
      const formulaIds = repData.filter(r => r.item_type === 'formula').map(r => r.item_id);

      // 3. Batch fetch questions
      let questionsMap: Record<string, any> = {};
      if (questionIds.length > 0) {
        const { data: qData } = await client
          .from('questions')
          .select('*')
          .in('id', questionIds);
        
        if (qData) {
          qData.forEach(q => {
            questionsMap[q.id] = q;
          });
        }
      }

      // 4. Batch fetch formulas
      let formulasMap: Record<string, any> = {};
      if (formulaIds.length > 0) {
        const { data: fData } = await client
          .from('liked_formulas')
          .select('*')
          .in('formula_id', formulaIds)
          .eq('user_id', currentUser.id);

        if (fData) {
          fData.forEach(f => {
            formulasMap[f.formula_id] = f;
          });
        }
      }

      // 5. Combine and filter out items that no longer exist in their origin tables
      const loadedItems: ReviewItem[] = repData
        .map(r => {
          if (r.item_type === 'question' && questionsMap[r.item_id]) {
            const q = questionsMap[r.item_id];
            return {
              ...r,
              question_text: q.question_text,
              options: q.options,
              correct_index: q.correct_index,
              explanation: q.explanation,
              subject: q.subject,
              topic: q.topic
            };
          } else if (r.item_type === 'formula' && formulasMap[r.item_id]) {
            const f = formulasMap[r.item_id];
            return {
              ...r,
              title: f.title,
              content: f.content,
              shortcut: f.shortcut,
              subject: f.subject,
              topic: f.topic
            };
          }
          return null;
        })
        .filter((item): item is ReviewItem => item !== null);

      setItems(loadedItems);
      
      // Calculate Stats
      const { count: reviewedCount } = await client
        .from('spaced_repetition')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .gt('repetition_count', 0);
        
      setTotalReviewed(reviewedCount || 0);

      // Simple mock streak calculation
      setStreak(Math.min(7, Math.max(1, Math.floor((reviewedCount || 0) / 5))));

    } catch (err) {
      console.error('Failed to load spaced repetition items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueItems();
  }, [currentUser]);

  const handleRate = async (quality: number) => {
    if (items.length === 0) return;
    const currentItem = items[currentIndex];

    // SM-2 algorithm calculations
    let ef = Number(currentItem.easiness_factor);
    let rep = currentItem.repetition_count;
    let interval = currentItem.interval_days;

    let nextEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (nextEf < 1.3) nextEf = 1.3;

    let nextInterval = 1;
    let nextRep = rep;

    if (quality >= 3) {
      if (rep === 0) {
        nextInterval = 1;
      } else if (rep === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(interval * nextEf);
      }
      nextRep = rep + 1;
    } else {
      nextRep = 0;
      nextInterval = 1;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);
    const nextDateString = nextDate.toISOString().split('T')[0];

    try {
      // Update database
      const { error } = await client
        .from('spaced_repetition')
        .update({
          easiness_factor: nextEf,
          interval_days: nextInterval,
          repetition_count: nextRep,
          next_review_date: nextDateString,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', currentItem.id);

      if (error) throw new Error(error.message);

      // Advance to next card
      setShowAnswer(false);
      setSelectedOption(null);
      
      const newItems = [...items];
      newItems.splice(currentIndex, 1);
      setItems(newItems);

      // Check if finished
      if (newItems.length === 0) {
        // Reload stats
        setTotalReviewed(prev => prev + 1);
      } else if (currentIndex >= newItems.length) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to update spaced repetition rating:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'questions') return item.item_type === 'question';
    if (activeTab === 'formulas') return item.item_type === 'formula';
    return true;
  });

  const activeItem = filteredItems[currentIndex];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900/60">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading your review queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" /> Spaced Repetition Recall
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Optimize your memory retention using the scientifically proven SM-2 learning schedule.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold w-fit">
          <button
            onClick={() => { setActiveTab('all'); setCurrentIndex(0); setShowAnswer(false); }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
          >
            All Due ({items.length})
          </button>
          <button
            onClick={() => { setActiveTab('questions'); setCurrentIndex(0); setShowAnswer(false); }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'questions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Questions ({items.filter(i => i.item_type === 'question').length})
          </button>
          <button
            onClick={() => { setActiveTab('formulas'); setCurrentIndex(0); setShowAnswer(false); }}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'formulas' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Formulas ({items.filter(i => i.item_type === 'formula').length})
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-xs font-semibold">
        <div className="bg-white dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Due Today</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{filteredItems.length} items</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Daily Streak</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{streak} Days Streak</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Items Memorized</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{totalReviewed} items</h3>
          </div>
        </div>
      </div>

      {/* Main Review Area */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-md">
          <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6 shadow-sm">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white">All caught up!</h3>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-2.5 max-w-sm mx-auto">
            You have reviewed all due questions and formulas for today. Keep returning daily to strengthen your synaptic connections!
          </p>
          <button
            onClick={fetchDueItems}
            className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card Info Banner */}
          <div className="flex justify-between items-center text-xs font-bold px-1">
            <span className="text-slate-400">
              Reviewing {currentIndex + 1} of {filteredItems.length} due
            </span>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded uppercase text-[10px]">
              {activeItem.subject}
            </span>
          </div>

          {/* Flashcard Container */}
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-105 dark:border-slate-800/80 shadow-md overflow-hidden min-h-[320px] flex flex-col justify-between p-8 relative">
            
            {/* Front of Card */}
            <div className="space-y-4">
              <div className="flex gap-2 items-center text-[10px] font-bold text-slate-400">
                <span>{activeItem.item_type === 'question' ? 'Incorrect Question Review' : 'Formula & Shortcut'}</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">{activeItem.topic}</span>
              </div>

              {activeItem.item_type === 'question' ? (
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-white leading-relaxed">
                    {activeItem.question_text}
                  </h4>
                  
                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeItem.options?.map((option, idx) => {
                      const isCorrect = idx === activeItem.correct_index;
                      const isSelected = idx === selectedOption;
                      
                      let optStyle = 'border-slate-150 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50';
                      if (showAnswer) {
                        if (isCorrect) optStyle = 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
                        else if (isSelected) optStyle = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-450';
                      } else if (isSelected) {
                        optStyle = 'border-blue-500 bg-blue-50/10 text-blue-600';
                      }

                      return (
                        <button
                          key={idx}
                          disabled={showAnswer}
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full p-4 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${optStyle}`}
                        >
                          <span>{option}</span>
                          {showAnswer && isCorrect && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                          {showAnswer && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-base font-black text-slate-850 dark:text-white tracking-tight">
                    {activeItem.title}
                  </h4>
                  
                  {activeItem.shortcut && (
                    <div className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold">
                      Shortcut: {activeItem.shortcut}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Back / Answer Portion */}
            {showAnswer ? (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs font-medium text-slate-650 dark:text-slate-350 leading-relaxed">
                  <p className="font-bold text-slate-850 dark:text-white mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-blue-600" /> 
                    {activeItem.item_type === 'question' ? 'Solution Explanation' : 'Formula Contents'}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {activeItem.item_type === 'question' ? activeItem.explanation : activeItem.content}
                  </p>
                </div>

                {/* SM-2 Recall Rating Panel */}
                <div className="space-y-3">
                  <p className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                    How well did you recall this card?
                  </p>
                  
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { val: 0, label: 'Forgot', style: 'hover:bg-rose-500 hover:text-white text-rose-600 border-rose-200 bg-rose-50/20 dark:bg-rose-950/10 dark:border-rose-900/40' },
                      { val: 1, label: 'Wrong', style: 'hover:bg-orange-500 hover:text-white text-orange-600 border-orange-200 bg-orange-50/20 dark:bg-orange-950/10 dark:border-orange-900/40' },
                      { val: 2, label: 'Close', style: 'hover:bg-amber-500 hover:text-white text-amber-600 border-amber-200 bg-amber-50/20 dark:bg-amber-950/10 dark:border-amber-900/40' },
                      { val: 3, label: 'Hard', style: 'hover:bg-yellow-500 hover:text-white text-yellow-600 border-yellow-200 bg-yellow-50/20 dark:bg-yellow-950/10 dark:border-yellow-900/40' },
                      { val: 4, label: 'Good', style: 'hover:bg-emerald-500 hover:text-white text-emerald-600 border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/10 dark:border-emerald-900/40' },
                      { val: 5, label: 'Easy', style: 'hover:bg-green-600 hover:text-white text-green-600 border-green-200 bg-green-50/20 dark:bg-green-950/10 dark:border-green-900/40' },
                    ].map(rating => (
                      <button
                        key={rating.val}
                        onClick={() => handleRate(rating.val)}
                        className={`py-3 rounded-xl border text-[10px] font-black transition cursor-pointer flex flex-col items-center gap-1 ${rating.style}`}
                      >
                        <span className="text-sm font-black">{rating.val}</span>
                        <span className="font-extrabold uppercase text-[8px] tracking-tight">{rating.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <button
                  onClick={() => {
                    if (activeItem.item_type === 'question' && selectedOption === null) {
                      // Prompt selecting option before show
                      alert("Please select your answer first.");
                      return;
                    }
                    setShowAnswer(true);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 transition shadow-lg shadow-blue-500/20 cursor-pointer text-xs"
                >
                  <HelpCircle className="h-4.5 w-4.5" /> Show Answer & Explanations
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
