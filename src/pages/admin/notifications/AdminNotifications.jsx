import React from 'react';
import { NotificationCenter } from '../../../components/shared/NotificationCenter';

export const AdminNotifications = ({ onNavigate }) => {
  return <NotificationCenter onNavigate={onNavigate} />;
};

export default AdminNotifications;
