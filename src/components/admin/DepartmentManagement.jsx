import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Building2, PlusCircle, Users, CheckCircle2, AlertCircle, 
  Plus, X, Edit2, Power, ShieldCheck, Clock, FileText, Check
} from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { SupabaseHealthCheck } from '../common/SupabaseHealthCheck';

export const DepartmentManagement = () => {
  const { 
    departments, 
    addDepartment, 
    editDepartment, 
    toggleDepartmentStatus, 
    complaints 
  } = useComplaints();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [statusActionMsg, setStatusActionMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newDept, setNewDept] = useState({
    name: '',
    description: '',
    head: '',
    staffCount: 5,
    slaHours: 48
  });

  // Calculate live complaint counts per department
  const getDeptMetrics = (deptName) => {
    const deptComplaints = complaints.filter(c => 
      c.routing?.department === deptName || c.department === deptName
    );
    const active = deptComplaints.filter(c => 
      ['Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolution Submitted'].includes(c.status)
    ).length;
    const resolved = deptComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    return { active, resolved };
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDept.name.trim()) return;
    setIsSubmitting(true);
    try {
      await addDepartment(newDept);
      setShowAddModal(false);
      setNewDept({ name: '', description: '', head: '', staffCount: 5, slaHours: 48 });
      setStatusActionMsg(`Department "${newDept.name}" created successfully in Supabase!`);
      setTimeout(() => setStatusActionMsg(null), 3500);
    } catch (err) {
      alert(`Failed to create department: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name.trim()) return;
    setIsSubmitting(true);
    try {
      await editDepartment(editingDept.id, {
        name: editingDept.name,
        description: editingDept.description,
        head: editingDept.head,
        staffCount: editingDept.staffCount,
        slaHours: editingDept.slaHours
      });
      setStatusActionMsg(`Department "${editingDept.name}" updated successfully!`);
      setTimeout(() => setStatusActionMsg(null), 3500);
      setEditingDept(null);
    } catch (err) {
      alert(`Failed to update department: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const nextStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    const confirmMsg = `Are you sure you want to set "${dept.name}" to ${nextStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleDepartmentStatus(dept.id, dept.status);
      setStatusActionMsg(`Department "${dept.name}" marked as ${nextStatus}!`);
      setTimeout(() => setStatusActionMsg(null), 3500);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const actionButton = (
    <button
      onClick={() => setShowAddModal(true)}
      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
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

      {/* Action Notification Banner */}
      {statusActionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusActionMsg}</span>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const { active, resolved } = getDeptMetrics(dept.name);
          const isActive = dept.status === 'Active';

          return (
            <div 
              key={dept.id} 
              className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                isActive ? 'border-slate-200/80' : 'border-slate-200 bg-slate-50/60 opacity-80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${
                    isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {dept.status}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(dept)}
                      title={isActive ? 'Deactivate Department' : 'Activate Department'}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border-slate-200' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-between">
                    <span>{dept.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{dept.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Head Officer:</span>
                    <strong className="text-slate-900">{dept.head || 'Unassigned'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">SLA Resolution Target:</span>
                    <span className="font-mono font-bold text-emerald-800">{dept.slaHours || 48} Hours</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Staff</span>
                    <p className="font-extrabold text-slate-800 mt-0.5">{dept.staffCount || 1}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Active</span>
                    <p className="font-extrabold text-amber-700 mt-0.5">{active}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved</span>
                    <p className="font-extrabold text-emerald-700 mt-0.5">{resolved}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setEditingDept({ ...dept })}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Unit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Add New Barangay Department</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Officer Juan Santos"
                    value={newDept.head}
                    onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SLA Target (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={newDept.slaHours}
                    onChange={(e) => setNewDept({ ...newDept, slaHours: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">Edit Department: {editingDept.name}</h3>
              <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingDept.description}
                  onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Head Officer</label>
                  <input
                    type="text"
                    value={editingDept.head || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, head: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SLA Target (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingDept.slaHours || 48}
                    onChange={(e) => setEditingDept({ ...editingDept, slaHours: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
