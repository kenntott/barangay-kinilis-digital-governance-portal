import React from 'react';
import { useAuth } from '../hooks/auth/useAuth';
import { Unauthorized } from '../pages/public/Unauthorized';

export const ProtectedRoute = ({ children, requiredRole, onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-4 shadow-2xl">
          <h2 className="text-xl font-black text-white">Authentication Required</h2>
          <p className="text-xs text-slate-300">Please sign in with your credentials to access this portal.</p>
          <button
            onClick={() => onOpenAuth && onOpenAuth('login')}
            className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
          >
            Sign In to Account
          </button>
        </div>
      </div>
    );
  }

  if (!user?.status || user.status.trim().toLowerCase() !== 'active') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-rose-500/30 space-y-4 shadow-2xl">
          <h2 className="text-xl font-black text-rose-400">Account Inactive or Suspended</h2>
          <p className="text-xs text-slate-300">Your account is currently deactivated or suspended. You cannot access this portal.</p>
          <button
            onClick={() => onOpenAuth && onOpenAuth('login')}
            className="w-full py-3 px-5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-xs shadow-md"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Unauthorized onNavigate={onNavigate} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
