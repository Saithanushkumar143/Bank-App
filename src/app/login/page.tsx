"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (urlError) {
      if (urlError === "CredentialsSignin") {
        setErrorMsg("Invalid email or password credentials.");
      } else if (urlError.includes("attempts")) {
        setErrorMsg("Too many login attempts. Blocked for 15 minutes.");
      } else {
        setErrorMsg("An error occurred during authentication.");
      }
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        role,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (res.error.includes("attempts") || res.error.includes("Too many")) {
          setErrorMsg("Too many login attempts. Please try again in 15 minutes.");
        } else if (res.error.includes("rate limit") || res.error.includes("Supabase") || res.error.includes("confirm")) {
          setErrorMsg(res.error);
        } else {
          setErrorMsg("Invalid email or password.");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 dark:text-slate-350">Sign in to your Banking Exam Companion</p>
        </div>



        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-450 rounded-2xl flex items-start gap-2 text-xs font-semibold animate-in shake duration-300">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-normal">
              <span className="block font-bold">Sign In Failed</span>
              <span className="text-[10px] font-normal text-rose-600 dark:text-rose-400">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs font-semibold">
          {/* Dummy inputs to absorb browser autofill and password manager suggestions */}
          <input 
            type="text" 
            name="email_fake" 
            style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} 
            tabIndex={-1} 
            autoComplete="off" 
          />
          <input 
            type="password" 
            name="password_fake" 
            style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} 
            tabIndex={-1} 
            autoComplete="off" 
          />

          <div className="space-y-1">
            <label className="block text-slate-400 dark:text-slate-350">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-400 dark:text-slate-350">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="one-time-code"
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-400 dark:text-slate-350">Target Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-xs font-semibold"
            >
              <option value="student">Student</option>
              <option value="admin">Admin (Thanush only)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-1 transition shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
          >
            {loading ? "Signing In..." : "Sign In to Companion"}
          </button>
        </form>



      </div>
    </div>
  );
}
