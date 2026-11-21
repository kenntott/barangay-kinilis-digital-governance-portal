import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Users, UserCheck, Mail, Phone, Building2, Shield, PlusCircle, 
  Edit2, Power, X, CheckCircle2, AlertCircle, Briefcase, MapPin
} from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const StaffManagement = () => {
  const { staffList, departments, updateStaffMember, complaints } = useComplaints();
  const [editingStaff, setEditingStaff] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute active assigned complaint counts dynamically
  const getStaffActiveCount = (staffName) => {
    return complaints.filter(c => 
      (c.routing?.assignedStaff === staffName || c.assignedStaff === staffName) &&
      !['Resolved', 'Closed'].includes(c.status)
    ).length;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSubmitting(true);
    try {
      await updateStaffMember(editingStaff.id, {
        department: editingStaff.department,
        position: editingStaff.position,
        phone: editingStaff.phone,
        status: editingStaff.status
      });
      setStatusMsg(`Personnel profile for "${editingStaff.name}" updated successfully!`);
      setTimeout(() => setStatusMsg(null), 3500);
      setEditingStaff(null);
    } catch (err) {
      alert(`Failed to update personnel: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (stf) => {
    const nextStatus = stf.status === 'Active' ? 'Inactive' : 'Active';
    const confirmMsg = `Are you sure you want to change ${stf.name}'s status to ${nextStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateStaffMember(stf.id, { status: nextStatus });
      setStatusMsg(`${stf.name} marked as ${nextStatus}!`);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-16 min-w-0">
      <AdminPageHeader
        title="Barangay Staff & Personnel Directory"
        description="Manage personnel roles, department assignments, and resolution capacity across all offices"
        badgeText="Staff & Roles"
      />

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3 px-4">Personnel</th>
              <th className="py-3 px-4">Role & Position</th>
              <th className="py-3 px-4">Assigned Department</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Active Workload</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffList.map(stf => {
              const activeCount = getStaffActiveCount(stf.name);
              const isActive = stf.status === 'Active';

              return (
                <tr key={stf.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#075B42] to-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {stf.name ? stf.name[0] : 'U'}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">{stf.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{stf.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800 block">{stf.position}</span>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{stf.role}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <Building2 className="w-3.5 h-3.5" />
                      {stf.department}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {stf.phone || 'No Phone'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {activeCount} active cases
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {stf.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setEditingStaff({ ...stf })}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Edit Department and Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(stf)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border-slate-200' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                        }`}
                        title={isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">Edit Personnel: {editingStaff.name}</h3>
                <p className="text-xs text-slate-400">{editingStaff.email}</p>
              </div>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Department *</label>
                <select
                  value={editingStaff.department}
                  onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Unassigned">Unassigned</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Position / Title *</label>
                <input
                  type="text"
                  required
                  value={editingStaff.position}
                  onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                  placeholder="e.g. Sanitation Officer, Lead Tanod"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  placeholder="0917-000-0000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={editingStaff.status}
                  onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Update Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
