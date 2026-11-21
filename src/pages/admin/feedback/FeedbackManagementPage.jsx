import React from 'react';
import { FeedbackManagement } from '../../../components/admin/FeedbackManagement';

export const FeedbackManagementPage = ({ onViewDetails }) => {
  return <FeedbackManagement onViewDetails={onViewDetails} />;
};

export default FeedbackManagementPage;
