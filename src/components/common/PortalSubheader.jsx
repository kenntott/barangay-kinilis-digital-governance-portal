import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PhilippineDateTime } from './PhilippineDateTime';
import { 
  Shield, Building2, User, ChevronRight
} from 'lucide-react';

const TAB_TITLES = {
  // Admin Tabs
  'admin-dashboard': { title: 'Executive Command Center', category: 'Executive Dashboard' },
  'complaint-management': { title: 'Complaint Masterlist', category: 'Citizen Grievances' },
  'routing-config': { title: 'AI Routing & Category Rules', category: 'System Routing' },
  'departments': { title: 'Department Directory & Workload', category: 'Local Government Units' },
  'staff-management': { title: 'Personnel & Desk Officers', category: 'Staff Roster' },
  'reports': { title: 'Analytics & SLA Performance', category: 'Public Accountability' },
  'audit-logs': { title: 'Security & Action Audit Trail', category: 'Compliance' },
  'chatbot-management': { title: 'Resident Assistant AI Knowledge', category: 'Citizen Assistance' },
  'notifications': { title: 'System & Alert Notifications', category: 'In-App Alerts' },
  'profile': { title: 'Profile & Account Security', category: 'User Management' },
  'settings': { title: 'Portal Configuration', category: 'System Settings' },

  // Staff Tabs
  'staff-dashboard': { title: 'Department Operations Desk', category: 'Workload Overview' },
  'staff-assigned': { title: 'Assigned Complaints Roster', category: 'Active Casework' },
  'staff-ai-review': { title: 'AI Classification Review & Override', category: 'Routing Verification' },
  'staff-details': { title: 'Grievance Resolution & Proof', category: 'Case Investigation' },
  'staff-notifications': { title: 'Operational Alerts', category: 'Staff Notifications' },
  'staff-reports': { title: 'Department Metrics & SLA', category: 'Performance' },

  // Resident Tabs
  'resident-dashboard': { title: 'Resident Grievance Dashboard', category: 'Citizen Portal' },
  'submit-complaint': { title: 'File New Community Concern', category: 'Incident Submission' },
  'complaint-tracking': { title: 'Real-Time Resolution Timeline', category: 'Case Tracking' },
  'my-complaints': { title: 'My Submitted Concerns', category: 'Citizen Records' },
  'resident-notifications': { title: 'Service Updates & Responses', category: 'Notifications' },
  'resident-settings': { title: 'Resident Account Information', category: 'Settings' }
};

export const PortalSubheader = ({ activeTab, titleOverride, categoryOverride, actions }) => {
  const { user } = useAuth();
  const role = user?.role || 'resident';

  const tabInfo = TAB_TITLES[activeTab] || { 
    title: titleOverride || 'Digital Governance Workspace', 
    category: categoryOverride || 'Barangay Services' 
  };

  const roleBadgeConfig = {
    admin: {
      label: 'Administrator Portal',
      bg: 'bg-emerald-100 text-[#075B42] border-emerald-300',
      icon: Shield
    },
    staff: {
      label: 'Staff Operations',
      bg: 'bg-sky-100 text-sky-900 border-sky-300',
      icon: Building2
    },
    resident: {
      label: 'Citizen Services',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: User
    }
  }[role] || {
    label: 'Official Portal',
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: User
  };

  const RoleIcon = roleBadgeConfig.icon;

  return (
    <section 
      aria-label="Portal Subheader"
      className="bg-white border-b border-slate-200/90 shadow-2xs shrink-0 z-20 transition-all w-full"
    >
      <div className="w-full px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* LEFT: Contextual Breadcrumb & Current Section Title */}
        <div className="min-w-0 space-y-0.5">
          {/* Breadcrumb Path */}
          <div className="flex items-center flex-wrap gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wide uppercase">
            <span className="text-[#075B42] font-black">
              Barangay Kinilis
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="inline-flex items-center gap-1 font-extrabold text-slate-700">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black border ${roleBadgeConfig.bg}`}>
                <RoleIcon className="w-2.5 h-2.5 shrink-0" />
                <span>{roleBadgeConfig.label}</span>
              </span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-emerald-700 font-extrabold truncate">
              {tabInfo.category}
            </span>
          </div>

          {/* Current Section Title */}
          <div className="flex items-center gap-2 pt-0.5">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
              {titleOverride || tabInfo.title}
            </h2>
          </div>
        </div>

        {/* RIGHT: Live Philippine Standard Time & Optional Actions */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-3 shrink-0 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          {actions && (
            <div className="shrink-0">
              {actions}
            </div>
          )}
          
          {/* Mobile Date/Time Fallback */}
          <div className="md:hidden w-full sm:w-auto">
            <PhilippineDateTime />
          </div>
        </div>

      </div>
    </section>
  );
};

export default PortalSubheader;
