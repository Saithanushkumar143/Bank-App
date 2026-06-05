'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Bookmark, 
  DollarSign, 
  FileCheck, 
  CalendarDays,
  ExternalLink
} from 'lucide-react';

export default function JobsModule() {
  const { jobs, currentUser, userProfiles, toggleBookmark } = useAppStore();
  const [selectedOrg, setSelectedOrg] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { bookmarks: { jobs: [] } };
  const bookmarkedJobs = profile.bookmarks.jobs || [];

  const orgs = ['ALL', 'SBI', 'IBPS', 'RBI', 'NABARD', 'LIC'];

  const filteredJobs = jobs.filter(job => {
    const matchesOrg = selectedOrg === 'ALL' || job.organization === selectedOrg;
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.eligibility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOrg && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-blue-600" /> Active Job Vacancies
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Explore careers across leading state-owned banking organizations
        </p>
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-slate-400" />
          <input
            type="text"
            placeholder="Search job roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">No active job listings match your parameters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div 
              key={job.id}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/85 p-6 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center rounded-xl text-xs">
                      {job.organization}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-850 dark:text-white text-base leading-tight">
                        {job.title}
                      </h3>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded mt-1.5 inline-block">
                        {job.vacancyCount.toLocaleString()} Vacancies
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBookmark('jobs', job.id)}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition border ${
                      bookmarkedJobs.includes(job.id)
                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarkedJobs.includes(job.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                  </button>
                </div>

                {/* Salary & Eligibility List */}
                <div className="space-y-2.5 my-4">
                  <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350">
                    <DollarSign className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-500">Pay Scale / Salary:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{job.salary}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350">
                    <FileCheck className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-500">Academic Background:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{job.eligibility}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350">
                    <CalendarDays className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-500">Closing Registration Date:</span>
                      <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">{job.applyDeadline}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Pan-India Job Placement
                </span>
                
                <a
                  href={job.officialNotificationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-0.5"
                >
                  Notification Link <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
