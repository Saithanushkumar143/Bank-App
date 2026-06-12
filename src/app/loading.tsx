import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-xs font-semibold text-slate-500 font-sans">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="animate-pulse">Loading Banking Exam Companion...</p>
      </div>
    </div>
  );
}
