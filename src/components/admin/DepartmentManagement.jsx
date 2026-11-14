import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Building2, PlusCircle, Users, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { SupabaseHealthCheck } from '../common/SupabaseHealthCheck';

export const DepartmentManagement = () => {
  const { departments, addDepartment } = useComplaints();
  const [showAddModal, setShowAddModal] = useState(false);

  const [newDept, setNewDept] = useState({
    name: '',
    description: '',
    head: '',
    staffCount: 5
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newDept.name) return;
    addDepartment(newDept);
    setShowAddModal(false);
    setNewDept({ name: '', description: '', head: '', staffCount: 5 });
  };

  const actionButton = (
    <button
      onClick={() => setShowAddModal(true)}
      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
    >
      <PlusCircle className="w-4 h-4" /> Add New Department
    </button>
  );

  return (
    <div className="space-y-8 pb-16 min-w-0">
      {/* Top Header */}
      <AdminPageHeader
        title="Barangay Department Management"
        description="Configure active department units, personnel counts, and automated routing targets for Barangay Kinilis"
        badgeText="Operational Units"
        actionButton={actionButton}
      />

      <SupabaseHealthCheck />

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => (
          <div key={dept.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {dept.status}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{dept.description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                Head / Officer: <strong className="text-slate-900">{dept.head}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Staff</span>
                <p className="font-extrabold text-slate-800 mt-0.5">{dept.staffCount}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active</span>
                <p className="font-extrabold text-amber-700 mt-0.5">{dept.activeComplaints}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved</span>
                <p className="font-extrabold text-emerald-700 mt-0.5">{dept.resolvedComplaints}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Add New Barangay Department</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Environmental Protection Office"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities and scope..."
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Head Officer</label>
                <input
                  type="text"
                  placeholder="e.g. Officer Juan Santos"
                  value={newDept.head}
                  onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-700 text-white font-extrabold shadow-md"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
