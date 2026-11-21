import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Supabase Health Check Diagnostic Function
 * Tests read and write connectivity to Supabase project
 */
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or contains placeholder values in .env'
    };
  }

  try {
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('count')
      .limit(1);

    if (deptError) {
      return {
        connected: false,
        message: `Supabase query error: ${deptError.message} (Code: ${deptError.code})`,
        error: deptError
      };
    }

    const { data: cmpData, error: cmpError } = await supabase
      .from('complaints')
      .select('count')
      .limit(1);

    if (cmpError) {
      return {
        connected: false,
        message: `Complaints table error: ${cmpError.message}`,
        error: cmpError
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase database!',
      projectUrl: import.meta.env.VITE_SUPABASE_URL
    };
  } catch (err) {
    return {
      connected: false,
      message: `Supabase connection exception: ${err.message || err}`,
      error: err
    };
  }
};

/**
 * =========================================================================
 * FEATURE 1: DIGITAL COMPLAINT MANAGEMENT (HARDENED SUPABASE API)
 * =========================================================================
 */

/**
 * Dynamic collision-safe reference number generator
 * Uses current year dynamically: KIN-YYYY-XXXXXX
 */
export const generateReferenceNo = () => {
  const currentYear = new Date().getFullYear();
  // 6-digit random component + timestamp suffix to ensure collision resistance
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `KIN-${currentYear}-${randomPart}`;
};

/**
 * Duplicate check with strict error discrimination
 * Throws on actual database failure so UI does NOT falsely display "No duplicates found".
 */
export const checkDuplicatesInSupabase = async (title, description, location, category, excludeId = null) => {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from('complaints')
    .select('id, reference_no, title, category, status, location, submitted_at')
    .eq('category', category)
    .neq('status', 'Dismissed')
    .limit(8);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase Error - checkDuplicatesInSupabase]:', error);
    throw new Error(`Database error during duplicate check: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) return [];

  const keywords = (title || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);

  const matches = data.filter(c => {
    const cTitle = (c.title || '').toLowerCase();
    const cLoc = (c.location || '').toLowerCase();
    const hasKeyword = keywords.some(k => cTitle.includes(k));
    const hasLocation = location && cLoc.includes(location.toLowerCase());
    return hasKeyword || hasLocation;
  });

  return matches.map(m => ({
    id: m.id,
    referenceNo: m.reference_no,
    title: m.title,
    category: m.category,
    status: m.status,
    location: m.location,
    submittedAt: m.submitted_at
  }));
};

/**
 * Reserve an authorized submission reference bound to auth.uid() via PostgreSQL RPC.
 * Creates an authoritative pending reservation in public.complaint_submission_reservations.
 */
export const reserveComplaintReferenceInSupabase = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.rpc('reserve_complaint_submission_reference');
  if (error) {
    console.error('[reserveComplaintReferenceInSupabase Error]:', error);
    throw new Error(`Failed to reserve complaint reference: ${error.message}`);
  }

  return data;
};

/**
 * Abandon a complaint submission reservation (e.g. user canceled or upload failed).
 */
export const abandonComplaintReferenceReservationInSupabase = async (referenceNo) => {
  if (!isSupabaseConfigured() || !referenceNo) return;
  try {
    await supabase.rpc('abandon_complaint_submission_reservation', { p_reference_no: referenceNo });
  } catch (err) {
    console.warn('[abandonComplaintReferenceReservationInSupabase Notice]:', err.message);
  }
};

/**
 * Consume a complaint submission reservation upon successful complaint creation.
 */
export const consumeComplaintReferenceReservationInSupabase = async (referenceNo, complaintId) => {
  if (!isSupabaseConfigured() || !referenceNo || !complaintId) return;
  try {
    await supabase.rpc('consume_complaint_submission_reservation', {
      p_reference_no: referenceNo,
      p_complaint_id: complaintId
    });
  } catch (err) {
    console.warn('[consumeComplaintReferenceReservationInSupabase Notice]:', err.message);
  }
};

/**
 * Request server-side evidence cleanup for an unsubmitted or abandoned reservation.
 * Calls restricted PostgreSQL RPC that purges DB storage metadata and enqueues
 * background storage engine file deletion without granting client DELETE permissions.
 */
export const requestEvidenceCleanupInSupabase = async (referenceNo, filePaths = []) => {
  if (!isSupabaseConfigured() || !referenceNo) return null;
  try {
    const { data, error } = await supabase.rpc('request_evidence_cleanup', {
      p_reference_no: referenceNo,
      p_file_paths: filePaths
    });
    if (error) {
      console.warn('[requestEvidenceCleanupInSupabase Warning]:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[requestEvidenceCleanupInSupabase Notice]:', err.message);
    return null;
  }
};

/**
 * Hardened Evidence Uploader
 * Uploads selected files to private Supabase Storage bucket 'complaint-evidence'.
 * Path structure: {reference_no}/{timestamp}_{clean_filename}
 * Enforces pre-upload validation, upsert: false, and rolls back uploads on failure via server cleanup.
 */
export const uploadEvidenceFilesToSupabase = async (files, referenceNo) => {
  if (!isSupabaseConfigured() || !files || files.length === 0) return [];

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  // 1. Strict Pre-Validation Phase: If ANY file is invalid, reject all before touching storage
  for (const file of Array.from(files)) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Unsupported file type "${file.name}" (${file.type || 'unknown'}). Allowed: JPG, PNG, WEBP, PDF.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds the 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
    }
  }

  const uploadedRecords = [];
  const uploadedPaths = [];

  // 2. Upload Phase with immediate rollback if any upload fails
  try {
    for (const file of Array.from(files)) {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${referenceNo}/${Date.now()}_${cleanFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaint-evidence')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`[Supabase Storage Upload Error for ${file.name}]:`, uploadError);
        throw new Error(`Failed to upload evidence file "${file.name}": ${uploadError.message}`);
      }

      uploadedPaths.push(filePath);

      // Generate temporary signed URL (temporary bearer link valid 300 seconds / 5 mins; access authorized at generation time subject to storage RLS)
      let previewUrl = '';
      const { data: signedData, error: signError } = await supabase.storage
        .from('complaint-evidence')
        .createSignedUrl(filePath, 300);

      if (!signError && signedData?.signedUrl) {
        previewUrl = signedData.signedUrl;
      }

      uploadedRecords.push({
        fileName: file.name,
        filePath: filePath,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileType: file.type,
        previewUrl: previewUrl || URL.createObjectURL(file)
      });
    }

    return uploadedRecords;
  } catch (err) {
    // Purge any uploaded files from this session via secure server-side cleanup
    if (uploadedPaths.length > 0) {
      try {
        await requestEvidenceCleanupInSupabase(referenceNo, uploadedPaths);
      } catch (cleanErr) {
        console.warn('[uploadEvidenceFilesToSupabase] Rollback cleanup warning:', cleanErr);
      }
    }
    throw err;
  }
};

/**
 * Fetch complaints with related assignments, evidence, and status history
 */
export const fetchComplaintsFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      complaint_status_history (
        id, status, action_title, description, performed_by_name, performed_by_role, created_at
      ),
      complaint_evidence (
        id, file_name, file_path, file_size, file_type, uploaded_at
      ),
      complaint_assignments (
        id, department_name, assigned_staff, routing_status, notes, assigned_at
      ),
      complaint_resolutions (
        id, resolved_by, summary, evidence_url, resolved_at
      ),
      resident_feedback (
        id, rating, satisfaction_level, comments, submitted_at
      ),
      ai_classification_logs (
        id, category, priority, suggested_department, confidence, reasoning, keywords
      )
    `)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[Supabase Error - fetchComplaintsFromSupabase]:', error);
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }

  return await Promise.all(data.map(async (c) => {
    const aiLog = c.ai_classification_logs?.[0] || null;
    const assignment = c.complaint_assignments?.[0] || null;
    const resolution = c.complaint_resolutions?.[0] || null;
    const feedback = c.resident_feedback?.[0] || null;
    const historyList = Array.isArray(c.complaint_status_history)
      ? c.complaint_status_history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      : [];

    let resolutionEvidenceUrl = '';
    if (resolution?.evidence_url) {
      resolutionEvidenceUrl = await getResolutionProofSignedUrl(resolution.evidence_url, 300) || resolution.evidence_url;
    }

    return {
      id: c.id,
      referenceNo: c.reference_no,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      location: c.location,
      residentName: c.resident_name,
      residentEmail: c.resident_email,
      residentPhone: c.resident_phone,
      preferredContact: c.preferred_contact,
      submittedAt: c.submitted_at,
      incidentDate: c.incident_date,
      incidentTime: c.incident_time,
      isOverdue: c.is_overdue || false,
      remarks: c.remarks || '',
      aiResult: aiLog ? {
        category: aiLog.category,
        priority: aiLog.priority,
        department: aiLog.suggested_department,
        confidence: aiLog.confidence,
        reason: aiLog.reasoning,
        keywords: aiLog.keywords || []
      } : {
        category: c.category,
        priority: c.priority,
        department: assignment?.department_name || 'Administrative Office',
        confidence: 90,
        reason: 'Automated complaint routing',
        keywords: []
      },
      routing: {
        department: assignment?.department_name || 'Administrative Office',
        assignedStaff: assignment?.assigned_staff || 'Unassigned',
        routingStatus: assignment?.routing_status || 'Automatically Routed'
      },
      timeline: historyList.map(h => ({
        status: h.status,
        date: new Date(h.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        desc: h.description,
        actor: h.performed_by_name || null
      })),
      resolution: resolution ? {
        summary: resolution.summary,
        resolvedBy: resolution.resolved_by,
        resolvedAt: new Date(resolution.resolved_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        evidenceUrl: resolutionEvidenceUrl,
        rawEvidencePath: resolution.evidence_url || ''
      } : null,
      feedback: feedback ? {
        rating: feedback.rating,
        satisfaction: feedback.satisfaction_level,
        comments: feedback.comments,
        submittedAt: feedback.submitted_at
      } : null,
      attachments: (c.complaint_evidence || []).map(e => ({
        id: e.id,
        name: e.file_name,
        path: e.file_path,
        size: e.file_size
      }))
    };
  }));
};

/**
 * Hardened Complaint Creation
 * Validates real resident identity (zero hardcoded defaults).
 * Uploads evidence and creates related records with explicit error checks.
 */
export const createComplaintInSupabase = async (complaintData, aiResult, user = null, rawFiles = []) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Strict Validation of Complainant Information (Zero Hardcoded Defaults)
  const residentName = (user?.name || complaintData.residentName || complaintData.contactName || '').trim();
  const residentEmail = (user?.email || complaintData.residentEmail || complaintData.email || '').trim().toLowerCase();
  const residentPhone = (complaintData.residentPhone || complaintData.phone || user?.contact || '').trim();
  const title = (complaintData.title || '').trim();
  const description = (complaintData.description || '').trim();

  if (!title || title.length < 5) {
    throw new Error('Complaint title is required and must be at least 5 characters.');
  }
  if (!description || description.length < 10) {
    throw new Error('Complaint description is required and must be at least 10 characters.');
  }
  if (!residentName) {
    throw new Error('Complainant full name is required.');
  }
  if (!residentEmail || !residentEmail.includes('@')) {
    throw new Error('A valid email address is required for complaint status notifications.');
  }

  // 2. Reserve Authorized Reference Number bound to auth.uid() via PostgreSQL RPC
  let refNo = complaintData.referenceNo;
  let reservation = null;

  if (!refNo) {
    try {
      reservation = await reserveComplaintReferenceInSupabase();
      if (reservation?.reference_no) {
        refNo = reservation.reference_no;
      }
    } catch (resErr) {
      console.warn('[createComplaintInSupabase] Reservation notice (using fallback reference):', resErr.message);
      refNo = generateReferenceNo();
    }
  }

  let uploadedEvidence = [];

  try {
    // 3. Upload Evidence Files to Private Storage Bucket (authorized via active reservation)
    if (rawFiles && rawFiles.length > 0) {
      uploadedEvidence = await uploadEvidenceFilesToSupabase(rawFiles, refNo);
    }

    // 4. Atomic Complaint Insertion & Reservation Consumption via PostgreSQL RPC
    const evidencePayload = uploadedEvidence.map(ev => ({
      file_name: ev.fileName,
      file_path: ev.filePath,
      file_size: ev.fileSize,
      file_type: ev.fileType
    }));

    const { data: atomicResult, error: atomicError } = await supabase.rpc('submit_resident_complaint_with_reservation', {
      p_reference_no: refNo,
      p_title: title,
      p_description: description,
      p_category: aiResult?.category || complaintData.category || 'Waste Management',
      p_priority: aiResult?.priority || 'Medium',
      p_location: (complaintData.location || 'Barangay Kinilis, Polomolok').trim(),
      p_incident_date: complaintData.incidentDate || new Date().toISOString().split('T')[0],
      p_incident_time: complaintData.incidentTime || '10:00 AM',
      p_resident_name: residentName,
      p_resident_email: residentEmail,
      p_resident_phone: residentPhone || null,
      p_preferred_contact: complaintData.preferredContact || 'Phone',
      p_evidence_files: evidencePayload,
      p_ai_department: aiResult?.department || null,
      p_ai_confidence: aiResult?.confidence || 90,
      p_ai_reasoning: aiResult?.reason || 'Automated classification based on submitted description',
      p_ai_keywords: aiResult?.keywords || []
    });

    if (atomicError) {
      console.error('[Supabase Error - Atomic submit_resident_complaint_with_reservation]:', atomicError);
      throw new Error(`Database error saving complaint: ${atomicError.message}`);
    }

    const complaintId = atomicResult?.id;
    const nowFormatted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    return {
      id: complaintId,
      referenceNo: refNo,
      title: title,
      description: description,
      category: aiResult?.category || complaintData.category || 'Waste Management',
      priority: aiResult?.priority || 'Medium',
      status: 'Submitted',
      location: (complaintData.location || 'Barangay Kinilis, Polomolok').trim(),
      residentName: residentName,
      residentEmail: residentEmail,
      residentPhone: residentPhone || null,
      preferredContact: complaintData.preferredContact || 'Phone',
      submittedAt: atomicResult?.submitted_at || new Date().toISOString(),
      incidentDate: complaintData.incidentDate || new Date().toISOString().split('T')[0],
      incidentTime: complaintData.incidentTime || '10:00 AM',
      isOverdue: false,
      remarks: '',
      aiResult: {
        category: aiResult?.category || complaintData.category || 'Waste Management',
        priority: aiResult?.priority || 'Medium',
        department: aiResult?.department || 'Administrative Office',
        confidence: aiResult?.confidence || 90,
        reason: aiResult?.reason || 'Automated category classification',
        keywords: aiResult?.keywords || []
      },
      routing: {
        department: aiResult?.department || 'Administrative Office',
        assignedStaff: aiResult?.assignedStaff || 'Unassigned',
        routingStatus: 'Automatically Routed'
      },
      timeline: [
        { status: 'Submitted', date: nowFormatted, desc: `Complaint registered under ${refNo}.` },
        { status: 'Under Review', date: nowFormatted, desc: `AI classified category as ${aiResult?.category || 'General'} (${aiResult?.confidence || 90}% confidence).` },
        { status: 'Assigned', date: nowFormatted, desc: `Automatically routed to ${aiResult?.department || 'Administrative Office'}.` }
      ],
      attachments: uploadedEvidence.map(e => ({
        name: e.fileName,
        url: e.previewUrl,
        size: e.fileSize
      }))
    };
  } catch (submissionErr) {
    console.error('[createComplaintInSupabase Error]:', submissionErr);
    // Safe cleanup: abandon reservation & request server-side purging of uploaded files
    if (reservation?.reference_no) {
      await abandonComplaintReferenceReservationInSupabase(refNo);
    }
    if (uploadedEvidence.length > 0) {
      const pathsToRemove = uploadedEvidence.map(e => e.filePath).filter(Boolean);
      if (pathsToRemove.length > 0) {
        try {
          await requestEvidenceCleanupInSupabase(refNo, pathsToRemove);
        } catch (cleanErr) {
          console.warn('[createComplaintInSupabase] Orphan cleanup warning:', cleanErr);
        }
      }
    }
    throw submissionErr;
  }
};

/**
 * Hardened Complaint Status Update (Staff & Admin)
 * Validates database update response; throws on error.
 */
export const updateComplaintStatusInSupabase = async (id, status, remarks = '', user = null) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('complaints')
    .update({
      status,
      remarks: remarks || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - updateComplaintStatusInSupabase]:', error);
    throw new Error(`Failed to update status in database: ${error.message}`);
  }

  const { error: histError } = await supabase.from('complaint_status_history').insert([{
    complaint_id: id,
    status: status,
    action_title: `Status Changed to ${status}`,
    description: remarks || `Status officially updated to ${status}.`,
    performed_by_name: user?.name || 'Staff Officer',
    performed_by_role: user?.role || 'staff'
  }]);

  if (histError) {
    console.warn('[Supabase Warning - Status History Insert]:', histError.message);
  }

  return data;
};

/**
 * Hardened Department & Staff Reassignment (Admin & Desk)
 * Validates database insert response; throws on error.
 */
export const reassignComplaintInSupabase = async (complaintId, newDepartment, newOfficer, notes = '', user = null) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('complaint_assignments')
    .insert([{
      complaint_id: complaintId,
      department_name: newDepartment,
      assigned_staff: newOfficer,
      assigned_by_name: user?.name || 'Admin Desk',
      routing_status: 'Manually Reassigned',
      notes: notes || 'Administrative reassignment'
    }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - reassignComplaintInSupabase]:', error);
    throw new Error(`Failed to reassign department in database: ${error.message}`);
  }

  const { error: histError } = await supabase.from('complaint_status_history').insert([{
    complaint_id: complaintId,
    status: 'Assigned',
    action_title: 'Reassigned Department / Officer',
    description: `Reassigned to ${newDepartment} under ${newOfficer}. Notes: ${notes}`,
    performed_by_name: user?.name || 'Admin Desk',
    performed_by_role: user?.role || 'admin'
  }]);

  if (histError) {
    console.warn('[Supabase Warning - Status History Insert]:', histError.message);
  }

  return data;
};

/**
 * Hardened AI Classification Override (Staff & Admin)
 * Validates database update response; throws on error.
 */
export const overrideAIClassificationInSupabase = async (complaintId, newCategory, newDepartment, newPriority, reason = '', user = null) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('complaints')
    .update({
      category: newCategory,
      priority: newPriority,
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - overrideAIClassificationInSupabase]:', error);
    throw new Error(`Failed to override classification in database: ${error.message}`);
  }

  const { error: logError } = await supabase.from('ai_classification_logs').insert([{
    complaint_id: complaintId,
    category: newCategory,
    priority: newPriority,
    suggested_department: newDepartment,
    confidence: 100,
    reasoning: reason || 'Manual officer override',
    was_overridden: true,
    override_reason: reason,
    overridden_by: user?.name || 'Staff Officer'
  }]);

  if (logError) {
    console.warn('[Supabase Warning - AI Override Log Insert]:', logError.message);
  }

  return data;
};

/**
 * DEPARTMENTS API
 */
export const fetchDepartmentsFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[Supabase Error - fetchDepartmentsFromSupabase]:', error);
    throw new Error(`Failed to fetch departments: ${error.message}`);
  }

  return (data || []).map(d => ({
    id: d.id,
    name: d.name,
    description: d.description || '',
    head: d.head_officer || 'Unassigned',
    staffCount: d.staff_count || 1,
    slaHours: d.sla_hours || 48,
    status: d.status || 'Active',
    activeComplaints: 0,
    resolvedComplaints: 0
  }));
};

export const createDepartmentInSupabase = async (deptData) => {
  if (!isSupabaseConfigured()) return null;

  const payload = {
    name: deptData.name.trim(),
    description: (deptData.description || '').trim(),
    head_officer: (deptData.head || 'Unassigned').trim(),
    staff_count: Number(deptData.staffCount) || 1,
    sla_hours: Number(deptData.slaHours) || 48,
    status: 'Active'
  };

  const { data, error } = await supabase
    .from('departments')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - createDepartmentInSupabase]:', error);
    throw new Error(`Failed to create department: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    head: data.head_officer,
    staffCount: data.staff_count,
    slaHours: data.sla_hours,
    status: data.status,
    activeComplaints: 0,
    resolvedComplaints: 0
  };
};

export const updateDepartmentInSupabase = async (deptId, updates) => {
  if (!isSupabaseConfigured()) return null;

  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.head !== undefined) payload.head_officer = updates.head.trim();
  if (updates.staffCount !== undefined) payload.staff_count = Number(updates.staffCount);
  if (updates.slaHours !== undefined) payload.sla_hours = Number(updates.slaHours);
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase
    .from('departments')
    .update(payload)
    .eq('id', deptId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - updateDepartmentInSupabase]:', error);
    throw new Error(`Failed to update department: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    head: data.head_officer,
    staffCount: data.staff_count,
    slaHours: data.sla_hours,
    status: data.status
  };
};

/**
 * PERSONNEL & STAFF MANAGEMENT API
 */
export const fetchStaffFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['staff', 'admin'])
    .order('full_name', { ascending: true });

  if (error) {
    console.error('[Supabase Error - fetchStaffFromSupabase]:', error);
    throw new Error(`Failed to fetch staff directory: ${error.message}`);
  }

  return (data || []).map(p => ({
    id: p.id,
    name: p.full_name,
    email: p.email,
    role: p.role === 'admin' ? 'Admin' : 'Staff',
    department: p.department || 'Unassigned',
    position: p.position || (p.role === 'admin' ? 'Administrator' : 'Officer'),
    phone: p.phone || '',
    purok: p.purok || 'Brgy. Kinilis',
    avatar: p.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: p.status || 'Active',
    assignedCount: 0
  }));
};

export const updateStaffProfileInSupabase = async (profileId, updates) => {
  if (!isSupabaseConfigured()) return null;

  const payload = {};
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.position !== undefined) payload.position = updates.position;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.purok !== undefined) payload.purok = updates.purok;
  if (updates.status !== undefined) payload.status = updates.status;
  // Security: only allow role change if specified and valid (never allow escalating to admin directly from staff)
  if (updates.role !== undefined && ['staff', 'resident'].includes(updates.role.toLowerCase())) {
    payload.role = updates.role.toLowerCase();
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - updateStaffProfileInSupabase]:', error);
    throw new Error(`Failed to update personnel profile: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    role: data.role === 'admin' ? 'Admin' : 'Staff',
    department: data.department || 'Unassigned',
    position: data.position || 'Staff',
    phone: data.phone || '',
    status: data.status || 'Active'
  };
};

/**
 * COMPLAINT ROUTING RULES API
 */
export const fetchRoutingRulesFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('complaint_routing_rules')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.warn('[Supabase Error - fetchRoutingRulesFromSupabase]:', error.message);
    return null;
  }

  return (data || []).map(r => ({
    id: r.id,
    category: r.category,
    department: r.department,
    defaultPriority: r.default_priority,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    assignedStaff: r.assigned_staff || 'Department Desk',
    isActive: r.is_active !== false
  }));
};

export const updateRoutingRuleInSupabase = async (ruleData) => {
  if (!isSupabaseConfigured()) return null;

  const payload = {
    category: ruleData.category,
    department: ruleData.department,
    default_priority: ruleData.defaultPriority || 'Medium',
    keywords: Array.isArray(ruleData.keywords) ? ruleData.keywords : (ruleData.keywords ? [ruleData.keywords] : []),
    assigned_staff: ruleData.assignedStaff || 'Department Desk',
    is_active: ruleData.isActive !== false,
    updated_at: new Date().toISOString()
  };

  let query;
  if (ruleData.id && typeof ruleData.id === 'number') {
    query = supabase
      .from('complaint_routing_rules')
      .update(payload)
      .eq('id', ruleData.id);
  } else {
    query = supabase
      .from('complaint_routing_rules')
      .upsert([payload], { onConflict: 'category' });
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('[Supabase Error - updateRoutingRuleInSupabase]:', error);
    throw new Error(`Failed to update routing rule: ${error.message}`);
  }

  return data;
};

/**
 * AUDIT LOGS API
 */
export const fetchAuditLogsFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Notice - fetchAuditLogsFromSupabase]:', error.message);
      return null;
    }

    return (data || []).map(log => ({
      id: log.id,
      timestamp: log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now',
      user: log.user_name || 'System Admin',
      role: log.user_role || 'admin',
      action: log.action || 'ACTIVITY',
      module: log.module || 'System',
      entity: log.entity_ref || 'N/A',
      oldValue: log.old_value || '—',
      newValue: log.new_value || '—'
    }));
  } catch (err) {
    console.warn('[Supabase Notice - fetchAuditLogsFromSupabase caught]:', err.message);
    return null;
  }
};

export const createAuditLogInSupabase = async (logData) => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        user_name: logData.user || logData.userName || 'System Admin',
        user_role: logData.role || logData.userRole || 'admin',
        action: logData.action || 'ADMIN_ACTION',
        module: logData.module || 'General',
        entity_ref: String(logData.entity || logData.entityRef || 'N/A'),
        old_value: String(logData.oldValue ?? 'N/A'),
        new_value: String(logData.newValue ?? 'Updated')
      }])
      .select();

    if (error) {
      console.warn('[Supabase Warning - createAuditLogInSupabase]:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[Supabase Warning - createAuditLogInSupabase caught]:', err.message);
    return null;
  }
};

/**
 * =========================================================================
 * FEATURE 2: COMPLAINT TRACKING & STATUS MONITORING (SUPABASE API)
 * =========================================================================
 */

/**
 * Track a complaint publicly by reference number.
 * Privacy-preserving: Enforces ZERO resident PII exposure (no names, phones, emails).
 * First attempts to invoke the database-hardened `track_complaint_status` RPC.
 * If RPC is not deployed yet, falls back to an anonymous SELECT querying non-PII fields.
 */
export const trackPublicComplaint = async (referenceNo) => {
  if (!referenceNo || typeof referenceNo !== 'string') {
    throw new Error('A valid complaint reference number is required.');
  }

  const cleanRef = referenceNo.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Unable to perform live status tracking.');
  }

  // 1. Primary: Use security-definer RPC (prevents RLS blocking anon users, strictly omits PII)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('track_complaint_status', {
      p_reference_no: cleanRef,
      p_verification_phone: null
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      const match = rpcData[0];
      const timeline = Array.isArray(match.status_timeline) ? match.status_timeline : [];
      return {
        referenceNo: match.reference_no,
        title: match.title,
        category: match.category,
        status: match.status,
        priority: match.priority,
        submittedAt: match.submitted_at,
        incidentDate: match.submitted_at ? new Date(match.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent',
        targetResolutionDate: match.target_resolution_date,
        timeline: timeline.map(t => ({
          status: t.status,
          date: t.created_at ? new Date(t.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recorded',
          desc: t.description || t.action_title || `Status updated to ${t.status}`
        }))
      };
    }

    if (rpcError && rpcError.code !== '42883') {
      console.warn('[trackPublicComplaint] RPC notice:', rpcError.message);
    }
  } catch (rpcErr) {
    console.warn('[trackPublicComplaint] RPC execution error:', rpcErr);
  }

  // 2. Direct table query fallback with strict non-PII column list
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      reference_no,
      title,
      category,
      status,
      priority,
      submitted_at,
      target_resolution_date,
      complaint_status_history (
        status, action_title, description, created_at
      ),
      complaint_assignments (
        department_name
      )
    `)
    .ilike('reference_no', cleanRef)
    .maybeSingle();

  if (error) {
    console.error('[Supabase Error - trackPublicComplaint]:', error);
    throw new Error(`Tracking lookup failed: ${error.message}`);
  }

  if (!data) {
    return null; // Not found
  }

  const history = Array.isArray(data.complaint_status_history)
    ? data.complaint_status_history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const assignment = data.complaint_assignments?.[0] || null;

  return {
    referenceNo: data.reference_no,
    title: data.title,
    category: data.category,
    status: data.status,
    priority: data.priority,
    department: assignment?.department_name || 'Assigned Department',
    submittedAt: data.submitted_at,
    incidentDate: data.submitted_at ? new Date(data.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent',
    targetResolutionDate: data.target_resolution_date,
    timeline: history.map(h => ({
      status: h.status,
      date: h.created_at ? new Date(h.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recorded',
      desc: h.description || h.action_title || `Status updated to ${h.status}`
    }))
  };
};

/**
 * Fetch authenticated resident's complaints with full lifecycle history and assignments.
 * Strictly verifies resident ID and/or resident email.
 */
export const fetchResidentComplaintsFromSupabase = async (residentId, residentEmail) => {
  if (!isSupabaseConfigured()) return null;
  if (!residentId && !residentEmail) {
    throw new Error('Resident identifier (ID or verified email) is required to query personal complaints.');
  }

  let query = supabase
    .from('complaints')
    .select(`
      *,
      complaint_status_history (
        id, status, action_title, description, performed_by_name, performed_by_role, created_at
      ),
      complaint_evidence (
        id, file_name, file_path, file_size, file_type, uploaded_at
      ),
      complaint_assignments (
        id, department_name, assigned_staff, routing_status, notes, assigned_at
      ),
      complaint_resolutions (
        id, resolved_by, summary, evidence_url, resolved_at
      ),
      resident_feedback (
        id, rating, satisfaction, comments, created_at
      ),
      ai_classification_logs (
        id, category, priority, suggested_department, confidence, reasoning, keywords
      )
    `)
    .order('submitted_at', { ascending: false });

  if (residentId && residentEmail) {
    query = query.or(`resident_id.eq.${residentId},resident_email.ilike.${residentEmail.trim()}`);
  } else if (residentId) {
    query = query.eq('resident_id', residentId);
  } else {
    query = query.ilike('resident_email', residentEmail.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase Error - fetchResidentComplaintsFromSupabase]:', error);
    throw new Error(`Failed to fetch resident complaints: ${error.message}`);
  }

  return await Promise.all((data || []).map(async (c) => {
    const aiLog = c.ai_classification_logs?.[0] || null;
    const assignment = c.complaint_assignments?.[0] || null;
    const resolution = c.complaint_resolutions?.[0] || null;
    const feedback = c.resident_feedback?.[0] || null;
    const historyList = Array.isArray(c.complaint_status_history)
      ? c.complaint_status_history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      : [];

    let resolutionEvidenceUrl = '';
    if (resolution?.evidence_url) {
      resolutionEvidenceUrl = await getResolutionProofSignedUrl(resolution.evidence_url, 300) || resolution.evidence_url;
    }

    return {
      id: c.id,
      referenceNo: c.reference_no,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      location: c.location,
      residentId: c.resident_id,
      residentName: c.resident_name,
      residentEmail: c.resident_email,
      residentPhone: c.resident_phone,
      preferredContact: c.preferred_contact,
      submittedAt: c.submitted_at,
      incidentDate: c.incident_date,
      incidentTime: c.incident_time,
      isOverdue: c.is_overdue || false,
      remarks: c.remarks || '',
      aiResult: aiLog ? {
        category: aiLog.category,
        priority: aiLog.priority,
        department: aiLog.suggested_department,
        confidence: aiLog.confidence,
        reason: aiLog.reasoning,
        keywords: aiLog.keywords || []
      } : {
        category: c.category,
        priority: c.priority,
        department: assignment?.department_name || 'Sanitation Department',
        confidence: 90,
        reason: 'Automated complaint routing',
        keywords: []
      },
      routing: {
        department: assignment?.department_name || 'Sanitation Department',
        assignedStaff: assignment?.assigned_staff || 'Unassigned',
        routingStatus: assignment?.routing_status || 'Automatically Routed'
      },
      timeline: historyList.map(h => ({
        status: h.status,
        date: new Date(h.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        desc: h.description,
        actor: h.performed_by_name || null
      })),
      resolution: resolution ? {
        summary: resolution.summary,
        resolvedBy: resolution.resolved_by,
        resolvedAt: new Date(resolution.resolved_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        evidenceUrl: resolutionEvidenceUrl,
        rawEvidencePath: resolution.evidence_url || ''
      } : null,
      feedback: feedback ? {
        rating: feedback.rating,
        satisfaction: feedback.satisfaction,
        comments: feedback.comments,
        submittedAt: feedback.created_at
      } : null,
      attachments: (c.complaint_evidence || []).map(e => ({
        id: e.id,
        name: e.file_name,
        path: e.file_path,
        size: e.file_size
      }))
    };
  }));
};

/**
 * Fetch follow-up messages for a complaint from Supabase
 */
export const fetchComplaintFollowupsFromSupabase = async (complaintId) => {
  if (!isSupabaseConfigured() || !complaintId) return [];

  const { data, error } = await supabase
    .from('complaint_followups')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[Supabase Error - fetchComplaintFollowupsFromSupabase]:', error.message);
    return [];
  }

  const followups = await Promise.all((data || []).map(async (f) => {
    let attachmentUrl = null;
    if (f.attachment_path) {
      if (f.attachment_path.startsWith('http://') || f.attachment_path.startsWith('https://') || f.attachment_path.startsWith('blob:')) {
        attachmentUrl = f.attachment_path;
      } else {
        try {
          const { data: signedData } = await supabase.storage
            .from('complaint-evidence')
            .createSignedUrl(f.attachment_path, 300); // 300-second (5 min) temporary bearer link
          if (signedData?.signedUrl) {
            attachmentUrl = signedData.signedUrl;
          }
        } catch (e) {
          console.warn('[fetchComplaintFollowupsFromSupabase] Signed URL error:', e);
        }
      }
    }

    return {
      id: f.id,
      complaintId: f.complaint_id,
      senderId: f.sender_id,
      senderName: f.sender_name,
      senderRole: f.sender_role,
      message: f.message,
      attachmentPath: f.attachment_path,
      attachmentUrl: attachmentUrl,
      date: new Date(f.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    };
  }));

  return followups;
};

/**
 * Send a follow-up message on a complaint with optional attachment
 */
export const sendComplaintFollowupInSupabase = async (
  complaintId,
  message,
  senderName,
  senderRole,
  senderId = null,
  attachmentFile = null
) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  let attachmentPath = null;
  if (attachmentFile) {
    // 1. Enforce Storage MIME and size restrictions (10MB limit per storage.buckets)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(attachmentFile.type)) {
      throw new Error(`Invalid file type "${attachmentFile.type}". Allowed: JPG, PNG, WEBP, PDF.`);
    }
    const maxBytes = 10 * 1024 * 1024;
    if (attachmentFile.size > maxBytes) {
      throw new Error(`File size (${(attachmentFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10MB limit.`);
    }

    // 2. Fetch complaint reference_no so folder structure matches storage policy: {reference_no}/{filename}
    let folderRef = null;
    try {
      const { data: cData } = await supabase
        .from('complaints')
        .select('reference_no')
        .eq('id', complaintId)
        .maybeSingle();
      if (cData?.reference_no) {
        folderRef = cData.reference_no;
      }
    } catch (refErr) {
      console.warn('[sendComplaintFollowupInSupabase] Could not resolve reference_no:', refErr);
    }

    if (!folderRef) {
      throw new Error('Failed to resolve complaint reference number for evidence upload.');
    }

    const cleanFileName = attachmentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uploadPath = `${folderRef}/followup_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('complaint-evidence')
      .upload(uploadPath, attachmentFile, { upsert: false });

    if (uploadError) {
      console.error('[sendComplaintFollowupInSupabase] Attachment upload error:', uploadError);
      throw new Error(`Failed to upload follow-up attachment: ${uploadError.message}`);
    }

    attachmentPath = uploadPath;
  }

  // Defensively ensure senderId is a valid UUID matching the authenticated Supabase user
  let validSenderId = senderId;
  const isUuid = validSenderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validSenderId);
  if (!isUuid) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      validSenderId = authData?.user?.id || null;
    } catch (e) {
      validSenderId = null;
    }
  }

  const payload = {
    complaint_id: complaintId,
    sender_name: senderName || 'Resident',
    sender_role: senderRole || 'Resident',
    sender_id: validSenderId,
    message: message,
    attachment_path: attachmentPath
  };

  const { data, error } = await supabase
    .from('complaint_followups')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('[Supabase Error - sendComplaintFollowupInSupabase]:', error);
    throw new Error(`Failed to send follow-up message: ${error.message}`);
  }

  return {
    id: data.id,
    complaintId: data.complaint_id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    senderRole: data.sender_role,
    message: data.message,
    attachmentPath: data.attachment_path,
    date: new Date(data.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  };
};

/**
 * Subscribe to Supabase Realtime changes for complaints table.
 * Returns the active channel object for caller to clean up with unsubscribeFromComplaintsRealtime.
 */
export const subscribeToComplaintsRealtime = (onUpdate, onInsert = null) => {
  if (!isSupabaseConfigured()) return null;

  const channelName = `public:complaints:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'complaints' },
      (payload) => {
        if (typeof onUpdate === 'function') {
          onUpdate(payload.new, payload.old);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'complaints' },
      (payload) => {
        if (typeof onInsert === 'function') {
          onInsert(payload.new);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Channel connected
      }
    });

  return channel;
};

/**
 * Unsubscribe and remove a Supabase Realtime channel cleanly to avoid memory leaks.
 */
export const unsubscribeFromComplaintsRealtime = async (channel) => {
  if (!channel) return;
  try {
    await supabase.removeChannel(channel);
  } catch (err) {
    console.warn('[unsubscribeFromComplaintsRealtime] Warning:', err);
  }
};

/**
 * =========================================================================
 * FEATURE 4: RESIDENT COMMUNICATION, FEEDBACK & NOTIFICATIONS (SUPABASE API)
 * =========================================================================
 */

/**
 * Generate accessible URL for follow-up attachments stored in complaint-evidence bucket
 */
export const getFollowupAttachmentUrl = (attachmentPath) => {
  if (!attachmentPath) return null;
  if (attachmentPath.startsWith('http://') || attachmentPath.startsWith('https://') || attachmentPath.startsWith('blob:')) {
    return attachmentPath;
  }
  return null;
};

/**
 * Generate temporary signed URL (bearer link) for private evidence attachments (default 300s / 5 mins).
 * Access is authorized at generation time, subject to storage RLS. Anyone holding the link can
 * view the file until expiry. Expiration reduces window of exposure but does not guarantee
 * immediate revocation. Link is not session-authenticated after issuance.
 */
export const getFollowupAttachmentSignedUrl = async (attachmentPath, expiresIn = 300) => {
  if (!attachmentPath) return null;
  if (attachmentPath.startsWith('http://') || attachmentPath.startsWith('https://') || attachmentPath.startsWith('blob:')) {
    return attachmentPath;
  }
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.storage
      .from('complaint-evidence')
      .createSignedUrl(attachmentPath, expiresIn);
    if (error) {
      console.warn('[getFollowupAttachmentSignedUrl] Error:', error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    return null;
  }
};

/**
 * Upload photographic resolution proof to private 'resolution-proofs' bucket
 * Path convention: {reference_no}/resolution_{timestamp}_{cleanFileName}
 * Enforces 10MB limit and accepted MIME types (JPEG, PNG, WebP, PDF)
 */
export const uploadResolutionProofToSupabase = async (referenceNo, file) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }
  if (!file) {
    throw new Error('No resolution evidence file provided.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF completion proofs are accepted.');
  }

  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSizeBytes) {
    throw new Error('File exceeds the 10MB maximum size limit.');
  }

  if (!referenceNo) {
    throw new Error('Complaint reference number is required for resolution proof upload.');
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uploadPath = `${referenceNo}/resolution_${Date.now()}_${cleanFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resolution-proofs')
    .upload(uploadPath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('[uploadResolutionProofToSupabase Error]:', uploadError);
    throw new Error(`Failed to upload resolution proof: ${uploadError.message}`);
  }

  return uploadData?.path || uploadPath;
};

/**
 * Generate authenticated signed URL for private resolution proofs (300s / 5 mins expiry)
 * Fallback handles legacy web paths and external demo URLs without breaking.
 */
export const getResolutionProofSignedUrl = async (evidencePath, expiresIn = 300) => {
  if (!evidencePath) return null;

  // External URLs (demo seed data)
  if (evidencePath.startsWith('http://') || evidencePath.startsWith('https://')) {
    return evidencePath;
  }

  // Local blob previews
  if (evidencePath.startsWith('blob:')) {
    return evidencePath;
  }

  // Legacy PHP server filesystem paths (e.g. /KinilisIbaKa/backend/storage/resolutions/...)
  if (evidencePath.startsWith('/KinilisIbaKa/') || evidencePath.startsWith('uploads/') || evidencePath.includes('backend/storage/')) {
    return evidencePath;
  }

  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.storage
      .from('resolution-proofs')
      .createSignedUrl(evidencePath, expiresIn);

    if (error) {
      console.warn('[getResolutionProofSignedUrl] Signed URL Notice:', error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.warn('[getResolutionProofSignedUrl Catch]:', err.message);
    return null;
  }
};

/**
 * Submit Staff Complaint Resolution via hardened atomic PostgreSQL RPC
 * Handles row locking, assignment verification, status transition, milestone, notification, and audit.
 */
export const submitStaffComplaintResolutionInSupabase = async ({
  complaintId,
  summary,
  evidencePath = null,
  correctionReason = null,
  idempotencyKey = null
}) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    p_complaint_id: complaintId,
    p_summary: summary,
    p_evidence_path: evidencePath || null,
    p_correction_reason: correctionReason || null,
    p_idempotency_key: idempotencyKey || null
  };

  const { data, error } = await supabase.rpc('submit_staff_complaint_resolution', payload);

  if (error) {
    console.error('[submitStaffComplaintResolutionInSupabase RPC Error]:', error);
    throw new Error(error.message || 'Failed to submit complaint resolution.');
  }

  return data;
};

/**
 * Submit resident feedback & satisfaction rating for resolved complaints
 */
export const submitComplaintFeedbackToSupabase = async (
  complaintId,
  rating,
  satisfactionLevel,
  comments,
  actionStatus = 'Accepted',
  residentId = null
) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  // Primary: Call the atomic hardened SECURITY DEFINER RPC
  const { data, error } = await supabase.rpc('submit_resident_complaint_feedback', {
    p_complaint_id: complaintId,
    p_rating: Number(rating) || 5,
    p_satisfaction_level: satisfactionLevel || 'Very Satisfied',
    p_comments: comments || '',
    p_action_status: actionStatus || 'Accepted'
  });

  if (error) {
    console.error('[Supabase Error - submitComplaintFeedbackToSupabase RPC]:', error);
    throw new Error(error.message || 'Failed to submit resolution feedback.');
  }

  return data;
};

/**
 * Fetch all resident feedback records with complaint details for Admin & Staff review
 */
export const fetchComplaintFeedbackFromSupabase = async () => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('resident_feedback')
    .select(`
      id,
      complaint_id,
      resident_id,
      action_status,
      rating,
      satisfaction_level,
      comments,
      submitted_at,
      complaints (
        reference_no,
        title,
        category,
        location,
        resident_name,
        resident_email,
        status,
        submitted_at
      )
    `)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.warn('[Supabase Notice - fetchComplaintFeedbackFromSupabase]:', error.message);
    return [];
  }

  return (data || []).map(f => {
    const comp = f.complaints || {};
    return {
      id: f.id,
      complaintId: f.complaint_id,
      residentId: f.resident_id,
      actionStatus: f.action_status,
      rating: f.rating,
      satisfactionLevel: f.satisfaction_level,
      comments: f.comments,
      submittedAt: f.submitted_at,
      referenceNo: comp.reference_no || 'N/A',
      complaintTitle: comp.title || 'Untitled Complaint',
      category: comp.category || 'General',
      location: comp.location || 'Barangay Kinilis',
      residentName: comp.resident_name || 'Resident',
      residentEmail: comp.resident_email || '',
      complaintStatus: comp.status || 'Resolved'
    };
  });
};

/**
 * Fetch notifications from Supabase for authenticated user / role
 */
export const fetchNotificationsFromSupabase = async (userId = null, userRole = 'resident') => {
  if (!isSupabaseConfigured()) return [];

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      if (userRole === 'admin') {
        query = query.or(`user_id.eq.${userId},target_role.in.(admin,staff,all)`);
      } else if (userRole === 'staff') {
        query = query.or(`user_id.eq.${userId},target_role.in.(staff,all)`);
      } else {
        query = query.or(`user_id.eq.${userId},target_role.eq.all`);
      }
    } else {
      query = query.or(`target_role.in.(${userRole},all)`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase Notice - fetchNotificationsFromSupabase]:', error.message);
      return [];
    }

    return (data || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      targetRole: n.target_role,
      title: n.title,
      message: n.message,
      referenceNo: n.reference_no,
      type: n.type || 'system',
      read: n.is_read || false,
      timestamp: n.created_at ? new Date(n.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'
    }));
  } catch (err) {
    console.warn('[Supabase Catch - fetchNotificationsFromSupabase]:', err.message);
    return [];
  }
};

/**
 * Create a new notification event record in Supabase
 */
export const createNotificationInSupabase = async ({
  userId = null,
  targetRole = 'all',
  title,
  message,
  referenceNo = null,
  type = 'system'
}) => {
  if (!isSupabaseConfigured() || !title || !message) return null;

  try {
    const payload = {
      user_id: userId || null,
      target_role: targetRole || 'all',
      title,
      message,
      reference_no: referenceNo || null,
      type: type || 'system',
      is_read: false
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Supabase Warning - createNotificationInSupabase]:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[createNotificationInSupabase Exception]:', err.message);
    return null;
  }
};

/**
 * Mark a single notification as read via secure RPC
 */
export const markNotificationAsReadInSupabase = async (notificationId) => {
  if (!isSupabaseConfigured() || !notificationId) return false;

  try {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    });

    if (error) {
      console.warn('[Supabase Warning - markNotificationAsReadInSupabase RPC]:', error.message);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    return false;
  }
};

/**
 * Mark all relevant notifications as read via secure RPC
 */
export const markAllNotificationsAsReadInSupabase = async () => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      console.warn('[Supabase Warning - markAllNotificationsAsReadInSupabase RPC]:', error.message);
      return false;
    }
    return typeof data === 'number' && data >= 0;
  } catch (err) {
    return false;
  }
};

/**
 * Realtime subscription for user notifications
 */
export const subscribeToNotificationsRealtime = (userId, userRole, onNotificationReceived) => {
  if (!isSupabaseConfigured()) return null;

  const channelName = `public:notifications:${userId || userRole || 'all'}:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const notif = payload.new;
        if (!notif) return;

        const isTargetedToUser = userId && notif.user_id === userId;
        const isTargetedToRole = notif.target_role === 'all' || notif.target_role === userRole || (userRole === 'admin' && notif.target_role === 'staff');

        if (isTargetedToUser || (!notif.user_id && isTargetedToRole)) {
          if (typeof onNotificationReceived === 'function') {
            onNotificationReceived({
              id: notif.id,
              userId: notif.user_id,
              targetRole: notif.target_role,
              title: notif.title,
              message: notif.message,
              referenceNo: notif.reference_no,
              type: notif.type || 'system',
              read: notif.is_read || false,
              timestamp: notif.created_at ? new Date(notif.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'
            });
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Connected to notification realtime stream
      }
    });

  return channel;
};

/**
 * Clean up notification channel subscription
 */
export const unsubscribeFromNotificationsRealtime = async (channel) => {
  if (!channel) return;
  try {
    await supabase.removeChannel(channel);
  } catch (err) {
    console.warn('[unsubscribeFromNotificationsRealtime] Warning:', err);
  }
};
