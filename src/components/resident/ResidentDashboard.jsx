import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { 
  PlusCircle, Clock, CheckCircle2, AlertCircle, Eye, Search, Filter, Sparkles, MapPin, 
  Calendar, FileText, ArrowRight, Bot, Shield, Award, Heart, HelpCircle
} from 'lucide-react';
import { InstallAppButton } from '../common/InstallAppButton';

export const ResidentDashboard = ({ onNavigate, onViewDetails }) => {
  const { user } = useAuth();
  const { complaints } = useComplaints();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Filter complaints strictly belonging to the authenticated resident
  // Enforces user.id (auth.uid) as primary authoritative ownership identifier
  const userComplaints = complaints.filter(c => {
    if (!user || !user.id) return false;
    const complaintOwnerId = c.residentId || c.resident_id;
    if (complaintOwnerId) {
      return String(complaintOwnerId) === String(user.id);
    }
    // Backward compatibility for pre-migration records without assigned resident_id
    if (user.email && c.residentEmail) {
      return c.residentEmail.trim().toLowerCase() === user.email.trim().toLowerCase();
    }
    return false;
  });

  const total = userComplaints.length;
  const pending = userComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = userComplaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Acknowledged').length;
  const resolved = userComplaints.filter(c => c.status === 'Resolved').length;

  const filteredComplaints = userComplaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      
      {/* WARM & FRIENDLY RESIDENT WELCOME BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Official Barangay Kinilis Resident Services</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Magandang Araw, {user?.name || 'Kabarangay'}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed font-medium">
              Welcome to your digital resident portal. Submit community concerns, track response timeline updates in real-time, and experience faster barangay public service.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => onNavigate('submit-complaint')}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Submit a New Complaint</span>
          </button>
        </div>
      </div>

      {/* QUICK RESIDENT SERVICE HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('submit-complaint')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-colors">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Submit New Concern</h3>
            <p className="text-xs text-slate-500">24/7 online form filing</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('my-complaints')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="p-3 bg-sky-100 text-sky-800 rounded-xl group-hover:bg-sky-700 group-hover:text-white transition-colors">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Real-time Stage Stepper</h3>
            <p className="text-xs text-slate-500">Track resolution progress</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('my-complaints')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl group-hover:bg-amber-700 group-hover:text-white transition-colors">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Resolution Feedback</h3>
            <p className="text-xs text-slate-500">Rate government service quality</p>
          </div>
        </div>
      </div>

      {/* STATS COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="My Total Complaints" value={total} color="emerald" icon={FileText} />
        <StatCard title="Pending AI Review" value={pending} color="amber" icon={Clock} />
        <StatCard title="In Progress Action" value={inProgress} color="blue" icon={AlertCircle} />
        <StatCard title="Successfully Resolved" value={resolved} color="emerald" icon={CheckCircle2} />
      </div>

      {/* PWA MOBILE APP INSTALLATION CARD */}
      <InstallAppButton variant="card" label="Install Kinilis Iba Ka Mobile App" />

      {/* RECENT SUBMITTED COMPLAINTS SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">My Submitted Complaints & Tracking</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Transparent Timeline
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Monitor stage status and view official response updates</p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 text-slate-900"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Peace & Order">Peace & Order</option>
              <option value="Health Services">Health Services</option>
              <option value="Social Welfare">Social Welfare</option>
            </select>
          </div>
        </div>

        {/* Complaints Table & Mobile View */}
        {filteredComplaints.length === 0 ? (
          <EmptyState
            title="No complaints found"
            description="You haven't submitted any complaints matching this filter."
            actionText="Submit a Complaint"
            onAction={() => onNavigate('submit-complaint')}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Reference Code</th>
                    <th className="py-3.5 px-4">Complaint Title</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Target Department</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map(cmp => (
                    <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-emerald-800">{cmp.referenceNo}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">{cmp.title}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{cmp.category}</td>
                      <td className="py-3.5 px-4"><PriorityBadge priority={cmp.priority} /></td>
                      <td className="py-3.5 px-4"><StatusBadge status={cmp.status} /></td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{cmp.routing?.department || 'Unassigned'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onViewDetails(cmp)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-4">
              {filteredComplaints.map(cmp => (
                <div key={cmp.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-emerald-800">{cmp.referenceNo}</span>
                    <StatusBadge status={cmp.status} />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{cmp.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cmp.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={cmp.priority} />
                      <span className="font-semibold text-slate-700">{cmp.category}</span>
                    </div>
                    <button
                      onClick={() => onViewDetails(cmp)}
                      className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-xs"
                    >
                      View Timeline
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
