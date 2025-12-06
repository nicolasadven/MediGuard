import React, { useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Download, Loader2, X } from 'lucide-react';
import { AuditResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AuditReportProps {
  result: AuditResult;
}

const AuditReport: React.FC<AuditReportProps> = ({ result }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Chart data setup
  const chartData = [
    { name: 'Compliance', value: result.complianceScore },
    { name: 'Deficit', value: 100 - result.complianceScore },
  ];
  
  // Colors for the gauge based on score
  const CHART_COLORS = [
    result.complianceScore >= 90 ? '#16a34a' : result.complianceScore >= 70 ? '#d97706' : '#dc2626', 
    '#f1f5f9' // slate-100 for the empty part
  ];

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setToast(null);

    try {
      // Small delay to ensure any layout shifts are settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff',
        useCORS: true, // Handle potential cross-origin images
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If content is shorter than A4, use A4. If longer, use custom height to avoid awkward cutoffs.
      const pdfHeight = imgHeight > pageHeight ? imgHeight : pageHeight;
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [imgWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('MediGuard_Audit_Report.pdf');
      
      setToast({ type: 'success', message: 'Report exported successfully to PDF' });
      setTimeout(() => setToast(null), 3000);
      
    } catch (error) {
      console.error("PDF generation error", error);
      setToast({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up relative">
      
      {/* Loading Overlay */}
      {isExporting && (
        <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
           <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95">
             <div className="relative mb-4">
               <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
               <div className="relative bg-blue-50 p-4 rounded-full">
                 <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
               </div>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-1">Generating PDF</h3>
             <p className="text-sm text-slate-500">Compiling audit findings...</p>
           </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={generatePDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isExporting ? 'Processing...' : 'Export Report'}
        </button>
      </div>

      {/* Report Content Wrapper */}
      <div ref={reportRef} className="space-y-8 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-transparent sm:border-slate-100 print:bg-white print:p-0">
        
        {/* 1. Score & Summary Section (Hero Card) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
            
            {/* Gauge Visualization */}
            <div className="relative w-48 h-48 flex-shrink-0">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      cornerRadius={10} // Rounded ends for the gauge
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Text Overlay */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Score</span>
                  <span className={`text-5xl font-extrabold tracking-tight ${getScoreColor(result.complianceScore)}`}>
                    {result.complianceScore}%
                  </span>
               </div>
            </div>

            {/* Text Summary */}
            <div className="flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <ShieldCheck className={`h-6 w-6 ${getScoreColor(result.complianceScore)}`} />
                  <h2 className="text-2xl font-bold text-slate-800">Executive Summary</h2>
               </div>
               <p className="text-slate-600 text-lg leading-relaxed border-l-4 border-slate-200 pl-4 py-1 italic">
                 "{result.summary}"
               </p>
            </div>
          </div>
        </div>

        {/* 2. Detailed Findings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Violations Column */}
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Violations & Hazards</h3>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  {result.violations.length} Found
                </span>
             </div>

             {result.violations.length === 0 ? (
               <div className="p-8 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                 <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                 <p className="text-slate-500 font-medium">No violations detected. Excellent compliance!</p>
               </div>
             ) : (
               <div className="space-y-4">
                  {result.violations.map((violation, idx) => {
                    const isHigh = violation.severity === 'High';
                    const isMedium = violation.severity === 'Medium';
                    const isLow = violation.severity === 'Low';

                    return (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                        {/* Left Accent Bar */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                          isHigh ? 'bg-red-600' : isMedium ? 'bg-orange-500' : 'bg-yellow-400'
                        }`}></div>
                        
                        <div className="p-5 pl-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <XCircle className={`h-6 w-6 ${
                                isHigh ? 'text-red-600' : isMedium ? 'text-orange-500' : 'text-yellow-500'
                              }`} />
                            </div>
                            <div className="flex-1 space-y-3">
                               <div className="flex justify-between items-start gap-3">
                                 <h4 className="text-slate-900 font-bold text-lg leading-tight">{violation.hazard}</h4>
                                 
                                 {/* Severity Badge */}
                                 <span className={`flex-shrink-0 inline-flex items-center text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border shadow-sm ${
                                   isHigh ? 'bg-red-100 text-red-800 border-red-200' : 
                                   isMedium ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                                   'bg-yellow-100 text-yellow-800 border-yellow-200'
                                 }`}>
                                   {violation.severity}
                                 </span>
                               </div>
  
                               {/* Remedial Action Box */}
                               <div className={`rounded-lg p-3 text-sm border ${
                                 isHigh ? 'bg-red-50/50 border-red-100' : 
                                 isMedium ? 'bg-orange-50/50 border-orange-100' : 
                                 'bg-yellow-50/50 border-yellow-100'
                               }`}>
                                 <div className="flex gap-2">
                                   <span className={`font-bold whitespace-nowrap ${
                                      isHigh ? 'text-red-700' : isMedium ? 'text-orange-700' : 'text-yellow-700'
                                   }`}>Fix:</span>
                                   <span className="font-bold text-slate-800">{violation.remedialAction}</span>
                                 </div>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>

          {/* Compliant Items Column */}
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Compliant Items</h3>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                  {result.compliantItems.length} Verified
                </span>
             </div>

             <div className="grid grid-cols-1 gap-3">
               {result.compliantItems.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400">No specific compliant items listed in this report.</p>
                  </div>
               ) : (
                  result.compliantItems.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-green-200 shadow-sm p-4 flex items-center gap-4 group hover:shadow-md transition-all">
                      <div className="bg-green-100 rounded-full p-2 flex-shrink-0 border border-green-200 group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-slate-700 font-medium leading-relaxed">{item}</span>
                    </div>
                  ))
               )}
             </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-auto z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in border border-white/10 ${
          toast.type === 'success' ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <div className="bg-green-500/20 p-1.5 rounded-full">
               <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
          ) : (
            <div className="bg-white/20 p-1.5 rounded-full">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex-1">
             <p className="font-bold text-sm">{toast.type === 'success' ? 'Success' : 'Error'}</p>
             <p className="text-sm opacity-90">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors self-start mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditReport;