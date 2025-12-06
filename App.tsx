import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Play, AlertCircle, Tag } from 'lucide-react';
import Header from './components/Header';
import SOPPanel from './components/SOPPanel';
import ImageUploadPanel from './components/ImageUploadPanel';
import AuditReport from './components/AuditReport';
import HistoryModal from './components/HistoryModal';
import ConsultantChat from './components/ConsultantChat'; // Import chat component
import { DEFAULT_SOP } from './constants';
import { analyzeCompliance } from './services/geminiService';
import { AuditResult, LoadingState, SavedAudit } from './types';
import { saveAudit, getAudits, deleteAudit, clearHistory } from './services/storageService';

const SOP_STORAGE_KEY = 'mediguard_sop_autosave';

const App: React.FC = () => {
  const [sopText, setSopText] = useState(DEFAULT_SOP);
  const [sessionName, setSessionName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Ref to track latest SOP text for the interval closure
  const sopTextRef = useRef(sopText);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<SavedAudit[]>([]);

  // Update ref whenever sopText changes
  useEffect(() => {
    sopTextRef.current = sopText;
  }, [sopText]);

  // Load history and auto-saved SOP on mount
  useEffect(() => {
    setHistoryItems(getAudits());
    
    const savedSop = localStorage.getItem(SOP_STORAGE_KEY);
    if (savedSop) {
      setSopText(savedSop);
    }
  }, []);

  // Auto-save interval (every 30 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      localStorage.setItem(SOP_STORAGE_KEY, sopTextRef.current);
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Clear results if image changes
  useEffect(() => {
    if (result) {
      setResult(null);
      setStatus('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  const handleAudit = async () => {
    if (!imageFile) {
      setErrorMsg("Please upload a hospital room image first.");
      return;
    }
    if (!sopText.trim()) {
      setErrorMsg("Please provide SOP text.");
      return;
    }

    setStatus('analyzing');
    setErrorMsg(null);
    setResult(null);

    try {
      const data = await analyzeCompliance(sopText, imageFile);
      setResult(data);
      setStatus('complete');
      
      // Auto-save to history with session name
      const newRecord = saveAudit(data, sopText, sessionName);
      setHistoryItems(prev => [newRecord, ...prev]);
      
      // Smooth scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during the audit.");
      setStatus('error');
    }
  };

  const handleSelectHistoryItem = (item: SavedAudit) => {
    setResult(item.result);
    // Restore the exact SOP text used for this audit
    if (item.fullSOP) {
      setSopText(item.fullSOP);
    } else {
      // Fallback for older records that might not have fullSOP
      setSopText(item.sopPreview + "\n\n[Full text not available for this older record]");
    }
    
    // Restore session name
    setSessionName(item.sessionName || "");

    // We cannot restore the image file object from localStorage, 
    // so we clear the image preview to indicate this is a historical record.
    setImageFile(null);
    setImagePreviewUrl(null);
    
    setStatus('complete');
    setIsHistoryOpen(false);
    
    setTimeout(() => {
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteAudit(id);
    setHistoryItems(updated);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all audit history? This cannot be undone.")) {
      clearHistory();
      setHistoryItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header onHistoryClick={() => setIsHistoryOpen(true)} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        
        {/* Intro / Dashboard Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 tracking-tight">New Audit Session</h2>
             <p className="text-slate-500 mt-1">Compare room conditions against safety protocols instantly.</p>
          </div>
          <div className="w-full md:w-1/3">
             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Session Name / Room ID</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Tag className="h-4 w-4 text-slate-400" />
               </div>
               <input 
                 type="text" 
                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm text-sm font-medium"
                 placeholder="e.g. Ward 3B - Room 102"
                 value={sessionName}
                 onChange={(e) => setSessionName(e.target.value)}
               />
             </div>
          </div>
        </div>

        {/* Input Grid - Refined */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 h-auto md:h-[650px] items-stretch">
          <div className="h-[500px] md:h-full w-full">
            <SOPPanel 
              sopText={sopText} 
              setSopText={setSopText} 
              lastSaved={lastSaved}
            />
          </div>
          <div className="h-[500px] md:h-full w-full">
            <ImageUploadPanel 
              imageFile={imageFile} 
              setImageFile={setImageFile}
              imagePreviewUrl={imagePreviewUrl}
              setImagePreviewUrl={setImagePreviewUrl}
              violations={result?.violations}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-center justify-center mb-12 sticky bottom-6 z-20 pointer-events-none">
           <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto transition-all hover:shadow-2xl hover:scale-105">
              <button
                onClick={handleAudit}
                disabled={status === 'analyzing' || !imageFile}
                className={`
                  flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                  ${status === 'analyzing' 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : !imageFile
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30'
                  }
                `}
              >
                {status === 'analyzing' ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Analyzing Compliance...
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 fill-current" />
                    Run Compliance Audit
                  </>
                )}
              </button>
           </div>
           
           {/* Enhanced Error Display */}
           {errorMsg && (
             <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 shadow-lg pointer-events-auto max-w-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <AlertCircle className="h-5 w-5 text-red-600" />
                 <span className="font-bold text-red-700">Audit Failed</span>
               </div>
               <p className="text-sm leading-relaxed opacity-90">{errorMsg}</p>
             </div>
           )}
        </div>

        {/* Results Section */}
        {result && status === 'complete' && (
          <div className="mb-12 scroll-mt-24 transition-all duration-500 ease-in-out" id="results">
             {!imageFile && (
               <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex items-center justify-center text-sm">
                 <span className="font-semibold mr-1">Viewing Historical Record:</span> Original image not available in history view.
               </div>
             )}
            <AuditReport result={result} />
            
            {/* Consultant Chat Section */}
            <div className="mt-8">
               <ConsultantChat result={result} />
            </div>
          </div>
        )}

      </main>

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        audits={historyItems}
        onSelectAudit={handleSelectHistoryItem}
        onDeleteAudit={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
      />

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} MediGuard Systems. AI-Powered Hospital Accreditation Assistant.
        </div>
      </footer>
    </div>
  );
};

export default App;
