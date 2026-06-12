'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-8 text-center space-y-6 text-xs font-semibold">
        
        <div className="h-16 w-16 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-850 dark:text-white">Something went wrong</h2>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            An unexpected error occurred while rendering this page. You can try resetting the app view or return home.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/10 text-xs"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          
          <Link
            href="/"
            className="w-full py-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition text-xs"
          >
            <Home className="h-4 w-4" /> Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
