'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Bell, 
  HelpCircle, 
  BarChart3, 
  ArrowLeft, 
  Check, 
  Edit, 
  Trash2, 
  Search, 
  Plus, 
  TrendingUp, 
  Settings, 
  Activity, 
  AlertTriangle, 
  RefreshCw,
  Calendar,
  Lock,
  Database,
  Loader2
} from 'lucide-react';

interface AdminDashboardProps {
  session: any;
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

export default function AdminDashboard({ session }: AdminDashboardProps) {
  const client = getClientSupabase(session.user.supabaseAccessToken);

  // Tabs
  const [activeTab, setActiveTab] = useState<'stats' | 'notifications' | 'questions' | 'news' | 'users'>('stats');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Core Data Lists
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    totalQuestions: 0,
    pendingReports: 0
  });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentAffairs, setCurrentAffairs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('Quantitative Aptitude');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);

  // Form States (Editing / Creating)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Load stats
  const fetchStats = async () => {
    try {
      const { count: userCount } = await client.from('users').select('*', { count: 'exact', head: true });
      const { count: testCount } = await client.from('test_sessions').select('*', { count: 'exact', head: true });
      const { count: questionCount } = await client.from('questions').select('*', { count: 'exact', head: true });
      const { count: reportCount } = await client.from('question_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      setStats({
        totalUsers: userCount || 0,
        totalTests: testCount || 0,
        totalQuestions: questionCount || 0,
        pendingReports: reportCount || 0
      });
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  // Load notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await client
        .from('exam_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = client
        .from('questions')
        .select('*')
        .eq('subject', subjectFilter)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery.trim()) {
        query = query.ilike('question_text', `%${searchQuery.trim()}%`);
      }

      const { data } = await query;
      if (data) setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load news
  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await client
        .from('current_affairs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      if (data) setCurrentAffairs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = client.from('users').select('*').order('created_at', { ascending: false });
      if (searchQuery.trim()) {
        query = query.ilike('email', `%${searchQuery.trim()}%`);
      }
      const { data } = await query;
      if (data) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // User History Loading
  const loadUserHistory = async (user: any) => {
    setSelectedUser(user);
    try {
      const { data } = await client
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (data) setUserHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'questions') fetchQuestions();
    if (activeTab === 'news') fetchNews();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // Trigger sync current affairs cron
  const triggerScrapeNews = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/cron-sync', { method: 'POST' });
      if (res.ok) {
        alert("Scraping completed! Reloading news...");
        fetchNews();
      } else {
        alert("Failed to sync news feed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Trigger seed questions
  const triggerSeedQuestions = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/cron-seed-questions', { method: 'POST' });
      if (res.ok) {
        alert("Seeding process started in the background. It will add 50 questions per topic.");
      } else {
        alert("Failed to seed questions.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Verify elements
  const verifyItem = async (table: string, id: string) => {
    try {
      const { error } = await client
        .from(table)
        .update({ is_verified: true })
        .eq('id', id);

      if (error) throw new Error(error.message);
      
      // Update local state list
      if (table === 'questions') {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_verified: true } : q));
      } else if (table === 'exam_notifications') {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_verified: true } : n));
      } else if (table === 'current_affairs') {
        setCurrentAffairs(prev => prev.map(c => c.id === id ? { ...c, is_verified: true } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete elements
  const deleteItem = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);

      if (table === 'questions') {
        setQuestions(prev => prev.filter(q => q.id !== id));
      } else if (table === 'exam_notifications') {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else if (table === 'current_affairs') {
        setCurrentAffairs(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/60 flex flex-col font-sans text-xs font-semibold">
      
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 p-4.5 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition border border-transparent hover:border-slate-150"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-850 dark:text-white tracking-wide">Examiner Panel</h2>
              <p className="text-[10px] text-slate-400 font-medium">Banking Prep Console</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-extrabold uppercase">
            Admin Mode
          </span>
        </div>
      </nav>

      {/* Main Layout Workspace */}
      <div className="flex-grow flex flex-col md:flex-row min-h-0">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-56 bg-white dark:bg-slate-850 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition cursor-pointer ${activeTab === 'stats' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            <BarChart3 className="h-4.5 w-4.5" /> Stats & Dashboard
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition cursor-pointer ${activeTab === 'notifications' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            <Bell className="h-4.5 w-4.5" /> Exam Notifications
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition cursor-pointer ${activeTab === 'questions' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            <HelpCircle className="h-4.5 w-4.5" /> Questions Bank
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition cursor-pointer ${activeTab === 'news' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            <BookOpen className="h-4.5 w-4.5" /> News & Current Affairs
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition cursor-pointer ${activeTab === 'users' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            <Users className="h-4.5 w-4.5" /> User Management
          </button>
        </aside>

        {/* Viewport Content Panel */}
        <main className="flex-grow p-6 overflow-y-auto">
          
          {/* STATS OVERVIEW PANEL */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              {/* Analytics metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Users</span>
                    <h3 className="text-xl font-black text-slate-850 dark:text-white mt-0.5">{stats.totalUsers}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tests Submitted</span>
                    <h3 className="text-xl font-black text-slate-850 dark:text-white mt-0.5">{stats.totalTests}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Questions SeedTests</span>
                    <h3 className="text-xl font-black text-slate-850 dark:text-white mt-0.5">{stats.totalQuestions}</h3>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-rose-100 dark:border-rose-955/20 text-rose-600 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Reports</span>
                    <h3 className="text-xl font-black text-slate-850 dark:text-white mt-0.5">{stats.pendingReports}</h3>
                  </div>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-blue-600" /> Database & Crawler Operations
                </h3>
                <p className="text-[11px] text-slate-450 leading-relaxed font-medium">
                  Trigger background scraper functions and seeding algorithms to scrape banking current affairs feeds or seed fresh, high-quality test questions into targeted roadmap chapters.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    disabled={syncing}
                    onClick={triggerScrapeNews}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    Scrape & Sync News Now
                  </button>

                  <button
                    disabled={syncing}
                    onClick={triggerSeedQuestions}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-205 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Database className="h-4 w-4" />
                    Auto Seed 50 Questions/Topic
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXAM NOTIFICATIONS MANAGER */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Exam Announcements ({notifications.length})</h3>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Organization</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Vacancies</th>
                        <th className="p-4">Exam Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-750 dark:text-slate-250 font-medium">
                      {notifications.map((notif) => (
                        <tr key={notif.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="p-4 font-bold">{notif.organization}</td>
                          <td className="p-4 max-w-[200px] truncate">{notif.title}</td>
                          <td className="p-4">{notif.vacancy_count || 'N/A'}</td>
                          <td className="p-4">{notif.exam_date || 'TBD'}</td>
                          <td className="p-4">
                            {notif.is_verified ? (
                              <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded font-bold uppercase text-[9px]">Verified</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded font-bold uppercase text-[9px]">Pending</span>
                            )}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            {!notif.is_verified && (
                              <button 
                                onClick={() => verifyItem('exam_notifications', notif.id)}
                                className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-950/20 text-green-600 cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteItem('exam_notifications', notif.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* QUESTIONS BANK MANAGER */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              {/* Search & filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer focus:outline-none"
                  >
                    <option value="Quantitative Aptitude">Quant</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="English">English</option>
                    <option value="General Awareness">General Awareness</option>
                    <option value="Computer Awareness">Computer Awareness</option>
                  </select>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search question text..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl focus:outline-none font-bold"
                    />
                  </div>

                  <button
                    onClick={fetchQuestions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded text-[9px] font-bold uppercase">{q.topic}</span>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded text-[9px] font-bold">Diff: {q.difficulty}/10</span>
                          {q.is_verified ? (
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded text-[9px] font-bold uppercase">Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded text-[9px] font-bold uppercase">AI Generated</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!q.is_verified && (
                            <button
                              onClick={() => verifyItem('questions', q.id)}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-950/20 text-green-600 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" /> Verify
                            </button>
                          )}
                          <button
                            onClick={() => deleteItem('questions', q.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="font-bold text-slate-800 dark:text-white leading-relaxed">{q.question_text}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] pl-2">
                        {q.options?.map((opt: string, idx: number) => (
                          <div key={idx} className={`p-2 rounded-lg border ${idx === q.correct_index ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-bold' : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20'}`}>
                            {idx + 1}. {opt}
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 leading-relaxed whitespace-pre-wrap">
                        <span className="font-bold text-slate-655 dark:text-slate-350 block mb-1">Explanation:</span>
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CURRENT AFFAIRS MANAGER */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Current Affairs Articles ({currentAffairs.length})</h3>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {currentAffairs.map((news) => (
                    <div key={news.id} className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded text-[9px] font-bold uppercase">{news.category}</span>
                          <span className="text-slate-400 text-[10px] font-medium">{news.published_at?.split('T')[0]}</span>
                          {news.is_verified ? (
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded text-[9px] font-bold uppercase">Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-955/20 text-amber-600 rounded text-[9px] font-bold uppercase">Pending Review</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!news.is_verified && (
                            <button
                              onClick={() => verifyItem('current_affairs', news.id)}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-950/20 text-green-600 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" /> Verify
                            </button>
                          )}
                          <button
                            onClick={() => deleteItem('current_affairs', news.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-slate-850 dark:text-white text-sm leading-snug">{news.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">{news.content}</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400 font-medium leading-relaxed">
                        <span className="font-bold text-slate-655 dark:text-slate-350 block mb-1">AI Relevance Summary:</span>
                        {news.summary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USER MANAGEMENT & HISTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-slate-850 dark:text-white">Registered Candidates ({users.length})</h3>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 rounded-xl focus:outline-none font-bold"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Candidates List */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-4.5 space-y-3 max-h-[500px] overflow-y-auto">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Candidates</p>
                    <div className="space-y-2">
                      {users.map((u) => {
                        const isSel = selectedUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => loadUserHistory(u)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${isSel ? 'border-blue-500 bg-blue-50/20 text-slate-850 dark:text-white dark:bg-slate-900/60' : 'border-slate-100 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-655'}`}
                          >
                            <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase">
                              {u.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs truncate">{u.name}</div>
                              <div className="text-[9px] text-slate-400 mt-0.5 truncate">{u.email}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Candidate Performance History */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-5 min-h-[350px]">
                    {selectedUser ? (
                      <div className="space-y-4">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-850 dark:text-white">{selectedUser.name}'s History</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{selectedUser.email}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded font-bold uppercase text-[9px]">{selectedUser.role}</span>
                        </div>

                        {userHistory.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 font-bold">
                            No mock test attempts recorded yet.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[380px] overflow-y-auto">
                            {userHistory.map((sess) => (
                              <div key={sess.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-white">{sess.title}</div>
                                  <div className="text-[9px] text-slate-400 mt-0.5 flex gap-2 font-medium">
                                    <span>Date: {sess.completed_at?.split('T')[0]}</span>
                                    <span>•</span>
                                    <span>Time: {Math.floor(sess.time_spent_seconds / 60)} mins</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-sm text-slate-850 dark:text-white">{sess.score_pct}%</div>
                                  <div className="mt-0.5">
                                    {sess.is_cleared ? (
                                      <span className="px-1.5 py-0.2 bg-green-50 dark:bg-green-950/20 text-green-600 rounded uppercase text-[8px] font-black">Cleared</span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-rose-50 dark:bg-rose-955/20 text-rose-600 rounded uppercase text-[8px] font-black">Failed</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 font-bold">
                        Select a candidate from the list to view their comprehensive mock test history and accuracy scores.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
