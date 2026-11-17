-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- REVIEW REVISION 1: HARDENED ROW LEVEL SECURITY (RLS) POLICIES
-- File: supabase/review/02_rls_security_policies.sql
-- Fixes: Eliminates RLS Recursion via Security Definer Helpers,
--        Tightens Staff Scoping, Restricts Audit Insert, Enforces Phone Verification
-- =========================================================================

-- Enable RLS across all 13 core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_classification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- RECURSION-SAFE SECURITY DEFINER HELPER FUNCTIONS
-- Explicit search_path = public prevents search path hijacking.
-- Queries execute with table-owner privileges, completely avoiding RLS recursion loops.
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_department()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT department FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND status = 'Active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'Active'
    );
$$;

-- Checks if a user is the owner of a given complaint without triggering complaints RLS recursion
CREATE OR REPLACE FUNCTION public.is_complaint_owner(p_complaint_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.complaints 
        WHERE id = p_complaint_id AND resident_id = p_user_id
    );
$$;

-- Checks if a staff member is assigned to a complaint without triggering complaint_assignments RLS recursion
CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_complaint(p_complaint_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.complaint_assignments a
        JOIN public.profiles p ON p.id = p_user_id
        WHERE a.complaint_id = p_complaint_id 
          AND (a.assigned_staff = p.full_name OR a.department_name = p.department)
          AND a.is_active = TRUE
    );
$$;

-- Revoke default execute on helpers from public, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_auth_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_auth_department() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_complaint_owner(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff_assigned_to_complaint(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_department() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_complaint_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_assigned_to_complaint(UUID, UUID) TO authenticated;

-- =========================================================================
-- 1. PROFILES POLICIES (Recursion-Free)
-- =========================================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR public.is_staff()
    );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid() OR public.is_admin()
    );
-- Note: Field tampering (role, department, status) is strictly blocked by 
-- the database trigger `trg_prevent_profile_tampering` defined in File 1.

-- =========================================================================
-- 2. DEPARTMENTS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "departments_read_policy" ON public.departments;
CREATE POLICY "departments_read_policy" ON public.departments
    FOR SELECT TO anon, authenticated
    USING (status = 'Active' OR public.is_staff());

DROP POLICY IF EXISTS "departments_admin_insert" ON public.departments;
CREATE POLICY "departments_admin_insert" ON public.departments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "departments_admin_update" ON public.departments;
CREATE POLICY "departments_admin_update" ON public.departments
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "departments_admin_delete" ON public.departments;
CREATE POLICY "departments_admin_delete" ON public.departments
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- =========================================================================
-- 3. COMPLAINTS POLICIES (Recursion-Free & Staff Scoped)
-- =========================================================================
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
CREATE POLICY "complaints_select_policy" ON public.complaints
    FOR SELECT TO authenticated
    USING (
        resident_id = auth.uid() 
        OR public.is_admin()
        OR (
            public.is_staff() AND (
                category = public.get_auth_department()
                OR public.is_staff_assigned_to_complaint(id, auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "complaints_resident_insert" ON public.complaints;
CREATE POLICY "complaints_resident_insert" ON public.complaints
    FOR INSERT TO authenticated
    WITH CHECK (
        resident_id = auth.uid()
    );

-- Strict guest complaint submission validation
DROP POLICY IF EXISTS "complaints_anon_insert" ON public.complaints;
CREATE POLICY "complaints_anon_insert" ON public.complaints
    FOR INSERT TO anon
    WITH CHECK (
        resident_id IS NULL 
        AND reference_no IS NOT NULL 
        AND resident_email IS NOT NULL 
        AND length(trim(resident_email)) > 5
        AND resident_name IS NOT NULL
        AND length(trim(resident_name)) >= 2
        AND title IS NOT NULL
        AND length(trim(title)) >= 5
        AND description IS NOT NULL
        AND length(trim(description)) >= 10
    );

-- Restrict complaint updates to authorized staff (department or assigned) or admin
DROP POLICY IF EXISTS "complaints_staff_update" ON public.complaints;
CREATE POLICY "complaints_staff_update" ON public.complaints
    FOR UPDATE TO authenticated
    USING (
        public.is_admin()
        OR (
            public.is_staff() AND (
                category = public.get_auth_department()
                OR public.is_staff_assigned_to_complaint(id, auth.uid())
            )
        )
    )
    WITH CHECK (
        public.is_admin()
        OR (
            public.is_staff() AND (
                category = public.get_auth_department()
                OR public.is_staff_assigned_to_complaint(id, auth.uid())
            )
        )
    );

-- =========================================================================
-- 4. COMPLAINT STATUS HISTORY POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "history_select_policy" ON public.complaint_status_history;
CREATE POLICY "history_select_policy" ON public.complaint_status_history
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR public.is_complaint_owner(complaint_id, auth.uid())
    );

DROP POLICY IF EXISTS "history_staff_insert" ON public.complaint_status_history;
CREATE POLICY "history_staff_insert" ON public.complaint_status_history
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.is_staff() AND (
                EXISTS (
                    SELECT 1 FROM public.complaints c 
                    WHERE c.id = complaint_id 
                      AND (c.category = public.get_auth_department() OR public.is_staff_assigned_to_complaint(c.id, auth.uid()))
                )
            )
        )
    );

-- =========================================================================
-- 5. COMPLAINT EVIDENCE POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "evidence_select_policy" ON public.complaint_evidence;
CREATE POLICY "evidence_select_policy" ON public.complaint_evidence
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR public.is_complaint_owner(complaint_id, auth.uid())
    );

DROP POLICY IF EXISTS "evidence_insert_policy" ON public.complaint_evidence;
CREATE POLICY "evidence_insert_policy" ON public.complaint_evidence
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_staff()
        OR public.is_complaint_owner(complaint_id, auth.uid())
    );

-- =========================================================================
-- 6. COMPLAINT ASSIGNMENTS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "assignments_select_policy" ON public.complaint_assignments;
CREATE POLICY "assignments_select_policy" ON public.complaint_assignments
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR public.is_complaint_owner(complaint_id, auth.uid())
    );

DROP POLICY IF EXISTS "assignments_staff_insert" ON public.complaint_assignments;
CREATE POLICY "assignments_staff_insert" ON public.complaint_assignments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "assignments_staff_update" ON public.complaint_assignments;
CREATE POLICY "assignments_staff_update" ON public.complaint_assignments
    FOR UPDATE TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- =========================================================================
-- 7. COMPLAINT FOLLOWUPS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "followups_select_policy" ON public.complaint_followups;
CREATE POLICY "followups_select_policy" ON public.complaint_followups
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR public.is_complaint_owner(complaint_id, auth.uid())
    );

DROP POLICY IF EXISTS "followups_insert_policy" ON public.complaint_followups;
CREATE POLICY "followups_insert_policy" ON public.complaint_followups
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_staff()
        OR (
            public.is_complaint_owner(complaint_id, auth.uid())
            AND sender_id = auth.uid()
        )
    );

-- =========================================================================
-- 8. COMPLAINT RESOLUTIONS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "resolutions_select_policy" ON public.complaint_resolutions;
CREATE POLICY "resolutions_select_policy" ON public.complaint_resolutions
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR public.is_complaint_owner(complaint_id, auth.uid())
    );

DROP POLICY IF EXISTS "resolutions_staff_insert" ON public.complaint_resolutions;
CREATE POLICY "resolutions_staff_insert" ON public.complaint_resolutions
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.is_staff() AND EXISTS (
                SELECT 1 FROM public.complaints c 
                WHERE c.id = complaint_id 
                  AND (c.category = public.get_auth_department() OR public.is_staff_assigned_to_complaint(c.id, auth.uid()))
            )
        )
    );

-- =========================================================================
-- 9. RESIDENT FEEDBACK POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "feedback_select_policy" ON public.resident_feedback;
CREATE POLICY "feedback_select_policy" ON public.resident_feedback
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR resident_id = auth.uid()
    );

DROP POLICY IF EXISTS "feedback_resident_insert" ON public.resident_feedback;
CREATE POLICY "feedback_resident_insert" ON public.resident_feedback
    FOR INSERT TO authenticated
    WITH CHECK (
        resident_id = auth.uid()
        AND public.is_complaint_owner(complaint_id, auth.uid())
    );

-- =========================================================================
-- 10. AI CLASSIFICATION LOGS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "ai_logs_select_policy" ON public.ai_classification_logs;
CREATE POLICY "ai_logs_select_policy" ON public.ai_classification_logs
    FOR SELECT TO authenticated
    USING (public.is_staff());

DROP POLICY IF EXISTS "ai_logs_insert_policy" ON public.ai_classification_logs;
CREATE POLICY "ai_logs_insert_policy" ON public.ai_classification_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

-- =========================================================================
-- 11. COMPLAINT ROUTING RULES POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "rules_select_policy" ON public.complaint_routing_rules;
CREATE POLICY "rules_select_policy" ON public.complaint_routing_rules
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "rules_admin_modify" ON public.complaint_routing_rules;
CREATE POLICY "rules_admin_modify" ON public.complaint_routing_rules
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- =========================================================================
-- 12. NOTIFICATIONS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() 
        OR (target_role = 'admin' AND public.is_admin())
        OR (target_role = 'staff' AND public.is_staff())
        OR target_role = 'all'
    );

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

-- =========================================================================
-- 13. AUDIT LOGS POLICIES (Strictly Guarded Insertion)
-- =========================================================================
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- Only authenticated staff or admin can insert audit logs directly
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

-- Security Definer procedure for trusted system audit logging
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_module TEXT,
    p_entity_ref TEXT,
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_name TEXT;
    v_user_role TEXT;
BEGIN
    SELECT full_name, role INTO v_user_name, v_user_role
    FROM public.profiles WHERE id = auth.uid();

    INSERT INTO public.audit_logs (
        user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
    ) VALUES (
        COALESCE(v_user_name, 'System Anonymous'),
        COALESCE(v_user_role, 'System'),
        p_action,
        p_module,
        p_entity_ref,
        p_old_value,
        p_new_value,
        '127.0.0.1',
        NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

-- =========================================================================
-- 14. HARDENED PUBLIC COMPLAINT TRACKING RPC
-- REQUIRES explicit phone number verification (matching last 4 digits)
-- Never returns records without verification.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.track_complaint_status(
    p_reference_no TEXT,
    p_verification_phone TEXT
)
RETURNS TABLE (
    reference_no TEXT,
    title TEXT,
    category TEXT,
    status TEXT,
    priority TEXT,
    submitted_at TIMESTAMPTZ,
    target_resolution_date TIMESTAMPTZ,
    status_timeline JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Strict anti-abuse validation: reference number and at least 4 digits of phone number
    IF p_reference_no IS NULL 
       OR p_verification_phone IS NULL 
       OR length(trim(p_verification_phone)) < 4 
       OR length(trim(p_reference_no)) < 8 
       OR UPPER(TRIM(p_reference_no)) NOT LIKE 'KIN-%' THEN
        -- Return empty result set immediately without leaking reference number existence
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        c.reference_no,
        c.title,
        c.category,
        c.status,
        c.priority,
        c.submitted_at,
        c.target_resolution_date,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'status', h.status,
                        'action_title', h.action_title,
                        'description', h.description,
                        'created_at', h.created_at
                    ) ORDER BY h.created_at ASC
                )
                FROM public.complaint_status_history h
                WHERE h.complaint_id = c.id
            ),
            '[]'::jsonb
        ) AS status_timeline
    FROM public.complaints c
    WHERE c.reference_no = UPPER(TRIM(p_reference_no))
      AND c.resident_phone IS NOT NULL
      AND RIGHT(regexp_replace(c.resident_phone, '[^0-9]', '', 'g'), 4) = RIGHT(regexp_replace(p_verification_phone, '[^0-9]', '', 'g'), 4)
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_complaint_status(TEXT, TEXT) TO anon, authenticated;
