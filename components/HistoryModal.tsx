
import React from 'react';
import { X, Trash2, Eye, Clock, Calendar } from 'lucide-react';
import { SavedAudit } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  audits: SavedAudit[];
  onSelectAudit: (audit: SavedAudit) => void;
  onDeleteAudit: (id: string) => void;
  onClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  audits, 
  onSelectAudit, 
  onDeleteAudit,
  onClearHistory
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Audit History</h2>
            <p className="text-sm text-slate-500">View past compliance reports</p>
          </div>
          <div className="flex items-center gap-2">
            {audits.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors mr-2"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-6 space-y-4">
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No audit history found.</p>
              <p className="text-xs text-slate-400 mt-1">Run an audit to see it listed here.</p>
            </div>
          ) : (
            audits.map((audit) => (
              <div 
                key={audit.id} 
                className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                {/* Score Badge */}
                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border flex-shrink-0 ${getScoreColor(audit.complianceScore)}`}>
                  <span className="text-xl font-bold">{audit.complianceScore}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wide opacity-80">Score</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                     <h3 className="font-bold text-slate-900 truncate pr-2 text-base">
                      {audit.sessionName || "Untitled Session"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(audit.timestamp)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 truncate mb-1">
                    {audit.result.summary}
                  </p>
                  <p className="text-xs text-slate-400 truncate font-mono bg-slate-50 inline-block px-1.5 py-0.5 rounded">
                    SOP: {audit.sopPreview}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => onSelectAudit(audit)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAudit(audit.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl text-center text-xs text-slate-400">
           Note: History is stored locally in your browser.
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
