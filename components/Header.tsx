import React from 'react';
import { ShieldCheck, History } from 'lucide-react';

interface HeaderProps {
  onHistoryClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHistoryClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">MediGuard</h1>
            <p className="text-xs text-slate-500 font-medium -mt-1">AI Compliance Auditor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onHistoryClick}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;