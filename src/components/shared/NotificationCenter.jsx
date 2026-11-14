import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck, Clock, ShieldAlert, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

export const NotificationCenter = ({ onNavigate }) => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsRead } = useComplaints();
  const [filter, setFilter] = useState('All');

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Notification Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time complaint tracking updates, AI routing alerts, and status changes</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1.5 rounded-lg ${filter === 'All' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('Unread')}
              className={`px-3 py-1.5 rounded-lg ${filter === 'Unread' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'}`}
            >
              Unread
            </button>
          </div>
          <button
            onClick={markAllNotificationsRead}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4 text-emerald-700" /> Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">No notifications to display.</p>
        ) : (
          filtered.map((n, idx) => (
            <div
              key={`${n.id}_${idx}`}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer flex items-start gap-4 ${
                !n.read ? 'bg-emerald-50/50 border border-emerald-100' : ''
              }`}
            >
              <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-xs">{n.title}</h3>
                  <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                {n.referenceNo && (
                  <span className="inline-block mt-2 font-bold text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Ref: {n.referenceNo}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
