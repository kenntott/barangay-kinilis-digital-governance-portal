import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { StaffLayout } from '../pages/staff/layout/StaffLayout';
import { StaffDashboard } from '../components/staff/StaffDashboard';
import { StaffAssignedMasterlist } from '../components/staff/StaffAssignedMasterlist';
import { StaffAIReviewDesk } from '../components/staff/StaffAIReviewDesk';
import { StaffNotificationsCenter } from '../components/staff/StaffNotificationsCenter';
import { StaffReportsAnalytics } from '../components/staff/StaffReportsAnalytics';
import { FeedbackManagement } from '../components/admin/FeedbackManagement';
import { AssignedComplaints } from '../pages/staff/complaints/AssignedComplaints';
import { StaffProfile } from '../pages/staff/profile/StaffProfile';
import { SettingsPage } from '../components/shared/SettingsPage';

export const StaffRoutes = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  selectedComplaint,
  onViewDetails,
  onOpenAIReview
}) => {
  const renderStaffPage = () => {
    switch (activeTab) {
      case 'staff-dashboard':
        return <StaffDashboard onViewDetails={onViewDetails} onOpenAIReview={onOpenAIReview} />;
      case 'complaint-management':
        return <StaffAssignedMasterlist onViewDetails={onViewDetails} onOpenAIReview={onOpenAIReview} />;
      case 'feedback':
        return <FeedbackManagement onViewDetails={onViewDetails} />;
      case 'ai-review':
        return <StaffAIReviewDesk onNavigate={(tab) => setActiveTab(tab)} onOpenAIReview={onOpenAIReview} />;
      case 'notifications':
        return <StaffNotificationsCenter onNavigate={(tab) => setActiveTab(tab)} />;
      case 'reports':
        return <StaffReportsAnalytics />;
      case 'staff-details':
        return (
          <AssignedComplaints
            complaint={selectedComplaint}
            onBack={() => setActiveTab('staff-dashboard')}
            onOpenAIReview={onOpenAIReview}
          />
        );
      case 'profile':
        return <StaffProfile />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <StaffDashboard onViewDetails={onViewDetails} onOpenAIReview={onOpenAIReview} />;
    }
  };

  return (
    <ProtectedRoute requiredRole="staff" onNavigate={setActiveTab} onOpenAuth={onOpenAuth}>
      <StaffLayout activeTab={activeTab} setActiveTab={setActiveTab} onOpenAuth={onOpenAuth}>
        {renderStaffPage()}
      </StaffLayout>
    </ProtectedRoute>
  );
};

export default StaffRoutes;
