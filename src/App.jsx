import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';

import { PublicRoutes } from './routes/PublicRoutes';
import { AdminRoutes } from './routes/AdminRoutes';
import { StaffRoutes } from './routes/StaffRoutes';
import { ResidentRoutes } from './routes/ResidentRoutes';

import { Toast } from './components/common/Toast';
import { AuthModal } from './components/auth/AuthModal';
import { AIReviewOverrideModal } from './components/staff/AIReviewOverrideModal';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAUpdateToast } from './components/common/PWAUpdateToast';

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [aiReviewComplaint, setAiReviewComplaint] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccessRedirect = (role) => {
    showToast(`Welcome! Signed in to ${role.toUpperCase()} portal.`, 'success');
    if (role === 'resident') setActiveTab('resident-dashboard');
    else if (role === 'staff') setActiveTab('staff-dashboard');
    else if (role === 'admin') setActiveTab('admin-dashboard');
    else setActiveTab('resident-dashboard');
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    if (user?.role === 'resident') {
      setActiveTab('complaint-tracking');
    } else {
      setActiveTab('staff-details');
    }
  };

  const handleOpenAIReview = (complaint) => {
    setAiReviewComplaint(complaint);
  };

  const renderRolePortal = () => {
    if (!isAuthenticated || !user || activeTab === 'landing') {
      return (
        <PublicRoutes
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuth={handleOpenAuth}
        />
      );
    }

    switch (user.role) {
      case 'admin':
        return (
          <AdminRoutes
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAuth={handleOpenAuth}
            onViewDetails={handleViewDetails}
            onOpenAIReview={handleOpenAIReview}
          />
        );
      case 'staff':
        return (
          <StaffRoutes
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAuth={handleOpenAuth}
            selectedComplaint={selectedComplaint}
            onViewDetails={handleViewDetails}
            onOpenAIReview={handleOpenAIReview}
          />
        );
      case 'resident':
      default:
        return (
          <ResidentRoutes
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAuth={handleOpenAuth}
            selectedComplaint={selectedComplaint}
            onViewDetails={handleViewDetails}
          />
        );
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 selection:bg-emerald-600 selection:text-white min-h-screen">
      <OfflineBanner />
      {renderRolePortal()}

      {/* PWA New Version Update Toast */}
      <PWAUpdateToast />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onSuccessRedirect={handleAuthSuccessRedirect}
      />

      {/* AI Review & Override Modal */}
      {aiReviewComplaint && (
        <AIReviewOverrideModal
          complaint={aiReviewComplaint}
          onClose={() => setAiReviewComplaint(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ComplaintProvider>
        <AppContent />
      </ComplaintProvider>
    </AuthProvider>
  );
}

