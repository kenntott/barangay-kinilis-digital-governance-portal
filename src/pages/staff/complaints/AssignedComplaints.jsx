import React from 'react';
import { StaffComplaintDetails } from '../../../components/staff/StaffComplaintDetails';

export const AssignedComplaints = ({ complaint, onBack, onOpenAIReview }) => {
  return (
    <StaffComplaintDetails
      complaint={complaint}
      onBack={onBack}
      onOpenAIReview={onOpenAIReview}
    />
  );
};

export default AssignedComplaints;
