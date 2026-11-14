import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ResidentMobileNav } from './ResidentMobileNav';
import { StaffMobileNav } from './StaffMobileNav';

export const MobileNav = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null; // Public / Guest: No portal bottom navbar
  }

  if (user.role === 'resident') {
    return <ResidentMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  if (user.role === 'staff') {
    return <StaffMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  // Admin has NO bottom navbar (Requirement 1, 10, 12)
  return null;
};
