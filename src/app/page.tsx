'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/sidebar';
import DashboardHome from '@/components/dashboard-home';
import NotificationsModule from '@/components/notifications-module';
import CalendarModule from '@/components/calendar-module';
import TimelineModule from '@/components/timeline-module';
import JobsModule from '@/components/jobs-module';
import CurrentAffairsModule from '@/components/current-affairs-module';
import StudyMaterialsModule from '@/components/study-materials-module';
import RoadmapModule from '@/components/roadmap-module';
import MockTestsModule from '@/components/mock-tests-module';
import AnalyticsModule from '@/components/analytics-module';
import BookmarksModule from '@/components/bookmarks-module';
import ProfileModule from '@/components/profile-module';
import SpacedRepetitionModule from '@/components/spaced-repetition-module';
import DoubtSolver from '@/components/doubt-solver';
import CustomToast from '@/components/custom-toast';
import { Sparkles, Menu, Bell, Clock, Loader2 } from 'lucide-react';

export default function RootPage() {
  const { data: session, status } = useSession();
  const { currentUser, setCurrentUser, userProfiles, syncData, notifications } = useAppStore();
  const [activeTab, setActiveTab] = useState('Home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showMobileBellDropdown, setShowMobileBellDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync NextAuth session user with Zustand store
  useEffect(() => {
    if (session?.user) {
      const sessUser = session.user as any;
      if (!currentUser || currentUser.email !== sessUser.email) {
        setCurrentUser({
          id: sessUser.id || '',
          email: sessUser.email || '',
          name: sessUser.name || '',
          role: sessUser.role || 'student',
          supabaseAccessToken: sessUser.supabaseAccessToken || '',
        });
      }
    } else if (status === 'unauthenticated') {
      setCurrentUser(null);
    }
  }, [session, status, currentUser, setCurrentUser]);

  // Sync active theme class list with document.documentElement
  const profile = currentUser ? userProfiles[currentUser.email] : null;
  const theme = profile?.preferences?.theme || 'light';
  
  const userReminders = profile?.reminders || [];
  const activeReminders = userReminders.filter(r => !r.triggered).slice(0, 3);
  const recentNotifications = notifications?.slice(0, 3) || [];

  const handleReminderClick = () => {
    setShowMobileBellDropdown(false);
    setActiveTab('Calendar');
  };

  const handleNotificationClick = () => {
    setShowMobileBellDropdown(false);
    setActiveTab('Notifications');
  };

  useEffect(() => {
    const isDark = theme === 'dark' || (theme !== 'light' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Trigger auto sync on mount and set up periodic 15-minute sync interval
  useEffect(() => {
    if (currentUser) {
      // Background sync immediately
      syncData();

      // Setup 15-minute background interval
      const syncInterval = setInterval(() => {
        syncData();
      }, 15 * 60 * 1000);

      return () => clearInterval(syncInterval);
    }
  }, [currentUser, syncData]);

  // Mounted state check
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // If not mounted or session loading, render loading spinner
  if (!mounted || status === 'loading' || (status === 'authenticated' && !currentUser)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // If user is not logged in, they will be redirected by middleware, but render fallback just in case
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  // Active Dashboard Layout View
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar component */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main viewport panels */}
      <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Mobile top header bar */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-7 rounded bg-blue-650 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-800 dark:text-white tracking-wide">ExamCompanion</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">
              {activeTab}
            </span>
            
            {/* Mobile Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button 
                  onClick={() => setShowMobileBellDropdown(!showMobileBellDropdown)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 cursor-pointer relative"
                >
                  <Bell className="h-5 w-5" />
                  {(activeReminders.length > 0 || recentNotifications.length > 0) && (
                    <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center border border-white dark:border-slate-900">
                      {activeReminders.length + recentNotifications.length}
                    </span>
                  )}
                </button>

                {showMobileBellDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMobileBellDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-72 max-h-[350px] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-4 text-xs font-semibold text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="font-extrabold text-slate-800 dark:text-white text-xs">Alerts & Reminders</span>
                        <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase">Active</span>
                      </div>
                      
                      <div className="py-2 space-y-3">
                        {/* Reminders */}
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Reminders</div>
                          {activeReminders.length === 0 ? (
                            <div className="text-slate-400 font-normal py-1">No active deadlines.</div>
                          ) : (
                            <div className="space-y-1.5">
                              {activeReminders.map(rem => (
                                <div 
                                  key={rem.id}
                                  onClick={handleReminderClick}
                                  className="p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-855 rounded-xl cursor-pointer flex items-start gap-2"
                                >
                                  <Clock className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-750 dark:text-slate-200 leading-snug line-clamp-2">{rem.title}</p>
                                    <p className="text-[8px] text-slate-400 mt-0.5">Due: {rem.date}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Notifications */}
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Notifications</div>
                          {recentNotifications.length === 0 ? (
                            <div className="text-slate-400 font-normal py-1">No new announcements.</div>
                          ) : (
                            <div className="space-y-1.5">
                              {recentNotifications.map(notif => (
                                <div 
                                  key={notif.id}
                                  onClick={handleNotificationClick}
                                  className="p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-855 rounded-xl cursor-pointer flex flex-col gap-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="px-1 py-0.2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-bold rounded uppercase">
                                      {notif.organization}
                                    </span>
                                  </div>
                                  <p className="text-slate-750 dark:text-slate-200 leading-snug line-clamp-2">{notif.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {activeTab === 'Home' && <DashboardHome setActiveTab={setActiveTab} />}
        {activeTab === 'Notifications' && <NotificationsModule />}
        {activeTab === 'Calendar' && <CalendarModule />}
        {activeTab === 'Timeline' && <TimelineModule />}
        {activeTab === 'Jobs' && <JobsModule />}
        {activeTab === 'Current Affairs' && <CurrentAffairsModule />}
        {activeTab === 'Study Materials' && <StudyMaterialsModule />}
        {activeTab === 'Study Roadmap' && <RoadmapModule setActiveTab={setActiveTab} />}
        {activeTab === 'Mock Tests' && <MockTestsModule />}
        {activeTab === 'Spaced Repetition' && <SpacedRepetitionModule />}
        {activeTab === 'Analytics' && <AnalyticsModule />}
        {activeTab === 'Bookmarks' && <BookmarksModule />}
        {activeTab === 'Profile' && <ProfileModule />}
      </main>

      {/* Floating Doubt Solver Chatbot */}
      <DoubtSolver />

      {/* Global Custom Toast System */}
      <CustomToast />
    </div>
  );
}
