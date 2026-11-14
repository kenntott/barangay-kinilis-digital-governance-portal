import React from 'react';
import { ResidentDashboard as SharedResidentDashboard } from '../../../components/resident/ResidentDashboard';

export const ResidentDashboard = ({ onNavigate, onViewDetails }) => {
  return <SharedResidentDashboard onNavigate={onNavigate} onViewDetails={onViewDetails} />;
};

export default ResidentDashboard;
