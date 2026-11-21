import React, { useEffect, useState } from 'react';
import './SystemPreloader.css';

/**
 * SystemPreloader - Minimal, Elegant, Premium 3D Preloader for Barangay Kinilis
 * Inspired by the DesinioKoleksyon aesthetic:
 *  - Fullscreen dark emerald / charcoal canvas
 *  - Discreet geometric corner accents (dots + diagonal lines)
 *  - Centered official 3D seal with subtle floating elevation
 *  - Single refined rotating accent ring with travelling photon
 *  - Bold, clean typography with subtle gold highlights
 *  - Minimal, high-precision circular spinner with contextual status
 *  - Exact 5.0s presentation sequence
 */
export const SystemPreloader = ({ 
  mode = 'startup', 
  userRole = null, 
  userName = null,
  onComplete = null,
  minDuration = 5000 
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [stage, setStage] = useState(1);

  useEffect(() => {
    // 5-second staged reveal sequence
    const t1 = setTimeout(() => setStage(2), 1000); // 1.0s: Seal smoothly scales in
    const t2 = setTimeout(() => setStage(3), 2000); // 2.0s: Brand title & portal text fade in
    const t3 = setTimeout(() => setStage(4), 3000); // 3.0s: Tagline & circular spinner appear
    const t4 = setTimeout(() => setStage(5), 4200); // 4.2s: Full composition settles

    const exitTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 550); // CSS fade-out transition
    }, minDuration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(exitTimer);
    };
  }, [minDuration, onComplete]);

  // Contextual text based on mode
  const getContextInfo = () => {
    switch (mode) {
      case 'login':
        return {
          title: 'BARANGAY KINILIS',
          subtitle: 'DIGITAL GOVERNANCE PORTAL',
          desc: userRole ? `Accessing ${userRole.toUpperCase()} Command Center` : 'Welcome to your secure portal',
          status: 'PREPARING YOUR DASHBOARD...'
        };
      case 'logout':
        return {
          title: 'BARANGAY KINILIS',
          subtitle: 'DIGITAL GOVERNANCE PORTAL',
          desc: 'Thank you for visiting Barangay Kinilis Digital Services',
          status: 'SECURELY SIGNING OUT...'
        };
      case 'startup':
      default:
        return {
          title: 'BARANGAY KINILIS',
          subtitle: 'DIGITAL GOVERNANCE PORTAL',
          desc: 'Smarter Governance, Faster Service.',
          status: 'INITIALIZING DIGITAL SERVICES...'
        };
    }
  };

  const info = getContextInfo();

  return (
    <div 
      className={`kinilis-minimal-preloader fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden ${
        isFadingOut ? 'kinilis-preloader-fadeout' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Barangay Kinilis Portal"
    >
      {/* 1. Subtle Background Ambience */}
      <div className="kinilis-minimal-backdrop" />

      {/* 2. Discreet Geometric Corner Decorations (DesinioKoleksyon Style) */}
      <div className="kinilis-corner-decor kinilis-corner-tl">
        {/* Top-Left: Dot Grid */}
        <div className="kinilis-dot-matrix">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="kinilis-grid-dot" />
          ))}
        </div>
      </div>

      <div className="kinilis-corner-decor kinilis-corner-tr">
        {/* Top-Right: Diagonal Lines */}
        <div className="kinilis-diagonal-stripes" />
      </div>

      <div className="kinilis-corner-decor kinilis-corner-bl">
        {/* Bottom-Left: Diagonal Lines */}
        <div className="kinilis-diagonal-stripes flip" />
      </div>

      <div className="kinilis-corner-decor kinilis-corner-br">
        {/* Bottom-Right: Dot Grid */}
        <div className="kinilis-dot-matrix">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="kinilis-grid-dot" />
          ))}
        </div>
      </div>

      {/* Main Content Vertical Column (Centered, Clean Spacing) */}
      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 max-w-lg z-10">
        
        {/* Centered 3D Official Seal with Single Refined Halo Ring */}
        <div className={`kinilis-seal-centerpiece relative flex items-center justify-center stage-${stage}`}>
          {/* Soft Emerald Glow Backdrop */}
          <div className="kinilis-seal-soft-radial" />
          
          {/* Single Thin Animated Gold & Emerald Accent Ring */}
          <div className="kinilis-minimal-accent-ring">
            <span className="kinilis-ring-photon" />
          </div>

          {/* Elevation Depth Shadow */}
          <div className="kinilis-seal-base-shadow" />

          {/* The Official 3D Barangay Kinilis Seal */}
          <div className="kinilis-seal-img-box relative z-10">
            <img
              src="/images/barangay-kinilis-seal.png"
              alt="Official 3D Barangay Kinilis Seal"
              className="kinilis-seal-img object-contain pointer-events-none"
              onError={(e) => {
                e.currentTarget.src = '/images/barangay-seal.png';
              }}
            />
          </div>
        </div>

        {/* Large, Modern, Elegant System Branding */}
        <div className={`kinilis-brand-block mt-8 flex flex-col items-center text-center transition-all duration-700 ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <h1 className="kinilis-title-main text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-[0.14em] uppercase">
            {info.title}
          </h1>

          <div className="kinilis-title-portal text-xs sm:text-sm font-extrabold text-amber-400 tracking-[0.28em] uppercase mt-1.5">
            {info.subtitle}
          </div>

          {/* Short, Refined Tagline / Description */}
          <p className="kinilis-desc-text text-xs sm:text-sm text-slate-300 font-medium tracking-wide mt-3 italic">
            "{info.desc}"
          </p>
        </div>

        {/* Minimal Circular Loading Animation (Inspired by Reference) */}
        <div className={`kinilis-loader-block mt-8 flex flex-col items-center transition-all duration-700 ${stage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          
          {/* High-Precision Circular Spinner */}
          <div className="kinilis-minimal-spinner relative flex items-center justify-center">
            <div className="kinilis-spinner-track" />
            <div className="kinilis-spinner-glow-head" />
            <div className="kinilis-spinner-center-dot" />
          </div>

          {/* Clean Contextual Status Text */}
          <div className="kinilis-status-label text-[11px] font-mono tracking-[0.25em] text-emerald-400 font-bold uppercase mt-3">
            {info.status}
          </div>
        </div>
      </div>

      {/* 4. Elegant Minimal Footer */}
      <footer className="w-full pb-6 text-center z-10">
        <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase">
          BARANGAY KINILIS DIGITAL SERVICES • POLOMOLOK
        </p>
      </footer>
    </div>
  );
};

export default SystemPreloader;
