import React from 'react';
import { LandingPage as SharedLandingPage } from '../../components/landing/LandingPage';

export const LandingPage = ({ onNavigate, onOpenAuth }) => {
  return <SharedLandingPage onNavigate={onNavigate} onOpenAuth={onOpenAuth} />;
};

export default LandingPage;
