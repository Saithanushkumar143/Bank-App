'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Bell, 
  AlertCircle,
  BellRing
} from 'lucide-react';

export default function CalendarModule() {
  const { notifications, currentUser, userProfiles, addReminder, removeReminder } = useAppStore();
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderType, setNewReminderType] = useState<'30_days' | '10_days' | '2_days' | '1_day'>('1_day');

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { reminders: [] };
  const userReminders = profile.reminders || [];

  // Gather all exam deadlines to list in calendar events
  const calendarEvents: { id: string; title: string; date: string; type: string; org: string }[] = [];

  notifications.forEach(notif => {
    calendarEvents.push({
      id: `${notif.id}_reg_start`,
      org: notif.organization,
      title: `${notif.organization} PO Registration Starts`,
      date: notif.importantDates.registrationStart,
      type: 'registration'
    });
    calendarEvents.push({
      id: `${notif.id}_reg_end`,
      org: notif.organization,
      title: `${notif.organization} PO Registration Ends`,
      date: notif.importantDates.registrationEnd,
      type: 'deadline'
    });
    calendarEvents.push({
      id: `${notif.id}_exam`,
      org: notif.organization,
      title: `${notif.organization} PO Prelims Exam`,
      date: notif.importantDates.examDate,
      type: 'exam'
    });
    calendarEvents.push({
      id: `${notif.id}_result`,
      org: notif.organization,
      title: `${notif.organization} PO Prelims Result`,
      date: notif.importantDates.resultDate,
      type: 'result'
    });
  });

  // Sort calendar events by date
  calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDate) return;

    addReminder({
      title: newReminderTitle,
      date: newReminderDate,
      type: newReminderType
    });

    setNewReminderTitle('');
    setNewReminderDate('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" /> Exam Calendar & Deadlines
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Synchronized timeline of registration dates, exam papers, and your custom study reminders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar Events List (Takes 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <h3 className="font-bold text-slate-850 dark:text-white text-base mb-4 flex items-center gap-2">
              Upcoming Milestones
            </h3>
            
            <div className="space-y-3.5">
              {calendarEvents.map((evt) => {
                const colors = 
                  evt.type === 'deadline' 
                    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' 
                    : evt.type === 'registration'
                    ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                    : evt.type === 'exam'
                    ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';

                return (
                  <div 
                    key={evt.id} 
                    className={`flex items-center justify-between p-4 border rounded-2xl transition duration-150 ${colors}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold px-2 py-0.5 bg-white/60 dark:bg-slate-800/40 rounded uppercase border border-current">
                        {evt.org}
                      </div>
                      <div className="font-bold text-sm tracking-wide">{evt.title}</div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      {evt.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Smart Reminder Engine panel */}
        <div className="space-y-6">
          {/* Custom Reminder Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-850 dark:text-white text-base mb-3.5 flex items-center gap-2">
              <BellRing className="h-5 w-5 text-indigo-500" /> Smart Reminder Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Schedule browser alerts and push tasks before a final deadline (e.g. 30 days, 10 days, 2 days prior).
            </p>

            <form onSubmit={handleCreateReminder} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IBPS fee payment"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Alert Timing</label>
                <select
                  value={newReminderType}
                  onChange={(e) => setNewReminderType(e.target.value as '30_days' | '10_days' | '2_days' | '1_day')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="30_days">30 days before</option>
                  <option value="10_days">10 days before</option>
                  <option value="2_days">2 days before</option>
                  <option value="1_day">1 day before (Critical)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Smart Reminder
              </button>
            </form>
          </div>

          {/* Active Reminders List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4 flex items-center justify-between">
              <span>Active Reminders</span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                {userReminders.length} schedule
              </span>
            </h3>

            {userReminders.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center flex flex-col items-center gap-2">
                <AlertCircle className="h-5 w-5 text-slate-400" />
                <p className="text-slate-400 text-xs">No active smart alerts set.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userReminders.map((rem) => (
                  <div 
                    key={rem.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-700 dark:text-slate-200 leading-snug">{rem.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Due {rem.date} ({rem.type.replace('_', ' ')})
                      </div>
                    </div>

                    <button
                      onClick={() => removeReminder(rem.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
