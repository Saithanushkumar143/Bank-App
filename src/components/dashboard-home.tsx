'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Bookmark,
  Bell,
  Search,
  BookOpen,
  Award
} from 'lucide-react';
import { useAppStore, getMilestoneInfo } from '@/lib/store';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function DashboardHome({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { 
    currentUser, 
    userProfiles, 
    notifications, 
    currentAffairs, 
    jobs,
    toggleBookmark,
    isSyncing,
    syncData
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || {
    bookmarks: { notifications: [], jobs: [], currentAffairs: [] },
    roadmapProgress: {},
    unlockedLevels: { 'Full-Length': 1 },
    mockTestHistory: []
  };

  // Calculations
  const mockTestHistory = profile.mockTestHistory || [];
  const bookmarks = profile.bookmarks || { notifications: [], jobs: [], currentAffairs: [] };
  const mockTestCount = mockTestHistory.length;
  const clearedCount = mockTestHistory.filter(h => h.isCleared).length;
  const bookmarksCount = 
    (bookmarks.notifications || []).length + 
    (bookmarks.jobs || []).length + 
    (bookmarks.currentAffairs || []).length;

  const topicsCompletedCount = Object.values(profile.roadmapProgress || {}).filter(status => status === 'Completed').length;
  
  const userReminders = profile.reminders || [];
  const activeReminders = userReminders.filter(r => !r.triggered).slice(0, 3);
  const recentNotifications = (notifications || []).slice(0, 3);

  const handleReminderClick = () => {
    setShowBellDropdown(false);
    setActiveTab('Calendar');
  };

  const handleNotificationClick = () => {
    setShowBellDropdown(false);
    setActiveTab('Notifications');
  };
  
  // Calculate average accuracy
  const totalCorrect = mockTestHistory.reduce((acc, h) => acc + h.correctAnswers, 0);
  const totalAttempted = mockTestHistory.reduce((acc, h) => acc + h.correctAnswers + h.wrongAnswers, 0);
  const averageAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Chart data (mock test scores over time)
  const chartData = mockTestHistory.slice().reverse().map((test, index) => ({
    name: `Test ${index + 1}`,
    score: test.scorePct,
    accuracy: Math.round((test.correctAnswers / (test.correctAnswers + test.wrongAnswers || 1)) * 100)
  }));

  // Fallback default chart data if no history yet
  const defaultChartData = [
    { name: 'Jan', score: 20 },
    { name: 'Feb', score: 38 },
    { name: 'Mar', score: 25 },
    { name: 'Apr', score: 45 },
    { name: 'May', score: 40 },
    { name: 'Jun', score: 55 }
  ];

  // Calculate upcoming exam countdowns (e.g. RBI, IBPS)
  const getDaysLeft = (targetDateStr: string) => {
    const today = new Date();
    const target = new Date(targetDateStr);
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : 'Exam Over';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 font-sans bg-slate-50 dark:bg-slate-900/60 min-h-screen">
      {/* Header bar matching the layout */}
      <header className="flex justify-between items-center mb-8 gap-4">
        {/* Search bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications, exams, roadmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Sync & Notification Panel */}
        <div className="flex items-center gap-3">
          <button 
            onClick={syncData}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              isSyncing 
                ? 'bg-slate-100 border-slate-200 text-slate-400 animate-pulse' 
                : 'bg-white hover:bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
            }`}
          >
            {isSyncing ? 'Syncing...' : 'Sync Live Data'}
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowBellDropdown(!showBellDropdown)}
              className="h-10 w-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-350 relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <Bell className="h-5 w-5" />
              {(activeReminders.length > 0 || recentNotifications.length > 0) && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-slate-850">
                  {activeReminders.length + recentNotifications.length}
                </span>
              )}
            </button>

            {showBellDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBellDropdown(false)} />
                <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-4 text-xs font-semibold text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                    <span className="font-extrabold text-slate-800 dark:text-white text-sm">Alerts & Reminders</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Active</span>
                  </div>
                  
                  <div className="py-2 space-y-4">
                    {/* Reminders section */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Upcoming Deadlines</div>
                      {activeReminders.length === 0 ? (
                        <div className="text-slate-400 font-normal py-1">No active deadlines.</div>
                      ) : (
                        <div className="space-y-2">
                          {activeReminders.map(rem => (
                            <div 
                              key={rem.id}
                              onClick={handleReminderClick}
                              className="p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 hover:border-blue-300 dark:hover:border-blue-900 rounded-xl cursor-pointer transition flex items-start gap-2"
                            >
                              <Clock className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-750 dark:text-slate-200 leading-snug line-clamp-2">{rem.title}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">Due: {rem.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notifications section */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Latest Notifications</div>
                      {recentNotifications.length === 0 ? (
                        <div className="text-slate-400 font-normal py-1">No new announcements.</div>
                      ) : (
                        <div className="space-y-2">
                          {recentNotifications.map(notif => (
                            <div 
                              key={notif.id}
                              onClick={handleNotificationClick}
                              className="p-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 hover:border-blue-300 dark:hover:border-blue-900 rounded-xl cursor-pointer transition flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-bold rounded uppercase">
                                  {notif.organization}
                                </span>
                                <span className="text-[8px] text-slate-400 font-normal">
                                  Exam: {notif.importantDates?.examDate}
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
        </div>
      </header>

      {/* Main Title Banner */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight mb-1">
            Aspirant Dashboard & Progress
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Welcome back, {currentUser?.name || 'Aspirant'}. Track your custom milestones and mock tests.
          </p>
        </div>
        {/* Milestone badge */}
        {profile && (
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-xs font-bold ${getMilestoneInfo(profile.unlockedLevels['Full-Length'] || 1).color} shadow-sm transition`}>
            <span className="text-xl">{getMilestoneInfo(profile.unlockedLevels['Full-Length'] || 1).badge}</span>
            <div>
              <div className="uppercase tracking-wider text-[9px] text-slate-400 dark:text-slate-500">Milestone Rank</div>
              <div className="text-slate-750 dark:text-slate-200">{getMilestoneInfo(profile.unlockedLevels['Full-Length'] || 1).rank}</div>
            </div>
          </div>
        )}
      </div>

      {/* 4 Cards Grid - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Level Completed</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{profile.unlockedLevels['Full-Length'] - 1}</span>
            <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
              Level {profile.unlockedLevels['Full-Length']} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5">Mock Test Game Progression</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roadmap Status</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{topicsCompletedCount}</span>
            <span className="text-xs font-semibold text-blue-600">/ 11 Topics</span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5">Completed syllabus chapters</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Accuracy</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{averageAccuracy}%</span>
            <span className="text-xs font-medium text-blue-600 flex items-center gap-0.5">
              {mockTestCount} Tests taken
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5">Correct/Incorrect ratio analytics</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm shadow-slate-100/50 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Items</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{bookmarksCount}</span>
            <span className="text-xs font-medium text-indigo-600">Bookmarks active</span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5">Notifications & jobs bookmarked</p>
        </div>
      </div>

      {/* Main Grid: Chart + Sidebar Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recharts chart card (takes 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Learning Progress</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dynamic performance and test percentage logs</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" /> Score Pct</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : defaultChartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exam Countdowns & Deadlines Sidebar */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" /> Exam Countdowns
          </h3>
          <div className="space-y-4 flex-1">
            {(notifications || []).map((notif) => (
              <div 
                key={notif.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/40 hover:border-blue-200 transition"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded uppercase">
                    {notif.organization}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {getDaysLeft(notif.importantDates.examDate)}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal line-clamp-2">
                  {notif.title}
                </h4>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Exam: {notif.importantDates.examDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Latest News Highlights & Bookmarked Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* News & Current Affairs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" /> Current Affairs & Economy News
            </h3>
            <button 
              onClick={() => setActiveTab('Current Affairs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Read All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {(currentAffairs || []).slice(0, 2).map((article) => (
              <div 
                key={article.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 rounded-2xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full uppercase">
                    {article.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug mb-1">
                  {article.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {article.summary}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <button 
                    onClick={() => toggleBookmark('currentAffairs', article.id)}
                    className="text-slate-400 hover:text-blue-600 transition flex items-center gap-1 text-[11px]"
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${profile.bookmarks.currentAffairs.includes(article.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                    {profile.bookmarks.currentAffairs.includes(article.id) ? 'Saved' : 'Bookmark'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Mock Level Game card */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-950 p-6 rounded-2xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-2xl -z-0" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> Exam Arcade
              </span>
              <span className="text-xs text-blue-300 font-semibold">Unlock Quest</span>
            </div>
            
            <h3 className="text-lg font-bold mb-1 leading-snug">Level-Locked Challenge</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Clear the current level test with a score of 60% or higher to unlock the next dynamic exam level.
            </p>
          </div>

          <div>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Completed Rank</span>
                <span>Level {profile.unlockedLevels['Full-Length']}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((profile.unlockedLevels['Full-Length'] - 1) / 10) * 100)}%` }}
                />
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('Mock Tests')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 transition shadow-lg shadow-blue-500/20"
            >
              Start Game Test <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
