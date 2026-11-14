import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export const InstallAppButton = ({
  variant = 'default',
  className = '',
  label = 'Install Kinilis Iba Ka',
  installedLabel = 'App Installed ✓'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = window.navigator.standalone === true;
      const isAndroidAppReferrer = document.referrer.includes('android-app://');
      return isStandaloneMedia || isNavigatorStandalone || isAndroidAppReferrer;
    };

    if (checkStandalone()) {
      setIsInstalled(true);
    }

    // Detect display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) setIsInstalled(true);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 3. Listen for Chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 4. Listen for successful installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // If already installed, do nothing
    if (isInstalled) return;

    // iOS Safari guidance modal
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Chromium deferred prompt available
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt failed:', err);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // Fallback: If no deferred prompt but on mobile/browser, alert or show iOS/instructions
    setShowIOSModal(true);
  };

  // Render variant styles
  if (isInstalled) {
    if (variant === 'hidden') return null;

    if (variant === 'badge') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-300 dark:border-emerald-800 ${className}`}>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {installedLabel}
        </span>
      );
    }

    if (variant === 'card') {
      return (
        <div className={`p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">Application Installed</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Kinilis Iba Ka is installed on your device home screen.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg shrink-0">
            Installed
          </span>
        </div>
      );
    }

    return (
      <button
        disabled
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 cursor-default ${className}`}
      >
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        {installedLabel}
      </button>
    );
  }

  return (
    <>
      {variant === 'card' ? (
        <div className={`p-4 bg-gradient-to-r from-emerald-900 to-green-800 text-white rounded-2xl shadow-lg border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Kinilis Iba Ka" className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 shrink-0" />
            <div>
              <h4 className="font-bold text-white text-base">Install Kinilis Iba Ka App</h4>
              <p className="text-xs text-emerald-100">Get fast offline access, instant notifications, and one-tap complaint reporting.</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            {isInstalling ? 'Installing...' : label}
          </button>
        </div>
      ) : variant === 'hero' ? (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-emerald-900/30 transition-all duration-200 active:scale-95 border border-emerald-500/30 ${className}`}
        >
          <Smartphone className="w-5 h-5 text-amber-300" />
          <span>{isInstalling ? 'Installing App...' : label}</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalling ? 'Installing...' : label}</span>
        </button>
      )}

      {/* iOS Safari Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Barangay Kinilis" className="w-12 h-12 rounded-2xl object-contain bg-emerald-50 p-1" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Install Kinilis Iba Ka</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Barangay Kinilis Digital Services</p>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 text-xs text-emerald-900 dark:text-emerald-200 space-y-3">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                To install this app on your iPhone or iPad:
              </p>
              <ol className="space-y-2 list-decimal list-inside text-slate-700 dark:text-slate-300">
                <li className="leading-relaxed">
                  Tap the <span className="font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></span> button in Safari's bottom toolbar.
                </li>
                <li className="leading-relaxed">
                  Scroll down the menu and tap <span className="font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline" /></span>.
                </li>
                <li className="leading-relaxed">
                  Tap <span className="font-bold text-emerald-800 dark:text-emerald-300">Add</span> in the top right corner to complete.
                </li>
              </ol>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppButton;
