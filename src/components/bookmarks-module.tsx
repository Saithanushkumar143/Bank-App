'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Bookmark, 
  Trash2, 
  FileText, 
  Briefcase, 
  BookOpen, 
  Compass, 
  ArrowRight,
  BookmarkX
} from 'lucide-react';

export default function BookmarksModule() {
  const { 
    currentUser, 
    userProfiles, 
    notifications, 
    jobs, 
    currentAffairs, 
    roadmapStructure,
    toggleBookmark 
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'jobs' | 'currentAffairs' | 'roadmapTopics'>('notifications');

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || {
    bookmarks: { notifications: [], jobs: [], currentAffairs: [], roadmapTopics: [] }
  };
  const bookmarks = profile.bookmarks || { notifications: [], jobs: [], currentAffairs: [], roadmapTopics: [] };

  // Fetch bookmarks data
  const bookmarkedNotifications = notifications.filter(n => bookmarks.notifications.includes(n.id));
  const bookmarkedJobs = jobs.filter(j => bookmarks.jobs.includes(j.id));
  const bookmarkedArticles = currentAffairs.filter(ca => bookmarks.currentAffairs.includes(ca.id));
  const bookmarkedTopics = roadmapStructure.filter(t => bookmarks.roadmapTopics.includes(t.id));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-blue-600 fill-current" /> Bookmarked Materials
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Access your saved exams, job openings, articles, and syllabus topics
        </p>
      </div>

      {/* Sub tabs switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 text-xs font-bold font-medium text-slate-500">
        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-1.5 pb-3 px-4 border-b-2 cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'border-blue-600 text-blue-650'
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" /> Notifications ({bookmarkedNotifications.length})
        </button>
        <button
          onClick={() => setActiveSubTab('jobs')}
          className={`flex items-center gap-1.5 pb-3 px-4 border-b-2 cursor-pointer ${
            activeSubTab === 'jobs'
              ? 'border-blue-600 text-blue-650'
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Briefcase className="h-4 w-4" /> Jobs ({bookmarkedJobs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('currentAffairs')}
          className={`flex items-center gap-1.5 pb-3 px-4 border-b-2 cursor-pointer ${
            activeSubTab === 'currentAffairs'
              ? 'border-blue-600 text-blue-650'
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          <BookOpen className="h-4 w-4" /> News Articles ({bookmarkedArticles.length})
        </button>
        <button
          onClick={() => setActiveSubTab('roadmapTopics')}
          className={`flex items-center gap-1.5 pb-3 px-4 border-b-2 cursor-pointer ${
            activeSubTab === 'roadmapTopics'
              ? 'border-blue-600 text-blue-650'
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Compass className="h-4 w-4" /> Roadmap Chapters ({bookmarkedTopics.length})
        </button>
      </div>

      {/* Bookmarks List Container */}
      <div className="space-y-4">
        {activeSubTab === 'notifications' && (
          bookmarkedNotifications.length === 0 ? (
            <EmptyState message="No bookmarked exam announcements." />
          ) : (
            bookmarkedNotifications.map((notif) => (
              <BookmarkItemRow 
                key={notif.id}
                title={notif.title}
                tag={notif.organization}
                desc={`Eligibility: ${notif.eligibility}`}
                onRemove={() => toggleBookmark('notifications', notif.id)}
              />
            ))
          )
        )}

        {activeSubTab === 'jobs' && (
          bookmarkedJobs.length === 0 ? (
            <EmptyState message="No bookmarked job listings." />
          ) : (
            bookmarkedJobs.map((job) => (
              <BookmarkItemRow 
                key={job.id}
                title={job.title}
                tag={job.organization}
                desc={`Salary: ${job.salary} • Deadline: ${job.applyDeadline}`}
                onRemove={() => toggleBookmark('jobs', job.id)}
              />
            ))
          )
        )}

        {activeSubTab === 'currentAffairs' && (
          bookmarkedArticles.length === 0 ? (
            <EmptyState message="No bookmarked current affairs articles." />
          ) : (
            bookmarkedArticles.map((art) => (
              <BookmarkItemRow 
                key={art.id}
                title={art.title}
                tag={art.category}
                desc={art.summary}
                onRemove={() => toggleBookmark('currentAffairs', art.id)}
              />
            ))
          )
        )}

        {activeSubTab === 'roadmapTopics' && (
          bookmarkedTopics.length === 0 ? (
            <EmptyState message="No bookmarked syllabus chapters." />
          ) : (
            bookmarkedTopics.map((topic) => (
              <BookmarkItemRow 
                key={topic.id}
                title={topic.name}
                tag={topic.subject.split(' ')[0]}
                desc={topic.notes}
                onRemove={() => toggleBookmark('roadmapTopics', topic.id)}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 p-12 rounded-2xl text-center flex flex-col items-center gap-2">
      <BookmarkX className="h-8 w-8 text-slate-350" />
      <p className="text-slate-400 text-xs font-semibold">{message}</p>
    </div>
  );
}

interface RowProps {
  title: string;
  tag: string;
  desc: string;
  onRemove: () => void;
}

function BookmarkItemRow({ title, tag, desc, onRemove }: RowProps) {
  return (
    <div className="bg-white dark:bg-slate-800 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-slate-200 transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 text-xs">
          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded uppercase">
            {tag}
          </span>
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm leading-snug truncate">
          {title}
        </h4>
        <p className="text-xs text-slate-400 truncate mt-1">
          {desc}
        </p>
      </div>

      <button
        onClick={onRemove}
        className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition border border-slate-150 dark:border-slate-700"
      >
        <Trash2 className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
