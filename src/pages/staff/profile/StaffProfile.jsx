import React from 'react';
import { useAuth } from '../../../hooks/auth/useAuth';
import { UserCheck } from 'lucide-react';

export const StaffProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={user?.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
        />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{user?.name || 'Staff Member'}</h1>
          <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-emerald-600 inline" />
            {user?.department || 'Department Staff'} Personnel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{user?.email}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Department</p>
          <p className="text-sm font-bold text-emerald-800 mt-1">{user?.department || 'Sanitation Department'}</p>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
