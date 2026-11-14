import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, LayoutDashboard, ClipboardList, Sliders, Building2, Users, 
  BarChart3, FileText, Bell, User, Settings, LogOut, Compass, ChevronRight 
} from 'lucide-react';

export const AdminMobileDrawer = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const renderSection = (title, items) => (
    <div className="space-y-1 mb-4">
      <p className="px-3 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase mb-1.5">
        {title}
      </p>
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.isLogout) {
                logout();
                setActiveTab('landing');
              } else {
                setActiveTab(item.id);
              }
              onClose();
            }}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold
              transition-all duration-150 group
              ${isActive 
                ? 'bg-emerald-600 text-white shadow-md' 
                : item.isLogout
                  ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : item.isLogout ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </div>
            {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 text-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Drawer Header */}
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-emerald-800 via-amber-400 to-emerald-600 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center border border-amber-300">
                  <img
                    src="/images/barangay-seal.png"
                    alt="Barangay Kinilis Official Seal"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
              <div>
                <p className="font-extrabold text-sm text-white">Barangay Kinilis</p>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Administrator Drawer
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Profile Banner */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-amber-400"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate">Full Access Admin</p>
            </div>
          </div>

          {/* Grouped Admin Navigation */}
          {renderSection('OPERATIONS', [
            { id: 'admin-dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
            { id: 'complaint-management', label: 'Complaint Masterlist', icon: ClipboardList },
            { id: 'routing-config', label: 'AI Category Routing', icon: Sliders }
          ])}

          {renderSection('MANAGEMENT', [
            { id: 'departments', label: 'Department Directory', icon: Building2 },
            { id: 'staff-management', label: 'Staff Directory', icon: Users }
          ])}

          {renderSection('REPORTING', [
            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
            { id: 'audit-logs', label: 'Audit Trail Log', icon: FileText }
          ])}

          {renderSection('SYSTEM & ACCOUNT', [
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'profile', label: 'Admin Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'landing', label: 'Public Website', icon: Compass },
            { id: 'logout', label: 'Sign Out', icon: LogOut, isLogout: true }
          ])}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[10px] text-slate-400 text-center">
          Barangay Kinilis Administrative Console • 2026
        </div>
      </div>
    </div>
  );
};
