import React from 'react';
import { LayoutDashboard, FileText, ClipboardCheck, Bell, User, AlertCircle } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';

export const StaffMobileNav = ({ activeTab, setActiveTab }) => {
  const { complaints, notifications } = useComplaints();

  const unreadCount = notifications.filter(n => !n.read).length;
  const assignedCount = complaints.filter(c => c.status === 'Pending' || c.status === 'Assigned' || c.status === 'In Progress').length;
  const hasUrgent = complaints.some(c => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Closed');

  const items = [
    { id: 'staff-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'complaint-management', label: 'Complaints', icon: FileText, hasUrgentAlert: hasUrgent },
    { id: 'ai-review', label: 'Assignments', icon: ClipboardCheck, badge: assignedCount },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 shadow-2xl lg:hidden px-3 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center py-1.5 px-3 rounded-xl transition-all focus:outline-none min-w-[54px] min-h-[44px] justify-center touch-manipulation cursor-pointer active:scale-95 ${
                isActive 
                  ? 'text-amber-300 font-extrabold scale-105' 
                  : 'text-slate-400 font-semibold hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
              
              {/* Badge for assigned count or unread notifications */}
              {item.badge > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}

              {/* Urgent Priority Alert indicator */}
              {item.hasUrgentAlert && (
                <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
              
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
