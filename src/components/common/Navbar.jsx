import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { 
  Bell, Menu, X, User, LogOut, LayoutDashboard, ChevronDown, 
  Search
} from 'lucide-react';
import { InstallAppButton } from './InstallAppButton';
import { PhilippineDateTime } from './PhilippineDateTime';

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
  
  // Sticky Scroll State: Header stays consistently solid white on scroll
  const [isScrolled, setIsScrolled] = useState(false);
  const isManualScrollRef = useRef(false);
  const manualScrollTimerRef = useRef(null);

  // Real-time Scroll-Aware Active Section state
  const [activeSection, setActiveSection] = useState(initialActiveSection);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isPortalView = activeTab !== 'landing' && isAuthenticated && user;

  // Optimized Scroll Detection and Active Section Spy
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);

      // Navigation Active Section Spy for Landing Page
      if (activeTab === 'landing' && !isManualScrollRef.current) {
        const windowHeight = window.innerHeight;
        const fullHeight = document.documentElement.scrollHeight;

        if (windowHeight + currentScrollY >= fullHeight - 90) {
          setActiveSection('contact');
          return;
        }

        if (currentScrollY < 260) {
          setActiveSection(prev => prev === 'track' ? 'track' : 'home');
          return;
        }

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

        const targetLine = 160;
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
  }, [activeTab]);

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

    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 1000);

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleMobileMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSidebar) onToggleSidebar();
  };

  const handleDashboardRedirect = () => {
    if (!isAuthenticated || !user) {
      onOpenAuth('login');
      return;
    }
    if (user.role === 'admin') setActiveTab('admin-dashboard');
    else if (user.role === 'staff') setActiveTab('staff-dashboard');
    else if (user.role === 'resident') setActiveTab('resident-dashboard');
  };

  const roleTitleBadge = {
    admin: { label: 'Admin Command Center', bg: 'bg-emerald-100 text-[#075B42] border-emerald-300' },
    staff: { label: 'Staff Operations Desk', bg: 'bg-sky-100 text-sky-900 border-sky-300' },
    resident: { label: 'Citizen Portal', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
  }[user?.role] || { label: 'Official Portal', bg: 'bg-slate-100 text-slate-800 border-slate-300' };

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-white transition-all duration-200 shrink-0 ${
        isScrolled 
          ? 'shadow-sm border-b border-slate-200/90' 
          : 'border-b border-slate-200/60 shadow-none'
      }`}
    >
      <div className={`w-full ${isPortalView ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4`}>
        
        {/* LEFT SECTION: Official Barangay Seal & Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 shrink-0">
          {/* Sidebar Toggle for Portal Views Only */}
          {activeTab !== 'landing' && (
            <button
              type="button"
              onClick={handleMobileMenuClick}
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-[#075B42] focus:outline-none lg:hidden shrink-0 transition-colors touch-manipulation cursor-pointer active:scale-95 border border-slate-200/80"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0 select-none"
          >
            {/* Official Seal with Crisp Government Border */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 aspect-square rounded-full p-0.5 bg-gradient-to-tr from-[#075B42] via-emerald-600 to-[#E8B844] shrink-0 overflow-hidden shadow-xs cursor-pointer group-hover:scale-105 transition-transform">
              <div className="w-full h-full aspect-square rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
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

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#075B42] leading-none block truncate">
                  Bayan ng Polomolok
                </span>
                {isPortalView && (
                  <span className={`hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${roleTitleBadge.bg}`}>
                    {roleTitleBadge.label}
                  </span>
                )}
              </div>
              
              <h1 className="font-black text-slate-900 text-xs sm:text-base leading-none tracking-tight group-hover:text-[#075B42] transition-colors truncate">
                Barangay Kinilis
              </h1>
              
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-500 leading-none tracking-wide truncate">
                {isPortalView ? 'Digital Governance Portal' : 'Lalawigan ng Timog Cotabato'}
              </p>
            </div>
          </div>
        </div>

        {/* CENTER SECTION (Portal View): Government Global Search Bar */}
        {isPortalView && (
          <div className="hidden md:flex relative flex-1 max-w-sm lg:max-w-md mx-2">
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
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#075B42] focus:bg-white focus:outline-none transition-all shadow-2xs"
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
                        <p className="text-[10px] font-extrabold text-[#075B42] uppercase tracking-wider px-2">Complaints</p>
                        {matchingComplaints.map(cmp => (
                          <button
                            key={cmp.id}
                            onClick={() => {
                              setActiveTab('complaint-management');
                              setSearchQuery('');
                              setShowSearchResults(false);
                            }}
                            className="w-full text-left p-2 hover:bg-emerald-50/60 rounded-xl transition-colors flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div className="overflow-hidden pr-2">
                              <p className="font-bold text-slate-900 truncate">{cmp.title}</p>
                              <p className="text-[10px] text-slate-500">{cmp.referenceNo} • {cmp.residentName}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                              {cmp.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {matchingDepartments.length > 0 && (
                      <div className="space-y-1 border-t border-slate-100 pt-2">
                        <p className="text-[10px] font-extrabold text-[#075B42] uppercase tracking-wider px-2">Departments</p>
                        {matchingDepartments.map(dept => (
                          <button
                            key={dept.id}
                            onClick={() => {
                              setActiveTab('departments');
                              setSearchQuery('');
                              setShowSearchResults(false);
                            }}
                            className="w-full text-left p-2 hover:bg-emerald-50/60 rounded-xl transition-colors flex items-center justify-between text-xs cursor-pointer"
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

        {/* CENTER SECTION (Desktop Landing): Public Nav Links with Emerald Active Indicator */}
        {activeTab === 'landing' && (
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-xs font-bold shrink-0">
            {navLinks.map(link => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative py-2 px-1 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer group ${
                    isActive 
                      ? 'text-[#075B42] font-black' 
                      : 'text-slate-700 hover:text-[#075B42]'
                  }`}
                >
                  <span>{link.label}</span>
                  <span 
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#075B42] rounded-full shadow-[0_0_8px_rgba(7,91,66,0.3)] transition-all duration-300 ease-out origin-center ${
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

        {/* RIGHT SECTION: Authenticated Portal Controls OR Public Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Live Portal Indicator Badge (Authenticated Only) */}
          {isPortalView && (
            <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#075B42] text-xs font-extrabold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10px] font-black tracking-wider uppercase">Live</span>
            </div>
          )}

          {isAuthenticated && user ? (
            <>
              {/* LIVE PHILIPPINE DATE & TIME (Exclusively inside Authenticated Portals) */}
              <div className="hidden md:block">
                <PhilippineDateTime />
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    setShowProfileMenu(false);
                  }}
                  className="relative p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-700 hover:bg-emerald-50 hover:text-[#075B42] rounded-xl transition-colors touch-manipulation cursor-pointer border border-slate-200/80"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4 pointer-events-none" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse pointer-events-none">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent cursor-pointer touch-manipulation" 
                      onClick={() => setShowNotifs(false)}
                      onTouchStart={() => setShowNotifs(false)}
                    />
                    <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-xs">Official Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            type="button"
                            onClick={markAllNotificationsRead} 
                            className="text-xs text-[#075B42] hover:text-[#0B8F65] font-bold p-1 touch-manipulation cursor-pointer"
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
                              className={`p-3.5 hover:bg-emerald-50/40 cursor-pointer touch-manipulation text-xs ${!n.read ? 'bg-emerald-50/60 font-semibold' : ''}`}
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
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#075B42] hover:bg-[#054331] text-white font-extrabold text-xs shadow-xs transition-all touch-manipulation cursor-pointer active:scale-98"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> 
                <span>Portal Desk</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifs(false);
                  }}
                  className="flex items-center gap-2 p-1 min-w-[38px] min-h-[38px] justify-center rounded-xl hover:bg-emerald-50 border border-slate-200 touch-manipulation cursor-pointer"
                  aria-label="Open profile menu"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg object-cover border border-[#075B42] pointer-events-none"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block pointer-events-none" />
                </button>

                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent cursor-pointer touch-manipulation" 
                      onClick={() => setShowProfileMenu(false)}
                      onTouchStart={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-extrabold text-slate-900 truncate">{user.name}</p>
                        <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                        <span className={`mt-1.5 inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${roleTitleBadge.bg}`}>
                          {user.role}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { handleDashboardRedirect(); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/60 font-semibold text-slate-800 flex items-center gap-2 touch-manipulation cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#075B42]" /> My Portal Desk
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/60 font-semibold text-slate-800 flex items-center gap-2 touch-manipulation cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-500" /> Account Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => { logout(); setActiveTab('landing'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-rose-50 font-bold text-rose-600 flex items-center gap-2 border-t border-slate-100 touch-manipulation cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Logged Out Actions: Install App, Sign In / Register (Hidden on small mobile, placed in drawer) */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden sm:block">
                <InstallAppButton variant="default" label="Install App" />
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="hidden sm:inline-flex px-3 sm:px-4 py-2 min-h-[38px] rounded-xl border border-[#075B42]/30 text-[#075B42] hover:bg-emerald-50 font-black text-xs transition-all touch-manipulation cursor-pointer whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="hidden sm:inline-flex px-3 sm:px-4 py-2 min-h-[38px] rounded-xl bg-[#075B42] hover:bg-[#054331] text-white font-black text-xs shadow-xs transition-all touch-manipulation cursor-pointer whitespace-nowrap"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button for Landing Page (screens < 1024px) */}
          {activeTab === 'landing' && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-800 hover:bg-slate-100 hover:text-[#075B42] lg:hidden touch-manipulation cursor-pointer active:scale-95 border border-slate-200/90 shadow-2xs"
              aria-label={mobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#075B42]" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          )}
        </div>
      </div>

      {/* PUBLIC MOBILE NAVIGATION DRAWER & BACKDROP */}
      {mobileMenuOpen && activeTab === 'landing' && (
        <>
          {/* Mobile Menu Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-[57px] sm:top-[65px] bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
            aria-hidden="true"
          />

          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b-2 border-[#075B42]/30 px-4 py-5 space-y-4 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain">
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
                    className={`text-left px-4 py-3 min-h-[44px] rounded-xl transition-all flex items-center justify-between touch-manipulation cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-900 border-l-4 border-[#075B42] font-black' 
                        : 'hover:bg-slate-50 text-slate-700 hover:text-[#075B42]'
                    }`}
                  >
                    <span className="text-sm font-bold">{link.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#075B42]" />}
                  </button>
                );
              })}
            </nav>

            {!isAuthenticated && (
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                  className="w-full py-3 min-h-[44px] rounded-xl border-2 border-[#075B42]/30 bg-emerald-50/50 hover:bg-emerald-50 text-[#075B42] font-black text-xs text-center touch-manipulation cursor-pointer active:scale-98"
                >
                  Sign In to Account
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                  className="w-full py-3 min-h-[44px] rounded-xl bg-[#075B42] hover:bg-[#054331] text-white font-black text-xs text-center shadow-md touch-manipulation cursor-pointer active:scale-98"
                >
                  Register New Account
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
