'use client';

import React, { useState } from 'react';
import { useAppStore, ExamNotification } from '@/lib/store';
import { 
  GitCommit, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  CalendarDays
} from 'lucide-react';

export default function TimelineModule() {
  const { notifications } = useAppStore();
  const safeNotifs = notifications || [];
  const [selectedNotifId, setSelectedNotifId] = useState<string>(safeNotifs[0]?.id || '');

  const activeNotif = safeNotifs.find(n => n.id === selectedNotifId) || safeNotifs[0];

  if (!activeNotif) {
    return (
      <div className="flex-1 p-6 text-center text-slate-400">
        No notification loaded for timeline calculation.
      </div>
    );
  }

  const stages = [
    { label: 'Notification Release', date: activeNotif.importantDates.notificationRelease, key: 'notif_release' },
    { label: 'Registration Start', date: activeNotif.importantDates.registrationStart, key: 'reg_start' },
    { label: 'Registration End', date: activeNotif.importantDates.registrationEnd, key: 'reg_end' },
    { label: 'Fee Payment Deadline', date: activeNotif.importantDates.feeDeadline, key: 'fee_deadline' },
    { label: 'Admit Card Release', date: activeNotif.importantDates.admitCardRelease, key: 'admit_card' },
    { label: 'Exam Date (Prelims)', date: activeNotif.importantDates.examDate, key: 'exam_prelims' },
    { label: 'Result Date', date: activeNotif.importantDates.resultDate, key: 'result_prelims' },
    { label: 'Interview Stage', date: activeNotif.importantDates.interviewDate || '', key: 'interview' },
    { label: 'Final Selection List', date: activeNotif.importantDates.finalSelectionDate || '', key: 'final_selection' }
  ].filter(s => s.date !== ''); // Filter out missing optional dates

  // Calculate which stage is active based on current time
  const getStageStatus = (stageDateStr: string, idx: number) => {
    const today = new Date();
    const stageDate = new Date(stageDateStr);
    
    // Check if today is past the stage date
    if (today.getTime() > stageDate.getTime()) {
      return 'completed';
    }

    // Check if this is the first stage that hasn't happened yet (active stage)
    const prevStagesPassed = stages.slice(0, idx).every(s => today.getTime() > new Date(s.date).getTime());
    if (prevStagesPassed) {
      return 'active';
    }

    return 'upcoming';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <GitCommit className="h-6 w-6 text-blue-600 rotate-90" /> Interactive Timeline View
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Step-by-step roadmap tracking the recruitment cycles from initial release to final results
          </p>
        </div>

        {/* Select Exam Dropdown */}
        <select
          value={selectedNotifId}
          onChange={(e) => setSelectedNotifId(e.target.value)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {safeNotifs.map((notif) => (
            <option key={notif.id} value={notif.id}>
              {notif.organization} - {notif.title.slice(0, 30)}...
            </option>
          ))}
        </select>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
        
        {/* Active Exam Summary Card */}
        <div className="p-4 bg-blue-50/40 dark:bg-slate-900/30 border border-blue-100/50 dark:border-slate-700/30 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-extrabold text-blue-600 dark:text-blue-400 text-sm uppercase tracking-wider mb-1">
              Recruitment Path: {activeNotif.organization} PO
            </h3>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {activeNotif.title}
            </p>
          </div>
          <a
            href={activeNotif.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <CalendarDays className="h-4 w-4" /> Download Schedule Details
          </a>
        </div>

        {/* Vertical Stepper Timeline */}
        <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-700/60 ml-3 space-y-8 py-2">
          {stages.map((stage, idx) => {
            const status = getStageStatus(stage.date, idx);
            
            // Icon color mappings
            let statusColor = 'bg-slate-200 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-600';
            let outlineColor = 'border-slate-100 dark:border-slate-800';

            if (status === 'completed') {
              statusColor = 'bg-emerald-500 text-white border-emerald-500';
              outlineColor = 'border-emerald-100 dark:border-emerald-950/40';
            } else if (status === 'active') {
              statusColor = 'bg-blue-600 text-white border-blue-600 animate-pulse';
              outlineColor = 'border-blue-100 dark:border-blue-950/40';
            }

            return (
              <div key={stage.key} className="relative group">
                
                {/* Node Dot Icon */}
                <div className={`absolute -left-[45px] top-0 h-8 w-8 rounded-full border-4 flex items-center justify-center transition duration-200 z-10 ${statusColor} ${outlineColor}`}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status === 'active' ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <div className="h-1.5 w-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h4 className={`font-bold text-sm leading-snug transition-colors ${
                      status === 'active' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : status === 'completed'
                        ? 'text-slate-800 dark:text-slate-250'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {stage.label}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Syllabus & application deadline
                    </p>
                  </div>

                  {/* Stage Date Label */}
                  <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
                    status === 'active'
                      ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20'
                      : status === 'completed'
                      ? 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-800/40 dark:border-slate-700/40'
                      : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800/20 dark:border-slate-800'
                  }`}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {stage.date}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
