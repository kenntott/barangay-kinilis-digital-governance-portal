import React from 'react';
import { useAuth } from '../../../hooks/auth/useAuth';
import { User, ShieldCheck } from 'lucide-react';

export const AdminProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <div className="w-16 h-16 rounded-full bg-emerald-700 text-amber-300 flex items-center justify-center font-black text-2xl border-2 border-amber-400">
          BK
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{user?.name || 'Admin User'}</h1>
          <p className="text-xs text-emerald-800 font-bold flex items-center gap-1 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-700 inline" />
            Full Access Administrator
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{user?.email}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Role & Scope</p>
          <p className="text-sm font-bold text-emerald-800 uppercase mt-1">{user?.role}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Department</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{user?.department || 'Executive Office'}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Location / Jurisdiction</p>
          <p className="text-sm font-bold text-slate-900 mt-1">Brgy. Kinilis, Polomolok, South Cotabato</p>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
