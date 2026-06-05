'use client';

import React, { useState } from 'react';
import { useAppStore, ExamNotification } from '@/lib/store';
import { 
  Search, 
  FileText, 
  Calendar, 
  Bookmark, 
  CheckCircle,
  ExternalLink,
  MapPin,
  TrendingUp,
  Award
} from 'lucide-react';

export default function NotificationsModule() {
  const { notifications, currentUser, userProfiles, toggleBookmark } = useAppStore();
  const [selectedOrg, setSelectedOrg] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { bookmarks: { notifications: [] } };
  const bookmarkedIds = profile.bookmarks.notifications || [];

  const orgs = ['ALL', 'SBI', 'IBPS', 'RBI', 'NABARD', 'LIC'];

  const filteredNotifications = notifications.filter(notif => {
    const matchesOrg = selectedOrg === 'ALL' || notif.organization === selectedOrg;
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.eligibility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOrg && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen">
      {/* Page Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Exam Notifications</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Official announcements, pdf advertisements, and eligibility guidelines
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-slate-400" />
          <input
            type="text"
            placeholder="Search details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {orgs.map((org) => (
            <button
              key={org}
              onClick={() => setSelectedOrg(org)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                selectedOrg === org
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {org}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">No notification matches the filter criteria.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200"
            >
              {/* Card Top */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {notif.organization}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-850 dark:text-white text-base leading-tight">
                      {notif.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> All India Postings
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleBookmark('notifications', notif.id)}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition border ${
                      bookmarkedIds.includes(notif.id)
                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarkedIds.includes(notif.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                  </button>
                  <a
                    href={notif.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.8 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400 rounded-lg text-xs font-bold transition"
                  >
                    <FileText className="h-4 w-4" /> PDF Advt
                  </a>
                </div>
              </div>

              {/* Vacancy & Eligibility Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl mb-5 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Vacancies</h4>
                  <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-base">
                    <TrendingUp className="h-4 w-4 text-green-500" /> {notif.vacancyCount.toLocaleString()} posts
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Eligibility Criteria</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {notif.eligibility}
                  </p>
                </div>
              </div>

              {/* Important Dates Timeline Header */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Critical Deadlines</h4>
              
              {/* Timeline Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40 rounded-xl">
                  <div className="text-slate-400 mb-0.5">Registration Start</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200">{notif.importantDates.registrationStart}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40 rounded-xl">
                  <div className="text-slate-400 mb-0.5">Registration End</div>
                  <div className="font-bold text-rose-600 dark:text-rose-400">{notif.importantDates.registrationEnd}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40 rounded-xl">
                  <div className="text-slate-400 mb-0.5">Prelims Exam</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">{notif.importantDates.examDate}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40 rounded-xl">
                  <div className="text-slate-400 mb-0.5">Final Selection</div>
                  <div className="font-bold text-green-600 dark:text-green-400">{notif.importantDates.finalSelectionDate || 'N/A'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Published on {new Date(notif.created_at).toLocaleDateString()}
                </span>
                
                <a 
                  href={notif.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-0.5 hover:underline"
                >
                  Apply Online <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
