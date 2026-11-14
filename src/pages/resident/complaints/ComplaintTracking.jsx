import React from 'react';
import { ComplaintTracking as SharedComplaintTracking } from '../../../components/resident/ComplaintTracking';

export const ComplaintTracking = ({ complaint, onBack }) => {
  return <SharedComplaintTracking complaint={complaint} onBack={onBack} />;
};

export default ComplaintTracking;
