import React from 'react';
import { Home, ClipboardList, PlusCircle, Bell, User } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';

export const ResidentMobileNav = ({ activeTab, setActiveTab }) => {
  const { notifications } = useComplaints();
  const unreadCount = notifications.filter(n => !n.read).length;

  const items = [
    { id: 'resident-dashboard', label: 'Home', icon: Home },
    { id: 'my-complaints', label: 'Complaints', icon: ClipboardList },
    { id: 'submit-complaint', label: 'Submit', icon: PlusCircle, isPrimary: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-xl lg:hidden px-3 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center -mt-6 group focus:outline-none touch-manipulation cursor-pointer"
                aria-label="Submit a Complaint"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/40 border-4 border-white active:scale-95 transition-transform group-hover:bg-emerald-800">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-1">Submit</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-all focus:outline-none min-w-[54px] min-h-[44px] justify-center touch-manipulation cursor-pointer active:scale-95 ${
                isActive 
                  ? 'text-emerald-800 font-extrabold scale-105' 
                  : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
              
              {item.badge > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {item.badge}
                </span>
              )}
              
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
