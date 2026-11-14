import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Bell, Menu, X, User, LogOut, LayoutDashboard, ChevronDown, CheckCheck, 
  Search, Activity, Sparkles, Building2, ClipboardList, Shield 
} from 'lucide-react';
import { InstallAppButton } from './InstallAppButton';

export const Navbar = ({ 
  onToggleSidebar, 
  activeTab, 
  setActiveTab, 
  onOpenAuth,
  initialActiveSection = 'home'
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { complaints, departments, notifications, markNotificationAsRead, markAllNotificationsRead } = useComplaints();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Smart Auto-Hide Header States
  const [showHeader, setShowHeader] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);
  const isManualScrollRef = useRef(false);
  const manualScrollTimerRef = useRef(null);

  // Real-time Scroll-Aware Active Section state
  const [activeSection, setActiveSection] = useState(initialActiveSection);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isPortalView = activeTab !== 'landing' && isAuthenticated && user;

  // Optimized Scroll-Direction Detection and Accurate Active Section Spy
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollYRef.current;
      const SCROLL_THRESHOLD = 8; // Small threshold to ignore micro-jitter

      setIsScrolled(currentScrollY > 15);

      // 1. Smart Auto-Hide Logic (Only applies on public landing page)
      if (activeTab !== 'landing') {
        setShowHeader(true);
      } else if (mobileMenuOpen) {
        // Keep header fully visible when mobile drawer is open
        setShowHeader(true);
      } else if (currentScrollY <= 20) {
        // At the very top: ALWAYS show complete header
        setShowHeader(true);
      } else if (scrollDiff > SCROLL_THRESHOLD && currentScrollY > 70) {
        // Scrolling DOWN -> smoothly slide up and hide
        setShowHeader(false);
      } else if (scrollDiff < -SCROLL_THRESHOLD) {
        // Scrolling UP -> smoothly slide down and reveal
        setShowHeader(true);
      }

      lastScrollYRef.current = currentScrollY;

      // 2. Navigation Active Section Spy for Landing Page (skipped during manual click scroll transit)
      if (activeTab === 'landing' && !isManualScrollRef.current) {
        const windowHeight = window.innerHeight;
        const fullHeight = document.documentElement.scrollHeight;

        // Bottom of the page activates Contact
        if (windowHeight + currentScrollY >= fullHeight - 90) {
          setActiveSection('contact');
          return;
        }

        // Very top activates Home
        if (currentScrollY < 260) {
          setActiveSection(prev => prev === 'track' ? 'track' : 'home');
          return;
        }

        // Ordered sections in visual top-to-bottom layout
        const sectionMapping = [
          { id: 'contact', navId: 'contact' },
          { id: 'transparency', navId: 'services' },
          { id: 'gallery', navId: 'services' },
          { id: 'departments', navId: 'departments' },
          { id: 'how-it-works', navId: 'how-it-works' },
          { id: 'announcements', navId: 'services' },
          { id: 'about', navId: 'about' },
          { id: 'services', navId: 'services' },
          { id: 'leadership', navId: 'home' },
          { id: 'home', navId: 'home' }
        ];

        const targetLine = 160; // 160px from viewport top
        for (const sec of sectionMapping) {
          const el = document.getElementById(sec.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= targetLine && rect.bottom >= targetLine) {
              setActiveSection(sec.navId);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    };
  }, [activeTab, mobileMenuOpen]);

  // Real-time Global Search matching
  const matchingComplaints = searchQuery.trim() 
    ? complaints.filter(c => 
        c.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const matchingDepartments = searchQuery.trim()
    ? departments.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.head.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 2)
    : [];

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'services', label: 'Services' },
    { id: 'departments', label: 'Departments' },
    { id: 'track', label: 'Track Complaint' },
    { id: 'contact', label: 'Contact' }
  ];

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    isManualScrollRef.current = true;
    setShowHeader(true); // Ensure header is visible when user clicks a navigation item

    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 850);

    setMobileMenuOpen(false);

    if (activeTab !== 'landing') {
      setActiveTab('landing');
      setTimeout(() => {
        if (sectionId === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleDashboardRedirect = () => {
    if (user?.role === 'resident') setActiveTab('resident-dashboard');
    else if (user?.role === 'staff') setActiveTab('staff-dashboard');
    else if (user?.role === 'admin') setActiveTab('admin-dashboard');
    else setActiveTab('resident-dashboard');
  };

  const handleMobileMenuClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeTab !== 'landing') {
      if (onToggleSidebar) onToggleSidebar();
    } else {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-40 w-full h-16 sm:h-20 bg-white/95 backdrop-blur-md flex items-center shrink-0 transition-transform duration-300 ease-in-out will-change-transform ${
          (activeTab === 'landing' && !showHeader) ? '-translate-y-full' : 'translate-y-0'
        } ${
          isScrolled 
            ? 'shadow-[0_4px_25px_rgba(5,150,105,0.18)] border-b border-emerald-500/30' 
            : 'border-b border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.08)]'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* LEFT SECTION: Logo & Barangay Name */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Sidebar Toggle for Portal Views Only */}
            {activeTab !== 'landing' && (
              <button
                type="button"
                onClick={handleMobileMenuClick}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none lg:hidden shrink-0 transition-colors touch-manipulation cursor-pointer active:scale-95"
                aria-label="Toggle Navigation Sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <div
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0"
            >
              {/* Circular Badge Treatment with Floating Animation & Soft Glow */}
              <div className="barangay-seal-animated w-11 h-11 sm:w-14 sm:h-14 aspect-square rounded-full p-0.5 bg-gradient-to-tr from-[#075B42] via-emerald-400 to-[#E8B844] shrink-0 overflow-hidden cursor-pointer">
                <div className="w-full h-full aspect-square rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center border border-emerald-50">
                  <img
                    src="/images/barangay-seal.png"
                    alt="Barangay Kinilis Official Seal"
                    className="w-full h-full max-w-full max-h-full aspect-square object-contain rounded-full shrink-0"
                    onError={(e) => {
                      e.target.src = '/images/barangay-seal.jpg';
                    }}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight tracking-tight group-hover:text-[#075B42] transition-colors truncate">
                    Barangay Kinilis
                  </h1>
                  {user?.role === 'admin' && isPortalView && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-widest">
                      AI Command Center
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-[#075B42] leading-none mt-0.5 tracking-wide truncate">
                  Polomolok, South Cotabato
                </p>
              </div>
            </div>
          </div>

          {/* CENTER SECTION (Portal View): Global Search Bar */}
          {isPortalView && (
            <div className="hidden md:flex relative flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search complaints, residents, departments..."
                  value={searchQuery}
                  onFocus={() => setShowSearchResults(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Global Search Results Dropdown */}
              {showSearchResults && searchQuery.trim().length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 space-y-3"
                  onMouseLeave={() => setShowSearchResults(false)}
                >
                  {matchingComplaints.length === 0 && matchingDepartments.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-3">No matching records found for "{searchQuery}"</p>
                  ) : (
                    <>
                      {matchingComplaints.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Complaints</p>
                          {matchingComplaints.map(cmp => (
                            <button
                              key={cmp.id}
                              onClick={() => {
                                setActiveTab('complaint-management');
                                setSearchQuery('');
                                setShowSearchResults(false);
                              }}
                              className="w-full text-left p-2 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between text-xs"
                            >
                              <div className="overflow-hidden pr-2">
                                <p className="font-bold text-slate-900 truncate">{cmp.title}</p>
                                <p className="text-[10px] text-slate-500">{cmp.referenceNo} • {cmp.residentName}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {cmp.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {matchingDepartments.length > 0 && (
                        <div className="space-y-1 border-t border-slate-100 pt-2">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Departments</p>
                          {matchingDepartments.map(dept => (
                            <button
                              key={dept.id}
                              onClick={() => {
                                setActiveTab('departments');
                                setSearchQuery('');
                                setShowSearchResults(false);
                              }}
                              className="w-full text-left p-2 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-slate-900 truncate">{dept.name}</span>
                              <span className="text-[10px] text-emerald-800 font-semibold">{dept.head}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CENTER SECTION (Desktop Landing): Public Nav Links with Smooth Active Underline */}
          {activeTab === 'landing' && (
            <nav className="hidden xl:flex items-center gap-7 text-xs font-bold">
              {navLinks.map(link => {
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className={`relative py-2 px-1 text-xs font-bold transition-colors cursor-pointer group ${
                      isActive 
                        ? 'text-[#075B42] font-black' 
                        : 'text-slate-600 hover:text-[#075B42]'
                    }`}
                  >
                    <span>{link.label}</span>
                    
                    {/* Centered Active Indicator with Smooth Scale Transition */}
                    <span 
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#075B42] rounded-full shadow-[0_0_8px_rgba(7,91,66,0.4)] transition-all duration-300 ease-out origin-center ${
                        isActive 
                          ? 'opacity-100 scale-x-100' 
                          : 'opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-75'
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          )}

          {/* RIGHT SECTION: Auth Actions, Status Indicator & Profile */}
          <div className="flex items-center gap-3">
            {/* Live System Indicator Badge */}
            {isPortalView && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold tracking-wide">LIVE SYSTEM</span>
              </div>
            )}
            {isAuthenticated && user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifs(!showNotifs);
                      setShowProfileMenu(false);
                    }}
                    className="relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition-colors touch-manipulation cursor-pointer"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5 pointer-events-none" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse pointer-events-none">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <>
                      {/* Invisible backdrop to dismiss on touch outside */}
                      <div 
                        className="fixed inset-0 z-40 bg-transparent cursor-pointer touch-manipulation" 
                        onClick={() => setShowNotifs(false)}
                        onTouchStart={() => setShowNotifs(false)}
                      />
                      <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 text-xs">Notifications</h3>
                          {unreadCount > 0 && (
                            <button 
                              type="button"
                              onClick={markAllNotificationsRead} 
                              className="text-xs text-emerald-700 font-semibold p-1.5 touch-manipulation cursor-pointer"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <p className="p-4 text-center text-xs text-slate-500">No notifications yet</p>
                          ) : (
                            notifications.map((n, idx) => (
                              <div
                                key={`${n.id}_${idx}`}
                                onClick={() => {
                                  markNotificationAsRead(n.id);
                                  handleDashboardRedirect();
                                  setShowNotifs(false);
                                }}
                                className={`p-3.5 hover:bg-slate-50 cursor-pointer touch-manipulation text-xs ${!n.read ? 'bg-emerald-50/50' : ''}`}
                              >
                                <p className="font-bold text-slate-900">{n.title}</p>
                                <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Portal Dashboard Button */}
                <button
                  type="button"
                  onClick={handleDashboardRedirect}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all touch-manipulation cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" /> Portal Dashboard
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifs(false);
                    }}
                    className="flex items-center gap-2 p-1 min-w-[44px] min-h-[44px] justify-center rounded-full hover:bg-slate-100 border border-slate-200 touch-manipulation cursor-pointer"
                    aria-label="Open profile menu"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-600 pointer-events-none"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 pr-1 hidden sm:block pointer-events-none" />
                  </button>

                  {showProfileMenu && (
                    <>
                      {/* Invisible backdrop to dismiss on touch outside */}
                      <div 
                        className="fixed inset-0 z-40 bg-transparent cursor-pointer touch-manipulation" 
                        onClick={() => setShowProfileMenu(false)}
                        onTouchStart={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                          <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded uppercase">
                            {user.role}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { handleDashboardRedirect(); setShowProfileMenu(false); }}
                          className="w-full text-left px-4 py-2.5 min-h-[44px] hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 touch-manipulation cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-700" /> My Portal Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                          className="w-full text-left px-4 py-2.5 min-h-[44px] hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2 touch-manipulation cursor-pointer"
                        >
                          <User className="w-4 h-4 text-slate-500" /> Profile Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => { logout(); setActiveTab('landing'); setShowProfileMenu(false); }}
                          className="w-full text-left px-4 py-2.5 min-h-[44px] hover:bg-rose-50 font-bold text-rose-600 flex items-center gap-2 border-t border-slate-100 touch-manipulation cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Logged Out Actions: Install App, Login / Register */
              <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                  <InstallAppButton variant="default" label="Install App" />
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-[#075B42]/30 text-[#075B42] hover:bg-[#E7F3EC] font-extrabold text-xs transition-all touch-manipulation cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-[#075B42] hover:bg-[#0B8F65] text-white font-extrabold text-xs shadow-md transition-all touch-manipulation cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button for Landing Page */}
            {activeTab === 'landing' && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 xl:hidden touch-manipulation cursor-pointer active:scale-95"
                aria-label="Mobile Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* PUBLIC MOBILE NAVIGATION DRAWER WITH ACTIVE HIGHLIGHTS */}
        {mobileMenuOpen && activeTab === 'landing' && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 px-4 py-5 space-y-3 shadow-2xl z-50 animate-in fade-in max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain">
            <div className="pb-2 border-b border-slate-100">
              <InstallAppButton variant="card" label="Install Kinilis Iba Ka App" />
            </div>
            <nav className="flex flex-col space-y-1.5 text-xs font-bold">
              {navLinks.map(link => {
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className={`text-left px-3.5 py-3 min-h-[44px] rounded-xl transition-all flex items-center justify-between touch-manipulation cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-900 border-l-4 border-[#075B42] pl-3 font-extrabold' 
                        : 'hover:bg-slate-50 text-slate-700 hover:text-emerald-800'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#075B42]" />}
                  </button>
                );
              })}
            </nav>

            {!isAuthenticated && (
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                  className="flex-1 py-3 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs text-center touch-manipulation cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                  className="flex-1 py-3 min-h-[44px] rounded-xl bg-[#075B42] hover:bg-[#0B8F65] text-white font-extrabold text-xs text-center shadow-md touch-manipulation cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
