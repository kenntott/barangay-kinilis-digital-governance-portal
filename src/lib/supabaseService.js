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
    // 1. Test Select from departments table
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

    // 2. Test Select from complaints table
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
 * DEPARTMENTS API
 */
export const fetchDepartmentsFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase API Error - Fetch Departments]:', error);
    throw error;
  }

  return data;
};

export const createDepartmentInSupabase = async (deptData) => {
  if (!isSupabaseConfigured()) return null;

  const payload = {
    name: deptData.name,
    description: deptData.description || '',
    head_officer: deptData.head || 'Unassigned',
    staff_count: Number(deptData.staffCount) || 1,
    status: 'Active'
  };

  const { data, error } = await supabase
    .from('departments')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('[Supabase API Error - Create Department]:', error);
    throw error;
  }

  return data;
};

/**
 * COMPLAINTS API
 */
export const fetchComplaintsFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('[Supabase API Error - Fetch Complaints]:', error);
    throw error;
  }

  return data;
};

export const createComplaintInSupabase = async (complaintData, aiResult) => {
  if (!isSupabaseConfigured()) return null;

  // Insert Complaint Record
  const { data: insertedCmp, error: cmpError } = await supabase
    .from('complaints')
    .insert([{
      reference_no: complaintData.referenceNo,
      title: complaintData.title,
      description: complaintData.description,
      category: aiResult.category,
      priority: aiResult.priority,
      status: 'Pending',
      location: complaintData.location || 'Barangay Kinilis',
      resident_name: complaintData.residentName || 'Resident',
      resident_email: complaintData.residentEmail || '',
      resident_phone: complaintData.residentPhone || '',
      preferred_contact: complaintData.preferredContact || 'Phone'
    }])
    .select()
    .single();

  if (cmpError) {
    console.error('[Supabase API Error - Create Complaint]:', cmpError);
    throw cmpError;
  }

  // Insert AI Result Record
  if (insertedCmp && aiResult) {
    await supabase.from('ai_classification_results').insert([{
      complaint_id: insertedCmp.id,
      category: aiResult.category,
      priority: aiResult.priority,
      suggested_department: aiResult.department,
      confidence: aiResult.confidence,
      reasoning: aiResult.reason,
      keywords: aiResult.keywords
    }]);

    // Insert Routing Record
    await supabase.from('complaint_routing').insert([{
      complaint_id: insertedCmp.id,
      department_name: aiResult.department,
      assigned_staff: aiResult.assignedStaff,
      routing_status: 'Automatically Routed'
    }]);
  }

  return insertedCmp;
};

export const updateComplaintStatusInSupabase = async (id, status) => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('complaints')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase API Error - Update Complaint Status]:', error);
    throw error;
  }

  return data;
};

/**
 * AUDIT LOGS API
 */
export const fetchAuditLogsFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('[Supabase API Error - Fetch Audit Logs]:', error);
    throw error;
  }

  return data;
};

export const createAuditLogInSupabase = async (logData) => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('audit_logs')
    .insert([{
      user_name: logData.user,
      action: logData.action,
      module: logData.module,
      entity_ref: logData.entity,
      old_value: String(logData.oldValue || 'N/A'),
      new_value: String(logData.newValue || 'Updated')
    }])
    .select();

  if (error) {
    console.error('[Supabase API Error - Create Audit Log]:', error);
    // Don't throw for non-critical audit log failures
  }

  return data;
};
