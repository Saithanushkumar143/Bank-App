"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, ShieldAlert, UserCheck, ShieldCheck, HelpCircle } from "lucide-react";

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

  const handleQuickLogin = async (demoEmail: string, demoPass: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setRole(demoRole);
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: demoPass,
        role: demoRole,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (res.error.includes("attempts") || res.error.includes("Too many")) {
          setErrorMsg("Too many login attempts. Please try again in 15 minutes.");
        } else if (res.error.includes("rate limit") || res.error.includes("Supabase") || res.error.includes("confirm")) {
          setErrorMsg(res.error);
        } else {
          setErrorMsg(`Invalid credentials. (Ensure this user is added in your Supabase Auth dashboard).`);
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
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-650 text-white shadow-lg shadow-blue-500/20 mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 dark:text-slate-350">Sign in to your Banking Exam Companion</p>
        </div>

        {/* Quick Demo Accounts Selection */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-755 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Quick Demo Login</span>
            <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 rounded text-[9px] font-bold uppercase">Static Users</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin("yegotisaithanushkumar143@gmail.com", "bankpass123", "admin")}
              disabled={loading}
              type="button"
              className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-blue-955/10 border border-slate-200 dark:border-slate-700 rounded-xl transition duration-150 text-left cursor-pointer group font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 group-hover:scale-110 transition duration-150" />
                <div>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Thanush (Admin)</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-450 font-normal">yegotisaithanushkumar143@gmail.com</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 px-1.5 py-0.5 rounded">Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin("yegotisaithanushkumar143@gmail.com", "bankpass123", "student")}
              disabled={loading}
              type="button"
              className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-blue-955/10 border border-slate-200 dark:border-slate-700 rounded-xl transition duration-150 text-left cursor-pointer group font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition duration-150" />
                <div>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Thanush (Student)</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-450 font-normal">yegotisaithanushkumar143@gmail.com</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">Student</span>
            </button>

            <button
              onClick={() => handleQuickLogin("vyshnavirayapudi86@gmail.com", "vyshnavi123", "student")}
              disabled={loading}
              type="button"
              className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-blue-955/10 border border-slate-200 dark:border-slate-700 rounded-xl transition duration-150 text-left cursor-pointer group font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition duration-150" />
                <div>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Vyshnavi (Student)</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-450 font-normal">vyshnavirayapudi86@gmail.com</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">Student</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-955/20 dark:border-rose-900/50 dark:text-rose-450 rounded-2xl flex items-start gap-2 text-xs font-semibold animate-in shake duration-300">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-normal">
              <span className="block font-bold">Sign In Failed</span>
              <span className="text-[10px] font-normal text-rose-550 dark:text-rose-400">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
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
            className="w-full py-3 bg-blue-650 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-1 transition shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
          >
            {loading ? "Signing In..." : "Sign In to Companion"}
          </button>
        </form>

        {/* Supabase Dashboard Setup Instructions Alert */}
        <div className="p-3.5 bg-blue-50/50 dark:bg-slate-905/20 border border-blue-100/50 dark:border-slate-750 text-slate-500 dark:text-slate-400 rounded-2xl flex items-start gap-3 text-[10px] leading-relaxed font-normal">
          <HelpCircle className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-bold text-slate-800 dark:text-slate-200">First-Time Setup Instructions</p>
            <p>If login fails, the users may not exist in your hosted Supabase Auth database yet:</p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Open your **Supabase Dashboard** for this project.</li>
              <li>Go to **Authentication** &rarr; **Users** &rarr; **Add User** &rarr; **Create User**.</li>
              <li>Add `yegotisaithanushkumar143@gmail.com` with password `bankpass123` and `vyshnavirayapudi86@gmail.com` with password `vyshnavi123`.</li>
              <li>Ensure **Auto-confirm User** is checked.</li>
              <li>*Alternatively*, disable **"Confirm email"** in **Authentication** &rarr; **Providers** &rarr; **Email** to allow automated setup upon first login attempt.</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
