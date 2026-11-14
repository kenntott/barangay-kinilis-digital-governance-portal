import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../hooks/auth/useAuth';

export const Unauthorized = ({ onNavigate }) => {
  const { user } = useAuth();
  const role = user?.role || 'resident';

  const handleReturnHome = () => {
    if (onNavigate) {
      if (role === 'admin') onNavigate('admin-dashboard');
      else if (role === 'staff') onNavigate('staff-dashboard');
      else onNavigate('resident-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
      <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">403 - Access Denied</h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          You do not have administrative permission to view this portal area.
          Role separation security policies prohibit cross-portal access.
        </p>
        <div className="pt-4">
          <button
            onClick={handleReturnHome}
            className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Home className="w-4 h-4" /> Return to My Portal Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
