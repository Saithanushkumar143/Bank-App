import React from 'react';
import { 
  LayoutDashboard, 
  Bell, 
  Calendar, 
  GitCommit, 
  Briefcase, 
  BookOpen, 
  BookMarked, 
  Compass, 
  Award, 
  BarChart3, 
  Bookmark, 
  User, 
  LogOut,
  Sparkles,
  Sun,
  Moon,
  X,
  Brain
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const logout = useAppStore((state) => state.logout);
  const currentUser = useAppStore((state) => state.currentUser);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const profile = useAppStore((state) => state.userProfiles[currentUser?.email || '']) || {
    preferences: { theme: 'light' }
  };
  const theme = profile.preferences.theme || 'light';
  const isDark = theme === 'dark';

  const menuItems = [
    { name: 'Home', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'Notifications', label: 'Notifications', icon: Bell },
    { name: 'Calendar', label: 'Calendar', icon: Calendar },
    { name: 'Timeline', label: 'Timeline', icon: GitCommit },
    { name: 'Jobs', label: 'Jobs', icon: Briefcase },
    { name: 'Current Affairs', label: 'Current Affairs', icon: BookOpen },
    { name: 'Study Materials', label: 'Study Materials', icon: BookMarked },
    { name: 'Study Roadmap', label: 'Study Roadmap', icon: Compass },
    { name: 'Mock Tests', label: 'Mock Tests', icon: Award },
    { name: 'Spaced Repetition', label: 'Review Queue', icon: Brain },
    { name: 'Analytics', label: 'Analytics', icon: BarChart3 },
    { name: 'Bookmarks', label: 'Bookmarks', icon: Bookmark },
    { name: 'Profile', label: 'Profile', icon: User },
  ];

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    if (onClose) onClose(); // Auto-close drawer on mobile selection
  };

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-45 transform transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } font-sans`}>
        
        {/* Header / Logo */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">ExamCompanion</h1>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Banking Hub</span>
            </div>
          </div>
          
          {/* Close button on mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-450 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Info & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
          
          {/* User Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs flex-shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="text-xs font-semibold text-slate-850 dark:text-slate-200 truncate leading-snug">
                {currentUser?.name || 'Aspirant'}
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>

          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {isDark ? <Sun className="h-4.5 w-4.5 text-yellow-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition duration-200 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 text-rose-500" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
