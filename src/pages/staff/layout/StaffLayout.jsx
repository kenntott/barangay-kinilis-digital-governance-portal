import React, { useState } from 'react';
import { Navbar } from '../../../components/common/Navbar';
import { Sidebar } from '../../../components/common/Sidebar';
import { StaffMobileNav } from '../../../components/common/StaffMobileNav';
import { PortalSubheader } from '../../../components/common/PortalSubheader';

export const StaffLayout = ({ children, activeTab, setActiveTab, onOpenAuth }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col bg-slate-50 text-slate-800 h-screen overflow-hidden selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={onOpenAuth}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Staff Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Column with Aligned Subheader & Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Official Government Portal Subheader */}
          <PortalSubheader activeTab={activeTab} />

          {/* Main Viewport */}
          <main className="flex-1 overflow-y-auto overscroll-contain pb-24 lg:pb-8 p-4 md:p-6 lg:p-8 min-w-0 relative">
            {children}
          </main>
        </div>
      </div>

      {/* Staff Mobile Bottom Navigation */}
      <StaffMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default StaffLayout;
