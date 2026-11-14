import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { classifyAndRouteComplaint, DEFAULT_CATEGORY_ROUTING } from '../lib/aiClassifier';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync state with PHP MySQL backend on mount
  const syncWithBackend = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch Complaints
      const complaintsData = await apiClient.get('complaints.php');
      if (Array.isArray(complaintsData) && complaintsData.length > 0) {
        setComplaints(complaintsData);
        localStorage.setItem('kinilis_complaints', JSON.stringify(complaintsData));
      }

      // 2. Fetch Departments and Staff
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

      // 3. Fetch Notifications
      const notifsData = await apiClient.get('notifications.php');
      if (Array.isArray(notifsData)) {
        setNotifications(notifsData);
        localStorage.setItem('kinilis_notifications', JSON.stringify(notifsData));
      }

      // 4. Fetch Audit Logs
      const auditData = await apiClient.get('audit.php');
      if (Array.isArray(auditData)) {
        setAuditLogs(auditData);
        localStorage.setItem('kinilis_audit_logs', JSON.stringify(auditData));
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

  // FEATURE 1: Submit Complaint with MySQL & Evidence File Support
  const submitComplaint = async (formData, user) => {
    try {
      // Build FormData for upload
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

      // Append files if available
      if (formData.rawFiles && formData.rawFiles.length > 0) {
        Array.from(formData.rawFiles).forEach(f => {
          dataPayload.append('evidence[]', f);
        });
      }

      const result = await apiClient.post('complaints.php', dataPayload, true);
      if (result && result.referenceNo) {
        setComplaints(prev => [result, ...prev]);
        syncWithBackend(); // refresh notifications and audit
        return result;
      }
    } catch (err) {
      console.warn('Backend submit notice, creating offline/fallback complaint:', err.message);
    }

    // Fallback in-memory creation
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const aiResult = classifyAndRouteComplaint(formData.title, formData.description, formData.category);
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

  // FEATURE 3: Check Duplicate Complaints
  const checkDuplicates = async (title, description, location, category, excludeId = 0) => {
    try {
      const dupes = await apiClient.get('complaints.php', {
        action: 'check_duplicates',
        title,
        description,
        location,
        category,
        exclude_id: excludeId
      });
      return Array.isArray(dupes) ? dupes : [];
    } catch (err) {
      console.warn('Duplicate check notice:', err.message);
      return [];
    }
  };

  // FEATURE 3 & 4: Manual Override of AI Classification & Priority
  const overrideAIClassification = async (complaintId, newCategory, newDepartment, newPriority, overrideReason, staffUser) => {
    try {
      const updated = await apiClient.put('complaints.php?action=override_ai', {
        complaintId,
        category: newCategory,
        department: newDepartment,
        priority: newPriority,
        reason: overrideReason,
        userName: staffUser?.name || 'Staff Officer',
        userRole: staffUser?.role || 'Staff'
      });
      if (updated && updated.id) {
        setComplaints(prev => prev.map(c => c.id === String(complaintId) ? updated : c));
        syncWithBackend();
        return updated;
      }
    } catch (err) {
      console.warn('Backend override notice:', err.message);
    }

    // Local fallback
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

  // FEATURE 5: Department & Officer Reassignment
  const reassignComplaint = async (complaintId, newDepartment, newOfficer, notes, staffUser) => {
    try {
      const updated = await apiClient.put('complaints.php?action=reassign', {
        complaintId,
        department: newDepartment,
        assignedStaff: newOfficer,
        notes: notes || 'Administrative reassignment',
        userName: staffUser?.name || 'Admin',
        userRole: staffUser?.role || 'Admin'
      });
      if (updated && updated.id) {
        setComplaints(prev => prev.map(c => c.id === String(complaintId) ? updated : c));
        syncWithBackend();
        return updated;
      }
    } catch (err) {
      console.warn('Backend reassign notice:', err.message);
    }

    // Local fallback
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

  // FEATURE 6: Update Complaint Status
  const updateComplaintStatus = async (complaintId, newStatus, staffRemarks, staffUser) => {
    try {
      const updated = await apiClient.put('complaints.php?action=update_status', {
        complaintId,
        status: newStatus,
        remarks: staffRemarks || '',
        userName: staffUser?.name || 'Staff Officer',
        userRole: staffUser?.role || 'Staff'
      });
      if (updated && updated.id) {
        setComplaints(prev => prev.map(c => c.id === String(complaintId) ? updated : c));
        syncWithBackend();
        return updated;
      }
    } catch (err) {
      console.warn('Backend status update notice:', err.message);
    }

    // Local fallback
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

  // FEATURE 8: Submit Resolution (Staff Proof of Work)
  const submitResolution = async (complaintId, resolutionSummary, evidenceUrl, staffUser, evidenceFile = null) => {
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
    }

    // Local fallback
    const nowFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    setComplaints(prev => prev.map(cmp => {
      if (cmp.id === String(complaintId)) {
        return {
          ...cmp,
          status: 'Resolution Submitted',
          resolution: {
            summary: resolutionSummary,
            resolvedBy: staffUser?.name || 'Staff Officer',
            resolvedAt: nowFormatted,
            evidenceUrl: evidenceUrl || ''
          },
          timeline: [
            ...cmp.timeline,
            { status: 'Resolution Submitted', date: nowFormatted, desc: `Action taken: ${resolutionSummary}. Awaiting resident review and verification.` }
          ]
        };
      }
      return cmp;
    }));
  };

  // FEATURE 8: Resident Reviews Resolution & Submits Feedback
  const submitResidentFeedback = async (complaintId, rating, satisfaction, comments, actionStatus = 'Accepted', residentName = 'Resident') => {
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
      return true;
    } catch (err) {
      console.warn('Backend feedback notice:', err.message);
    }

    // Local fallback
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
  };

  // FEATURE 7: Send Follow-Up Message
  const sendFollowup = async (complaintId, message, senderName, senderRole, senderId = null, attachmentFile = null) => {
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

  // Department Management
  const addDepartment = async (deptData) => {
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

    // Fallback
    const newDept = {
      id: `dept_${Date.now()}`,
      name: deptData.name,
      description: deptData.description,
      head: deptData.head || 'Unassigned',
      staffCount: Number(deptData.staffCount) || 5,
      slaHours: 72,
      activeComplaints: 0,
      resolvedComplaints: 0,
      status: 'Active'
    };
    setDepartments(prev => [...prev, newDept]);
  };

  // Update Routing Rules
  const updateRoutingRules = async (newRules) => {
    setCategoryRoutingRules(newRules);
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
    try {
      await apiClient.post('notifications.php?action=mark_read', { id });
    } catch (err) {
      console.warn('Mark read notice:', err.message);
    }
    setNotifications(prev => prev.map(n => n.id === String(id) ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async (role = 'all') => {
    try {
      await apiClient.post('notifications.php?action=mark_all_read', { role });
    } catch (err) {
      console.warn('Mark all read notice:', err.message);
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
      submitResidentFeedback,
      sendFollowup,
      addDepartment,
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
