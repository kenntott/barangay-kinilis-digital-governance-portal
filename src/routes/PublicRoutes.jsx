import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { LandingPage } from '../pages/public/LandingPage';
import { Unauthorized } from '../pages/public/Unauthorized';
import { KinilisResidentAssistant } from '../components/chatbot/KinilisResidentAssistant';

export const PublicRoutes = ({ activeTab, setActiveTab, onOpenAuth }) => {
  if (activeTab === 'unauthorized') {
    return <Unauthorized onNavigate={setActiveTab} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={onOpenAuth}
      />
      <main className="flex-1">
        <LandingPage onNavigate={setActiveTab} onOpenAuth={onOpenAuth} />
      </main>

      {/* Floating Chatbot Assistant - Rendered EXCLUSIVELY on Public Landing Page */}
      <KinilisResidentAssistant
        onNavigate={setActiveTab}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};

export default PublicRoutes;

