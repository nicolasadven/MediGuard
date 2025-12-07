
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Save, ChevronDown, FileUp, FileType, Trash2, AlertCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { SOP_PRESETS } from '../constants';
import { Language } from '../types';
import { summarizeSOP } from '../services/geminiService';

interface SOPPanelProps {
  sopText: string;
  setSopText: (text: string) => void;
  lastSaved?: Date | null;
  sopFile: File | null;
  setSopFile: (file: File | null) => void;
  t: any;
  language?: Language;
}

const SOPPanel: React.FC<SOPPanelProps> = ({ sopText, setSopText, lastSaved, sopFile, setSopFile, t, language = 'en' }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('ward');
  const [fileError, setFileError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to detect if text matches a preset exactly, otherwise set to custom
  useEffect(() => {
    const match = Object.entries(SOP_PRESETS).find(([key, preset]) => 
      key !== 'custom' && preset.text.trim() === sopText.trim()
    );
    
    if (match) {
      setSelectedPreset(match[0]);
    } else {
      setSelectedPreset('custom');
    }
  }, [sopText]);

  // Clear summary when text or file changes
  useEffect(() => {
    setSummary(null);
  }, [sopText, sopFile]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedPreset(key);
    setFileError(null);
    setSummary(null);
    
    if (key !== 'custom') {
      setSopText(SOP_PRESETS[key].text);
      setSopFile(null); // Clear file if preset is chosen
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSopText(e.target.value);
    setSelectedPreset('custom');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setSummary(null);
    const file = e.target.files?.[0];
    
    if (!file) return;

    // 1. MIME Type Check
    if (file.type !== 'application/pdf') {
      setFileError(t.invalidPdfType);
      return;
    }

    // 2. Size Check (Max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setFileError(t.fileTooLarge);
      return;
    }
    
    // 3. Header Check for Corruption
    try {
      // Read first 4 bytes to check for %PDF signature
      const arrayBuffer = await file.slice(0, 4).arrayBuffer();
      const header = new TextDecoder().decode(arrayBuffer);
      if (!header.startsWith('%PDF')) {
        setFileError(t.corruptedPdf);
        return;
      }
    } catch (err) {
      console.error("File read error", err);
      setFileError(t.readError);
      return;
    }

    setSopFile(file);
    setSelectedPreset('custom');
  };

  const clearFile = () => {
    setSopFile(null);
    setFileError(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSummarize = async () => {
    if ((!sopText.trim() && !sopFile) || isSummarizing) return;
    
    setIsSummarizing(true);
    setSummary(null);
    
    try {
      const result = await summarizeSOP(sopText, sopFile, language as Language);
      setSummary(result);
    } catch (error) {
      setFileError(t.summaryFailed);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="bg-slate-800 dark:bg-slate-900 rounded-xl shadow-sm border border-slate-700 dark:border-slate-800 flex flex-col h-full overflow-hidden transition-colors relative">
      <div className="p-4 border-b border-slate-700 dark:border-slate-800 bg-slate-900/50 flex flex-col gap-3">
        
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold text-slate-100">{t.sopTitle}</h2>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Summarize Button */}
             {(sopText.trim().length > 0 || sopFile) && (
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title={t.summarizeSop}
                >
                  {isSummarizing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{isSummarizing ? t.generatingSummary : t.summarizeSop}</span>
                </button>
             )}

            {/* Upload Button */}
            {!sopFile && (
              <button 
                onClick={triggerFileUpload}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors border border-slate-600"
              >
                <FileUp className="h-3 w-3" />
                {t.uploadPdf}
              </button>
            )}
          </div>
        </div>

        {/* Preset Selector (Hidden if File Uploaded) */}
        {!sopFile && (
          <div className="relative">
            <select
              value={selectedPreset}
              onChange={handlePresetChange}
              className="w-full appearance-none bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer hover:bg-slate-700"
            >
              <option value="" disabled hidden>{t.selectPreset}</option>
              {Object.entries(SOP_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        )}

      </div>

      {/* Error Banner */}
      {fileError && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2 px-4 flex items-center gap-2 text-red-300 text-xs animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{fileError}</span>
          <button 
            onClick={() => setFileError(null)} 
            className="ml-auto hover:text-white p-1 rounded-full hover:bg-red-500/20 transition-colors"
          >
            <X className="h-3 w-3"/>
          </button>
        </div>
      )}

      {/* Summary Overlay Card */}
      {summary && (
        <div className="absolute top-[130px] left-4 right-4 z-20 bg-indigo-50/95 dark:bg-slate-800/95 backdrop-blur-sm border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2">
           <div className="flex items-start justify-between mb-2">
             <div className="flex items-center gap-2">
               <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
               <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">{t.sopSummary}</h3>
             </div>
             <button onClick={() => setSummary(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
               <X className="h-4 w-4" />
             </button>
           </div>
           <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
             {summary}
           </div>
        </div>
      )}
      
      <div className="flex-1 p-4 relative">
        {sopFile ? (
          <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 flex flex-col items-center text-center max-w-sm">
              <div className="bg-red-500/10 p-4 rounded-full mb-4">
                <FileType className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="text-slate-200 font-medium truncate w-full px-2 mb-1">{sopFile.name}</h3>
              <p className="text-slate-400 text-xs mb-6">{(sopFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
              
              <button 
                onClick={clearFile}
                className="flex items-center gap-2 text-slate-300 hover:text-red-400 text-sm font-medium px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t.removeFile}
              </button>
            </div>
          </div>
        ) : (
          <textarea
            className="w-full h-full min-h-[300px] resize-none border-0 focus:ring-0 text-white placeholder:text-slate-500 text-sm leading-relaxed p-0 outline-none bg-transparent"
            placeholder={t.sopPlaceholder}
            value={sopText}
            onChange={handleTextChange}
            spellCheck={false}
          />
        )}
      </div>
      
      <div className="bg-slate-900/50 px-4 py-2 text-xs text-slate-400 border-t border-slate-700 dark:border-slate-800 flex justify-between items-center">
        <span>{sopFile ? t.usingUploaded : t.editableStandard}</span>
        {!sopFile && lastSaved && (
          <div className="flex items-center gap-1.5 text-blue-400/80 animate-pulse">
            <Save className="h-3 w-3" />
            <span>{t.autoSaved} {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        className="hidden" 
      />
    </div>
  );
};

export default SOPPanel;
