import React, { useState, useEffect } from 'react';
import { testSupabaseConnection } from '../../lib/supabaseService';
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const SupabaseHealthCheck = () => {
  const [status, setStatus] = useState({ loading: true, connected: false, message: '' });

  const runCheck = async () => {
    setStatus({ loading: true, connected: false, message: 'Testing Supabase Database connection...' });
    const res = await testSupabaseConnection();
    setStatus({
      loading: false,
      connected: res.connected,
      message: res.message,
      projectUrl: res.projectUrl
    });
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <div className={`p-4 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
      status.loading 
        ? 'bg-slate-100 border-slate-300 text-slate-700' 
        : status.connected 
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
          : 'bg-rose-50 border-rose-300 text-rose-900'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl text-white ${status.connected ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <Database className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm">Supabase Database Connection</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              status.connected ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
            }`}>
              {status.loading ? 'CHECKING...' : status.connected ? 'CONNECTED (LIVE)' : 'CONNECTION ERROR'}
            </span>
          </div>
          <p className="text-[11px] opacity-80 mt-0.5">{status.message}</p>
        </div>
      </div>

      <button
        onClick={runCheck}
        disabled={status.loading}
        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? 'animate-spin' : ''}`} />
        Re-test Connection
      </button>
    </div>
  );
};
