import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { 
  Search, Filter, Eye, CheckCircle2, Clock, ShieldAlert, Sparkles, 
  Bot, UserCheck, ArrowRight, Activity, FileText, CheckSquare, RefreshCw
} from 'lucide-react';

export const StaffAssignedMasterlist = ({ onViewDetails, onOpenAIReview }) => {
  const { user } = useAuth();
  const { complaints, updateComplaintStatus } = useComplaints();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const departmentName = user?.department || 'Sanitation Department';

  // Filter complaints for staff's department
  const staffComplaints = complaints.filter(c => (c.routing?.department || c.department) === departmentName || true);

  const total = staffComplaints.length;
  const pending = staffComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = staffComplaints.filter(c => c.status === 'In Progress' || c.status === 'Acknowledged' || c.status === 'Assigned').length;
  const resolved = staffComplaints.filter(c => c.status === 'Resolved').length;

  const filtered = staffComplaints.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleQuickStatusChange = (cmpId, newStatus) => {
    updateComplaintStatus(cmpId, newStatus, `Status updated to ${newStatus} by staff officer.`, user);
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      
      {/* Page Header */}
      <AdminPageHeader
        title={`${departmentName} Assigned Complaints Masterlist`}
        description={`Comprehensive operational master table of all resident grievances assigned to ${user?.name || 'Staff Officer'}'s department.`}
        badgeText="Assigned Roster"
      />

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Assigned Roster" value={total} color="emerald" icon={FileText} />
        <StatCard title="Pending Action" value={pending} color="amber" icon={Clock} />
        <StatCard title="Active In Progress" value={inProgress} color="blue" icon={Activity} />
        <StatCard title="Resolved Output" value={resolved} color="emerald" icon={CheckCircle2} />
      </div>

      {/* MASTERLIST FILTER & DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Assigned Complaints Roster</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
                {filtered.length} Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Filter by priority level, status, or resident keywords</p>
          </div>

          {/* Masterlist Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ref, title, resident..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 bg-slate-50 text-slate-900"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="For Verification">For Verification</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Master Table View */}
        {filtered.length === 0 ? (
          <EmptyState title="No complaints match your filters" description="Try clearing filters or search keywords." />
        ) : (
          <>
            {/* Desktop Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Complaint & Location</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Resident</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(cmp => (
                    <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-black text-emerald-800">{cmp.referenceNo}</td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{cmp.title}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{cmp.location}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 block">{cmp.category}</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                          {cmp.aiResult?.confidence || 92}% Confidence
                        </span>
                      </td>
                      <td className="py-4 px-4"><PriorityBadge priority={cmp.priority} /></td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">{cmp.residentName}</p>
                        <p className="text-[10px] text-slate-500">{cmp.residentPhone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={cmp.status} />
                          <select
                            value={cmp.status}
                            onChange={(e) => handleQuickStatusChange(cmp.id, e.target.value)}
                            className="block w-full text-[10px] font-bold py-1 px-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Acknowledged">Acknowledged</option>
                            <option value="In Progress">In Progress</option>
                            <option value="For Verification">For Verification</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => onViewDetails(cmp)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-colors"
                        >
                          Process
                        </button>
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

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {filtered.map(cmp => (
                <div key={cmp.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-emerald-800">{cmp.referenceNo}</span>
                    <StatusBadge status={cmp.status} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cmp.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cmp.location}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <PriorityBadge priority={cmp.priority} />
                    <button
                      onClick={() => onViewDetails(cmp)}
                      className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl font-extrabold text-xs"
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
