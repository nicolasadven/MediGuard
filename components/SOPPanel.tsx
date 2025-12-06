import React from 'react';
import { FileText } from 'lucide-react';

interface SOPPanelProps {
  sopText: string;
  setSopText: (text: string) => void;
}

const SOPPanel: React.FC<SOPPanelProps> = ({ sopText, setSopText }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-400" />
        <h2 className="font-semibold text-slate-100">Standard Operating Procedures (SOP)</h2>
      </div>
      <div className="flex-1 p-4">
        <textarea
          className="w-full h-full min-h-[300px] resize-none border-0 focus:ring-0 text-white placeholder:text-slate-500 text-sm leading-relaxed p-0 outline-none bg-transparent"
          placeholder="Paste your safety protocols here..."
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="bg-slate-900/50 px-4 py-2 text-xs text-slate-400 border-t border-slate-700">
        Editable text area for compliance standards
      </div>
    </div>
  );
};

export default SOPPanel;