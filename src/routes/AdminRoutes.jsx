import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../pages/admin/layout/AdminLayout';
import { ExecutiveDashboard } from '../pages/admin/dashboard/ExecutiveDashboard';
import { ComplaintMasterlist } from '../pages/admin/complaints/ComplaintMasterlist';
import { AIRoutingCenter } from '../pages/admin/ai-routing/AIRoutingCenter';
import { DepartmentDirectory } from '../pages/admin/departments/DepartmentDirectory';
import { StaffDirectory } from '../pages/admin/staff/StaffDirectory';
import { ReportsAnalytics } from '../pages/admin/reports/ReportsAnalytics';
import { AuditTrail } from '../pages/admin/audit/AuditTrail';
import { AdminNotifications } from '../pages/admin/notifications/AdminNotifications';
import { AdminProfile } from '../pages/admin/profile/AdminProfile';
import { AdminSettings } from '../pages/admin/settings/AdminSettings';
import { ChatbotManagement } from '../pages/admin/chatbot/ChatbotManagement';
import { FeedbackManagementPage } from '../pages/admin/feedback/FeedbackManagementPage';
import { StaffComplaintDetails } from '../components/staff/StaffComplaintDetails';

export const AdminRoutes = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  selectedComplaint,
  onViewDetails,
  onOpenAIReview
}) => {
  const renderAdminPage = () => {
    switch (activeTab) {
      case 'admin-dashboard':
        return <ExecutiveDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'complaint-management':
        return <ComplaintMasterlist onViewDetails={onViewDetails} onOpenAIReview={onOpenAIReview} />;
      case 'routing-config':
        return <AIRoutingCenter />;
      case 'chatbot-management':
        return <ChatbotManagement />;
      case 'feedback':
        return <FeedbackManagementPage onViewDetails={onViewDetails} />;
      case 'departments':
        return <DepartmentDirectory />;
      case 'staff-management':
        return <StaffDirectory />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'audit-logs':
        return <AuditTrail />;
      case 'notifications':
        return <AdminNotifications onNavigate={(tab) => setActiveTab(tab)} />;
      case 'staff-details':
      case 'complaint-details':
        return (
          <StaffComplaintDetails
            complaint={selectedComplaint}
            onBack={() => setActiveTab('complaint-management')}
            onOpenAIReview={onOpenAIReview}
          />
        );
      case 'profile':
        return <AdminProfile />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <ExecutiveDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <ProtectedRoute requiredRole="admin" onNavigate={setActiveTab} onOpenAuth={onOpenAuth}>
      <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} onOpenAuth={onOpenAuth}>
        {renderAdminPage()}
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AdminRoutes;
