
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Play, AlertCircle, Tag, LayoutDashboard, FileCheck, Save, RefreshCw, CheckCircle } from 'lucide-react';
import Header from './components/Header';
import SOPPanel from './components/SOPPanel';
import ImageUploadPanel from './components/ImageUploadPanel';
import AuditReport from './components/AuditReport';
import HistoryModal from './components/HistoryModal';
import ConsultantChat from './components/ConsultantChat'; // Import chat component
import AnalyticsDashboard from './components/AnalyticsDashboard'; // Import analytics
import { DEFAULT_SOP } from './constants';
import { analyzeCompliance } from './services/geminiService';
import { AuditResult, LoadingState, SavedAudit, Language, PendingAudit } from './types';
import { saveAudit, getAudits, deleteAudit, clearHistory, savePendingAudit, getPendingAudits, removePendingAudit } from './services/storageService';
import { TRANSLATIONS } from './constants/translations';

const SOP_STORAGE_KEY = 'mediguard_sop_autosave';
const THEME_STORAGE_KEY = 'mediguard_theme';

const App: React.FC = () => {
  const [sopText, setSopText] = useState(DEFAULT_SOP);
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'audit' | 'analytics'>('audit');

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingAudits, setPendingAudits] = useState<PendingAudit[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Language State
  const [language, setLanguage] = useState<Language>('en');
  const t = TRANSLATIONS[language];

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'light';
  });

  // Ref to track latest SOP text for the interval closure
  const sopTextRef = useRef(sopText);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<SavedAudit[]>([]);

  // Update ref whenever sopText changes
  useEffect(() => {
    sopTextRef.current = sopText;
  }, [sopText]);

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Load history, pending queue and auto-saved SOP on mount
  useEffect(() => {
    setHistoryItems(getAudits());
    setPendingAudits(getPendingAudits());
    
    const savedSop = localStorage.getItem(SOP_STORAGE_KEY);
    if (savedSop) {
      setSopText(savedSop);
    }
    
    // Online Status Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
    // Check if either text OR file is provided
    if (!sopText.trim() && !sopFile) {
      setErrorMsg("Please provide SOP text or upload a PDF document.");
      return;
    }

    // OFFLINE FLOW
    if (!isOnline) {
      try {
        await savePendingAudit(imageFile, sopText, sessionName, sopFile || undefined);
        setPendingAudits(getPendingAudits()); // Update UI count
        
        // Reset Inputs
        setImageFile(null);
        setImagePreviewUrl(null);
        setSessionName("");
        
        // Show Success
        setSuccessToast(t.savedToQueue);
        setTimeout(() => setSuccessToast(null), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to save offline audit.");
      }
      return;
    }

    // ONLINE FLOW
    setStatus('analyzing');
    setErrorMsg(null);
    setResult(null);

    try {
      // Pass sopFile (can be undefined) to the service
      const data = await analyzeCompliance(sopText, imageFile, sopFile || undefined, language);
      setResult(data);
      setStatus('complete');
      
      // Auto-save to history with session name
      // If using file, we save a note about the file instead of full text
      const storedSopText = sopFile ? `[PDF Audit] Used document: ${sopFile.name}` : sopText;
      const newRecord = saveAudit(data, storedSopText, sessionName);
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

  const handleSyncPending = async () => {
    if (pendingAudits.length === 0 || !isOnline) return;
    
    setIsSyncing(true);
    let successCount = 0;

    for (const pending of pendingAudits) {
      try {
        // Call analyzeCompliance using Base64 strings from pending audit
        const result = await analyzeCompliance(
          pending.sopText, 
          pending.imageBase64, 
          pending.sopFileBase64 || undefined, 
          language
        );
        
        // Save to History
        const storedSopText = pending.sopFileBase64 ? `[PDF Audit] Offline Sync` : pending.sopText;
        const newRecord = saveAudit(result, storedSopText, pending.sessionName);
        
        // Remove from Queue
        removePendingAudit(pending.id);
        successCount++;
        
      } catch (error) {
        console.error(`Failed to sync audit ${pending.id}`, error);
        // Continue to next item even if one fails
      }
    }

    setPendingAudits(getPendingAudits()); // Update list
    setHistoryItems(getAudits()); // Update history
    setIsSyncing(false);
    
    if (successCount > 0) {
      setSuccessToast(t.syncComplete);
      setTimeout(() => setSuccessToast(null), 3000);
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
    
    // Ensure we are in text mode when restoring history
    setSopFile(null);
    
    // Restore session name
    setSessionName(item.sessionName || "");

    // We cannot restore the image file object from localStorage, 
    // so we clear the image preview to indicate this is a historical record.
    setImageFile(null);
    setImagePreviewUrl(null);
    
    setStatus('complete');
    setIsHistoryOpen(false);
    setCurrentView('audit'); // Switch back to audit view
    
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header 
        onHistoryClick={() => setIsHistoryOpen(true)} 
        language={language}
        setLanguage={setLanguage}
        t={t}
        isOnline={isOnline}
        isSyncing={isSyncing}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Sync Banner */}
      {isOnline && pendingAudits.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-medium">
               <AlertCircle className="h-4 w-4" />
               <span>You have {pendingAudits.length} pending audits from offline mode.</span>
            </div>
            <button 
              onClick={handleSyncPending}
              disabled={isSyncing}
              className="bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t.syncing : t.syncPending}
            </button>
          </div>
        </div>
      )}

      {/* Offline Toast */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right fade-in duration-300">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium text-sm">{successToast}</span>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
        
        {/* Intro / Dashboard Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
               {currentView === 'audit' ? t.newAuditSession : t.complianceAnalytics}
             </h2>
             <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
               {currentView === 'audit' 
                 ? t.newAuditDesc 
                 : t.analyticsDesc}
             </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
              <button
                onClick={() => setCurrentView('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'audit' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">{t.audit}</span>
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'analytics' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t.analytics}</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Content */}
        {currentView === 'audit' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Session Name Input */}
            <div className="flex justify-end mb-6">
              <div className="w-full md:w-1/3">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">{t.sessionName}</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Tag className="h-4 w-4 text-slate-400" />
                   </div>
                   <input 
                     type="text" 
                     className="w-full pl-10 pr-4 py-3 md:py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm text-sm font-medium"
                     placeholder={t.sessionPlaceholder}
                     value={sessionName}
                     onChange={(e) => setSessionName(e.target.value)}
                   />
                 </div>
              </div>
            </div>

            {/* Input Grid - Refined for Mobile/Tablet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 h-auto md:h-[650px] items-stretch">
              <div className="h-[400px] md:h-full w-full order-2 md:order-1">
                <SOPPanel 
                  sopText={sopText} 
                  setSopText={setSopText} 
                  lastSaved={lastSaved}
                  sopFile={sopFile}
                  setSopFile={setSopFile}
                  t={t}
                  language={language}
                />
              </div>
              <div className="h-[400px] md:h-full w-full order-1 md:order-2">
                <ImageUploadPanel 
                  imageFile={imageFile} 
                  setImageFile={setImageFile}
                  imagePreviewUrl={imagePreviewUrl}
                  setImagePreviewUrl={setImagePreviewUrl}
                  violations={result?.violations}
                  t={t}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col items-center justify-center mb-12 sticky bottom-6 z-20 pointer-events-none">
               <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 pointer-events-auto transition-all hover:shadow-2xl hover:scale-105 w-full max-w-sm md:w-auto">
                  <button
                    onClick={handleAudit}
                    disabled={status === 'analyzing' || !imageFile}
                    className={`
                      w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]
                      ${status === 'analyzing' 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                        : !imageFile
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : isOnline 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30'
                            : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 hover:shadow-slate-500/30'
                      }
                    `}
                  >
                    {status === 'analyzing' ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        {t.analyzing}
                      </>
                    ) : isOnline ? (
                      <>
                        <Play className="h-6 w-6 fill-current" />
                        {t.runAudit}
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6" />
                        {t.saveForLater}
                      </>
                    )}
                  </button>
               </div>
               
               {/* Enhanced Error Display */}
               {errorMsg && (
                 <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800 shadow-lg pointer-events-auto max-w-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                   <div className="flex items-center justify-center gap-2 mb-2">
                     <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                     <span className="font-bold text-red-700 dark:text-red-300">{t.auditFailed}</span>
                   </div>
                   <p className="text-sm leading-relaxed opacity-90">{errorMsg}</p>
                 </div>
               )}
            </div>

            {/* Results Section */}
            {result && status === 'complete' && (
              <div className="mb-12 scroll-mt-24 transition-all duration-500 ease-in-out" id="results">
                 {!imageFile && (
                   <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl border border-blue-100 dark:border-blue-900 flex items-center justify-center text-sm">
                     <span className="font-semibold mr-1">{t.viewingHistory}</span> {t.historyNote}
                   </div>
                 )}
                <AuditReport result={result} t={t} />
                
                {/* Consultant Chat Section */}
                <div className="mt-8">
                   <ConsultantChat result={result} language={language} t={t} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <AnalyticsDashboard t={t} />
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

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 dark:text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} {t.footer}
        </div>
      </footer>
    </div>
  );
};

export default App;