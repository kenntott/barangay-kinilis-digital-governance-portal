import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, PlusCircle, ClipboardList, LayoutDashboard, Building2, 
  Users, Sliders, BarChart3, FileText, Bell, Settings, User, Compass,
  ChevronRight, Bot, PanelLeftClose, PanelLeftOpen, Sparkles, ShieldCheck, X, MessageSquare
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'resident';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  const renderNavSection = (title, items) => (
    <div className="space-y-1 mb-4">
      {title && !isCollapsed && (
        <p className="px-3 text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1.5 flex items-center justify-between">
          <span>{title}</span>
        </p>
      )}
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            title={isCollapsed ? item.label : undefined}
            onClick={() => handleNavClick(item.id)}
            className={`
              w-full flex items-center justify-between rounded-xl text-xs font-semibold min-h-[44px]
              transition-all duration-150 group relative cursor-pointer touch-manipulation select-none
              active:scale-[0.98]
              ${isCollapsed ? 'p-3 justify-center' : 'px-3.5 py-2.5'}
              ${isActive 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-extrabold' 
                : item.highlight
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? 'text-amber-300' : item.highlight ? 'text-emerald-400' : 'text-slate-400'
              }`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </div>
            
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                {item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay - z-40 */}
      {isOpen && (
        <div 
          onClick={onClose}
          onTouchStart={onClose}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-40 lg:hidden cursor-pointer touch-manipulation"
        />
      )}

      {/* Sidebar Container - z-50 so sidebar items sit ABOVE backdrop on mobile */}
      <aside 
        aria-hidden={!isOpen}
        className={`
          fixed lg:relative top-0 lg:top-0 left-0 bottom-0 z-50
          ${isCollapsed ? 'w-20' : 'w-72 sm:w-80 lg:w-64'} h-full bg-slate-900 text-white flex flex-col justify-between
          transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800 shadow-2xl
          ${isOpen 
            ? 'translate-x-0 opacity-100 pointer-events-auto visible' 
            : '-translate-x-full opacity-0 pointer-events-none invisible lg:visible lg:opacity-100 lg:pointer-events-auto lg:translate-x-0'
          }
        `}
      >
        <div className="overflow-y-auto p-3.5 flex-1 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain">
          
          {/* Header Brand Badge & Close / Collapse Toggles */}
          <div className="flex items-center justify-between mb-4 px-1 pb-2 border-b border-slate-800 pt-2 lg:pt-0">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-amber-400 shrink-0">
                  <img src="/images/barangay-seal.png" alt="Barangay Seal" className="w-full h-full object-contain rounded-full bg-white" />
                </div>
                <div className="text-emerald-400 font-extrabold text-xs tracking-wider uppercase truncate">
                  Barangay Kinilis AI
                </div>
              </div>
            ) : (
              <div className="mx-auto w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-amber-400">
                <img src="/images/barangay-seal.png" alt="Barangay Seal" className="w-full h-full object-contain rounded-full bg-white" />
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              title="Close Sidebar Navigation"
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
            >
              <X className="w-6 h-6 text-emerald-400" />
            </button>
          </div>

          {/* User Profile Summary Card */}
          <div className={`p-3 bg-slate-800/90 rounded-2xl border border-slate-700/60 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4 shadow-sm`}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
            />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-100 truncate">{user?.name}</p>
                <p className="text-[10px] text-emerald-400 font-semibold truncate capitalize flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                  <span>{role} • {user?.department || 'Kinilis Portal'}</span>
                </p>
              </div>
            )}
          </div>

          {/* Role-specific Navigation Groups */}
          {role === 'resident' && (
            <>
              {renderNavSection('Resident Portal', [
                { id: 'resident-dashboard', label: 'Home Dashboard', icon: Home },
                { id: 'submit-complaint', label: 'Submit Complaint', icon: PlusCircle, highlight: true, badge: 'AI' },
                { id: 'my-complaints', label: 'My Complaints & Timeline', icon: ClipboardList },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'profile', label: 'My Account', icon: User },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'landing', label: 'Public Website', icon: Compass }
              ])}
            </>
          )}

          {role === 'staff' && (
            <>
              {renderNavSection('Operational Command', [
                { id: 'staff-dashboard', label: 'Staff Command Desk', icon: LayoutDashboard },
                { id: 'complaint-management', label: 'Assigned Complaints', icon: ClipboardList },
                { id: 'feedback', label: 'Resident Feedback', icon: MessageSquare },
                { id: 'ai-review', label: 'AI Review & Override', icon: Bot, highlight: true, badge: 'AUTO' },
                { id: 'notifications', label: 'Notifications', icon: Bell }
              ])}
              {renderNavSection('Tools & Account', [
                { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'landing', label: 'Public Website', icon: Compass }
              ])}
            </>
          )}

          {role === 'admin' && (
            <>
              {renderNavSection('OPERATIONS', [
                { id: 'admin-dashboard', label: 'Executive Command', icon: LayoutDashboard },
                { id: 'complaint-management', label: 'Complaint Masterlist', icon: ClipboardList },
                { id: 'routing-config', label: 'AI Category Routing', icon: Sliders, highlight: true, badge: 'AI PIPELINE' },
                { id: 'chatbot-management', label: 'Resident Assistant AI', icon: Bot, highlight: true, badge: 'BLAAN+' }
              ])}
              {renderNavSection('MANAGEMENT', [
                { id: 'departments', label: 'Department Directory', icon: Building2 },
                { id: 'staff-management', label: 'Staff Directory', icon: Users }
              ])}
              {renderNavSection('REPORTING', [
                { id: 'feedback', label: 'Resident Feedback & Inquiries', icon: MessageSquare },
                { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                { id: 'audit-logs', label: 'Audit Trail Log', icon: FileText }
              ])}
              {renderNavSection('SYSTEM & ACCOUNT', [
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'profile', label: 'Admin Profile', icon: User },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'landing', label: 'Public Website', icon: Compass }
              ])}
            </>
          )}
        </div>

        {/* Sidebar Bottom Banner */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          {!isCollapsed ? (
            <div className="bg-emerald-950/90 p-2.5 rounded-xl border border-emerald-800/60 text-center">
              <p className="text-[11px] font-black text-emerald-300 flex items-center justify-center gap-1">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                Kinilis AI Command Center
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Polomolok, South Cotabato</p>
            </div>
          ) : (
            <div className="flex justify-center text-emerald-400">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
