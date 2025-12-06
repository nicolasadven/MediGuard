
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, AlertTriangle, ClipboardCheck, Activity, Award } from 'lucide-react';
import { getAudits } from '../services/storageService';

interface AnalyticsDashboardProps {
  t: any;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ t }) => {
  // Fetch data directly from storage
  const audits = getAudits();

  // Process data for visualizations
  const stats = useMemo(() => {
    if (audits.length === 0) return null;

    // 1. Summary Stats
    const totalAudits = audits.length;
    const totalScore = audits.reduce((acc, curr) => acc + curr.complianceScore, 0);
    const averageScore = Math.round(totalScore / totalAudits);
    const bestScore = Math.max(...audits.map(a => a.complianceScore));

    // 2. Trend Data (Chronological)
    // Audits are stored newest first, so we reverse for the chart
    const trendData = [...audits]
      .reverse()
      .slice(-10) // Last 10 audits
      .map(audit => ({
        date: new Date(audit.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(audit.timestamp).toLocaleString(),
        score: audit.complianceScore,
        name: audit.sessionName || 'Untitled'
      }));

    // 3. Hazard Stats (Top 5)
    const hazardCounts: Record<string, number> = {};
    audits.forEach(audit => {
      audit.result.violations.forEach(v => {
        // Group by exact hazard name string - in a real app, might need semantic grouping
        const name = v.hazard;
        hazardCounts[name] = (hazardCounts[name] || 0) + 1;
      });
    });

    const hazardData = Object.entries(hazardCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalAudits, averageScore, bestScore, trendData, hazardData };
  }, [audits]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center transition-colors">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
          <Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t.noAnalytics}</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          {t.runFirstAudit}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
            <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.totalAudits}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalAudits}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.avgScore}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.averageScore}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
            <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.bestScore}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.bestScore}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Compliance Trend Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.scoreTrend}</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                  }}
                  itemStyle={{ color: '#0f172a' }}
                  labelStyle={{ color: '#64748b', marginBottom: '0.25rem', fontSize: '0.75rem' }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Violations Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">{t.topViolations}</h3>
          </div>
          <div className="h-[300px] w-full">
            {stats.hazardData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hazardData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#ef4444" 
                    radius={[0, 4, 4, 0]} 
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <p>No violation data collected yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
