import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { EmptyState } from '../common/EmptyState';
import { AssignmentModal } from './AssignmentModal';
import { Search, Filter, Eye, Sparkles, UserCheck, ShieldAlert, Clock, AlertTriangle, Building2 } from 'lucide-react';

export const ComplaintManagement = ({ onViewDetails, onOpenAIReview }) => {
  const { complaints } = useComplaints();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Assignment Modal
  const [assigningComplaint, setAssigningComplaint] = useState(null);

  const filtered = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesDept = departmentFilter === 'All' || c.routing?.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesOverdue = !overdueOnly || c.isOverdue;
    return matchesSearch && matchesCategory && matchesDept && matchesStatus && matchesPriority && matchesOverdue;
  });

  const overdueCount = complaints.filter(c => c.isOverdue).length;

  return (
    <div className="space-y-6 pb-12 min-w-0">
      {/* Standardized Page Header */}
      <AdminPageHeader
        title="Complaint Masterlist Management"
        description="Comprehensive administrative view to search, filter, monitor response deadlines, and reassign community complaints."
        badgeText={`${filtered.length} Active Records`}
      />

      {/* Overdue Alert Bar (Feature 6) */}
      {overdueCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-900 font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
            <span>Operational Alert: <strong>{overdueCount} complaints</strong> have exceeded their SLA response target!</span>
          </div>
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all text-xs ${
              overdueOnly 
                ? 'bg-rose-700 text-white' 
                : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-100'
            }`}
          >
            {overdueOnly ? 'Show All Complaints' : 'Filter Overdue Complaints Only'}
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, title, or resident..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 bg-slate-50 font-medium"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="All">All Categories</option>
            <option value="Waste Management">Waste Management</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Peace & Order">Peace & Order</option>
            <option value="Health Services">Health Services</option>
            <option value="Social Welfare">Social Welfare</option>
            <option value="Barangay Administration">Barangay Administration</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolution Submitted">Resolution Submitted</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Master Table Container */}
        {filtered.length === 0 ? (
          <EmptyState title="No complaints found" description="Adjust search parameters or clear filters." />
        ) : (
          <div className="overflow-x-auto pt-2 min-w-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Deadline</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(cmp => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-emerald-800 whitespace-nowrap">
                      {cmp.referenceNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {cmp.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {cmp.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {cmp.routing?.department}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={cmp.priority} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={cmp.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {cmp.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3 text-rose-600" /> Overdue
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" /> On Target
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {cmp.routing?.assignedStaff || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => onViewDetails(cmp)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setAssigningComplaint(cmp)}
                        className="px-2 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold text-xs border border-sky-300 transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => onOpenAIReview(cmp)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
                      >
                        AI Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal (Feature 5) */}
      {assigningComplaint && (
        <AssignmentModal
          complaint={assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
        />
      )}
    </div>
  );
};

export default ComplaintManagement;
