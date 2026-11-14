import React from 'react';
import { useAuth } from '../../../hooks/auth/useAuth';
import { Home } from 'lucide-react';

export const ResidentProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={user?.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-600"
        />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{user?.name || 'Resident'}</h1>
          <p className="text-xs text-emerald-800 font-bold flex items-center gap-1 uppercase tracking-wider">
            <Home className="w-4 h-4 text-emerald-700 inline" />
            Verified Barangay Resident
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{user?.email}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Resident Role</p>
          <p className="text-sm font-bold text-emerald-800 uppercase mt-1">{user?.role || 'Resident'}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 md:col-span-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Residential Purok & Address</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{user?.purok || 'Purok 3, Main Street, Brgy. Kinilis, Polomolok'}</p>
        </div>
      </div>
    </div>
  );
};

export default ResidentProfile;
