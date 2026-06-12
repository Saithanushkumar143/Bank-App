'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function CustomToast() {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-500 text-white',
          icon: <CheckCircle2 className="h-5 w-5 flex-shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-500 text-white',
          icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />,
        };
      default:
        return {
          bg: 'bg-blue-600 text-white',
          icon: <Info className="h-5 w-5 flex-shrink-0" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl ${style.bg} font-sans text-xs font-bold`}>
        {style.icon}
        <span className="max-w-xs">{toast.message}</span>
        <button 
          onClick={clearToast}
          className="p-0.5 rounded-lg hover:bg-white/20 transition cursor-pointer ml-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
