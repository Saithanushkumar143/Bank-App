'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  BookOpen, 
  Play, 
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { useEffect } from 'react';

interface RoadmapModuleProps {
  setActiveTab: (tab: string) => void;
}

export default function RoadmapModule({ setActiveTab }: RoadmapModuleProps) {
  const { 
    roadmapStructure, 
    currentUser, 
    userProfiles, 
    updateRoadmapTopicStatus,
    setActiveTestTopic
  } = useAppStore();
  const [activeSubject, setActiveSubject] = useState<'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'>('Quantitative Aptitude');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Study Timer States
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerTopicId, setTimerTopicId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerTopicId) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerTopicId]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartTimer = (topicId: string) => {
    if (timerTopicId && timerTopicId !== topicId && timerSeconds > 0) {
      if (!confirm("Starting a study study timer here will discard your active unsaved timer on the other topic. Proceed?")) {
        return;
      }
    }
    setTimerTopicId(topicId);
    setTimerSeconds(0);
    setTimerActive(true);
  };

  const handleLogSession = async (topicId: string) => {
    const minutesToLog = Math.max(1, Math.round(timerSeconds / 60));
    setTimerActive(false);
    
    const logStudyTime = useAppStore.getState().logStudyTime;
    await logStudyTime(topicId, minutesToLog);

    setTimerTopicId(null);
    setTimerSeconds(0);
    alert(`Logged ${minutesToLog} minutes of study time for this topic!`);
  };

  const handleResetTimer = () => {
    setTimerTopicId(null);
    setTimerSeconds(0);
    setTimerActive(false);
  };

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { roadmapProgress: {}, unlockedLevels: { 'Full-Length': 1 } };
  const progressMap = profile.roadmapProgress || {};

  const subjects: ('Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness')[] = [
    'Quantitative Aptitude',
    'Reasoning',
    'English',
    'General Awareness',
    'Computer Awareness'
  ];

  const currentTopics = roadmapStructure.filter(t => t.subject === activeSubject);

  const getStatusColor = (status: 'Locked' | 'Learning' | 'Practicing' | 'Completed') => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      case 'Practicing':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900';
      case 'Learning':
        return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800';
    }
  };

  const getSubjectProgress = (subName: string) => {
    const subTopics = roadmapStructure.filter(t => t.subject === subName);
    const completed = subTopics.filter(t => (progressMap[t.id] || (t.level === 1 ? 'Learning' : 'Locked')) === 'Completed').length;
    return {
      completed,
      total: subTopics.length,
      percentage: subTopics.length > 0 ? Math.round((completed / subTopics.length) * 100) : 0
    };
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Compass className="h-6 w-6 text-blue-600" /> Syllabus Preparation Roadmap
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Follow a structured path to master subjects for IBPS PO, from basics to test level
        </p>
      </div>

      {/* Grid: Subject Progression Blocks + Tree */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {subjects.map((sub) => {
          const stats = getSubjectProgress(sub);
          const isActive = activeSubject === sub;
          return (
            <button
              key={sub}
              onClick={() => {
                setActiveSubject(sub);
                setExpandedTopicId(null);
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                isActive 
                  ? 'bg-white border-blue-500 dark:bg-slate-800 shadow-sm' 
                  : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 w-full">
                <span className={`text-[9px] font-bold uppercase tracking-wider block ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                  {sub.split(' ')[0]} Subject
                </span>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-1 truncate w-full">{sub}</h4>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-4">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                  <span>{stats.completed} / {stats.total} chapters</span>
                  <span>{stats.percentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-350"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Roadmap Tree (Accordion List) */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        <h3 className="font-bold text-slate-850 dark:text-white text-base mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" /> Mastery Checklist
        </h3>

        <div className="space-y-4">
          {currentTopics.map((topic, index) => {
            const defaultStatus = topic.level === 1 ? 'Learning' : 'Locked';
            const status = progressMap[topic.id] || defaultStatus;
            const isExpanded = expandedTopicId === topic.id;

            return (
              <div 
                key={topic.id}
                className={`border rounded-2xl transition duration-150 overflow-hidden ${
                  isExpanded
                    ? 'border-blue-200 dark:border-blue-900 bg-slate-50/20 dark:bg-slate-900/10'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                {/* Header */}
                <div 
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none text-xs font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-slate-400 w-6 text-center">#{index + 1}</div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{topic.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Chapter difficulty matches IBPS PO XIV prelims patterns</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] border font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                      {status}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-xs space-y-4">
                    {/* Notes summary */}
                    <div>
                      <h5 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> Topic notes & core formulas
                      </h5>
                      <p className="text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                        {topic.notes}
                      </p>
                    </div>

                    {/* Book & Videos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div>
                        <h6 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Compass className="h-3.5 w-3.5" /> Reference standard book
                        </h6>
                        <ul className="list-disc list-inside text-slate-660 dark:text-slate-350 space-y-1 font-semibold">
                          {topic.recommendedBooks.map((book, bIdx) => <li key={bIdx}>{book}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Play className="h-3.5 w-3.5" /> Quick lecture clips
                        </h6>
                        <div className="space-y-1">
                          {topic.videoLinks.map((vid, vIdx) => (
                            <a 
                              key={vIdx} 
                              href={vid.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold block"
                            >
                              {vid.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Study Session Timer */}
                    <div className="bg-slate-100/50 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h6 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Study Session Timer</h6>
                          <p className="text-[10px] text-slate-400 font-medium">Total time logged: <span className="font-bold text-slate-600 dark:text-slate-350">{profile.roadmapTimeSpent?.[topic.id] || 0} minutes</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {timerTopicId === topic.id ? (
                          <div className="flex items-center gap-3">
                            <span className="font-black text-xs text-blue-600 dark:text-blue-400 font-mono">
                              {formatTime(timerSeconds)}
                            </span>
                            <button
                              onClick={() => setTimerActive(!timerActive)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-bold transition cursor-pointer text-[10px]"
                            >
                              {timerActive ? 'Pause' : 'Resume'}
                            </button>
                            <button
                              onClick={() => handleLogSession(topic.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition cursor-pointer shadow-sm shadow-blue-500/10 text-[10px]"
                            >
                              Log {Math.max(1, Math.round(timerSeconds / 60))} Min
                            </button>
                            <button
                              onClick={handleResetTimer}
                              className="p-1.5 text-slate-400 hover:text-slate-500 cursor-pointer"
                              title="Cancel Timer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartTimer(topic.id)}
                            className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-205 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-[10px]"
                          >
                            <Play className="h-3.5 w-3.5 text-blue-600" /> Start Studying
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Topic Test Actions and Completion Status */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <button
                          onClick={() => {
                            setActiveTestTopic({ subject: topic.subject, topic: topic.name });
                            setActiveTab('Mock Tests');
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/10 cursor-pointer"
                        >
                          <Award className="h-3.5 w-3.5" /> Start Topic Test
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto sm:justify-end">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Set status:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {(['Locked', 'Learning', 'Practicing', 'Completed'] as const).map((stat) => (
                            <button
                              key={stat}
                              onClick={() => updateRoadmapTopicStatus(topic.id, stat)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                status === stat
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 hover:bg-slate-50'
                              }`}
                            >
                              {stat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
