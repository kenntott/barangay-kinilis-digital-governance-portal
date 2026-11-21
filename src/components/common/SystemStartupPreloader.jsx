import React, { useEffect, useState, useRef } from 'react';
import './SystemStartupPreloader.css';
import { 
  Settings, Box, Database, UserCheck, LayoutGrid, ShieldCheck, 
  AlertCircle, RotateCcw, Check, LogOut, KeyRound, Sparkles
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { testSupabaseConnection } from '../../lib/supabaseService';

/**
 * SystemStartupPreloader - Percentage-Based Cinematic Preloader
 * SWAPPED FUNCTIONALITY:
 *  - Exclusively for LOGIN (Admin, Staff, Resident) and LOGOUT.
 *  - Displays dynamic percentage counter, horizontal progress bar with photon light,
 *    and contextual operational stages matching login or logout.
 */
export const SystemStartupPreloader = ({ 
  mode = 'login', // 'login' or 'logout'
  userRole = null,
  userName = null,
  onComplete = null, 
  minDuration = 5000 
}) => {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [opError, setOpError] = useState(null);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  // Contextual stages based on mode
  const getStages = () => {
    if (mode === 'logout') {
      return [
        { id: 'session', label: 'Terminating active session...', icon: KeyRound, targetPct: 20 },
        { id: 'cache', label: 'Clearing local storage & credentials...', icon: Box, targetPct: 45 },
        { id: 'supabase', label: 'Disconnecting from Supabase...', icon: Database, targetPct: 65 },
        { id: 'cleanup', label: 'Cleaning up active Realtime channels...', icon: ShieldCheck, targetPct: 85 },
        { id: 'redirect', label: 'Redirecting to public portal...', icon: LogOut, targetPct: 100 }
      ];
    }
    // Login stages
    const roleLabel = userRole ? userRole.toUpperCase() : 'RESIDENT';
    return [
      { id: 'auth', label: 'Authenticating credentials with Supabase...', icon: UserCheck, targetPct: 20 },
      { id: 'profile', label: `Loading ${roleLabel} command profile...`, icon: Settings, targetPct: 40 },
      { id: 'channels', label: 'Connecting to Realtime notifications...', icon: Database, targetPct: 65 },
      { id: 'dashboard', label: 'Preparing personalized dashboard...', icon: LayoutGrid, targetPct: 85 },
      { id: 'ready', label: `Welcome, ${userName || 'Kabarangay'}! Access granted.`, icon: ShieldCheck, targetPct: 100 }
    ];
  };

  const STAGES = getStages();

  // Smooth number interpolation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev < progress) {
          const step = Math.max(1, Math.round((progress - prev) * 0.25));
          return Math.min(progress, prev + step);
        }
        return prev;
      });
    }, 35);
    return () => clearInterval(timer);
  }, [progress]);

  // Main asynchronous progression flow
  const runOperation = async () => {
    setOpError(null);
    startTimeRef.current = Date.now();
    completedRef.current = false;

    try {
      const stepDuration = Math.max(450, Math.floor((minDuration - 800) / STAGES.length));

      for (let i = 0; i < STAGES.length; i++) {
        setCurrentStageIdx(i);
        setProgress(STAGES[i].targetPct);
        await new Promise(r => setTimeout(r, stepDuration));
      }

      // Ensure minDuration (5.0 seconds) is respected before fading out
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(400, minDuration - elapsed);

      setTimeout(() => {
        completedRef.current = true;
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 550); // Wait for CSS opacity transition
      }, remainingTime);

    } catch (err) {
      console.error('[SystemStartupPreloader] Operation failure:', err);
      setOpError(err.message || 'An error occurred during authentication/session transition.');
    }
  };

  useEffect(() => {
    runOperation();
  }, [mode, userRole]);

  const getHeaderBadge = () => {
    if (mode === 'logout') {
      return 'BARANGAY KINILIS • SECURE LOGOUT';
    }
    return userRole 
      ? `BARANGAY KINILIS • ${userRole.toUpperCase()} LOGIN`
      : 'BARANGAY KINILIS • AUTHENTICATION';
  };

  const getSubtitle = () => {
    if (mode === 'logout') {
      return 'SECURELY SIGNING OUT...';
    }
    return userRole 
      ? `ACCESSING ${userRole.toUpperCase()} PORTAL` 
      : 'AUTHENTICATING DIGITAL SERVICES...';
  };

  return (
    <div 
      className={`kinilis-startup-preloader fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden ${
        isFadingOut ? 'kinilis-startup-fadeout' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label="Barangay Kinilis Authentication Transition"
    >
      {/* 1. Ambient Background with Soft Radial Glow */}
      <div className="kinilis-startup-backdrop" />
      <div className="kinilis-startup-radial-glow" />

      {/* 2. Geometric Corner Accents */}
      <div className="kinilis-startup-corner corner-tl">
        <div className="kinilis-startup-matrix">
          {[...Array(15)].map((_, i) => <span key={i} className="startup-dot" />)}
        </div>
      </div>
      <div className="kinilis-startup-corner corner-tr">
        <div className="kinilis-startup-diagonal" />
      </div>
      <div className="kinilis-startup-corner corner-bl">
        <div className="kinilis-startup-diagonal flip" />
      </div>
      <div className="kinilis-startup-corner corner-br">
        <div className="kinilis-startup-matrix">
          {[...Array(15)].map((_, i) => <span key={i} className="startup-dot" />)}
        </div>
      </div>

      {/* Top Header Tag */}
      <header className="w-full pt-8 sm:pt-10 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-amber-300 text-[10px] font-mono tracking-[0.25em] uppercase shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{getHeaderBadge()}</span>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="w-full max-w-4xl px-4 flex-1 flex flex-col items-center justify-center z-10 space-y-6 sm:space-y-8">
        
        {/* 3D Official Seal with Refined Rotating Outer Accent Ring */}
        <div className="kinilis-startup-seal-wrapper relative flex items-center justify-center">
          <div className="kinilis-startup-seal-glow" />
          
          {/* Animated Outer Golden-Emerald Ring */}
          <div className="kinilis-startup-seal-ring">
            <span className="startup-ring-photon" />
          </div>

          {/* Depth Shadow */}
          <div className="kinilis-startup-seal-shadow" />

          {/* Official 3D Seal */}
          <div className="kinilis-startup-seal-box relative z-10">
            <img
              src="/images/barangay-kinilis-seal.png"
              alt="Barangay Kinilis Official 3D Seal"
              className="kinilis-startup-seal-img object-contain pointer-events-none"
              onError={(e) => {
                e.currentTarget.src = '/images/barangay-seal.png';
              }}
            />
          </div>
        </div>

        {/* System Branding Typography */}
        <div className="text-center space-y-1 sm:space-y-1.5">
          <h1 className="kinilis-startup-title text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-[0.14em] uppercase">
            BARANGAY KINILIS
          </h1>
          <div className="kinilis-startup-subtitle text-xs sm:text-sm font-extrabold text-amber-400 tracking-[0.28em] uppercase">
            {getSubtitle()}
          </div>
          <p className="kinilis-startup-tagline text-xs sm:text-sm text-slate-300 font-medium italic pt-1">
            {mode === 'logout' 
              ? '"Thank you for utilizing Barangay Kinilis Digital Services."'
              : '"Smarter Governance, Faster Service."'}
          </p>
        </div>

        {/* Dynamic Percentage & Horizontal Progress Bar Block */}
        <div className="w-full max-w-xl mx-auto space-y-3.5 text-center">
          
          {/* Large Animated Percentage Counter */}
          <div className="flex items-baseline justify-center gap-1">
            <span className="kinilis-startup-percentage font-black font-mono text-4xl sm:text-6xl text-amber-400 tracking-tight drop-shadow-[0_0_25px_rgba(232,184,68,0.45)]">
              {displayProgress}
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300/80 font-mono">%</span>
          </div>

          {/* Modern Horizontal Progress Bar */}
          <div className="kinilis-startup-progress-track relative w-full h-3 sm:h-3.5 rounded-full overflow-hidden bg-slate-900/80 border border-emerald-500/40 p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            <div 
              className="kinilis-startup-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-300 ease-out relative shadow-[0_0_15px_rgba(16,185,129,0.6)]"
              style={{ width: `${displayProgress}%` }}
            >
              {/* Traveling light photon along the progress bar */}
              <span className="startup-progress-photon" />
            </div>
          </div>

          {/* Current Dynamic Status Message */}
          <div className="kinilis-startup-status-msg font-mono text-xs sm:text-sm font-bold tracking-[0.18em] text-emerald-300 uppercase min-h-[1.5rem] flex items-center justify-center gap-2">
            <span>{STAGES[currentStageIdx]?.label || 'PROCESSING...'}</span>
          </div>
        </div>

        {/* Staged Circular Icon Indicators */}
        <div className="w-full max-w-3xl pt-2 hidden sm:block">
          <div className={`grid grid-cols-${STAGES.length} gap-2 sm:gap-3 relative`} style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }}>
            
            {/* Connecting line behind icons */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-emerald-950/80 -translate-y-1/2 z-0" />
            
            {STAGES.map((s, idx) => {
              const isPassed = idx < currentStageIdx || displayProgress === 100;
              const isCurrent = idx === currentStageIdx && displayProgress < 100;
              const IconComp = s.icon;

              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center text-center group">
                  {/* Circular Step Badge */}
                  <div className={`
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 border
                    ${isPassed 
                      ? 'bg-emerald-700/80 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : isCurrent 
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-4 ring-amber-400/20 scale-110 animate-pulse' 
                        : 'bg-slate-900/80 border-slate-700 text-slate-500'}
                  `}>
                    {isPassed ? (
                      <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                    ) : (
                      <IconComp className="w-4 h-4" />
                    )}
                  </div>

                  {/* Tiny Status Label */}
                  <span className={`
                    text-[9px] sm:text-[10px] font-medium leading-tight mt-2 px-1 line-clamp-2 transition-colors
                    ${isCurrent ? 'text-amber-300 font-bold' : isPassed ? 'text-slate-300' : 'text-slate-500'}
                  `}>
                    {s.label.replace('...', '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Handling Card */}
        {opError && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs max-w-md text-center space-y-2 animate-in fade-in">
            <div className="flex items-center justify-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Operation Error</span>
            </div>
            <p className="text-[11px] text-rose-300/90">{opError}</p>
            <button
              onClick={runOperation}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="w-full pb-6 text-center z-10 space-y-1">
        <div className="flex items-center justify-center gap-4 text-[10px] font-mono tracking-[0.25em] text-slate-400 uppercase">
          <span>SECURE DIGITAL SERVICES</span>
          <span className="text-amber-400">•</span>
          <span>VERSION 1.0.0</span>
        </div>
        <p className="text-[9px] text-slate-500 font-mono tracking-[0.3em] uppercase">
          BARANGAY KINILIS DIGITAL SERVICES • POLOMOLOK, SOUTH COTABATO
        </p>
      </footer>
    </div>
  );
};

export default SystemStartupPreloader;
