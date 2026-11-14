import React from 'react';
import { ComplaintSubmissionWizard } from '../../../components/resident/ComplaintSubmissionWizard';

export const SubmitComplaint = ({ onNavigate, onViewDetails }) => {
  return <ComplaintSubmissionWizard onNavigate={onNavigate} onViewDetails={onViewDetails} />;
};

export default SubmitComplaint;
