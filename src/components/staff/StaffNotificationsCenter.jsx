import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Bell, CheckCircle2, AlertTriangle, ShieldAlert, GitMerge, Bot, 
  UserCheck, ArrowRight, Clock, Star, Filter, Sparkles, RefreshCw
} from 'lucide-react';
import { AdminPageHeader } from '../common/AdminPageHeader';

export const StaffNotificationsCenter = ({ onNavigate }) => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsRead } = useComplaints();

  const [filterType, setFilterType] = useState('All');

  const departmentName = user?.department || 'Sanitation Department';

  // Generate staff operational alerts
  const staffAlerts = [
    {
      id: 'stf_notif_1',
      title: 'New Complaint Auto-Routed',
      message: `AI Engine automatically routed complaint KIN-2026-000123 ("Garbage uncollected at Purok 3") to ${departmentName} queue.`,
      timestamp: '10 minutes ago',
      type: 'assignment',
      read: false,
      priority: 'Medium',
      refCode: 'KIN-2026-000123'
    },
    {
      id: 'stf_notif_2',
      title: 'High Priority SLA Alert',
      message: 'Urgent complaint KIN-2026-000118 ("Drainage overflow hazard at Purok 5") requires site deployment within 2 hours.',
      timestamp: '45 minutes ago',
      type: 'urgent',
      read: false,
      priority: 'Urgent',
      refCode: 'KIN-2026-000118'
    },
    {
      id: 'stf_notif_3',
      title: 'Resident 5-Star Rating Received',
      message: 'Resident Juan dela Cruz submitted 5-star rating feedback for resolved complaint KIN-2026-000120 ("Dengue fogging").',
      timestamp: '2 hours ago',
      type: 'feedback',
      read: true,
      priority: 'Low',
      refCode: 'KIN-2026-000120'
    },
    {
      id: 'stf_notif_4',
      title: 'AI Routing Confidence Notice',
      message: 'AI classified complaint KIN-2026-000122 with 88% confidence. Please review assigned task specs.',
      timestamp: '5 hours ago',
      type: 'ai',
      read: true,
      priority: 'Medium',
      refCode: 'KIN-2026-000122'
    }
  ];

  const filteredAlerts = staffAlerts.filter(a => {
    if (filterType === 'Unread') return !a.read;
    if (filterType === 'Urgent') return a.priority === 'Urgent' || a.priority === 'High';
    if (filterType === 'Assignments') return a.type === 'assignment';
    return true;
  });

  return (
    <div className="space-y-8 pb-16 font-sans text-slate-800">
      
      {/* Page Header */}
      <AdminPageHeader
        title={`${departmentName} Operational Notifications`}
        description={`Real-time task assignments, SLA emergency alerts, and resident satisfaction feedback for ${user?.name || 'Staff Officer'}.`}
        badgeText="Department Alerts"
        actionButton={
          <button
            onClick={markAllNotificationsRead}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mark All Notifications Read</span>
          </button>
        }
      />

      {/* FILTER BUTTON TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-xs">
          {['All Alerts', 'Unread', 'Assignments', 'Urgent'].map(tab => {
            const key = tab === 'All Alerts' ? 'All' : tab;
            const isActive = filterType === key;
            return (
              <button
                key={tab}
                onClick={() => setFilterType(key)}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-700 text-white shadow-xs font-black' 
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing <strong>{filteredAlerts.length}</strong> operational alerts
        </span>
      </div>

      {/* OPERATIONAL NOTIFICATION CARDS STREAM */}
      <div className="space-y-4">
        {filteredAlerts.map(item => (
          <div 
            key={item.id}
            className={`p-5 rounded-3xl border transition-all space-y-3 shadow-xs ${
              !item.read 
                ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10' 
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 ${
                  item.type === 'urgent' ? 'bg-rose-100 text-rose-800' :
                  item.type === 'assignment' ? 'bg-emerald-100 text-emerald-800' :
                  item.type === 'feedback' ? 'bg-amber-100 text-amber-800' :
                  'bg-indigo-100 text-indigo-800'
                }`}>
                  {item.type === 'urgent' ? <ShieldAlert className="w-5 h-5" /> :
                   item.type === 'assignment' ? <GitMerge className="w-5 h-5" /> :
                   item.type === 'feedback' ? <Star className="w-5 h-5" /> :
                   <Bot className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">{item.title}</h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider">
                    {item.refCode}
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-bold">{item.timestamp}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1">
              {item.message}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                item.priority === 'Urgent' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700'
              }`}>
                {item.priority} Priority
              </span>

              <button
                onClick={() => onNavigate('staff-dashboard')}
                className="font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group text-xs"
              >
                <span>Process Task in Queue</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
