import React, { useState, useEffect } from 'react';
import { FileText, Save, ChevronDown } from 'lucide-react';
import { SOP_PRESETS } from '../constants';

interface SOPPanelProps {
  sopText: string;
  setSopText: (text: string) => void;
  lastSaved?: Date | null;
}

const SOPPanel: React.FC<SOPPanelProps> = ({ sopText, setSopText, lastSaved }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('ward');

  // Effect to detect if text matches a preset exactly, otherwise set to custom
  // This handles initial load from localStorage
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

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedPreset(key);
    
    if (key !== 'custom') {
      setSopText(SOP_PRESETS[key].text);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSopText(e.target.value);
    // Automatically switch to custom if the user edits the text
    setSelectedPreset('custom');
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex flex-col gap-3">
        
        {/* Title Row */}
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          <h2 className="font-semibold text-slate-100">Standard Operating Procedures (SOP)</h2>
        </div>

        {/* Preset Selector */}
        <div className="relative">
          <select
            value={selectedPreset}
            onChange={handlePresetChange}
            className="w-full appearance-none bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer hover:bg-slate-700"
          >
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

      </div>
      
      <div className="flex-1 p-4">
        <textarea
          className="w-full h-full min-h-[300px] resize-none border-0 focus:ring-0 text-white placeholder:text-slate-500 text-sm leading-relaxed p-0 outline-none bg-transparent"
          placeholder="Paste your safety protocols here..."
          value={sopText}
          onChange={handleTextChange}
          spellCheck={false}
        />
      </div>
      
      <div className="bg-slate-900/50 px-4 py-2 text-xs text-slate-400 border-t border-slate-700 flex justify-between items-center">
        <span>Editable compliance standards</span>
        {lastSaved && (
          <div className="flex items-center gap-1.5 text-blue-400/80 animate-pulse">
            <Save className="h-3 w-3" />
            <span>Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOPPanel;
