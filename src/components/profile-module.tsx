'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  User, 
  Settings, 
  Target, 
  ShieldAlert,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function ProfileModule() {
  const { 
    currentUser, 
    userProfiles, 
    updateUserPreferences,
    clearUserProfileData,
    logout
  } = useAppStore();

  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState('');

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || {
    preferences: {
      theme: 'light',
      targetExams: [],
      enableBrowserNotifications: true,
      enableGoogleCalendarSync: false
    },
    mockTestHistory: []
  };

  const toggleTargetExam = (exam: string) => {
    const currentTargets = profile.preferences.targetExams || [];
    const newTargets = currentTargets.includes(exam)
      ? currentTargets.filter(e => e !== exam)
      : [...currentTargets, exam];

    updateUserPreferences({ targetExams: newTargets });
  };

  const handleClearDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClearError('');
    setClearSuccess('');

    if (!currentUser) return;

    if (confirmDeleteInput.trim().toUpperCase() !== 'DELETE') {
      setClearError('Please type "DELETE" to confirm.');
      return;
    }

    clearUserProfileData(currentUser.email);
    setConfirmDeleteInput('');
    setClearSuccess('Profile data cleared successfully! Reloading...');
    
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" /> User Profile & Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Manage your account preferences, target exams, and data sync settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Settings and preferences (Takes 2 Columns) */}
        <div className="lg:col-span-2 space-y-6 text-xs font-semibold">
          
          {/* Target exams card */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-850 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-blue-600" /> Target Banking Exams
            </h3>
            
            <div className="flex flex-wrap gap-2.5 font-bold">
              {['SBI PO', 'IBPS PO', 'RBI Grade B', 'NABARD Grade A', 'LIC AAO'].map((exam) => {
                const isSelected = (profile.preferences.targetExams || []).includes(exam);
                return (
                  <button
                    key={exam}
                    onClick={() => toggleTargetExam(exam)}
                    className={`px-4 py-2 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:text-slate-350'
                    }`}
                  >
                    {exam}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences Settings */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-blue-600" /> Application Preferences
            </h3>

            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-750 dark:text-slate-200">Push Browser Notifications</h4>
                <p className="text-[10px] text-slate-400 font-medium">Alert me 10 days and 2 days before registration closing deadlines</p>
              </div>
              <button
                onClick={() => updateUserPreferences({ 
                  enableBrowserNotifications: !profile.preferences.enableBrowserNotifications 
                })}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-250 cursor-pointer ${
                  profile.preferences.enableBrowserNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-250 ${
                  profile.preferences.enableBrowserNotifications ? 'translate-x-5.5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-750 dark:text-slate-200">Google Calendar Synchronization</h4>
                <p className="text-[10px] text-slate-400 font-medium">Export exam dates and custom alerts directly to Google Calendar account</p>
              </div>
              <button
                onClick={() => updateUserPreferences({ 
                  enableGoogleCalendarSync: !profile.preferences.enableGoogleCalendarSync 
                })}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-250 cursor-pointer ${
                  profile.preferences.enableGoogleCalendarSync ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-250 ${
                  profile.preferences.enableGoogleCalendarSync ? 'translate-x-5.5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Danger Zone: Clear Profile Data */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-rose-100 dark:border-rose-950/40 shadow-sm shadow-rose-50/10 space-y-4">
            <h3 className="font-extrabold text-rose-650 dark:text-rose-450 text-sm flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" /> Danger Zone: Erase Profile Data
            </h3>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Permanently erase all mock test history, bookmarks, calendar reminders, and roadmap chapter progress. This action is irreversible.
            </p>

            <form onSubmit={handleClearDataSubmit} className="space-y-3 max-w-sm">
              {clearError && (
                <p className="text-[10px] text-rose-650 font-bold bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-100 dark:border-rose-900/40 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> {clearError}
                </p>
              )}
              {clearSuccess && (
                <p className="text-[10px] text-green-600 font-bold bg-green-50 dark:bg-green-950/30 p-2 rounded-lg border border-green-100 dark:border-green-900/40">
                  {clearSuccess}
                </p>
              )}
              
              <div className="space-y-1">
                <label className="block text-slate-450 text-[10px]">Type <span className="font-bold text-rose-600">DELETE</span> to confirm</label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={confirmDeleteInput}
                  onChange={(e) => setConfirmDeleteInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 transition shadow-lg shadow-rose-500/10 cursor-pointer text-xs"
              >
                Erase Profile Data
              </button>
            </form>
          </div>
        </div>

        {/* Account Info Sidebar (1 Column) */}
        <div className="space-y-6 text-xs">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-blue-600" /> Account Information
            </h3>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-850 dark:text-white text-xs truncate">{currentUser?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser?.email}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Access Role</span>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold rounded uppercase">
                  {currentUser?.role || 'student'}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              type="button"
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-2xl font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Database isolation warning */}
          <div className="bg-blue-50/30 dark:bg-slate-900/20 border border-blue-100/50 dark:border-slate-800/80 p-5 rounded-2xl flex gap-3 text-xs leading-normal">
            <ShieldAlert className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-slate-750 dark:text-slate-350">Completely Isolated Profiles</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Bookmarks, completed mock levels, syllabus status checkers, and preferences are saved independently in separate profile slots in accordance with database isolation mandates.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
