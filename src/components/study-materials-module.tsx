'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  BookMarked, 
  BookOpen, 
  Video, 
  Download, 
  HelpCircle, 
  Bookmark,
  ExternalLink,
  BookmarkCheck
} from 'lucide-react';

export default function StudyMaterialsModule() {
  const { roadmapStructure, currentUser, userProfiles, toggleBookmark } = useAppStore();
  const [activeSubject, setActiveSubject] = useState<'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'>('Quantitative Aptitude');

  const email = currentUser?.email || '';
  const profile = userProfiles[email] || { bookmarks: { studyMaterials: [], roadmapTopics: [] } };
  const bookmarkedTopics = profile.bookmarks.roadmapTopics || [];

  const subjects: ('Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness')[] = [
    'Quantitative Aptitude',
    'Reasoning',
    'English',
    'General Awareness',
    'Computer Awareness'
  ];

  // Group roadmap structure topics by current subject
  const currentTopics = roadmapStructure.filter(t => t.subject === activeSubject);

  const subjectBooks: Record<string, string[]> = {
    'Quantitative Aptitude': [
      'Quantitative Aptitude by R.S. Aggarwal',
      'Fast Track Objective Arithmetic by Rajesh Verma'
    ],
    'Reasoning': [
      'A Modern Approach to Verbal and Non-Verbal Reasoning by R.S. Aggarwal',
      'Analytical Reasoning by M.K. Pandey'
    ],
    'English': [
      'Objective General English by S.P. Bakshi',
      'Word Power Made Easy by Norman Lewis'
    ],
    'General Awareness': [
      'Lucent General Knowledge',
      'Arihant General Knowledge'
    ],
    'Computer Awareness': [
      'Objective Computer Awareness by Arihant'
    ]
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/60 min-h-screen font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BookMarked className="h-6 w-6 text-blue-600" /> Syllabus Study Materials
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Subject-wise notes, handbooks, reference books list, and practice problem lists
        </p>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubject(sub)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
              activeSubject === sub
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Topics and Notes (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {currentTopics.map((topic) => (
            <div 
              key={topic.id}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-150"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight mb-1">
                    {topic.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Topic Level: Chapter {topic.level}
                  </span>
                </div>

                <button
                  onClick={() => toggleBookmark('roadmapTopics', topic.id)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition border ${
                    bookmarkedTopics.includes(topic.id)
                      ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-750 text-slate-450 hover:text-slate-650'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarkedTopics.includes(topic.id) ? 'fill-blue-600 text-blue-600' : ''}`} />
                </button>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Core Revision Notes:</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/35 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                    {topic.notes}
                  </p>
                </div>

                {/* Additional Helpers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Videos */}
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-blue-500" /> Video Tutorials
                    </h5>
                    <div className="space-y-1.5">
                      {topic.videoLinks.map((vid, idx) => (
                        <a
                          key={idx}
                          href={vid.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-900 transition font-bold"
                        >
                          <span className="truncate max-w-[150px]">{vid.title}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Practice Info */}
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-green-500" /> Practical Resources
                    </h5>
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/35 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-550 flex flex-col justify-between h-[52px]">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-500">Practice questions:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{topic.practiceQuestionsCount} problems</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">Standard exam complexity syllabus matching.</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Recommended Books List (1 Column) */}
        <div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-24">
            <h3 className="font-bold text-slate-850 dark:text-white text-base mb-3.5 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" /> Recommended Books
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Standard study curriculum suggested by top teachers and qualifiers for the banking examinations.
            </p>

            <div className="space-y-3.5">
              {subjectBooks[activeSubject].map((book, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
                    {book}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50/40 dark:bg-slate-900/20 rounded-2xl border border-blue-100/50 dark:border-slate-800/50 text-[10px] text-slate-400 text-center font-medium leading-relaxed">
              Available at standard e-commerce stores. Verify updated editions for current patterns.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
