import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { 
  Eye, CheckCircle2, Clock, AlertTriangle, ShieldAlert, Sparkles, Filter, Search,
  Bot, GitMerge, UserCheck, ArrowRight, Activity, Zap, CheckSquare, RefreshCw, FileText
} from 'lucide-react';

export const StaffDashboard = ({ onViewDetails, onOpenAIReview }) => {
  const { user } = useAuth();
  const { complaints, updateComplaintStatus } = useComplaints();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter complaints assigned to staff department or all for demo
  const staffComplaints = complaints;

  const assigned = staffComplaints.length;
  const pending = staffComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = staffComplaints.filter(c => c.status === 'In Progress' || c.status === 'Acknowledged' || c.status === 'Assigned').length;
  const forVerification = staffComplaints.filter(c => c.status === 'For Verification').length;
  const resolved = staffComplaints.filter(c => c.status === 'Resolved').length;
  const highPriority = staffComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length;

  const filtered = staffComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleQuickAcknowledge = (cmp) => {
    updateComplaintStatus(cmp.id, 'In Progress', 'Quick acknowledged by assigned staff officer.', user);
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      
      {/* STAFF OPERATIONAL COMMAND HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-amber-300 font-extrabold text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Operational Staff Command Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {user?.department || 'Sanitation Department'} Processing Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Officer: <strong className="text-white">{user?.name || 'Maria Santos'}</strong> • Real-time processing of AI-classified resident grievances.
          </p>
        </div>

        {/* Operational SLA Status Pill */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 space-y-1 shrink-0 relative z-10 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Target Response SLA: &lt; 24 Hours</span>
          </div>
          <p className="text-[11px] text-slate-400">Current Workload: <strong className="text-amber-400 font-extrabold">{inProgress + pending} Active Tasks</strong></p>
        </div>
      </div>

      {/* OPERATIONAL METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Assigned" value={assigned} color="emerald" icon={FileText} />
        <StatCard title="Pending Review" value={pending} color="amber" icon={Clock} />
        <StatCard title="In Progress" value={inProgress} color="blue" icon={Activity} />
        <StatCard title="For Verification" value={forVerification} color="indigo" icon={CheckSquare} />
        <StatCard title="Resolved Output" value={resolved} color="emerald" icon={CheckCircle2} />
        <StatCard title="Urgent Alerts" value={highPriority} color="rose" icon={ShieldAlert} />
      </div>

      {/* TASK QUEUE TABLE & PROCESSING WORKFLOW */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Operational Task Processing Queue</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live Queue
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Manage, acknowledge, and log photo resolution evidence for assigned complaints</p>
          </div>

          {/* Operational Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 text-slate-900"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent Only</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Task List Content */}
        {filtered.length === 0 ? (
          <EmptyState title="No assigned tasks requiring action" description="All tasks under this operational filter are clear." />
        ) : (
          <>
            {/* Desktop Structured Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Complaint Title</th>
                    <th className="py-3.5 px-4">Category & AI Confidence</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Resident Contact</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(cmp => (
                    <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-emerald-800">{cmp.referenceNo}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">{cmp.title}</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">{cmp.category}</span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                            {cmp.aiResult?.confidence || 92}% Confidence
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><PriorityBadge priority={cmp.priority} /></td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700">
                          <span className="font-bold block">{cmp.residentName}</span>
                          <span className="text-[10px] text-slate-500">{cmp.residentPhone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><StatusBadge status={cmp.status} /></td>
                      <td className="py-3.5 px-4 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => onViewDetails(cmp)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-colors"
                        >
                          View & Process
                        </button>
                        {cmp.status === 'Pending' && (
                          <button
                            onClick={() => handleQuickAcknowledge(cmp)}
                            className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-xs shadow-xs"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => onOpenAIReview(cmp)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300"
                        >
                          AI Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Operational Card List */}
            <div className="lg:hidden space-y-4">
              {filtered.map(cmp => (
                <div key={cmp.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-emerald-800">{cmp.referenceNo}</span>
                    <StatusBadge status={cmp.status} />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{cmp.title}</h3>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <PriorityBadge priority={cmp.priority} />
                    <button
                      type="button"
                      onClick={() => onViewDetails(cmp)}
                      className="px-4 py-2 min-h-[42px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold text-xs shadow-xs touch-manipulation cursor-pointer active:scale-95 flex items-center justify-center"
                    >
                      Process Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
