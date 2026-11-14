import React from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { ResidentLayout } from '../pages/resident/layout/ResidentLayout';
import { ResidentDashboard } from '../pages/resident/dashboard/ResidentDashboard';
import { SubmitComplaint } from '../pages/resident/complaints/SubmitComplaint';
import { ComplaintTracking } from '../pages/resident/complaints/ComplaintTracking';
import { ResidentNotifications } from '../pages/resident/notifications/ResidentNotifications';
import { ResidentProfile } from '../pages/resident/profile/ResidentProfile';
import { ResidentSettings } from '../pages/resident/settings/ResidentSettings';

export const ResidentRoutes = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  selectedComplaint,
  onViewDetails
}) => {
  const renderResidentPage = () => {
    switch (activeTab) {
      case 'resident-dashboard':
        return <ResidentDashboard onNavigate={(tab) => setActiveTab(tab)} onViewDetails={onViewDetails} />;
      case 'submit-complaint':
        return <SubmitComplaint onNavigate={(tab) => setActiveTab(tab)} onViewDetails={onViewDetails} />;
      case 'my-complaints':
      case 'complaint-tracking':
        return (
          <ComplaintTracking
            complaint={selectedComplaint || {
              id: 'cmp_123',
              referenceNo: 'KIN-2026-000123',
              title: 'Garbage not collected along Purok 3 main street',
              description: 'Unhygienic uncollected garbage piles left for 4 days near corner store.',
              category: 'Waste Management',
              priority: 'Medium',
              status: 'In Progress',
              location: 'Purok 3, Main Street, Brgy. Kinilis',
              residentName: 'Juan dela Cruz',
              submittedAt: '2026-04-26T10:30:00Z',
              routing: { department: 'Sanitation Department', assignedStaff: 'Maria Santos', routingStatus: 'Automatically Routed' },
              aiResult: { confidence: 92, reason: 'The complaint describes uncollected garbage.' },
              timeline: [
                { status: 'Submitted', date: '2026-04-26 10:30 AM', desc: 'Registered by resident Juan dela Cruz.' },
                { status: 'AI Classified', date: '2026-04-26 10:30 AM', desc: 'Classified as Waste Management (92% confidence).' },
                { status: 'Routed', date: '2026-04-26 10:30 AM', desc: 'Routed to Sanitation Department.' },
                { status: 'In Progress', date: '2026-04-26 11:20 AM', desc: 'Sanitation truck dispatched.' }
              ]
            }}
            onBack={() => setActiveTab('resident-dashboard')}
          />
        );
      case 'notifications':
        return <ResidentNotifications onNavigate={(tab) => setActiveTab(tab)} />;
      case 'profile':
        return <ResidentProfile />;
      case 'settings':
        return <ResidentSettings />;
      default:
        return <ResidentDashboard onNavigate={(tab) => setActiveTab(tab)} onViewDetails={onViewDetails} />;
    }
  };

  return (
    <ProtectedRoute requiredRole="resident" onNavigate={setActiveTab} onOpenAuth={onOpenAuth}>
      <ResidentLayout activeTab={activeTab} setActiveTab={setActiveTab} onOpenAuth={onOpenAuth}>
        {renderResidentPage()}
      </ResidentLayout>
    </ProtectedRoute>
  );
};

export default ResidentRoutes;
