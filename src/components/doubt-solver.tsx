'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minus, 
  Maximize2, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  question: string;
  answer: string;
  is_helpful?: boolean | null;
  created_at?: string;
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

export default function DoubtSolver() {
  const { currentUser } = useAppStore();
  const client = getClientSupabase(currentUser?.supabaseAccessToken);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat history from DB on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!currentUser) return;
      setFetchingHistory(true);
      try {
        const { data, error } = await client
          .from('doubts')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw new Error(error.message);
        if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setFetchingHistory(false);
      }
    };

    if (isOpen && messages.length === 0) {
      fetchChatHistory();
    }
  }, [isOpen, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const questionText = inputVal.trim();
    setInputVal('');
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/doubt-solver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: questionText })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to solve doubt');
      }

      if (data.success && data.doubt) {
        setMessages(prev => [...prev, data.doubt]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRateHelpfulness = async (msgIndex: number, helpful: boolean) => {
    const msg = messages[msgIndex];
    if (!msg?.id) return;

    try {
      const { error } = await client
        .from('doubts')
        .update({ is_helpful: helpful })
        .eq('id', msg.id);

      if (error) throw new Error(error.message);

      setMessages(prev => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], is_helpful: helpful };
        return updated;
      });
    } catch (err) {
      console.error("Failed to update helpfulness rating:", err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-45 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 transition-all duration-200 cursor-pointer relative group"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-10 right-0 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md">
            Ask Doubt Solver
          </span>
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[360px] h-[500px] md:w-[400px] md:h-[550px] bg-white dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-xs font-semibold">
          
          {/* Header */}
          <div className="p-4 bg-blue-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">AI Doubt Solver</h3>
                <p className="text-[10px] text-blue-200 font-medium">Banking Syllabus Expert Tutor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
            {fetchingHistory ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-[10px] text-slate-400 font-medium">Loading history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bot className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-850 dark:text-white">Ask your first doubt!</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed max-w-[240px]">
                  Ask questions on Quantitative Aptitude, Logical Reasoning, English, current affairs, or banking regulations.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="space-y-3">
                  {/* User Question */}
                  <div className="flex justify-end items-start gap-2 max-w-[85%] ml-auto">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.question}
                    </div>
                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] text-blue-700 dark:text-blue-300 font-extrabold flex-shrink-0">
                      U
                    </div>
                  </div>

                  {/* Bot Answer */}
                  <div className="flex justify-start items-start gap-2 max-w-[85%]">
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-655 dark:text-slate-400 flex-shrink-0">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-2xl rounded-tl-none shadow-sm leading-relaxed whitespace-pre-wrap text-slate-750 dark:text-slate-200 font-medium">
                        {msg.answer}
                      </div>
                      
                      {/* Helpfulness buttons */}
                      {msg.id && (
                        <div className="flex items-center gap-2 pl-1">
                          <span className="text-[9px] text-slate-400 font-medium">Helpful?</span>
                          <button
                            onClick={() => handleRateHelpfulness(idx, true)}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${msg.is_helpful === true ? 'text-green-600' : 'text-slate-400'}`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRateHelpfulness(idx, false)}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${msg.is_helpful === false ? 'text-rose-600' : 'text-slate-400'}`}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading / Typing indicator */}
            {loading && (
              <div className="flex justify-start items-start gap-2 max-w-[85%] animate-pulse">
                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Solving your doubt...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-2 leading-relaxed">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-850 flex gap-2">
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Ask an exam doubt (e.g. solve a math formula)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="h-9.5 w-9.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition cursor-pointer flex-shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
