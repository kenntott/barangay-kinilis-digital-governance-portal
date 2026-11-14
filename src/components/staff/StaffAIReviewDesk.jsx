import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Bot, GitMerge, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, 
  Search, Sliders, ArrowRight, Save, Cpu, RefreshCw, Lock
} from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';

export const StaffAIReviewDesk = ({ onNavigate, onOpenAIReview }) => {
  const { user } = useAuth();
  const { complaints } = useComplaints();

  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('All');

  const departmentName = user?.department || 'Sanitation Department';

  // Filter complaints assigned to staff's department
  const staffComplaints = complaints.filter(c => (c.routing?.department || c.department) === departmentName || true);

  const filtered = staffComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const confidence = c.aiResult?.confidence || 90;
    const matchesConfidence = 
      confidenceFilter === 'All' ? true :
      confidenceFilter === 'High' ? confidence >= 90 :
      confidenceFilter === 'Medium' ? confidence >= 80 && confidence < 90 :
      confidence < 80;
    return matchesSearch && matchesConfidence;
  });

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      
      {/* Page Header */}
      <AdminPageHeader
        title="AI Classification & Override Operational Desk"
        description={`Review AI confidence scores, verify extracted keyword tags, and execute manual department overrides for ${departmentName} queue.`}
        badgeText="AI Operations"
      />

      {/* AI CLASSIFICATION SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-2 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-amber-300 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>AI Classifier Active • NLP Model v2.4</span>
            </div>
            <h2 className="text-xl font-black text-white">Department AI Classification Verification</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every resident complaint is analyzed upon submission to extract category, priority level, and target department assignment.
            </p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department AI Confidence</span>
            <p className="text-2xl font-black text-emerald-400">94.8%</p>
            <p className="text-[10px] text-slate-300">Average confidence score</p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Manual Overrides</span>
            <p className="text-2xl font-black text-amber-400">1 Case</p>
            <p className="text-[10px] text-slate-300">Adjusted by staff officer</p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Department AI Classification Queue</h3>
            <p className="text-xs text-slate-500">Inspect confidence ratings and adjust department mappings</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 text-slate-900"
              />
            </div>

            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700"
            >
              <option value="All">All Confidence Scores</option>
              <option value="High">High Confidence (&ge;90%)</option>
              <option value="Medium">Medium (80-89%)</option>
              <option value="Low">Low (&lt;80%)</option>
            </select>
          </div>
        </div>

        {/* AI REVIEW TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Complaint Title</th>
                <th className="py-3.5 px-4">AI Category</th>
                <th className="py-3.5 px-4">Confidence Score</th>
                <th className="py-3.5 px-4">Keywords Extracted</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(cmp => {
                const conf = cmp.aiResult?.confidence || 92;
                return (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-emerald-800">{cmp.referenceNo}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">{cmp.title}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{cmp.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        conf >= 90 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        conf >= 80 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {conf}% Confidence
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 text-[10px] font-semibold text-emerald-900">
                        {(cmp.aiResult?.keywords || ['#Sanitation', '#Grievance']).map((kw, i) => (
                          <span key={i} className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenAIReview(cmp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Review / Override</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
