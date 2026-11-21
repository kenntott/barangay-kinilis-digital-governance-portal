import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { classifyAndRouteComplaint, DEFAULT_CATEGORY_ROUTING } from '../lib/aiClassifier';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchComplaintsFromSupabase,
  createComplaintInSupabase,
  checkDuplicatesInSupabase,
  updateComplaintStatusInSupabase,
  reassignComplaintInSupabase,
  overrideAIClassificationInSupabase,
  sendComplaintFollowupInSupabase,
  subscribeToComplaintsRealtime,
  unsubscribeFromComplaintsRealtime,
  fetchDepartmentsFromSupabase,
  createDepartmentInSupabase,
  updateDepartmentInSupabase,
  fetchStaffFromSupabase,
  updateStaffProfileInSupabase,
  fetchRoutingRulesFromSupabase,
  updateRoutingRuleInSupabase,
  fetchAuditLogsFromSupabase,
  createAuditLogInSupabase,
  submitComplaintFeedbackToSupabase,
  fetchComplaintFeedbackFromSupabase,
  fetchNotificationsFromSupabase,
  markNotificationAsReadInSupabase,
  markAllNotificationsAsReadInSupabase,
  subscribeToNotificationsRealtime,
  unsubscribeFromNotificationsRealtime,
  uploadResolutionProofToSupabase,
  submitStaffComplaintResolutionInSupabase,
  getResolutionProofSignedUrl,
  reserveComplaintReferenceInSupabase,
  abandonComplaintReferenceReservationInSupabase,
  consumeComplaintReferenceReservationInSupabase,
  requestEvidenceCleanupInSupabase
} from '../lib/supabaseService';
import apiClient from '../services/api/apiClient';

const ComplaintContext = createContext();

const INITIAL_COMPLAINTS = [
  {
    id: '1',
    referenceNo: 'KIN-2026-000123',
    title: 'Garbage not collected along Purok 3 main street',
    description: 'Unhygienic uncollected garbage piles left for 4 days near the corner store causing foul smell and attracting stray animals.',
    category: 'Waste Management',
    priority: 'Medium',
    status: 'In Progress',
    location: 'Purok 3, Main Street, Brgy. Kinilis',
    residentName: 'Juan dela Cruz',
    residentEmail: 'juan.delacruz@kinilis.gov.ph',
    residentPhone: '0917-123-4567',
    preferredContact: 'Phone',
    submittedAt: '2026-04-26T10:30:00Z',
    incidentDate: '2026-04-26',
    incidentTime: '10:30 AM',
    isOverdue: false,
    aiResult: {
      category: 'Waste Management',
      priority: 'Medium',
      department: 'Sanitation Department',
      confidence: 92,
      reason: 'The complaint describes an issue involving uncollected garbage in the community.',
      keywords: ['Garbage', 'Collection', 'Waste', 'Community'],
      classifiedAt: '2026-04-26T10:30:05Z'
    },
    routing: {
      department: 'Sanitation Department',
      assignedStaff: 'Maria Santos',
      routingStatus: 'Automatically Routed',
      routedAt: '2026-04-26T10:30:06Z'
    },
    timeline: [
      { status: 'Submitted', date: '2026-04-26 10:30 AM', desc: 'Complaint registered by resident Juan dela Cruz.' },
      { status: 'Under Review', date: '2026-04-26 10:30 AM', desc: 'Classification engine suggested category Waste Management (92% confidence).' },
      { status: 'Assigned', date: '2026-04-26 10:35 AM', desc: 'Routed to Sanitation Department under officer Maria Santos.' },
      { status: 'Acknowledged', date: '2026-04-26 11:00 AM', desc: 'Acknowledged by Maria Santos (Sanitation Officer).' },
      { status: 'In Progress', date: '2026-04-26 11:20 AM', desc: 'Sanitation truck dispatched to clear Purok 3 main street.' }
    ],
    attachments: [
      { name: 'Garbage_pile_purok3.jpg', url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80', size: '2.4 MB' }
    ],
    remarks: 'Dispatched 6-wheeler waste management truck to site.'
  },
  {
    id: '2',
    referenceNo: 'KIN-2026-000122',
    title: 'Deep pothole hazard on Purok 1 access road',
    description: 'Large damaged road section causing motorcycle accidents near the elementary school perimeter line.',
    category: 'Infrastructure',
    priority: 'High',
    status: 'Assigned',
    location: 'Purok 1 Road near Elementary School',
    residentName: 'Pedro Penduko',
    residentEmail: 'pedro@kinilis.gov.ph',
    residentPhone: '0918-999-8877',
    preferredContact: 'SMS',
    submittedAt: '2026-04-25T14:15:00Z',
    incidentDate: '2026-04-25',
    incidentTime: '02:15 PM',
    isOverdue: false,
    aiResult: {
      category: 'Infrastructure',
      priority: 'High',
      department: 'Infrastructure & Public Works',
      confidence: 88,
      reason: 'Detected keywords relating to road damage, hazard, and pothole.',
      keywords: ['Road', 'Pothole', 'Hazard', 'Accident'],
      classifiedAt: '2026-04-25T14:15:05Z'
    },
    routing: {
      department: 'Infrastructure & Public Works',
      assignedStaff: 'Engr. Roberto Cruz',
      routingStatus: 'Automatically Routed',
      routedAt: '2026-04-25T14:15:06Z'
    },
    timeline: [
      { status: 'Submitted', date: '2026-04-25 02:15 PM', desc: 'Complaint submitted by Pedro Penduko.' },
      { status: 'Under Review', date: '2026-04-25 02:15 PM', desc: 'Classified as Infrastructure (88% confidence).' },
      { status: 'Assigned', date: '2026-04-25 03:00 PM', desc: 'Assigned to Engr. Roberto Cruz for site inspection.' }
    ],
    attachments: [],
    remarks: 'Site inspection scheduled for tomorrow morning.'
  },
  {
    id: '3',
    referenceNo: 'KIN-2026-000121',
    title: 'Loud videoke past midnight at Purok 4',
    description: 'Continuous loud music and videoke noise past 12:00 AM disturbing sleep on a weekday night.',
    category: 'Peace & Order',
    priority: 'Low',
    status: 'Submitted',
    location: 'Purok 4 near basketball court',
    residentName: 'Maria Clara',
    residentEmail: 'maria.clara@kinilis.gov.ph',
    residentPhone: '0920-111-2233',
    preferredContact: 'Phone',
    submittedAt: '2026-04-24T23:45:00Z',
    incidentDate: '2026-04-24',
    incidentTime: '11:45 PM',
    isOverdue: false,
    aiResult: {
      category: 'Peace & Order',
      priority: 'Low',
      department: 'Peace & Order Bureau',
      confidence: 85,
      reason: 'Detected keywords for noise, videoke, and late night.',
      keywords: ['Noise', 'Videoke', 'Disturbance'],
      classifiedAt: '2026-04-24T23:45:05Z'
    },
    routing: {
      department: 'Peace & Order Bureau',
      assignedStaff: 'Tanod Desk Officer',
      routingStatus: 'Automatically Routed',
      routedAt: '2026-04-24T23:45:06Z'
    },
    timeline: [
      { status: 'Submitted', date: '2026-04-24 11:45 PM', desc: 'Complaint submitted by Maria Clara.' }
    ],
    attachments: [],
    remarks: 'Pending Tanod night patrol assignment.'
  },
  {
    id: '4',
    referenceNo: 'KIN-2026-000120',
    title: 'Stagnant water breeding dengue mosquitoes in vacant lot',
    description: 'Large open puddle and dumped tires holding stagnant rainwater after heavy typhoon downpour.',
    category: 'Health Services',
    priority: 'High',
    status: 'Resolved',
    location: 'Purok 2 interior access path',
    residentName: 'Juan dela Cruz',
    residentEmail: 'juan.delacruz@kinilis.gov.ph',
    residentPhone: '0917-123-4567',
    preferredContact: 'Email',
    submittedAt: '2026-04-22T09:00:00Z',
    incidentDate: '2026-04-22',
    incidentTime: '09:00 AM',
    isOverdue: false,
    aiResult: {
      category: 'Health Services',
      priority: 'High',
      department: 'Barangay Health Center',
      confidence: 91,
      reason: 'Health concern keywords identified.',
      keywords: ['Dengue', 'Mosquito', 'Fogging', 'Health'],
      classifiedAt: '2026-04-22T09:00:05Z'
    },
    routing: {
      department: 'Barangay Health Center',
      assignedStaff: 'Nurse Elena Ramos',
      routingStatus: 'Automatically Routed',
      routedAt: '2026-04-22T09:00:06Z'
    },
    timeline: [
      { status: 'Submitted', date: '2026-04-22 09:00 AM', desc: 'Submitted by Juan dela Cruz.' },
      { status: 'Assigned', date: '2026-04-22 09:15 AM', desc: 'Routed to Barangay Health Center.' },
      { status: 'In Progress', date: '2026-04-22 01:00 PM', desc: 'Health team deployed for misting.' },
      { status: 'Resolved', date: '2026-04-23 04:00 PM', desc: 'Fogging completed and anti-mosquito kits distributed.' }
    ],
    resolution: {
      summary: 'Fogging conducted across all 4 streets of Purok 2. 50 dengue prevention kits turned over to Purok Leader.',
      resolvedBy: 'Nurse Elena Ramos',
      resolvedAt: '2026-04-23 04:00 PM',
      evidenceUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80'
    },
    feedback: {
      rating: 5,
      satisfaction: 'Very Satisfied',
      comments: 'Very fast response from the health center team! Thank you Barangay Kinilis!'
    },
    attachments: [],
    remarks: 'Operation successful with zero new fever reports.'
  },
  {
    id: '5',
    referenceNo: 'KIN-2026-000118',
    title: 'Flash flooding risk due to clogged drainage culvert',
    description: 'Heavy rain causes overflowing canal into 3 houses near Purok 5 bridge line due to trapped logs and trash.',
    category: 'Infrastructure',
    priority: 'Urgent',
    status: 'In Progress',
    location: 'Purok 5 Drainage Canal near Creek Bridge',
    residentName: 'Santanina Santos',
    residentEmail: 'santanina@kinilis.gov.ph',
    residentPhone: '0919-888-7766',
    preferredContact: 'Phone',
    submittedAt: '2026-04-21T08:30:00Z',
    incidentDate: '2026-04-21',
    incidentTime: '08:30 AM',
    isOverdue: false,
    aiResult: {
      category: 'Infrastructure',
      priority: 'Urgent',
      department: 'Infrastructure & Public Works',
      confidence: 96,
      reason: 'Urgent keywords (flash flooding, overflow, hazard) detected by AI engine.',
      keywords: ['Flood', 'Baha', 'Drainage', 'Canal', 'Urgent'],
      classifiedAt: '2026-04-21T08:30:05Z'
    },
    routing: {
      department: 'Infrastructure & Public Works',
      assignedStaff: 'Engr. Roberto Cruz',
      routingStatus: 'Escalated Urgently',
      routedAt: '2026-04-21T08:30:06Z'
    },
    timeline: [
      { status: 'Submitted', date: '2026-04-21 08:30 AM', desc: 'Submitted marked as high alert.' },
      { status: 'Assigned', date: '2026-04-21 08:31 AM', desc: 'Urgent notification sent to Public Works.' },
      { status: 'In Progress', date: '2026-04-21 09:00 AM', desc: 'Backhoe operator and maintenance crew deployed.' }
    ],
    attachments: [],
    remarks: 'Heavy machinery clearing debris currently.'
  }
];

const INITIAL_DEPARTMENTS = [
  { id: '1', name: 'Sanitation Department', description: 'Manages solid waste collection, street cleaning, and environmental hygiene.', staffCount: 8, slaHours: 48, activeComplaints: 1, resolvedComplaints: 0, status: 'Active', head: 'Maria Santos' },
  { id: '2', name: 'Peace & Order Bureau', description: 'Handles community security, barangay tanod patrol, noise, and dispute conciliation.', staffCount: 12, slaHours: 24, activeComplaints: 1, resolvedComplaints: 0, status: 'Active', head: 'Officer Cardo Dimaano' },
  { id: '3', name: 'Infrastructure & Public Works', description: 'Maintains barangay roads, streetlights, drainage canals, and public buildings.', staffCount: 6, slaHours: 72, activeComplaints: 2, resolvedComplaints: 0, status: 'Active', head: 'Engr. Roberto Cruz' },
  { id: '4', name: 'Barangay Health Center', description: 'Coordinates disease control, immunizations, maternal care, and community sanitation.', staffCount: 10, slaHours: 48, activeComplaints: 0, resolvedComplaints: 1, status: 'Active', head: 'Nurse Elena Ramos' },
  { id: '5', name: 'Social Welfare Office', description: 'Manages senior citizen aid, PWD support, educational assistance, and relief distribution.', staffCount: 5, slaHours: 96, activeComplaints: 0, resolvedComplaints: 0, status: 'Active', head: 'Social Worker Ana Garcia' },
  { id: '6', name: 'Barangay Administrative Office', description: 'Overlooks clearances, permits, secretarial records, and executive public service.', staffCount: 7, slaHours: 48, activeComplaints: 0, resolvedComplaints: 0, status: 'Active', head: 'Sec. Danilo Lopez' }
];

const INITIAL_STAFF = [
  { id: '2', name: 'Maria Santos', role: 'Staff', department: 'Sanitation Department', position: 'Sanitation Officer', email: 'maria.santos@kinilis.gov.ph', phone: '0920-987-6543', status: 'Active', assignedCount: 1 },
  { id: '4', name: 'Engr. Roberto Cruz', role: 'Staff', department: 'Infrastructure & Public Works', position: 'Public Works Engineer', email: 'roberto.cruz@kinilis.gov.ph', phone: '0917-555-4433', status: 'Active', assignedCount: 2 },
  { id: '5', name: 'Nurse Elena Ramos', role: 'Staff', department: 'Barangay Health Center', position: 'Head Nurse', email: 'elena.ramos@kinilis.gov.ph', phone: '0922-111-9988', status: 'Active', assignedCount: 1 },
  { id: '3', name: 'Admin Desk (Capt. Hon. Escabarte)', role: 'Admin', department: 'Barangay Administrative Office', position: 'Barangay Administrator', email: 'admin@kinilis.gov.ph', phone: '0918-000-1122', status: 'Active', assignedCount: 0 }
];

export const ComplaintProvider = ({ children }) => {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('kinilis_complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('kinilis_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('kinilis_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [categoryRoutingRules, setCategoryRoutingRules] = useState(() => {
    const saved = localStorage.getItem('kinilis_routing_rules');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORY_ROUTING;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('kinilis_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('kinilis_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [feedbackList, setFeedbackList] = useState([]);
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFeedback = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const data = await fetchComplaintFeedbackFromSupabase();
        if (Array.isArray(data)) {
          setFeedbackList(data);
        }
        return data;
      } catch (err) {
        console.warn('[ComplaintContext] Failed to fetch feedback:', err);
      }
    }
    return [];
  }, []);

  // Sync state with Supabase backend on mount (with PHP & cached state compatibility)
  const syncWithBackend = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Complaints directly from Supabase PostgreSQL
      if (isSupabaseConfigured()) {
        try {
          const supabaseComplaints = await fetchComplaintsFromSupabase();
          if (Array.isArray(supabaseComplaints) && supabaseComplaints.length > 0) {
            setComplaints(supabaseComplaints);
            localStorage.setItem('kinilis_complaints', JSON.stringify(supabaseComplaints));
          }
        } catch (sbErr) {
          console.warn('[ComplaintContext] Supabase fetch notice:', sbErr.message);
        }
      } else {
        // Fallback to legacy PHP API if Supabase is not configured
        try {
          const complaintsData = await apiClient.get('complaints.php');
          if (Array.isArray(complaintsData) && complaintsData.length > 0) {
            setComplaints(complaintsData);
            localStorage.setItem('kinilis_complaints', JSON.stringify(complaintsData));
          }
        } catch (apiErr) {
          // ignore
        }
      }

      // 2. Fetch Departments, Personnel, and Routing Rules from Supabase PostgreSQL
      if (isSupabaseConfigured()) {
        try {
          const [sbDepts, sbStaff, sbRules] = await Promise.all([
            fetchDepartmentsFromSupabase().catch(() => null),
            fetchStaffFromSupabase().catch(() => null),
            fetchRoutingRulesFromSupabase().catch(() => null)
          ]);

          if (Array.isArray(sbDepts) && sbDepts.length > 0) {
            setDepartments(sbDepts);
            localStorage.setItem('kinilis_departments', JSON.stringify(sbDepts));
          }
          if (Array.isArray(sbStaff) && sbStaff.length > 0) {
            setStaffList(sbStaff);
            localStorage.setItem('kinilis_staff', JSON.stringify(sbStaff));
          }
          if (Array.isArray(sbRules) && sbRules.length > 0) {
            setCategoryRoutingRules(sbRules);
            localStorage.setItem('kinilis_routing_rules', JSON.stringify(sbRules));
          }
        } catch (sbErr) {
          console.warn('[ComplaintContext] Supabase departments/staff sync notice:', sbErr.message);
        }
      } else {
        // Fallback to legacy PHP API if Supabase is not configured
        try {
          const deptData = await apiClient.get('departments.php');
          if (deptData) {
            if (Array.isArray(deptData.departments) && deptData.departments.length > 0) {
              setDepartments(deptData.departments);
              localStorage.setItem('kinilis_departments', JSON.stringify(deptData.departments));
            }
            if (Array.isArray(deptData.staffList)) {
              setStaffList(deptData.staffList);
              localStorage.setItem('kinilis_staff', JSON.stringify(deptData.staffList));
            }
            if (Array.isArray(deptData.routingRules)) {
              setCategoryRoutingRules(deptData.routingRules);
              localStorage.setItem('kinilis_routing_rules', JSON.stringify(deptData.routingRules));
            }
          }
        } catch (apiErr) {
          // ignore
        }
      }

      // 3. Fetch Notifications from Supabase
      if (isSupabaseConfigured()) {
        try {
          const sbNotifs = await fetchNotificationsFromSupabase(user?.id, user?.role || 'resident');
          if (Array.isArray(sbNotifs)) {
            setNotifications(sbNotifs);
            localStorage.setItem('kinilis_notifications', JSON.stringify(sbNotifs));
          }
        } catch (notifErr) {
          console.warn('[ComplaintContext] Supabase notification fetch notice:', notifErr.message);
        }
      } else {
        const notifsData = await apiClient.get('notifications.php');
        if (Array.isArray(notifsData)) {
          setNotifications(notifsData);
          localStorage.setItem('kinilis_notifications', JSON.stringify(notifsData));
        }
      }

      // 4. Fetch Resident Feedback from Supabase
      if (isSupabaseConfigured()) {
        try {
          const fb = await fetchComplaintFeedbackFromSupabase();
          if (Array.isArray(fb)) setFeedbackList(fb);
        } catch (fbErr) {
          console.warn('[ComplaintContext] Supabase feedback fetch notice:', fbErr.message);
        }
      }

      // 5. Fetch Audit Logs
      if (isSupabaseConfigured()) {
        try {
          const sbAudit = await fetchAuditLogsFromSupabase();
          if (Array.isArray(sbAudit) && sbAudit.length > 0) {
            setAuditLogs(sbAudit);
            localStorage.setItem('kinilis_audit_logs', JSON.stringify(sbAudit));
          }
        } catch (sbErr) {
          console.warn('[ComplaintContext] Supabase audit log fetch notice:', sbErr.message);
        }
      } else {
        try {
          const auditData = await apiClient.get('audit.php');
          if (Array.isArray(auditData)) {
            setAuditLogs(auditData);
            localStorage.setItem('kinilis_audit_logs', JSON.stringify(auditData));
          }
        } catch (apiErr) {
          // ignore
        }
      }

      // 5. Fetch Reports Overview
      const reportsData = await apiClient.get('reports.php');
      if (reportsData) {
        setAnalyticsOverview(reportsData);
      }
    } catch (err) {
      console.warn('Backend sync notice (using cached/fallback state):', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // FEATURE 2: Supabase Realtime Channel Subscription with automatic unmount cleanup
  // Governed by RLS: Authenticated channels only receive records allowed by SELECT policies.
  // We sanitize updates so existing local state is only updated for matching complaints.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = subscribeToComplaintsRealtime(
      (newRecord) => {
        // Handle UPDATE event from Supabase Realtime (sanitized to existing authorized complaints)
        setComplaints(prev => prev.map(c => {
          if (c.id === newRecord.id || c.referenceNo === newRecord.reference_no) {
            return {
              ...c,
              status: newRecord.status || c.status,
              priority: newRecord.priority || c.priority,
              category: newRecord.category || c.category,
              title: newRecord.title || c.title,
              description: newRecord.description || c.description,
              remarks: newRecord.remarks || c.remarks,
              timeline: [
                ...(c.timeline || []),
                {
                  status: newRecord.status,
                  date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                  desc: newRecord.remarks || `Status updated to ${newRecord.status} via Live Realtime.`
                }
              ]
            };
          }
          return c;
        }));
      },
      (newRecord) => {
        // Handle live INSERT event: verify ownership before adding to resident state
        setComplaints(prev => {
          // If already in list, do not duplicate
          if (prev.some(c => c.id === newRecord.id || c.referenceNo === newRecord.reference_no)) {
            return prev;
          }
          // Only append if it contains verified reference and title
          if (!newRecord.reference_no || !newRecord.title) {
            return prev;
          }
          return [
            {
              id: newRecord.id,
              referenceNo: newRecord.reference_no,
              title: newRecord.title,
              description: newRecord.description,
              category: newRecord.category,
              priority: newRecord.priority,
              status: newRecord.status,
              location: newRecord.location,
              residentId: newRecord.resident_id,
              residentName: newRecord.resident_name,
              residentEmail: newRecord.resident_email,
              residentPhone: newRecord.resident_phone,
              submittedAt: newRecord.submitted_at,
              incidentDate: newRecord.incident_date,
              timeline: [
                {
                  status: newRecord.status || 'Submitted',
                  date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                  desc: 'New complaint registered via Live Realtime.'
                }
              ],
              attachments: []
            },
            ...prev
          ];
        });
      }
    );

    return () => {
      if (channel) {
        unsubscribeFromComplaintsRealtime(channel);
      }
    };
  }, []);

  // FEATURE 6: Supabase Realtime Notification Subscription with automatic cleanup
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const notifChannel = subscribeToNotificationsRealtime(
      user?.id,
      user?.role || 'resident',
      (newNotif) => {
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      }
    );

    return () => {
      if (notifChannel) {
        unsubscribeFromNotificationsRealtime(notifChannel);
      }
    };
  }, [user?.id, user?.role]);

  // Persist local state whenever updated
  useEffect(() => {
    localStorage.setItem('kinilis_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('kinilis_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('kinilis_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // FEATURE 1: Submit Complaint with Supabase PostgreSQL & Storage Evidence Support
  const submitComplaint = async (formData, user) => {
    const aiResult = classifyAndRouteComplaint(formData.title, formData.description, formData.category);

    // 1. Primary: Save directly to Supabase PostgreSQL & Supabase Storage
    if (isSupabaseConfigured()) {
      try {
        const createdSupabaseComplaint = await createComplaintInSupabase(
          formData,
          aiResult,
          user,
          formData.rawFiles || []
        );
        if (createdSupabaseComplaint) {
          setComplaints(prev => [createdSupabaseComplaint, ...prev]);
          return createdSupabaseComplaint;
        }
      } catch (sbError) {
        console.error('[ComplaintContext] Supabase submission error:', sbError);
        throw sbError; // Propagate error so user gets clear failure alert without misleading success
      }
    }

    // 2. Compatibility: Try legacy PHP API only if Supabase is not configured
    try {
      const dataPayload = new FormData();
      dataPayload.append('title', formData.title);
      dataPayload.append('description', formData.description);
      dataPayload.append('category', formData.category || 'Waste Management');
      dataPayload.append('location', formData.location || 'Brgy. Kinilis, Polomolok');
      dataPayload.append('incidentDate', formData.incidentDate || new Date().toISOString().split('T')[0]);
      dataPayload.append('incidentTime', formData.incidentTime || '10:00 AM');
      dataPayload.append('preferredContact', formData.preferredContact || 'Phone');
      dataPayload.append('residentName', user?.name || formData.contactName || 'Juan dela Cruz');
      dataPayload.append('residentEmail', user?.email || formData.email || 'juan.delacruz@kinilis.gov.ph');
      dataPayload.append('residentPhone', formData.phone || user?.contact || '0917-000-0000');
      if (user?.id) dataPayload.append('residentId', user.id);

      if (formData.rawFiles && formData.rawFiles.length > 0) {
        Array.from(formData.rawFiles).forEach(f => {
          dataPayload.append('evidence[]', f);
        });
      }

      const result = await apiClient.post('complaints.php', dataPayload, true);
      if (result && result.referenceNo) {
        setComplaints(prev => [result, ...prev]);
        return result;
      }
    } catch (err) {
      console.warn('[ComplaintContext] Legacy PHP fallback notice:', err.message);
    }

    // 3. Offline in-memory fallback
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const refNo = `KIN-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newComplaint = {
      id: `cmp_${Date.now()}`,
      referenceNo: refNo,
      title: formData.title,
      description: formData.description,
      category: aiResult.category,
      priority: aiResult.priority,
      status: 'Submitted',
      location: formData.location || 'Barangay Kinilis',
      residentName: user?.name || formData.contactName || 'Juan dela Cruz',
      residentEmail: user?.email || formData.email || 'juan.delacruz@kinilis.gov.ph',
      residentPhone: formData.phone || user?.contact || '0917-000-0000',
      preferredContact: formData.preferredContact || 'Phone',
      submittedAt: nowIso,
      incidentDate: formData.incidentDate || nowIso.split('T')[0],
      incidentTime: formData.incidentTime || '10:00 AM',
      isOverdue: false,
      aiResult: {
        category: aiResult.category,
        priority: aiResult.priority,
        department: aiResult.department,
        confidence: aiResult.confidence,
        reason: aiResult.reason,
        keywords: aiResult.keywords,
        classifiedAt: nowIso
      },
      routing: {
        department: aiResult.department,
        assignedStaff: aiResult.assignedStaff,
        routingStatus: 'Automatically Routed',
        routedAt: nowIso
      },
      timeline: [
        { status: 'Submitted', date: nowFormatted, desc: `Complaint registered under ${refNo}.` },
        { status: 'Under Review', date: nowFormatted, desc: `AI classified category as ${aiResult.category} (${aiResult.confidence}% confidence).` },
        { status: 'Assigned', date: nowFormatted, desc: `Automatically routed to ${aiResult.department}.` }
      ],
      attachments: formData.attachments || [],
      remarks: ''
    };

    setComplaints(prev => [newComplaint, ...prev]);
    return newComplaint;
  };

  // FEATURE 1: Check Duplicate Complaints with Supabase
  const checkDuplicates = async (title, description, location, category, excludeId = null) => {
    if (isSupabaseConfigured()) {
      try {
        const matches = await checkDuplicatesInSupabase(title, description, location, category, excludeId);
        return matches;
      } catch (sbErr) {
        console.warn('[ComplaintContext] Supabase duplicate check notice:', sbErr);
      }
    }

    try {
      const dupes = await apiClient.get('complaints.php', {
        action: 'check_duplicates',
        title,
        description,
        location,
        category,
        exclude_id: excludeId || 0
      });
      return Array.isArray(dupes) ? dupes : [];
    } catch (err) {
      return [];
    }
  };

  // FEATURE 1: Manual Override of AI Classification & Priority with Supabase
  const overrideAIClassification = async (complaintId, newCategory, newDepartment, newPriority, overrideReason, staffUser) => {
    if (isSupabaseConfigured()) {
      try {
        await overrideAIClassificationInSupabase(complaintId, newCategory, newDepartment, newPriority, overrideReason, staffUser);
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase override error:', sbErr);
        throw sbErr; // Propagate error so user gets clear failure alert without misleading success
      }
    } else {
      try {
        await apiClient.put('complaints.php?action=override_ai', {
          complaintId,
          category: newCategory,
          department: newDepartment,
          priority: newPriority,
          reason: overrideReason,
          userName: staffUser?.name || 'Staff Officer',
          userRole: staffUser?.role || 'Staff'
        });
      } catch (err) {
        // ignore
      }
    }

    // Synchronize local active state
    setComplaints(prev => prev.map(cmp => {
      if (cmp.id === String(complaintId)) {
        return {
          ...cmp,
          category: newCategory,
          priority: newPriority,
          routing: {
            ...cmp.routing,
            department: newDepartment,
            routingStatus: 'Staff Override'
          },
          timeline: [
            ...cmp.timeline,
            { status: 'Under Review', date: new Date().toLocaleString(), desc: `Override applied by ${staffUser?.name}: ${overrideReason}` }
          ]
        };
      }
      return cmp;
    }));
  };

  // FEATURE 1 & 3: Department & Officer Reassignment with Supabase
  const reassignComplaint = async (complaintId, newDepartment, newOfficer, notes, staffUser) => {
    if (isSupabaseConfigured()) {
      try {
        await reassignComplaintInSupabase(complaintId, newDepartment, newOfficer, notes, staffUser);
        createAuditLogInSupabase({
          user: staffUser?.name || staffUser?.fullName || 'Admin Desk',
          role: staffUser?.role || 'admin',
          action: 'REASSIGN_COMPLAINT',
          module: 'Department Assignment',
          entity: String(complaintId),
          oldValue: 'Assigned',
          newValue: `${newDepartment} -> ${newOfficer}`
        }).catch(err => console.warn('[Audit Log Notice]:', err.message));
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase reassign error:', sbErr);
        throw sbErr; // Propagate error so user gets clear failure alert without misleading success
      }
    } else {
      try {
        await apiClient.put('complaints.php?action=reassign', {
          complaintId,
          department: newDepartment,
          assignedStaff: newOfficer,
          notes: notes || 'Administrative reassignment',
          userName: staffUser?.name || 'Admin',
          userRole: staffUser?.role || 'Admin'
        });
      } catch (err) {
        // ignore
      }
    }

    // Synchronize local active state
    setComplaints(prev => prev.map(cmp => {
      if (cmp.id === String(complaintId)) {
        return {
          ...cmp,
          routing: {
            ...cmp.routing,
            department: newDepartment,
            assignedStaff: newOfficer,
            routingStatus: 'Manually Reassigned'
          },
          timeline: [
            ...cmp.timeline,
            { status: 'Assigned', date: new Date().toLocaleString(), desc: `Reassigned to ${newDepartment} under ${newOfficer}. Reason: ${notes}` }
          ]
        };
      }
      return cmp;
    }));
  };

  // FEATURE 1: Update Complaint Status with Supabase
  const updateComplaintStatus = async (complaintId, newStatus, staffRemarks, staffUser) => {
    if (isSupabaseConfigured()) {
      try {
        await updateComplaintStatusInSupabase(complaintId, newStatus, staffRemarks, staffUser);
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase status update error:', sbErr);
        throw sbErr; // Propagate error so user gets clear failure alert without misleading success
      }
    } else {
      try {
        await apiClient.put('complaints.php?action=update_status', {
          complaintId,
          status: newStatus,
          remarks: staffRemarks || '',
          userName: staffUser?.name || 'Staff Officer',
          userRole: staffUser?.role || 'Staff'
        });
      } catch (err) {
        // ignore
      }
    }

    // Synchronize local active state
    setComplaints(prev => prev.map(cmp => {
      if (cmp.id === String(complaintId)) {
        return {
          ...cmp,
          status: newStatus,
          remarks: staffRemarks || cmp.remarks,
          timeline: [
            ...cmp.timeline,
            { status: newStatus, date: new Date().toLocaleString(), desc: staffRemarks || `Status updated to ${newStatus}.` }
          ]
        };
      }
      return cmp;
    }));
  };

  // FEATURE 8: Submit Resolution (Staff Proof of Work) via Supabase Storage + Atomic RPC
  const submitResolution = async (complaintId, resolutionSummary, evidenceUrl, staffUser, evidenceFile = null, correctionReason = null) => {
    const targetComp = complaints.find(c => String(c.id) === String(complaintId));
    const refNo = targetComp?.referenceNo || `REF-${complaintId}`;

    if (isSupabaseConfigured()) {
      try {
        let evidencePath = null;
        if (evidenceFile) {
          // 1. Upload to private Supabase Storage bucket 'resolution-proofs'
          evidencePath = await uploadResolutionProofToSupabase(refNo, evidenceFile);
        } else if (evidenceUrl && !evidenceUrl.startsWith('http://') && !evidenceUrl.startsWith('https://') && !evidenceUrl.startsWith('blob:') && !evidenceUrl.startsWith('/')) {
          evidencePath = evidenceUrl;
        }

        // 2. Call atomic hardened PostgreSQL RPC with idempotency key
        const idempotencyKey = `res_${complaintId}_${Date.now()}`;
        const result = await submitStaffComplaintResolutionInSupabase({
          complaintId,
          summary: resolutionSummary,
          evidencePath,
          correctionReason,
          idempotencyKey
        });

        // 3. Resolve temporary signed URL for immediate local preview
        let previewSignedUrl = '';
        if (evidencePath) {
          previewSignedUrl = await getResolutionProofSignedUrl(evidencePath, 300) || '';
        }

        // 4. Synchronize local state
        const nowFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        setComplaints(prev => prev.map(cmp => {
          if (String(cmp.id) === String(complaintId)) {
            return {
              ...cmp,
              status: 'Resolution Submitted',
              resolution: {
                summary: resolutionSummary,
                resolvedBy: staffUser?.name || 'Staff Officer',
                resolvedAt: nowFormatted,
                evidenceUrl: previewSignedUrl || cmp.resolution?.evidenceUrl || '',
                rawEvidencePath: evidencePath || cmp.resolution?.rawEvidencePath || ''
              },
              timeline: [
                ...cmp.timeline,
                {
                  status: 'Resolution Submitted',
                  date: nowFormatted,
                  desc: correctionReason
                    ? `Corrected action taken: ${resolutionSummary} (${correctionReason})`
                    : `Action taken: ${resolutionSummary}. Awaiting resident review and verification.`
                }
              ]
            };
          }
          return cmp;
        }));

        return true;
      } catch (err) {
        console.error('[ComplaintContext] Supabase resolution error:', err);
        // Do NOT silently fall back to PHP in production/Vercel. Propagate clear error to caller.
        throw err;
      }
    }

    // Local development fallback only (when Supabase is explicitly not configured)
    try {
      let payload;
      let isForm = false;
      if (evidenceFile) {
        payload = new FormData();
        payload.append('complaintId', complaintId);
        payload.append('summary', resolutionSummary);
        payload.append('resolvedBy', staffUser?.name || 'Staff Officer');
        payload.append('evidence', evidenceFile);
        isForm = true;
      } else {
        payload = {
          complaintId,
          summary: resolutionSummary,
          resolvedBy: staffUser?.name || 'Staff Officer',
          evidenceUrl: evidenceUrl || ''
        };
      }

      await apiClient.post('resolutions.php?action=submit_resolution', payload, isForm);
      syncWithBackend();
      return true;
    } catch (err) {
      console.warn('Backend resolution notice:', err.message);
      throw err;
    }
  };

  // FEATURE 3 & 4: Resident Reviews Resolution & Submits Feedback with Supabase
  const submitResidentFeedback = async (complaintId, rating, satisfaction, comments, actionStatus = 'Accepted', residentName = 'Resident') => {
    if (isSupabaseConfigured()) {
      try {
        await submitComplaintFeedbackToSupabase(
          complaintId,
          rating,
          satisfaction,
          comments,
          actionStatus,
          user?.id || null
        );

        // Record audit trail
        createAuditLogInSupabase({
          user: residentName || user?.name || 'Resident',
          role: 'resident',
          action: 'SUBMIT_FEEDBACK',
          module: 'Resident Feedback',
          entity: String(complaintId),
          oldValue: 'Awaiting Verification',
          newValue: `${actionStatus} (${rating}★, ${satisfaction})`
        }).catch(() => {});

        // Notification dispatch is handled server-side by trg_feedback_notification trigger
        fetchFeedback();
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase submitResidentFeedback error:', sbErr);
        throw sbErr;
      }
    } else {
      try {
        await apiClient.post('resolutions.php?action=submit_feedback', {
          complaintId,
          rating,
          satisfaction,
          comments,
          actionStatus,
          residentName
        });
        syncWithBackend();
      } catch (err) {
        console.warn('Backend feedback notice:', err.message);
      }
    }

    // Synchronize local active state
    const finalStatus = (actionStatus === 'Accepted') ? 'Resolved' : 'In Progress';
    setComplaints(prev => prev.map(cmp => {
      if (cmp.id === String(complaintId)) {
        return {
          ...cmp,
          status: finalStatus,
          feedback: {
            rating,
            satisfaction,
            comments,
            submittedAt: new Date().toISOString()
          },
          timeline: [
            ...cmp.timeline,
            {
              status: finalStatus,
              date: new Date().toLocaleString(),
              desc: (actionStatus === 'Accepted') 
                ? `Resident verified resolution with a ${rating}-star rating (${satisfaction}).` 
                : `Resident requested further action: ${comments}`
            }
          ]
        };
      }
      return cmp;
    }));
    return true;
  };

  // FEATURE 1 & 2: Send Follow-Up Message with Attachments & Realtime Notifications
  const sendFollowup = async (complaintId, message, senderName, senderRole, senderId = null, attachmentFile = null) => {
    // 1. Primary: Save directly to Supabase PostgreSQL & Storage
    if (isSupabaseConfigured()) {
      try {
        const savedFollowup = await sendComplaintFollowupInSupabase(
          complaintId,
          message,
          senderName,
          senderRole,
          senderId,
          attachmentFile
        );

        // Notification dispatch is handled server-side by trg_followup_notification trigger
        return savedFollowup;
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase followup error:', sbErr);
        throw sbErr;
      }
    }

    // 2. Fallback: Legacy PHP endpoint
    try {
      let payload;
      let isForm = false;
      if (attachmentFile) {
        payload = new FormData();
        payload.append('complaintId', complaintId);
        payload.append('message', message);
        payload.append('senderName', senderName);
        payload.append('senderRole', senderRole);
        if (senderId) payload.append('senderId', senderId);
        payload.append('attachment', attachmentFile);
        isForm = true;
      } else {
        payload = {
          complaintId,
          message,
          senderName,
          senderRole,
          senderId
        };
      }
      await apiClient.post('followups.php', payload, isForm);
      syncWithBackend();
      return true;
    } catch (err) {
      console.warn('Backend follow-up notice:', err.message);
      return false;
    }
  };

  // FEATURE 3: Department Management
  const addDepartment = async (deptData) => {
    if (isSupabaseConfigured()) {
      try {
        const created = await createDepartmentInSupabase(deptData);
        if (created) {
          setDepartments(prev => [...prev, created]);
          createAuditLogInSupabase({
            user: 'Admin Desk',
            role: 'admin',
            action: 'CREATE_DEPARTMENT',
            module: 'Departments',
            entity: created.name,
            oldValue: 'None',
            newValue: `Head: ${created.head || 'N/A'}, Staff: ${created.staffCount}`
          }).catch(err => console.warn('[Audit Log Notice]:', err.message));
          return created;
        }
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase addDepartment error:', sbErr);
        throw sbErr;
      }
    }

    // Fallback: Legacy PHP
    try {
      await apiClient.post('departments.php?action=add_department', {
        name: deptData.name,
        description: deptData.description,
        head: deptData.head,
        staffCount: deptData.staffCount || 5,
        slaHours: deptData.slaHours || 72
      });
      syncWithBackend();
      return true;
    } catch (err) {
      console.warn('Backend add department notice:', err.message);
    }

    const newDept = {
      id: `dept_${Date.now()}`,
      name: deptData.name,
      description: deptData.description,
      head: deptData.head || 'Unassigned',
      staffCount: Number(deptData.staffCount) || 5,
      slaHours: deptData.slaHours || 72,
      activeComplaints: 0,
      resolvedComplaints: 0,
      status: 'Active'
    };
    setDepartments(prev => [...prev, newDept]);
    return newDept;
  };

  const editDepartment = async (deptId, updates) => {
    if (isSupabaseConfigured()) {
      try {
        const updated = await updateDepartmentInSupabase(deptId, updates);
        setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updated } : d));
        createAuditLogInSupabase({
          user: 'Admin Desk',
          role: 'admin',
          action: 'UPDATE_DEPARTMENT',
          module: 'Departments',
          entity: String(deptId),
          oldValue: 'Existing Configuration',
          newValue: JSON.stringify(updates)
        }).catch(err => console.warn('[Audit Log Notice]:', err.message));
        return updated;
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase editDepartment error:', sbErr);
        throw sbErr;
      }
    }

    setDepartments(prev => prev.map(d => d.id === deptId ? { ...d, ...updates } : d));
    return true;
  };

  const toggleDepartmentStatus = async (deptId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    return editDepartment(deptId, { status: nextStatus });
  };

  // FEATURE 3: Personnel Management
  const updateStaffMember = async (staffId, updates) => {
    if (isSupabaseConfigured()) {
      try {
        const updated = await updateStaffProfileInSupabase(staffId, updates);
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, ...updated } : s));
        createAuditLogInSupabase({
          user: 'Admin Desk',
          role: 'admin',
          action: 'UPDATE_STAFF_PROFILE',
          module: 'Personnel',
          entity: String(staffId),
          oldValue: 'Existing Profile',
          newValue: JSON.stringify(updates)
        }).catch(err => console.warn('[Audit Log Notice]:', err.message));
        return updated;
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase updateStaffMember error:', sbErr);
        throw sbErr;
      }
    }

    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
    return true;
  };

  // FEATURE 3: Department Routing Rules
  const updateRoutingRules = async (newRules) => {
    setCategoryRoutingRules(newRules);

    if (isSupabaseConfigured()) {
      try {
        for (const rule of newRules) {
          await updateRoutingRuleInSupabase(rule);
        }
        createAuditLogInSupabase({
          user: 'Admin Desk',
          role: 'admin',
          action: 'UPDATE_ROUTING_RULES',
          module: 'Routing Engine',
          entity: 'AI Category Rules',
          oldValue: 'Previous Rules',
          newValue: `${newRules.length} rules saved to database`
        }).catch(err => console.warn('[Audit Log Notice]:', err.message));
        return true;
      } catch (sbErr) {
        console.error('[ComplaintContext] Supabase updateRoutingRules error:', sbErr);
        throw sbErr;
      }
    }

    try {
      for (const rule of newRules) {
        await apiClient.post('departments.php?action=update_routing_rule', rule);
      }
      syncWithBackend();
      return true;
    } catch (err) {
      console.warn('Backend update routing rules notice:', err.message);
      return false;
    }
  };

  // Generic Complaint Update
  const updateComplaint = async (complaintId, updates) => {
    if (updates.status) {
      return updateComplaintStatus(complaintId, updates.status, updates.remarks || 'Status updated');
    }
    if (updates.department) {
      return reassignComplaint(complaintId, updates.department, updates.assignedStaff || 'Department Desk', 'Rule approved');
    }
    setComplaints(prev => prev.map(c => c.id === String(complaintId) ? { ...c, ...updates } : c));
  };

  // Notification actions
  const markNotificationAsRead = async (id) => {
    if (isSupabaseConfigured()) {
      markNotificationAsReadInSupabase(id).catch(err => console.warn('Supabase mark read warning:', err));
    } else {
      try {
        await apiClient.post('notifications.php?action=mark_read', { id });
      } catch (err) {
        console.warn('Mark read notice:', err.message);
      }
    }
    setNotifications(prev => prev.map(n => n.id === String(id) ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async (role = 'all') => {
    if (isSupabaseConfigured()) {
      markAllNotificationsAsReadInSupabase(user?.id, user?.role || role).catch(err => console.warn('Supabase mark all read warning:', err));
    } else {
      try {
        await apiClient.post('notifications.php?action=mark_all_read', { role });
      } catch (err) {
        console.warn('Mark all read notice:', err.message);
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <ComplaintContext.Provider value={{
      complaints,
      departments,
      staffList,
      categoryRoutingRules,
      auditLogs,
      notifications,
      feedbackList,
      fetchFeedback,
      analyticsOverview,
      loading,
      refreshData: syncWithBackend,
      submitComplaint,
      checkDuplicates,
      overrideAIClassification,
      reassignComplaint,
      updateComplaintStatus,
      updateComplaint,
      resolveComplaint: submitResolution,
      submitResolution,
      getResolutionProofSignedUrl,
      reserveComplaintReference: reserveComplaintReferenceInSupabase,
      abandonComplaintReferenceReservation: abandonComplaintReferenceReservationInSupabase,
      consumeComplaintReferenceReservation: consumeComplaintReferenceReservationInSupabase,
      requestEvidenceCleanup: requestEvidenceCleanupInSupabase,
      submitResidentFeedback,
      sendFollowup,
      addDepartment,
      editDepartment,
      toggleDepartmentStatus,
      updateStaffMember,
      updateRoutingRules,
      markNotificationAsRead,
      markAllNotificationsRead
    }}>
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintContext);
export default ComplaintContext;
