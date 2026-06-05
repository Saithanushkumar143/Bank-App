'use client';

import React from 'react';
import { useAppStore, MockTestHistory } from '@/lib/store';
import { 
  BarChart3, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb, 
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsModule() {
  const { currentUser, userProfiles } = useAppStore();

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { mockTestHistory: [] };
  const history = profile.mockTestHistory || [];

  // Aggregated calculations
  const totalTests = history.length;
  const clearedTests = history.filter(h => h.isCleared).length;

  const totalCorrect = history.reduce((acc, h) => acc + h.correctAnswers, 0);
  const totalWrong = history.reduce((acc, h) => acc + h.wrongAnswers, 0);
  const totalUnattempted = history.reduce((acc, h) => acc + h.unattemptedQuestions, 0);
  const totalAttempted = totalCorrect + totalWrong;

  const avgAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  
  const totalSeconds = history.reduce((acc, h) => acc + h.timeSpentSeconds, 0);
  const avgTimePerTest = totalTests > 0 ? Math.round(totalSeconds / totalTests) : 0;

  // Format time (mm:ss)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  // Pie chart data for correct/incorrect/unattempted
  const pieData = [
    { name: 'Correct', value: totalCorrect, color: '#10b981' },
    { name: 'Wrong', value: totalWrong, color: '#ef4444' },
    { name: 'Unattempted', value: totalUnattempted, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  // Subject-wise performance aggregation
  const subjectAgg: Record<string, { correct: number; total: number; tests: number }> = {};
  history.forEach(h => {
    const sub = h.subject || 'Full-Length';
    if (!subjectAgg[sub]) {
      subjectAgg[sub] = { correct: 0, total: 0, tests: 0 };
    }
    subjectAgg[sub].correct += h.correctAnswers;
    subjectAgg[sub].total += (h.correctAnswers + h.wrongAnswers);
    subjectAgg[sub].tests += 1;
  });

  const subjectData = Object.entries(subjectAgg).map(([name, data]) => ({
    name: name.split(' ')[0], // keep label short
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    tests: data.tests
  }));

  // Identify Weak & Strong Areas
  const strongAreas: string[] = [];
  const weakAreas: string[] = [];

  Object.entries(subjectAgg).forEach(([sub, data]) => {
    const acc = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    if (acc >= 70) {
      strongAreas.push(sub);
    } else if (acc < 60) {
      weakAreas.push(sub);
    }
  });

  // Default fallbacks if no data yet
  if (strongAreas.length === 0 && totalTests > 0) strongAreas.push('General Awareness');
  if (weakAreas.length === 0 && totalTests > 0) weakAreas.push('Quantitative Aptitude');

  // AI Recommendation Engine
  const recommendations: { title: string; desc: string; type: string }[] = [];
  if (totalTests === 0) {
    recommendations.push({
      title: 'Take your first level Mock Test',
      desc: 'Start with Level 1 Full-Length test to establish your baseline score parameters.',
      type: 'mock'
    });
    recommendations.push({
      title: 'Review Quantitative Aptitude Notes',
      desc: 'Go through Chapter 1 "Number System" formulas and watch tutorial clips.',
      type: 'study'
    });
  } else {
    // Subject specific suggestions
    if (weakAreas.includes('Quantitative Aptitude') || weakAreas.includes('Quant')) {
      recommendations.push({
        title: 'Revise Simplification & DI Chapters',
        desc: 'Review speed calculation tips to increase performance in Quant tests.',
        type: 'revision'
      });
      recommendations.push({
        title: 'Retake Level 1 Quant Subject Test',
        desc: 'Work on your accuracy in Quant level tests to raise your score past 60%.',
        type: 'mock'
      });
    }
    if (weakAreas.includes('Reasoning')) {
      recommendations.push({
        title: 'Practice Seating Arrangement Puzzles',
        desc: 'Spend 20 minutes solving circular arrangements to reduce time-per-question metrics.',
        type: 'study'
      });
    }
    if (avgAccuracy < 70) {
      recommendations.push({
        title: 'Focus on Speed-Accuracy trade-off',
        desc: 'Avoid guessing. Mark difficult questions for review and only answer confident questions to raise accuracy above 75%.',
        type: 'revision'
      });
    } else {
      recommendations.push({
        title: 'Advance to the Next Exam Level',
        desc: 'Excellent accuracy! Keep clearing mock test levels to complete the syllabus arcade.',
        type: 'mock'
      });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" /> Performance Analytics
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Real-time correct ratio charts, speed logs, and smart study suggestions
        </p>
      </div>

      {totalTests === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">No Analytics Collected Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Take mock tests, complete syllabus checkpoints, or clear levels. The engine will chart your progress in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Average Accuracy</span>
                <span className="text-xl text-slate-800 dark:text-white font-extrabold">{avgAccuracy}%</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Cleared Levels</span>
                <span className="text-xl text-slate-800 dark:text-white font-extrabold">{clearedTests} / {totalTests}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Time per test</span>
                <span className="text-base text-slate-800 dark:text-white font-extrabold">{formatTime(avgTimePerTest)}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Solved Problems</span>
                <span className="text-xl text-slate-800 dark:text-white font-extrabold">{totalCorrect} MCQ</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Accuracy By Subject Bar Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-105 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4">Subject-wise Accuracy (%)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Answer Distribution Pie Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-105 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4">Problem Solve Ratio</h3>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-1.5 text-[10px] font-bold text-slate-500">
                {pieData.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}</span>
                    <span className="text-slate-700 dark:text-slate-200">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths, Weaknesses, Recommendations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Weak & Strong areas */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-5">
              <div>
                <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <ThumbsUp className="h-4.5 w-4.5 text-emerald-500" /> Strong Domains (&gt;70%)
                </h3>
                <div className="space-y-2">
                  {strongAreas.length === 0 ? (
                    <span className="text-slate-400 text-xs font-semibold">Keep clearing tests to calculate strengths.</span>
                  ) : (
                    strongAreas.map((area, idx) => (
                      <div key={idx} className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs font-bold">
                        {area}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <ThumbsDown className="h-4.5 w-4.5 text-rose-500" /> Focus Domains (&lt;60%)
                </h3>
                <div className="space-y-2">
                  {weakAreas.length === 0 ? (
                    <span className="text-slate-450 text-xs font-semibold">Good job! No critical focus domains.</span>
                  ) : (
                    weakAreas.map((area, idx) => (
                      <div key={idx} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-900 rounded-xl text-xs font-bold">
                        {area}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Smart Recommendations List (2 columns) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" /> Smart Recommendation System
              </h3>
              
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex justify-between items-start gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-750 dark:text-slate-200 mb-0.5">{rec.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">{rec.desc}</p>
                    </div>
                    
                    <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                      {rec.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
