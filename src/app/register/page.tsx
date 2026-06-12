"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-8 space-y-6 text-center">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Redirecting to login...</p>
      </div>
    </div>
  );
}
