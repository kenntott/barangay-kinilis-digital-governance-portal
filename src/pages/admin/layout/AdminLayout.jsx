import React, { useState } from 'react';
import { Navbar } from '../../../components/common/Navbar';
import { Sidebar } from '../../../components/common/Sidebar';

export const AdminLayout = ({ children, activeTab, setActiveTab, onOpenAuth }) => {
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
        {/* Admin Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8 min-w-0 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
