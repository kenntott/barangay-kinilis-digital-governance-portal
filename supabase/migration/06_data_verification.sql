-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- FILE 6: DATA MIGRATION VERIFICATION & INTEGRITY SUITE
-- Validates: Source-vs-Target Row Counts, Foreign Key Links & Orphan Absence
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. RECORD COUNT RECONCILIATION
-- Expected counts based on MySQL \`barangay_kinilis_db\` live inventory:
-- -------------------------------------------------------------------------
SELECT 
    'profiles' AS table_name, 
    count(*) AS live_count, 
    5 AS expected_count,
    CASE WHEN count(*) = 5 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.profiles
UNION ALL
SELECT 
    'departments', count(*), 6,
    CASE WHEN count(*) = 6 THEN 'PASS' ELSE 'FAIL' END
FROM public.departments
UNION ALL
SELECT 
    'complaint_routing_rules', count(*), 6,
    CASE WHEN count(*) = 6 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaint_routing_rules
UNION ALL
SELECT 
    'complaints', count(*), 9,
    CASE WHEN count(*) = 9 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaints
UNION ALL
SELECT 
    'complaint_status_history', count(*), 19,
    CASE WHEN count(*) = 19 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaint_status_history
UNION ALL
SELECT 
    'complaint_assignments', count(*), 8,
    CASE WHEN count(*) = 8 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaint_assignments
UNION ALL
SELECT 
    'complaint_evidence', count(*), 0,
    CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaint_evidence
UNION ALL
SELECT 
    'complaint_followups', count(*), 2,
    CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaint_followups
UNION ALL
SELECT 
    'complaint_resolutions', count(*), 2,
    CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END
FROM public.complaint_resolutions
UNION ALL
SELECT 
    'resident_feedback', count(*), 2,
    CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END
FROM public.resident_feedback
UNION ALL
SELECT 
    'ai_classification_logs', count(*), 4,
    CASE WHEN count(*) = 4 THEN 'PASS' ELSE 'FAIL' END
FROM public.ai_classification_logs
UNION ALL
SELECT 
    'notifications', count(*), 16,
    CASE WHEN count(*) = 16 THEN 'PASS' ELSE 'FAIL' END
FROM public.notifications
UNION ALL
SELECT 
    'audit_logs', count(*), 16,
    CASE WHEN count(*) = 16 THEN 'PASS' ELSE 'FAIL' END
FROM public.audit_logs;

-- -------------------------------------------------------------------------
-- 2. FOREIGN KEY & ORPHAN CHECKS
-- Every check MUST return 0 orphan records.
-- -------------------------------------------------------------------------

-- A. Complaints with invalid resident_id
SELECT 'Orphan Complaints (invalid resident_id)' AS check_name, count(*) AS orphan_count
FROM public.complaints c
LEFT JOIN public.profiles p ON c.resident_id = p.id
WHERE c.resident_id IS NOT NULL AND p.id IS NULL;

-- B. Status History without valid parent complaint
SELECT 'Orphan Status History' AS check_name, count(*) AS orphan_count
FROM public.complaint_status_history h
LEFT JOIN public.complaints c ON h.complaint_id = c.id
WHERE c.id IS NULL;

-- C. Assignments without valid parent complaint
SELECT 'Orphan Assignments' AS check_name, count(*) AS orphan_count
FROM public.complaint_assignments a
LEFT JOIN public.complaints c ON a.complaint_id = c.id
WHERE c.id IS NULL;

-- D. Resolutions without valid parent complaint
SELECT 'Orphan Resolutions' AS check_name, count(*) AS orphan_count
FROM public.complaint_resolutions r
LEFT JOIN public.complaints c ON r.complaint_id = c.id
WHERE c.id IS NULL;

-- E. Resident Feedback without valid parent complaint
SELECT 'Orphan Feedback' AS check_name, count(*) AS orphan_count
FROM public.resident_feedback f
LEFT JOIN public.complaints c ON f.complaint_id = c.id
WHERE c.id IS NULL;

-- F. Follow-ups without valid parent complaint
SELECT 'Orphan Follow-ups' AS check_name, count(*) AS orphan_count
FROM public.complaint_followups fo
LEFT JOIN public.complaints c ON fo.complaint_id = c.id
WHERE c.id IS NULL;

-- G. AI Classification Logs without valid parent complaint
SELECT 'Orphan AI Classification Logs' AS check_name, count(*) AS orphan_count
FROM public.ai_classification_logs ai
LEFT JOIN public.complaints c ON ai.complaint_id = c.id
WHERE c.id IS NULL;

-- H. Notifications without valid user recipient
SELECT 'Orphan Notifications' AS check_name, count(*) AS orphan_count
FROM public.notifications n
LEFT JOIN public.profiles p ON n.user_id = p.id
WHERE n.user_id IS NOT NULL AND p.id IS NULL;

-- -------------------------------------------------------------------------
-- 3. SPECIFIC DATA INTEGRITY CHECKS
-- Verify exact key complaints from live MySQL:
-- -------------------------------------------------------------------------
SELECT 
    reference_no,
    category,
    priority,
    status,
    resident_name,
    CASE 
        WHEN reference_no = 'KIN-2026-000123' AND status = 'In Progress' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000122' AND status = 'Assigned' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000121' AND status = 'Submitted' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000120' AND status = 'Resolved' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000118' AND status = 'In Progress' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000106' AND status = 'Submitted' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000107' AND status = 'In Progress' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000108' AND status = 'Submitted' THEN 'VALID'
        WHEN reference_no = 'KIN-2026-000109' AND status = 'Resolved' THEN 'VALID'
        ELSE 'INVALID_RECORD'
    END AS status_check
FROM public.complaints
ORDER BY reference_no DESC;
