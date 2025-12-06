
import React from 'react';
import { ShieldCheck, History, Wifi, WifiOff, Globe, RefreshCw, Moon, Sun } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  onHistoryClick: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
  isOnline: boolean;
  isSyncing?: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onHistoryClick, 
  language, 
  setLanguage, 
  t, 
  isOnline,
  isSyncing = false,
  theme,
  setTheme
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.appTitle}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:block">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Network Status Indicator */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
              isOnline 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isSyncing ? t.syncing : (isOnline ? t.online : t.offline)}
            </span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'light' ? t.darkMode : t.lightMode}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Language Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'EN' : 'ID'}</span>
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-100 dark:border-slate-800 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => setLanguage('en')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-lg ${language === 'en' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('id')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 last:rounded-b-lg ${language === 'id' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Indonesia
              </button>
            </div>
          </div>

          <button 
            onClick={onHistoryClick}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors active:scale-95 touch-manipulation"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t.history}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
