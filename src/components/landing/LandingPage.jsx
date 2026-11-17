import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import punongBarangayImg from '../../assets/images/punong-barangay.jpg';
import { 
  Sparkles, Shield, Clock, Search, MapPin, Building2, 
  Users, Check, ArrowRight, Phone, Mail, 
  FileText, Bell, AlertTriangle, HeartPulse, Trash2, 
  Wrench, CheckCircle2, ChevronRight, X, ExternalLink,
  ShieldAlert, Award, Calendar, Eye, Lock, ArrowUpRight,
  Info, Compass, HelpCircle, PhoneCall, ShieldCheck, Loader2
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';

export const LandingPage = ({ onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const { complaints } = useComplaints();

  // Search tracker state
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Gallery Lightbox modal state
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  // Announcement modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Officials & Emergency modals
  const [officialsModalOpen, setOfficialsModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Close lightbox on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedGalleryImage(null);
        setSelectedAnnouncement(null);
        setOfficialsModalOpen(false);
        setEmergencyModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // CTA button handlers
  const handleSubmitClick = () => {
    if (!isAuthenticated || !user) {
      onOpenAuth('login');
    } else if (user.role === 'resident') {
      onNavigate('submit-complaint');
    } else if (user.role === 'staff') {
      onNavigate('staff-dashboard');
    } else if (user.role === 'admin') {
      onNavigate('admin-dashboard');
    }
  };

  const handleTrackClick = () => {
    if (isAuthenticated) {
      if (user?.role === 'resident') onNavigate('my-complaints');
      else onNavigate('complaint-management');
    } else {
      const el = document.getElementById('track');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else onOpenAuth('login');
    }
  };

  const handleSearchTrack = (e) => {
    e.preventDefault();
    const query = trackInput.trim().toLowerCase();
    if (!query) {
      setSearched(true);
      setTrackResult(null);
      return;
    }
    setIsTrackingLoading(true);
    setSearched(true);

    setTimeout(() => {
      const found = complaints.find(c => c.referenceNo.toLowerCase() === query);
      setTrackResult(found || null);
      setIsTrackingLoading(false);
    }, 350);
  };

  // Section 6: Six Public Community Services
  const communityServices = [
    {
      id: 'file-complaint',
      title: 'FILE A COMPLAINT',
      desc: 'Report incidents, disputes, and community concerns directly to barangay officials.',
      icon: FileText,
      action: handleSubmitClick,
      btnLabel: 'File Report'
    },
    {
      id: 'track-complaint',
      title: 'TRACK A COMPLAINT',
      desc: 'Monitor the progress of your submitted complaint in real-time with your reference number.',
      icon: Search,
      action: () => {
        const el = document.getElementById('track');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      btnLabel: 'Track Status'
    },
    {
      id: 'announcements',
      title: 'ANNOUNCEMENTS',
      desc: 'Read official barangay announcements and important community updates.',
      icon: Bell,
      action: () => {
        const el = document.getElementById('announcements');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      btnLabel: 'View Updates'
    },
    {
      id: 'our-officials',
      title: 'OUR OFFICIALS',
      desc: 'Get to know the barangay officials, sangguniang kagawad, and their public service responsibilities.',
      icon: Users,
      action: () => setOfficialsModalOpen(true),
      btnLabel: 'View Officials'
    },
    {
      id: 'departments',
      title: 'DEPARTMENTS',
      desc: 'Explore the dedicated departments handling different community concerns.',
      icon: Building2,
      action: () => {
        const el = document.getElementById('departments');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      btnLabel: 'Explore Units'
    },
    {
      id: 'emergency-info',
      title: 'EMERGENCY INFORMATION',
      desc: 'Access verified barangay emergency hotlines, disaster response units, and health desks.',
      icon: PhoneCall,
      action: () => setEmergencyModalOpen(true),
      btnLabel: 'Emergency Desk'
    }
  ];

  // Section 8: Public Services Supported by the Portal
  const supportedPortalServices = [
    {
      title: 'Online Complaint Submission',
      desc: 'Submit community grievances 24/7 with photo evidence, accurate purok location details, and incident timestamps.',
      icon: FileText,
      actionText: 'File Report',
      action: handleSubmitClick
    },
    {
      title: 'Complaint Tracking & Audit',
      desc: 'Track the step-by-step resolution lifecycle using your unique reference code (e.g. KIN-2026-000123) without visiting the hall.',
      icon: Clock,
      actionText: 'Track Status',
      action: handleTrackClick
    },
    {
      title: 'Resident Assistance & Follow-Up',
      desc: 'Direct two-way messaging with assigned barangay officers to provide additional clarifications or receive updates.',
      icon: Users,
      actionText: 'Resident Helpdesk',
      action: () => {
        if (!isAuthenticated) onOpenAuth('login');
        else if (user?.role === 'resident') onNavigate('my-complaints');
      }
    },
    {
      title: 'Community Information & Governance',
      desc: 'Access verified barangay regulations, department contacts, executive issuances, and community safety guidelines.',
      icon: Info,
      actionText: 'View Guidelines',
      action: () => {
        const el = document.getElementById('departments');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  // Section 9: Latest Announcements
  const announcements = [
    {
      id: 1,
      title: 'Barangay General Assembly & Mid-Year Consultation',
      category: 'Public Advisory',
      date: 'May 12, 2026',
      image: '/images/hero-bg.jpg',
      shortDesc: 'All residents and purok leaders are invited to attend the Barangay General Assembly to discuss upcoming infrastructure projects and community health programs.',
      fullContent: 'Notice is hereby given to all residents of Barangay Kinilis, Polomolok, South Cotabato regarding the upcoming Barangay Assembly on May 12, 2026 at the Kinilis Civic Gymnasium. Key agenda items include the Barangay Financial Report, the status of the Purok Road Concreting Project, solid waste management regulations, and open forum with the Sangguniang Barangay.'
    },
    {
      id: 2,
      title: 'Oplan Kalinisan: Community Clean-Up & Anti-Dengue Fogging Drive',
      category: 'Community Health',
      date: 'May 05, 2026',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      shortDesc: 'Barangay Kinilis Health Desk and Sanitation Department will conduct synchronized fogging and canal declogging across all Puroks.',
      fullContent: 'In line with the 4S strategy against Dengue, the Sanitation Department alongside Barangay Tanod units will execute extensive misting and environmental clearing. Residents are encouraged to clean their front yards and eliminate stagnant water breeding sites. Contact the Barangay Health Desk for larvicide supplies.'
    },
    {
      id: 3,
      title: 'Free Anti-Rabies Vaccination & Pet Health Clinic',
      category: 'Veterinary Care',
      date: 'April 28, 2026',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=80',
      shortDesc: 'The Municipal Agriculture & Veterinary Office, in coordination with Brgy. Kinilis, will provide free anti-rabies shots for registered pet dogs and cats.',
      fullContent: 'Pet owners of Barangay Kinilis are invited to bring their canine and feline companions to the Barangay Hall Covered Grounds for complimentary anti-rabies vaccinations and deworming. Please bring your Barangay Pet Registration booklet or valid ID.'
    }
  ];

  // Section 10: 4-Step Complaint Process
  const complaintSteps = [
    {
      step: '01',
      title: 'SUBMIT',
      desc: 'Residents provide complaint details, incident locations, and supporting evidence through the digital portal.'
    },
    {
      step: '02',
      title: 'REVIEW',
      desc: 'Barangay personnel review, verify, and assess the submitted complaint.'
    },
    {
      step: '03',
      title: 'ACTION',
      desc: 'The assigned department investigates on-site and addresses the community concern.'
    },
    {
      step: '04',
      title: 'TRACK AND VERIFY',
      desc: 'Residents monitor complaint progress and review the submitted resolution proof.'
    }
  ];

  // Section 11: Five Core Barangay Departments
  const departmentsList = [
    {
      name: 'Sanitation',
      icon: Trash2,
      desc: 'Manages solid waste collection, street cleaning, illegal dumping enforcement, and environmental cleanliness.',
      responsibilities: [
        'Purok garbage collection scheduling',
        'Illegal dumpsite inspection and cleanup',
        'Drainage and canal debris clearing',
        'Ecological waste segregation compliance'
      ]
    },
    {
      name: 'Health',
      icon: HeartPulse,
      desc: 'Oversees community clinic operations, maternal healthcare, immunization drives, and disease prevention.',
      responsibilities: [
        'Primary healthcare and first aid consultations',
        'Maternal and child health checkups',
        'Dengue surveillance and misting operations',
        'Senior citizen medication distribution'
      ]
    },
    {
      name: 'Infrastructure',
      icon: Wrench,
      desc: 'Maintains barangay road networks, public streetlights, drainage canals, and civic facilities.',
      responsibilities: [
        'Pothole and access road rehabilitation',
        'Streetlight repairs and electrical safety',
        'Flood mitigation canal maintenance',
        'Barangay Hall and gym facility upkeep'
      ]
    },
    {
      name: 'Barangay Tanod',
      icon: Shield,
      desc: 'Ensures community peace and order, night patrols, curfew enforcement, and emergency response.',
      responsibilities: [
        '24/7 Purok security and roving patrols',
        'Curfew compliance for minors',
        'Dispute de-escalation and neighborhood safety',
        'Emergency response and disaster rescue assistance'
      ]
    },
    {
      name: 'General Administration',
      icon: Building2,
      desc: 'Handles official records, resident certifications, public clearances, and general administrative inquiries.',
      responsibilities: [
        'Issuance of Barangay Clearance and Indigency certificates',
        'Lupon Tagapamayapa mediation scheduling',
        'Executive documentation and resident records',
        'Public assistance and administrative coordination'
      ]
    }
  ];

  // Section 12: Community Photo Gallery
  const galleryItems = [
    {
      id: 1,
      title: 'Barangay Kinilis Civic Hall',
      category: 'Public Facility',
      image: '/images/hero-bg.jpg',
      alt: 'Barangay Kinilis Civic Hall and Administrative Center'
    },
    {
      id: 2,
      title: 'Mount Matutum Agro-Community Landscape',
      category: 'Natural Landscape',
      image: '/images/hero-bg.png',
      alt: 'Scenic view of Mt. Matutum overlooking Barangay Kinilis'
    },
    {
      id: 3,
      title: 'Community Tree Planting & Watershed Protection',
      category: 'Environmental Initiative',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
      alt: 'Residents planting saplings for watershed conservation'
    },
    {
      id: 4,
      title: 'Purok Clean-up & Anti-Dengue Drive',
      category: 'Civic Service',
      image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
      alt: 'Community members cleaning streets and clearing drainage'
    },
    {
      id: 5,
      title: 'Rural Health Center & Wellness Caravan',
      category: 'Public Health',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      alt: 'Barangay health workers attending to community residents'
    },
    {
      id: 6,
      title: 'Barangay Assembly & Sangguniang Session',
      category: 'Governance & Civic Participation',
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
      alt: 'Barangay officials holding consultation with community leaders'
    }
  ];

  // Section 13: Transparency Pillars
  const transparencyPillars = [
    {
      title: 'Complaint Handling Procedures',
      desc: 'Standardized operating workflow from filing to on-site inspection, ensuring every report is recorded without omission.',
      icon: FileText
    },
    {
      title: 'Transparent Complaint Tracking',
      desc: 'Residents can verify the exact stage, assigned department, and officer handling their concern at any time.',
      icon: Eye
    },
    {
      title: 'Resident Privacy Protection',
      desc: 'All resident personal data, phone numbers, and addresses are strictly protected under the Philippine Data Privacy Act of 2012 (RA 10173).',
      icon: Lock
    },
    {
      title: 'Resolution Verification with Photo Evidence',
      desc: 'Staff cannot close a complaint without uploading clear photographic proof of on-site resolution for resident verification.',
      icon: CheckCircle2
    },
    {
      title: 'Responsible Complaint Management',
      desc: 'Systematic duplicate detection prevents duplicate filings while ensuring legitimate public grievances are expedited.',
      icon: Shield
    },
    {
      title: 'Official Accountability & Response SLAs',
      desc: 'Monitored target completion deadlines and officer performance audits maintain government accountability to the community.',
      icon: Award
    }
  ];

  // Barangay Officials Data for Modal
  const barangayOfficials = [
    { name: 'Hon. Romnick B. Barzo', position: 'Punong Barangay', desk: 'Executive Office' },
    { name: 'Hon. Maria Elena Santos', position: 'Barangay Kagawad', desk: 'Committee on Health & Sanitation' },
    { name: 'Hon. Roberto C. Cruz', position: 'Barangay Kagawad', desk: 'Committee on Public Works & Infrastructure' },
    { name: 'Hon. Arthur M. Ramos', position: 'Barangay Kagawad', desk: 'Committee on Peace and Order' },
    { name: 'Hon. Susan L. Villanueva', position: 'Barangay Kagawad', desk: 'Committee on Social Welfare & Women' },
    { name: 'Hon. Eduardo G. Morales', position: 'Barangay Kagawad', desk: 'Committee on Agriculture & Environment' },
    { name: 'Hon. Dennis P. Alcantara', position: 'Barangay Kagawad', desk: 'Committee on Appropriations' },
    { name: 'Hon. Katrina Joy Valdez', position: 'SK Chairperson', desk: 'Youth Development & Sports' },
    { name: 'Mr. Leonardo S. Banzon', position: 'Barangay Secretary', desk: 'Records & Certifications' },
    { name: 'Ms. Carmela T. Reyes', position: 'Barangay Treasurer', desk: 'Treasury & Revenue' }
  ];

  // Emergency Hotlines for Modal
  const emergencyHotlines = [
    { label: 'Barangay Kinilis Hotline Desk', number: '(083) 228-5464 / 0917-890-5464', desc: 'Direct Barangay Hall Assistance' },
    { label: 'Barangay Tanod Security Patrol', number: '0918-234-7890', desc: 'Peace & Order 24/7 Response' },
    { label: 'Polomolok Municipal Police Station', number: '(083) 500-2111 / 0998-598-6543', desc: 'PNP Emergency Line' },
    { label: 'Polomolok Fire Station (BFP)', number: '(083) 225-2111 / 160', desc: 'Bureau of Fire Protection' },
    { label: 'Municipal Disaster Risk Reduction (MDRRMO)', number: '(083) 225-3456 / 0947-891-2345', desc: 'Disaster & Ambulance Rescue' },
    { label: 'Polomolok Municipal Health Office', number: '(083) 225-1234', desc: 'Emergency Medical Assistance' }
  ];

  return (
    <div className="bg-[#F5F8F6] min-h-screen text-[#172923] font-sans selection:bg-[#075B42] selection:text-white">
      
      {/* ========================================================================= */}
      {/* SECTION 4: HERO SECTION (#home) — KINILIS IBA KA                          */}
      {/* ========================================================================= */}
      <section id="home" className="relative min-h-[660px] lg:min-h-[740px] bg-[#052C20] text-white overflow-hidden flex flex-col justify-between">
        
        {/* Background Landscape with Dark Forest-Green Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center no-repeat transition-all duration-700 scale-[1.01]"
          style={{ backgroundImage: `url('/images/hero-bg.jpg')` }}
        />
        {/* Gradients tailored to Government Theme: Primary Green #075B42 with Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#052C20]/95 via-[#075B42]/85 to-[#052C20]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#052C20]/95 via-transparent to-[#052C20]/40 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 flex-1">
          
          {/* Hero Left Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#052C20]/80 border border-[#E8B844]/40 text-[#E8B844] font-bold text-[10px] sm:text-xs shadow-lg backdrop-blur-md max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-[#E8B844] shrink-0" />
              <span className="truncate">OFFICIAL BARANGAY KINILIS DIGITAL PORTAL</span>
            </div>

            {/* Main Heading & Supporting Heading */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                KINILIS <span className="text-[#E8B844]">IBA KA</span>
              </h1>
              <p className="text-base sm:text-2xl lg:text-3xl font-extrabold text-[#E8B844] leading-snug drop-shadow-sm">
                Building a Better Community Through Responsive Public Service.
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-base text-slate-100 font-normal max-w-2xl leading-relaxed mx-auto lg:mx-0">
              A digital platform that connects Barangay Kinilis residents with local government services, making it easier to report community concerns, track complaints, and stay informed about barangay activities.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 sm:pt-2 w-full">
              <button
                type="button"
                onClick={handleSubmitClick}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 min-h-[46px] rounded-xl bg-[#0B8F65] hover:bg-[#075B42] text-white font-black text-xs sm:text-sm shadow-xl border border-emerald-400/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Submit a Complaint</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                type="button"
                onClick={handleTrackClick}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 min-h-[46px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#E8B844]" />
                <span>Track My Complaint</span>
              </button>
            </div>

            {/* Supporting Highlights */}
            <div className="pt-3 sm:pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-[11px] sm:text-xs text-slate-100 font-semibold border-t border-white/15">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8B844] shrink-0" />
                <span>Accessible Online Services</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8B844] shrink-0" />
                <span>Transparent Complaint Tracking</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8B844] shrink-0" />
                <span>Responsive Public Service</span>
              </div>
            </div>
          </div>

          {/* Hero Right Column: SECTION 5 QUICK COMPLAINT TRACKING CARD */}
          <div className="lg:col-span-5" id="track">
            <div className="group relative bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] text-[#172923] shadow-[0_20px_50px_rgba(5,44,32,0.35)] hover:shadow-[0_25px_60px_rgba(7,91,66,0.45)] border-2 border-emerald-500/20 hover:border-[#E8B844]/60 transition-all duration-300 space-y-5 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              
              {/* Subtle Decorative Top Emerald-Gold Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#075B42] via-[#E8B844] to-[#0B8F65]" />

              {/* Ambient Glowing Corner Orb */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#E8B844]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#E8B844]/20 transition-all duration-500" />

              {/* Card Header with Animated Official Barangay Kinilis Seal */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="barangay-seal-animated w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#075B42] via-emerald-400 to-[#E8B844] flex items-center justify-center shrink-0 cursor-pointer shadow-md">
                    <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
                      <img
                        src="/images/barangay-seal.png"
                        alt="Barangay Kinilis Seal"
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => { e.target.src = '/images/barangay-seal.jpg'; }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-black text-[#075B42] text-[10px] sm:text-xs uppercase tracking-wider truncate">
                        BARANGAY KINILIS PORTAL
                      </h3>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                      Track Your Complaint
                    </h2>
                  </div>
                </div>

                {/* Subtle Tracking Badge Visual Accent */}
                <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 items-center justify-center text-[#075B42] shrink-0 shadow-xs">
                  <Search className="w-5 h-5 text-[#075B42]" />
                </div>
              </div>

              {/* Description Section with Icon */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
                <Info className="w-4 h-4 text-[#075B42] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Enter your official complaint reference number to check its latest status.
                </p>
              </div>

              {/* Reference Number Form */}
              <form onSubmit={handleSearchTrack} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="ref-input" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Complaint Reference Number
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Modern Input Field with Search Icon */}
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FileText className="w-4 h-4 text-[#075B42]" />
                      </div>
                      <input
                        id="ref-input"
                        type="text"
                        value={trackInput}
                        onChange={(e) => setTrackInput(e.target.value)}
                        placeholder="E.G. KIN-2026-000123"
                        disabled={isTrackingLoading}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 text-xs font-bold focus:outline-none focus:border-[#075B42] focus:ring-4 focus:ring-[#075B42]/15 uppercase bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 shadow-inner transition-all duration-200 placeholder:text-slate-400 placeholder:normal-case disabled:opacity-60"
                      />
                    </div>

                    {/* Premium Government-Green Track Button */}
                    <button
                      type="submit"
                      disabled={isTrackingLoading}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#075B42] via-[#097354] to-[#075B42] hover:from-[#0B8F65] hover:to-[#075B42] text-white font-black text-xs shadow-lg shadow-[#075B42]/30 hover:shadow-xl hover:shadow-[#075B42]/40 border border-[#E8B844]/50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-75 disabled:pointer-events-none"
                    >
                      {isTrackingLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 text-[#E8B844] animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 text-[#E8B844]" />
                          <span>Track</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Real-time Tracking Result Box */}
              {searched && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-emerald-200/80 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                  {trackResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-black text-sm text-[#075B42]">{trackResult.referenceNo}</span>
                        </div>
                        <StatusBadge status={trackResult.status} />
                      </div>

                      <p className="font-extrabold text-slate-900 leading-snug text-xs sm:text-sm">
                        {trackResult.title}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Department</span>
                          <span className="font-bold text-slate-800 truncate block mt-0.5">{trackResult.routing?.department || trackResult.department || 'Unassigned'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Submitted Date</span>
                          <span className="font-bold text-slate-800 truncate block mt-0.5">{trackResult.incidentDate || 'Recent'}</span>
                        </div>
                      </div>

                      {trackResult.timeline && trackResult.timeline.length > 0 && (
                        <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Latest Stage:</span>
                          <span className="font-black text-[#075B42] bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            {trackResult.timeline[trackResult.timeline.length - 1].status}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 space-y-1.5">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <p className="text-rose-600 font-black text-xs">No complaint found for "{trackInput}"</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Please verify your reference number. Example: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">KIN-2026-000123</code>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Security Information Section */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#075B42] shrink-0" />
                  <span>Your information is safe and secure.</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider hidden sm:inline-block">
                  256-Bit SSL Encrypted
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Elegant Curved Flowing Ribbon Wave Divider between Hero and Punong Barangay */}
        <div className="relative z-20 w-full overflow-hidden leading-none pointer-events-none -mb-1">
          <svg className="relative block w-full h-12 sm:h-20 lg:h-28" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
            <path d="M0,45 C320,125 720,5 1440,65" stroke="#075B42" strokeWidth="8" opacity="0.6" />
            <path d="M0,35 C320,115 720,-5 1440,55" stroke="#E8B844" strokeWidth="5" strokeLinecap="round" />
            <path d="M0,40 C320,120 720,0 1440,60 L1440,120 L0,120 Z" fill="#F8FAF9" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION: MESSAGE FROM OUR PUNONG BARANGAY (#leadership)                   */}
      {/* ========================================================================= */}
      <section id="leadership" className="relative py-16 sm:py-24 bg-[#F8FAF9] text-[#172923] overflow-hidden scroll-mt-20">
        
        {/* Soft Background Image: Official Barangay Hall with Smooth Gradient Mask */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-7/12 pointer-events-none overflow-hidden select-none">
          <img 
            src="/images/barangay-hall.jpg" 
            alt="Barangay Hall Kinilis" 
            className="w-full h-full object-cover object-center lg:object-right filter brightness-105"
            onError={(e) => { e.target.src = '/images/hero-bg.jpg'; }}
          />
          {/* Multi-directional gradient masks to seamlessly blend into #F8FAF9 background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAF9] via-[#F8FAF9]/85 to-transparent lg:via-[#F8FAF9]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAF9] via-transparent to-[#F8FAF9]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAF9] via-transparent to-[#F8FAF9]/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* LEFT COLUMN: Official Portrait with 3:4 Aspect Ratio Container & Golden Double Frame */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative group w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[340px]">
                
                {/* Elegant Gold Accent Glow */}
                <div className="absolute -inset-2 rounded-[24px] bg-gradient-to-tr from-[#E8B844] via-[#075B42]/40 to-[#E8B844] opacity-90 blur-md group-hover:opacity-100 transition-opacity" />
                
                {/* Golden Framed Container */}
                <div 
                  className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-white shadow-2xl border-4 border-[#E8B844]"
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    overflow: 'hidden',
                    borderRadius: '16px'
                  }}
                >
                  <img
                    src={punongBarangayImg}
                    alt="HON. ROMNICK B. BARZO - Punong Barangay of Barangay Kinilis"
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top'
                    }}
                    loading="eager"
                  />
                  {/* Subtle lower gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#043D2E]/25 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Official Leadership Details */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              
              {/* Badge: BARANGAY LEADERSHIP */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#075B42] text-white text-xs font-black uppercase tracking-wider shadow-sm border border-[#E8B844]/40">
                <Sparkles className="w-3.5 h-3.5 text-[#E8B844]" />
                <span>BARANGAY LEADERSHIP</span>
              </div>

              {/* Headings */}
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#075B42] tracking-tight">
                  Message from Our Punong Barangay
                </h3>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#075B42] tracking-tight leading-tight drop-shadow-xs">
                  HON. ROMNICK B. BARZO
                </h2>
              </div>

              {/* Official Position Ribbon */}
              <div>
                <div className="relative inline-flex items-center px-6 py-2 rounded-lg bg-gradient-to-r from-[#043D2E] via-[#075B42] to-[#043D2E] text-white font-black text-xs sm:text-sm tracking-widest uppercase shadow-md border-y-2 border-[#E8B844]">
                  <Shield className="w-4 h-4 text-[#E8B844] mr-2" />
                  <span>PUNONG BARANGGAY</span>
                </div>
              </div>

              {/* Short Introduction */}
              <p className="text-sm sm:text-base text-slate-700 font-semibold leading-relaxed max-w-xl mx-auto lg:mx-0">
                A dedicated leader committed to responsive public service, community development, and building a better Barangay Kinilis.
              </p>

              {/* Decorative Gold Divider & Community Motto Signature */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-4">
                <span className="h-0.5 w-12 sm:w-16 bg-[#E8B844] rounded-full" />
                <span className="text-2xl sm:text-3xl font-black text-[#075B42] italic font-serif tracking-wide drop-shadow-xs">
                  Kinilis Iba Ka
                </span>
                <span className="h-0.5 w-12 sm:w-16 bg-[#E8B844] rounded-full" />
              </div>

            </div>

          </div>
        </div>

        {/* Elegant Curved Flowing Ribbon Wave Divider between Leadership and Public Services */}
        <div className="relative z-20 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-12 sm:mt-16">
          <svg className="relative block w-full h-12 sm:h-20 lg:h-28" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
            <path d="M0,45 C320,125 720,5 1440,65" stroke="#075B42" strokeWidth="8" opacity="0.6" />
            <path d="M0,35 C320,115 720,-5 1440,55" stroke="#E8B844" strokeWidth="5" strokeLinecap="round" />
            <path d="M0,40 C320,120 720,0 1440,60 L1440,120 L0,120 Z" fill="#F4FAF6" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 6: QUICK ACCESS — CITIZEN SERVICES (#services)                    */}
      {/* ========================================================================= */}
      <section id="services" className="py-16 sm:py-24 bg-[#F4FAF6] text-[#172923] scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white bg-[#075B42] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E8B844]" />
              <span>PUBLIC SERVICES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#075B42] tracking-tight">
              Accessible Services for Every Resident
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Access essential barangay services and stay connected with your community.
            </p>
          </div>

          {/* 6 Public Service Cards Grid: Responsive across mobile (1 col), tablet (2-3 col), desktop (6 col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
            {communityServices.map(service => {
              const IconComp = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white text-[#172923] p-5 sm:p-6 rounded-2xl border border-emerald-100 shadow-md hover:shadow-xl hover:border-[#E8B844] card-hover-lift transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#075B42] text-white flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-[#0B8F65] transition-all">
                      <IconComp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm mb-1.5 group-hover:text-[#075B42] transition-colors leading-snug">
                        {service.title === 'FILE A COMPLAINT' ? 'File a Complaint' :
                         service.title === 'TRACK A COMPLAINT' ? 'Track a Complaint' :
                         service.title === 'ANNOUNCEMENTS' ? 'Announcements' :
                         service.title === 'OUR OFFICIALS' ? 'Our Officials' :
                         service.title === 'DEPARTMENTS' ? 'Departments' :
                         service.title === 'EMERGENCY INFORMATION' ? 'Emergency Information' : service.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={service.action}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#075B42] hover:text-[#0B8F65] transition-colors group-hover:translate-x-1 cursor-pointer"
                    >
                      <span>
                        {service.id === 'file-complaint' ? 'Get Started' :
                         service.id === 'track-complaint' ? 'Track Now' :
                         service.id === 'announcements' ? 'View News' :
                         service.id === 'our-officials' ? 'View Officials' :
                         service.id === 'departments' ? 'View Departments' :
                         service.id === 'emergency-info' ? 'View Info' : service.btnLabel}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#075B42] group-hover:text-[#E8B844] transition-colors" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seamless Wave Divider leading into About Barangay Kinilis */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#E7F3EC]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 7: ABOUT BARANGAY KINILIS (#about)                                */}
      {/* ========================================================================= */}
      <section id="about" className="py-20 bg-[#E7F3EC] border-y border-emerald-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Community Photograph & Barangay Seal */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-slate-100">
                <img
                  src="/images/hero-bg.jpg"
                  alt="Barangay Kinilis Community Landscape"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#052C20]/80 via-transparent to-transparent" />
                
                {/* Embedded Seal Badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200">
                  <div className="w-12 h-12 rounded-full p-0.5 bg-[#075B42] shrink-0 overflow-hidden">
                    <img src="/images/barangay-seal.png" alt="Official Seal" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900 leading-tight">Barangay Kinilis</p>
                    <p className="text-[11px] font-semibold text-[#075B42]">Polomolok, South Cotabato</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Welcome, Introduction, Mission & Vision */}
            <div className="lg:col-span-7 space-y-6">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white bg-[#075B42] shadow-xs">
                Community Profile
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-[#075B42] tracking-tight leading-tight">
                Welcome to Barangay Kinilis
              </h2>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                Barangay Kinilis is a progressive, agricultural community nestled in the municipality of Polomolok, South Cotabato. Guided by the motto <strong className="text-[#075B42]">KINILIS IBA KA</strong>, our local government is committed to providing modern, transparent, and prompt public service to ensure safety, order, and shared prosperity for all residents.
              </p>

              {/* Mission & Vision Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="p-6 rounded-2xl bg-white border border-emerald-200/90 shadow-md space-y-2.5">
                  <div className="flex items-center gap-2 text-[#075B42] font-black text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4 text-[#E8B844]" />
                    <span>Our Mission</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To deliver transparent, accessible, and accountable governance that fosters community peace, environmental sustainability, and rapid resolution of public concerns for every resident.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-emerald-200/90 shadow-md space-y-2.5">
                  <div className="flex items-center gap-2 text-[#075B42] font-black text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-[#E8B844]" />
                    <span>Our Vision</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A progressive, resilient, and empowered Barangay Kinilis where citizens and barangay leaders work together towards continuous development and inclusive peace.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Seamless Wave Divider leading into Digital Portal Capabilities */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#F1F8F3]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 8: PUBLIC SERVICES SECTION                                        */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#F1F8F3] border-b border-emerald-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#075B42] bg-emerald-100/90 border border-emerald-300">
              Digital Portal Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#075B42] tracking-tight">
              Comprehensive Public Services
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Services supported and operational directly through the Barangay Kinilis portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportedPortalServices.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-md flex flex-col justify-between hover:border-[#075B42] transition-all hover:-translate-y-1"
                >
                  <div className="space-y-3.5">
                    <div className="w-12 h-12 p-3 rounded-xl bg-emerald-50 text-[#075B42] w-fit">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <button
                      onClick={item.action}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#E7F3EC] hover:bg-[#075B42] text-[#075B42] hover:text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{item.actionText}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seamless Wave Divider leading into Announcements */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#043D2E]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 9: LATEST ANNOUNCEMENTS & UPDATES (#announcements)                 */}
      {/* ========================================================================= */}
      <section id="announcements" className="py-20 bg-[#043D2E] text-white border-y border-[#075B42] scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#E8B844] bg-white/15 border border-[#E8B844]/40">
                Community Updates
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Latest from Barangay Kinilis
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100">
                Official notices, public health advisories, and community event announcements.
              </p>
            </div>

            <button
              onClick={() => setSelectedAnnouncement(announcements[0])}
              className="px-5 py-2.5 rounded-xl border border-white/40 hover:border-[#E8B844] text-white hover:text-[#E8B844] font-extrabold text-xs transition-colors self-start md:self-auto backdrop-blur-md cursor-pointer"
            >
              View All Announcements
            </button>
          </div>

          {/* Announcement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {announcements.map(ann => (
              <div
                key={ann.id}
                className="bg-white text-[#172923] rounded-2xl overflow-hidden border border-emerald-100 shadow-xl flex flex-col justify-between group hover:shadow-2xl card-hover-lift transition-all"
              >
                <div>
                  <div className="aspect-[16/9] w-full overflow-hidden bg-slate-200 relative">
                    <img
                      src={ann.image}
                      alt={ann.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#075B42] text-white shadow-sm">
                      {ann.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-[#075B42]" />
                      <span>{ann.date}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#075B42] transition-colors">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {ann.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="text-xs font-black text-[#075B42] hover:text-[#0B8F65] flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
                  >
                    <span>Read More</span>
                    <ChevronRight className="w-4 h-4 text-[#E8B844]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seamless Wave Divider leading into How It Works */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#E7F3EC]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 10: HOW IT WORKS — COMPLAINT PROCESS (#how-it-works)              */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 bg-[#E7F3EC] border-b border-emerald-200/80 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white bg-[#075B42] shadow-xs">
              Transparent Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#075B42] tracking-tight">
              Your Complaint Journey
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              From reporting to resolution, we make the process simple, transparent, and efficient.
            </p>
          </div>

          {/* Desktop: Horizontal 4-step Process / Mobile: Vertical timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {complaintSteps.map((st, idx) => (
              <div key={st.step} className="bg-white p-7 rounded-2xl border border-emerald-200 shadow-md relative space-y-3 hover:border-[#075B42] card-hover-lift transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-[#E8B844] font-mono tracking-wider">
                    {st.step}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-[#075B42] flex items-center justify-center font-bold text-xs border border-emerald-200">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Seamless Wave Divider leading into Departments */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#075B42]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 11: BARANGAY DEPARTMENTS (#departments)                            */}
      {/* ========================================================================= */}
      <section id="departments" className="py-20 bg-[#075B42] text-white border-y border-[#0B8F65]/50 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#E8B844] bg-white/15 border border-[#E8B844]/40">
              Barangay Administration
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Meet Our Departments
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Dedicated teams working for a cleaner, safer, and more progressive Barangay Kinilis.
            </p>
          </div>

          {/* 5 Core Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentsList.map(dept => {
              const IconComp = dept.icon;
              return (
                <div
                  key={dept.name}
                  className="bg-white text-[#172923] p-7 rounded-2xl border border-emerald-100 shadow-xl space-y-4 hover:border-[#E8B844] card-hover-lift transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 text-[#075B42] shadow-xs">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{dept.name}</h3>
                      <p className="text-[11px] font-semibold text-[#075B42]">Barangay Kinilis Unit</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dept.desc}
                  </p>

                  <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      Key Responsibilities:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {dept.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[#075B42] shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seamless Wave Divider leading into Community Gallery */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#F1F8F3]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 12: COMMUNITY GALLERY (#gallery)                                  */}
      {/* ========================================================================= */}
      <section id="gallery" className="py-20 bg-[#F1F8F3] border-b border-emerald-200/80 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#075B42] bg-emerald-100/90 border border-emerald-300">
              Community Life
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#075B42] tracking-tight">
              Life in Barangay Kinilis
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Discover the people, activities, facilities, and community events that make Barangay Kinilis unique.
            </p>
          </div>

          {/* Responsive Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedGalleryImage(item)}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-200 cursor-pointer shadow-md hover:shadow-2xl transition-all border-2 border-white hover:border-[#E8B844]"
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E8B844]">
                    {item.category}
                  </span>
                  <p className="font-extrabold text-sm leading-snug drop-shadow-sm">
                    {item.title}
                  </p>
                </div>

                <div className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seamless Wave Divider leading into Transparency */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#043D2E]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 13: TRANSPARENCY AND ACCOUNTABILITY (#transparency)                */}
      {/* ========================================================================= */}
      <section id="transparency" className="py-20 bg-[#043D2E] text-white border-y border-[#075B42] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#E8B844] bg-white/15 border border-[#E8B844]/30">
              Good Governance & Integrity
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Every Concern Matters. Every Action Counts.
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Barangay Kinilis promotes transparent and accountable public service by providing residents with a platform to report concerns, monitor complaint progress, and receive updates on actions taken by barangay personnel.
            </p>
          </div>

          {/* 6 Transparency Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transparencyPillars.map((tp, idx) => {
              const IconComp = tp.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/10 border border-white/15 hover:border-[#E8B844] p-6 rounded-2xl backdrop-blur-sm space-y-3 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#075B42] text-[#E8B844] flex items-center justify-center border border-[#E8B844]/30">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-white text-base">{tp.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{tp.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 14: CONTACT AND LOCATION (#contact)                               */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 bg-[#064E38] text-white border-b border-[#075B42] scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#E8B844] bg-white/15 border border-[#E8B844]/40 shadow-xs">
              Public Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Visit Barangay Kinilis
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Connect with your barangay leaders, access resident public assistance, or visit the Kinilis Civic Center and Gymnasium.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Contact Cards Left Column (4 Premium Cards) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              
              {/* Card A: Barangay Location */}
              <div className="bg-white text-[#172923] p-6 rounded-2xl border border-emerald-100 shadow-[0_4px_20px_rgba(7,91,66,0.06)] hover:shadow-[0_12px_30px_rgba(7,91,66,0.15)] hover:border-[#E8B844] card-hover-lift transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#075B42] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-[#075B42] group-hover:text-white transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm">Barangay Location</h3>
                    <p className="text-xs font-bold text-[#075B42]">
                      Kinilis Barangay Gymnasium & Civic Grounds
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Barangay Kinilis, Polomolok, South Cotabato, Philippines 9504
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Near Mount Matutum Eco-Zone • Coordinates: 6.2953° N, 125.0731° E
                    </p>
                    <div className="pt-1.5">
                      <a
                        href="https://www.google.com/maps/place/Kinilis+Barangay+Gymnasium/@6.2955295,125.0731935,666a,75y,182.45h,76.14t/data=!3m7!1e1!3m5!1sr-XvH5QRU-ixfrrSuKuOUA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D13.862935751747514%26panoid%3Dr-XvH5QRU-ixfrrSuKuOUA%26yaw%3D182.45145370462384!7i13312!8i6656!4m11!1m3!2m2!1sBarangay+Kinilis+Polomolok+South+Cotabato!6e1!3m6!1s0x32f785c60011612f:0x126776c866b85f47!8m2!3d6.2952617!4d125.0730539!15sCilCYXJhbmdheSBLaW5pbGlzIFBvbG9tb2xvayBTb3V0aCBDb3RhYmF0b5IBEGd5bW5hc2l1bV9zY2hvb2zgAQA!16s%2Fg%2F11gtzb2pv5?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#075B42] hover:text-[#0B8F65] transition-colors"
                      >
                        <span>View Location on Map</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#E8B844]" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card B: Office Operating Hours */}
              <div className="bg-white text-[#172923] p-6 rounded-2xl border border-emerald-100 shadow-[0_4px_20px_rgba(7,91,66,0.06)] hover:shadow-[0_12px_30px_rgba(7,91,66,0.15)] hover:border-[#E8B844] card-hover-lift transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#075B42] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-[#075B42] group-hover:text-white transition-colors">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-sm">Office Operating Hours</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Regular Hours
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Monday – Friday: <span className="text-[#075B42]">8:00 AM – 5:00 PM</span>
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Barangay Tanod on 24/7 security duty and first response for community emergencies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card C: Telephone & Hotline */}
              <div className="bg-white text-[#172923] p-6 rounded-2xl border border-emerald-100 shadow-[0_4px_20px_rgba(7,91,66,0.06)] hover:shadow-[0_12px_30px_rgba(7,91,66,0.15)] hover:border-[#E8B844] card-hover-lift transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#075B42] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-[#075B42] group-hover:text-white transition-colors">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm">Telephone & Hotline</h3>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <a
                        href="tel:0832285464"
                        className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-[#075B42] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#075B42] transition-colors"
                        title="Call Landline Hotline"
                      >
                        <Phone className="w-3 h-3 text-[#075B42]" />
                        <span>(083) 228-5464</span>
                      </a>
                      <a
                        href="tel:09178905464"
                        className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-[#075B42] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#075B42] transition-colors"
                        title="Call Mobile Hotline"
                      >
                        <Phone className="w-3 h-3 text-[#075B42]" />
                        <span>0917-890-5464</span>
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      Toll-free within Polomolok Municipality • 24/7 Mobile Dispatch
                    </p>
                  </div>
                </div>
              </div>

              {/* Card D: Official Electronic Mail */}
              <div className="bg-white text-[#172923] p-6 rounded-2xl border border-emerald-100 shadow-[0_4px_20px_rgba(7,91,66,0.06)] hover:shadow-[0_12px_30px_rgba(7,91,66,0.15)] hover:border-[#E8B844] card-hover-lift transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#075B42] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-[#075B42] group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm">Official Electronic Mail</h3>
                    <a
                      href="mailto:info@barangaykinilis.gov.ph"
                      className="font-bold text-xs sm:text-sm text-[#075B42] hover:underline block break-all"
                    >
                      info@barangaykinilis.gov.ph
                    </a>
                    <p className="text-[11px] text-slate-500">
                      For inquiries, government records, and resident assistance
                    </p>
                    <div className="pt-1">
                      <a
                        href="mailto:info@barangaykinilis.gov.ph"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#075B42] hover:text-[#0B8F65] transition-colors"
                      >
                        <span>Send Email</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#E8B844]" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Interactive Real Google Maps Embed Container (Right Column) */}
            <div className="lg:col-span-7 bg-white text-[#172923] p-6 sm:p-7 rounded-3xl border border-emerald-100 shadow-xl space-y-5 flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#075B42] flex items-center justify-center shrink-0 border border-emerald-100">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">Location Map & Directions</h3>
                    <p className="text-xs text-slate-500">Official Barangay Kinilis Landmark</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#075B42] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#075B42]" />
                  <span>Polomolok, South Cotabato</span>
                </span>
              </div>

              {/* Real Google Maps Embed with Coordinates 6.2952617, 125.0730539 */}
              <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner">
                <iframe
                  src="https://maps.google.com/maps?q=6.2952617,125.0730539&hl=en&z=17&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Kinilis Barangay Gymnasium Google Maps"
                  className="w-full h-full"
                />
              </div>

              {/* Destination Details & Transit Directions */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-[#075B42] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      Kinilis Barangay Gymnasium
                    </h4>
                    <p className="text-xs font-semibold text-[#075B42]">
                      Polomolok, South Cotabato, Philippines
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      Accessible via Polomolok Municipal Road. Public utility vehicles and tricycles operate daily from Polomolok Public Market directly to Kinilis Barangay Grounds.
                    </p>
                  </div>
                </div>

                {/* Prominent Open in Google Maps Button */}
                <a
                  href="https://www.google.com/maps/place/Kinilis+Barangay+Gymnasium/@6.2955295,125.0731935,666a,75y,182.45h,76.14t/data=!3m7!1e1!3m5!1sr-XvH5QRU-ixfrrSuKuOUA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D13.862935751747514%26panoid%3Dr-XvH5QRU-ixfrrSuKuOUA%26yaw%3D182.45145370462384!7i13312!8i6656!4m11!1m3!2m2!1sBarangay+Kinilis+Polomolok+South+Cotabato!6e1!3m6!1s0x32f785c60011612f:0x126776c866b85f47!8m2!3d6.2952617!4d125.0730539!15sCilCYXJhbmdheSBLaW5pbGlzIFBvbG9tb2xvayBTb3V0aCBDb3RhYmF0b5IBEGd5bW5hc2l1bV9zY2hvb2zgAQA!16s%2Fg%2F11gtzb2pv5?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#075B42] hover:bg-[#0B8F65] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-4 h-4 text-[#E8B844] group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

            </div>

          </div>
        </div>

        {/* Seamless Deep Green Wave Divider leading into Footer (#02281E) */}
        <div className="relative z-10 w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-14 sm:mt-20">
          <svg className="relative block w-full h-8 sm:h-14 text-[#02281E]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,70 600,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION 15: FOOTER REDESIGN                                               */}
      {/* ========================================================================= */}
      <footer className="bg-[#02281E] text-slate-300 text-xs pt-16 pb-12 border-t border-[#075B42]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#075B42] to-[#E8B844] shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
                    <img src="/images/barangay-seal.png" alt="Barangay Kinilis Seal" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight">Barangay Kinilis</h3>
                  <p className="text-[#E8B844] text-xs font-bold">Polomolok, South Cotabato</p>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
                <strong className="text-white">KINILIS IBA KA:</strong> Smarter Governance, Faster Service. Dedicated to transparent public accountability, community peace, and prompt resolution of resident grievances.
              </p>
            </div>

            {/* Quick Navigation Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-[#E8B844]">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Barangay</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Citizen Services</a></li>
                <li><a href="#departments" className="hover:text-white transition-colors">Barangay Departments</a></li>
                <li><a href="#announcements" className="hover:text-white transition-colors">Announcements</a></li>
                <li><a href="#gallery" className="hover:text-white transition-colors">Community Gallery</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact & Directory</a></li>
              </ul>
            </div>

            {/* Public Services Column */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-[#E8B844]">
                Resident Portal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={handleSubmitClick} className="hover:text-white transition-colors text-left">
                    File a New Complaint
                  </button>
                </li>
                <li>
                  <button onClick={handleTrackClick} className="hover:text-white transition-colors text-left">
                    Track Complaint Status
                  </button>
                </li>
                <li>
                  <button onClick={() => setOfficialsModalOpen(true)} className="hover:text-white transition-colors text-left">
                    Elected Barangay Officials
                  </button>
                </li>
                <li>
                  <button onClick={() => setEmergencyModalOpen(true)} className="hover:text-white transition-colors text-left">
                    Emergency Directory
                  </button>
                </li>
              </ul>

              <div className="pt-3">
                <p className="text-[11px] text-slate-400">Barangay Hall Office Hours:</p>
                <p className="text-xs text-white font-semibold">Mon – Fri: 8:00 AM – 5:00 PM</p>
              </div>
            </div>

          </div>

          {/* Footer Copyright & Data Privacy */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 Barangay Kinilis, Polomolok, South Cotabato. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="text-[#E8B844] font-medium">Data Privacy Act of 2012 (RA 10173) Compliant</span>
            </div>
          </div>

        </div>
      </footer>


      {/* ========================================================================= */}
      {/* INTERACTIVE MODAL 1: GALLERY LIGHTBOX MODAL                               */}
      {/* ========================================================================= */}
      {selectedGalleryImage && (
        <div 
          onClick={() => setSelectedGalleryImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-700 flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E8B844]">
                  {selectedGalleryImage.category}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  {selectedGalleryImage.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGalleryImage(null)}
                className="p-2 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={selectedGalleryImage.image}
                alt={selectedGalleryImage.alt}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="p-4 bg-white text-xs text-slate-600 flex items-center justify-between border-t border-slate-200">
              <span>{selectedGalleryImage.alt}</span>
              <span className="text-[11px] font-bold text-[#075B42]">Barangay Kinilis Gallery</span>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* INTERACTIVE MODAL 2: ANNOUNCEMENT DETAIL MODAL                            */}
      {/* ========================================================================= */}
      {selectedAnnouncement && (
        <div 
          onClick={() => setSelectedAnnouncement(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-[#075B42]">
                  {selectedAnnouncement.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">
                  {selectedAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-[#075B42]" />
                <span>Published on {selectedAnnouncement.date}</span>
              </div>
              <p>{selectedAnnouncement.fullContent}</p>
              <div className="p-4 rounded-xl bg-[#F5F8F6] border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-[#075B42]">Inquiries & Assistance:</p>
                <p className="text-slate-600">Please contact the Barangay Secretary Desk at (083) 228-5464 or visit the Barangay Hall during regular office hours.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2.5 rounded-xl bg-[#075B42] text-white font-extrabold text-xs hover:bg-[#0B8F65] transition-colors"
              >
                Close Announcement
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* INTERACTIVE MODAL 3: BARANGAY OFFICIALS MODAL                             */}
      {/* ========================================================================= */}
      {officialsModalOpen && (
        <div 
          onClick={() => setOfficialsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-0.5 bg-[#075B42] flex items-center justify-center">
                  <img src="/images/barangay-seal.png" alt="Seal" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Barangay Kinilis Officials</h3>
                  <p className="text-xs text-slate-500">Sangguniang Barangay & Administrative Officers</p>
                </div>
              </div>
              <button
                onClick={() => setOfficialsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {barangayOfficials.map((off, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#F5F8F6] border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{off.name}</h4>
                    <p className="text-[11px] font-semibold text-[#075B42]">{off.position}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200 shrink-0">
                    {off.desk}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setOfficialsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#075B42] text-white font-extrabold text-xs hover:bg-[#0B8F65] transition-colors"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* INTERACTIVE MODAL 4: EMERGENCY HOTLINES MODAL                             */}
      {/* ========================================================================= */}
      {emergencyModalOpen && (
        <div 
          onClick={() => setEmergencyModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Emergency Hotlines & Rescue</h3>
                  <p className="text-xs text-slate-500">Barangay Kinilis & Polomolok First Responders</p>
                </div>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {emergencyHotlines.map((hl, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{hl.label}</h4>
                    <p className="text-[11px] text-slate-600">{hl.desc}</p>
                  </div>
                  <a
                    href={`tel:${hl.number.split('/')[0].trim()}`}
                    className="font-mono font-black text-rose-700 bg-white px-3 py-1.5 rounded-lg border border-rose-300 w-fit shrink-0 hover:bg-rose-600 hover:text-white transition-colors"
                  >
                    {hl.number}
                  </a>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#075B42] text-white font-extrabold text-xs hover:bg-[#0B8F65] transition-colors"
              >
                Close Emergency Desk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
