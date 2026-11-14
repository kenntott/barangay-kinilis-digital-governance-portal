import React from 'react';
import { ComplaintManagement } from '../../../components/admin/ComplaintManagement';

export const ComplaintMasterlist = ({ onViewDetails, onOpenAIReview }) => {
  return <ComplaintManagement onViewDetails={onViewDetails} onOpenAIReview={onOpenAIReview} />;
};

export default ComplaintMasterlist;
