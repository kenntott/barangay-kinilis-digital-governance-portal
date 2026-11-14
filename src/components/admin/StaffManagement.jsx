import React from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Users, UserCheck, Mail, Phone, Building2, Shield, PlusCircle, Plus } from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const StaffManagement = () => {
  const { staffList } = useComplaints();

  const actionButton = (
    <button className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
      <Plus className="w-4 h-4" /> Add Staff Member
    </button>
  );

  return (
    <div className="space-y-8 pb-16 min-w-0">
      <AdminPageHeader
        title="Barangay Staff Directory"
        description="Manage personnel roles, department assignments, and resolution capacity across all offices"
        badgeText="Staff & Roles"
        actionButton={actionButton}
      />

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3 px-4">Staff Name</th>
              <th className="py-3 px-4">Role / Position</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Assigned Active</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffList.map(stf => (
              <tr key={stf.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    {stf.name[0]}
                  </div>
                  {stf.name}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700">{stf.position}</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-800">{stf.department}</td>
                <td className="py-3.5 px-4 text-slate-500">{stf.phone}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">{stf.assignedCount} cases</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {stf.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
                    Edit Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
