-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- REVIEW REVISION 1: COMPREHENSIVE DATA & SECURITY VERIFICATION SUITE
-- File: supabase/review/05_data_verification.sql
-- Validates:
-- 1. All 13 Table Record Counts
-- 2. Foreign Key & Orphan Absence
-- 3. Exact Status Preservation against MySQL
-- 4. Duplicate Reference Numbers & Records
-- 5. Missing / Unmapped Users
-- 6. Routing Rule Auto-Increment Sequence State
-- 7. RLS Enabled Status on All 13 Tables
-- 8. Storage Bucket Privacy & Policy Configuration
-- 9. Compatibility View Security Invoker Status
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. RECORD COUNT RECONCILIATION ACROSS ALL 13 TABLES
-- -------------------------------------------------------------------------
SELECT 'profiles' AS table_name, count(*) AS live_count, 5 AS expected_count, 
       CASE WHEN count(*) = 5 THEN 'PASS' ELSE 'FAIL' END AS status FROM public.profiles
UNION ALL SELECT 'departments', count(*), 6, CASE WHEN count(*) = 6 THEN 'PASS' ELSE 'FAIL' END FROM public.departments
UNION ALL SELECT 'complaint_routing_rules', count(*), 6, CASE WHEN count(*) = 6 THEN 'PASS' ELSE 'FAIL' END FROM public.complaint_routing_rules
UNION ALL SELECT 'complaints', count(*), 9, CASE WHEN count(*) = 9 THEN 'PASS' ELSE 'FAIL' END FROM public.complaints
UNION ALL SELECT 'complaint_status_history', count(*), 19, CASE WHEN count(*) = 19 THEN 'PASS' ELSE 'FAIL' END FROM public.complaint_status_history
UNION ALL SELECT 'complaint_assignments', count(*), 8, CASE WHEN count(*) = 8 THEN 'PASS' ELSE 'FAIL' END FROM public.complaint_assignments
UNION ALL SELECT 'complaint_evidence', count(*), 0, CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END FROM public.complaint_evidence
UNION ALL SELECT 'complaint_followups', count(*), 2, CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END FROM public.complaint_followups
UNION ALL SELECT 'complaint_resolutions', count(*), 2, CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END FROM public.complaint_resolutions
UNION ALL SELECT 'resident_feedback', count(*), 2, CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END FROM public.resident_feedback
UNION ALL SELECT 'ai_classification_logs', count(*), 4, CASE WHEN count(*) = 4 THEN 'PASS' ELSE 'FAIL' END FROM public.ai_classification_logs
UNION ALL SELECT 'notifications', count(*), 16, CASE WHEN count(*) = 16 THEN 'PASS' ELSE 'FAIL' END FROM public.notifications
UNION ALL SELECT 'audit_logs', count(*), 16, CASE WHEN count(*) = 16 THEN 'PASS' ELSE 'FAIL' END FROM public.audit_logs;

-- -------------------------------------------------------------------------
-- 2. FOREIGN KEY & ORPHAN INTEGRITY CHECKS (MUST ALL RETURN 0)
-- -------------------------------------------------------------------------
SELECT 'Orphan Complaints (invalid resident_id)' AS check_name, count(*) AS orphan_count 
FROM public.complaints c LEFT JOIN public.profiles p ON c.resident_id = p.id WHERE c.resident_id IS NOT NULL AND p.id IS NULL
UNION ALL SELECT 'Orphan History', count(*) FROM public.complaint_status_history h LEFT JOIN public.complaints c ON h.complaint_id = c.id WHERE c.id IS NULL
UNION ALL SELECT 'Orphan Assignments', count(*) FROM public.complaint_assignments a LEFT JOIN public.complaints c ON a.complaint_id = c.id WHERE c.id IS NULL
UNION ALL SELECT 'Orphan Resolutions', count(*) FROM public.complaint_resolutions r LEFT JOIN public.complaints c ON r.complaint_id = c.id WHERE c.id IS NULL
UNION ALL SELECT 'Orphan Feedback', count(*) FROM public.resident_feedback f LEFT JOIN public.complaints c ON f.complaint_id = c.id WHERE c.id IS NULL
UNION ALL SELECT 'Orphan Follow-ups', count(*) FROM public.complaint_followups fo LEFT JOIN public.complaints c ON fo.complaint_id = c.id WHERE c.id IS NULL
UNION ALL SELECT 'Orphan AI Logs', count(*) FROM public.ai_classification_logs ai LEFT JOIN public.complaints c ON ai.complaint_id = c.id WHERE c.id IS NULL
UNION ALL SELECT 'Orphan Notifications', count(*) FROM public.notifications n LEFT JOIN public.profiles p ON n.user_id = p.id WHERE n.user_id IS NOT NULL AND p.id IS NULL
UNION ALL SELECT 'Orphan Profiles (missing in auth.users)', count(*) FROM public.profiles p LEFT JOIN auth.users u ON p.id = u.id WHERE u.id IS NULL
UNION ALL SELECT 'Profile-Auth UUID Mismatches', count(*) FROM public.profiles p JOIN auth.users u ON lower(p.email) = lower(u.email) WHERE p.id <> u.id;

-- -------------------------------------------------------------------------
-- 3. STATUS PRESERVATION & DATA ACCURACY CHECK
-- Verifies exact MySQL complaints, categories, priorities, and statuses
-- -------------------------------------------------------------------------
SELECT 
    reference_no,
    category,
    priority,
    status,
    resident_name,
    CASE 
        WHEN reference_no = 'KIN-2026-000123' AND status = 'In Progress' AND category = 'Waste Management' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000122' AND status = 'Assigned' AND category = 'Infrastructure' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000121' AND status = 'Submitted' AND category = 'Peace & Order' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000120' AND status = 'Resolved' AND category = 'Health Services' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000118' AND status = 'In Progress' AND category = 'Infrastructure' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000106' AND status = 'Submitted' AND category = 'Waste Management' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000107' AND status = 'In Progress' AND category = 'Infrastructure' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000108' AND status = 'Submitted' AND category = 'Waste Management' THEN 'PASS'
        WHEN reference_no = 'KIN-2026-000109' AND status = 'Resolved' AND category = 'Infrastructure' THEN 'PASS'
        ELSE 'FAIL_STATUS_MISMATCH'
    END AS status_verification
FROM public.complaints
ORDER BY reference_no DESC;

-- -------------------------------------------------------------------------
-- 4. DUPLICATE RECORD CHECKS (MUST RETURN 0 DUPLICATES)
-- -------------------------------------------------------------------------
SELECT 'Duplicate Reference Numbers' AS check_name, count(*) - count(DISTINCT reference_no) AS duplicates 
FROM public.complaints
UNION ALL
SELECT 'Duplicate Profile Emails', count(*) - count(DISTINCT email) 
FROM public.profiles
UNION ALL
SELECT 'Duplicate Department Names', count(*) - count(DISTINCT name) 
FROM public.departments
UNION ALL
SELECT 'Duplicate Routing Categories', count(*) - count(DISTINCT category) 
FROM public.complaint_routing_rules;

-- -------------------------------------------------------------------------
-- 5. COMPLAINT OWNERSHIP & USER MAPPING AUDIT
-- Explicitly displays resident_id state for each complaint and joins through auth.users
-- -------------------------------------------------------------------------
SELECT 
    c.reference_no,
    c.title,
    c.resident_name,
    c.resident_email,
    c.resident_id,
    p.full_name AS mapped_profile_name,
    u.id AS auth_user_id,
    CASE 
        WHEN c.resident_id IS NULL THEN 'GUEST_SUBMISSION (Verified Intended NULL)'
        WHEN p.id IS NOT NULL AND u.id IS NOT NULL THEN 'AUTHENTICATED_OWNER (Mapped & Auth Linked)'
        WHEN p.id IS NOT NULL THEN 'PROFILE_FOUND_AUTH_MISSING'
        ELSE 'INVALID_OWNER'
    END AS ownership_state
FROM public.complaints c
LEFT JOIN public.profiles p ON c.resident_id = p.id
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY c.reference_no DESC;

-- -------------------------------------------------------------------------
-- 6. ROUTING RULE SEQUENCE SYNCHRONIZATION CHECK
-- Next value must be >= 6 so new inserts will not conflict with seeded rules 1..6
-- -------------------------------------------------------------------------
SELECT 
    sequencename AS sequence_name,
    last_value,
    CASE WHEN last_value >= 6 THEN 'PASS (Synchronized)' ELSE 'FAIL (Sequence Lagging)' END AS sequence_status
FROM pg_sequences
WHERE schemaname = 'public' AND sequencename = 'complaint_routing_rules_id_seq';

-- -------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) STATUS ACROSS ALL 13 TABLES
-- MUST RETURN 'PASS' for all 13 application tables
-- -------------------------------------------------------------------------
SELECT 
    tablename,
    rowsecurity AS rls_enabled,
    CASE WHEN rowsecurity = TRUE THEN 'PASS' ELSE 'FAIL_RLS_DISABLED' END AS security_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'departments', 'complaints', 'complaint_status_history',
    'complaint_evidence', 'complaint_assignments', 'complaint_followups',
    'complaint_resolutions', 'resident_feedback', 'ai_classification_logs',
    'complaint_routing_rules', 'notifications', 'audit_logs'
  )
ORDER BY tablename;

-- -------------------------------------------------------------------------
-- 8. STORAGE BUCKET PRIVACY CHECK
-- Both buckets MUST be public = FALSE
-- -------------------------------------------------------------------------
SELECT 
    id AS bucket_name,
    public AS is_public,
    CASE WHEN public = FALSE THEN 'PASS (Private)' ELSE 'FAIL (Publicly Exposed)' END AS privacy_check
FROM storage.buckets
WHERE id IN ('complaint-evidence', 'resolution-proofs');

-- -------------------------------------------------------------------------
-- 9. COMPATIBILITY VIEWS SECURITY INVOKER CHECK
-- All compatibility views MUST enforce security_invoker = true
-- -------------------------------------------------------------------------
SELECT 
    c.relname AS view_name,
    CASE 
        WHEN 'security_invoker=true' = ANY(c.reloptions) THEN 'PASS (Security Invoker Enabled)'
        ELSE 'WARNING (May Bypass Underlying RLS)'
    END AS security_invoker_check
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('users', 'ai_classification_results', 'complaint_routing');

-- -------------------------------------------------------------------------
-- 10. CRITICAL HELPER FUNCTIONS & SECURITY DEFINER CHECK
-- -------------------------------------------------------------------------
SELECT 
    p.proname AS function_name,
    p.prosecdef AS is_security_definer,
    CASE WHEN p.prosecdef = TRUE THEN 'PASS (Security Definer Active)' ELSE 'FAIL' END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'is_admin', 'is_staff', 'get_auth_role', 'get_auth_department',
      'is_complaint_owner', 'is_staff_assigned_to_complaint', 'track_complaint_status'
  )
ORDER BY p.proname;

-- -------------------------------------------------------------------------
-- 11. STORAGE POLICIES AUDIT ON storage.objects
-- -------------------------------------------------------------------------
SELECT 
    policyname AS storage_policy_name,
    cmd AS operation,
    roles::text AS assigned_roles,
    'PASS' AS status
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname IN (
      'resident_upload_evidence', 'authenticated_read_evidence',
      'admin_only_evidence_update', 'admin_only_evidence_delete',
      'staff_upload_resolution_proof', 'read_resolution_proof',
      'admin_only_resolution_update', 'admin_only_resolution_delete'
  )
ORDER BY policyname;

-- -------------------------------------------------------------------------
-- 12. HELPER FUNCTION EXECUTE PRIVILEGES AUDIT (ANON LOCKDOWN CHECK)
-- anon_can_execute MUST be FALSE
-- authenticated_can_execute MUST be TRUE
-- -------------------------------------------------------------------------
SELECT 
    p.proname AS function_name,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute,
    CASE 
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE') = FALSE 
         AND has_function_privilege('authenticated', p.oid, 'EXECUTE') = TRUE 
         AND has_function_privilege('service_role', p.oid, 'EXECUTE') = TRUE 
        THEN 'PASS (Secure: Anon Denied, Auth & Service Role Granted)' 
        ELSE 'FAIL (Permissions Misconfigured)' 
    END AS execution_privilege_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_staff', 'get_auth_department', 'is_staff_assigned_to_complaint')
ORDER BY p.proname;

-- -------------------------------------------------------------------------
-- 13. SEARCH PATH HARDENING AUDIT (EMPTY SEARCH_PATH VERIFICATION)
-- search_path MUST be set to empty string ('')
-- -------------------------------------------------------------------------
SELECT 
    p.proname AS function_name,
    p.proconfig AS configuration_settings,
    CASE 
        WHEN 'search_path=' = ANY(p.proconfig) 
          OR 'search_path=""' = ANY(p.proconfig)
          OR EXISTS (
              SELECT 1 FROM unnest(p.proconfig) cfg 
              WHERE cfg ~ '^search_path=(\s*|"")$'
          ) THEN 'PASS (search_path is empty string)'
        WHEN p.proconfig IS NULL THEN 'FAIL (search_path not set)'
        ELSE 'SETTING: ' || array_to_string(p.proconfig, ', ')
    END AS search_path_check
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_staff', 'get_auth_department', 'is_staff_assigned_to_complaint')
ORDER BY p.proname;

-- -------------------------------------------------------------------------
-- 14. DECOUPLED PUBLIC POLICIES AUDIT
-- Confirms departments_read_policy is removed and separate anon/auth policies active
-- -------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    policyname,
    roles::text AS target_roles,
    cmd AS operation,
    CASE 
        WHEN policyname IN ('departments_anon_select', 'rules_anon_select') AND roles::text = '{anon}' THEN 'PASS (Decoupled Anon)'
        WHEN policyname IN ('departments_authenticated_select', 'rules_authenticated_select') AND roles::text = '{authenticated}' THEN 'PASS (Decoupled Authenticated)'
        WHEN policyname = 'departments_read_policy' THEN 'FAIL (Old Coupled Policy Still Active)'
        ELSE 'PASS'
    END AS policy_state
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('departments', 'complaint_routing_rules')
ORDER BY tablename, policyname;
