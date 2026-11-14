import React from 'react';
import { StaffDashboard as SharedStaffDashboard } from '../../../components/staff/StaffDashboard';

export const StaffDashboard = ({ onViewDetails, onOpenAIReview }) => {
  return <SharedStaffDashboard onViewDetails={onViewDetails} onOpenAIReview={onOpenAIReview} />;
};

export default StaffDashboard;
