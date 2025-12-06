import React, { useState, useEffect } from 'react';
import { ShieldCheck, History, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHistoryClick }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">MediGuard</h1>
            <p className="text-xs text-slate-500 font-medium -mt-1 hidden sm:block">AI Compliance Auditor</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Network Status Indicator */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
              isOnline 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <button 
            onClick={onHistoryClick}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors active:scale-95 touch-manipulation"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;