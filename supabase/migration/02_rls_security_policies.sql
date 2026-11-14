-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- FILE 2: ROLE-BASED ROW LEVEL SECURITY (RLS) POLICIES
-- Zero Unrestricted USING(true) on Sensitive Citizen Data
-- Enforces: Strict Identity, Role Verification, Resident Ownership & Department Scope
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
-- SECURITY HELPER FUNCTIONS
-- Securely extract caller role and department without relying on client claims
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

-- =========================================================================
-- 1. PROFILES POLICIES
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
    )
    WITH CHECK (
        -- Regular residents cannot escalate their own role
        (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
        OR public.is_admin()
    );

-- =========================================================================
-- 2. DEPARTMENTS POLICIES (Public read of active departments; Admin write)
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

-- =========================================================================
-- 3. COMPLAINTS POLICIES
-- Residents see own; Staff see departmental/assigned; Admin sees all
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
                OR id IN (
                    SELECT complaint_id FROM public.complaint_assignments 
                    WHERE assigned_staff = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
                )
            )
        )
    );

-- Allow authenticated residents to insert complaints under their account
DROP POLICY IF EXISTS "complaints_resident_insert" ON public.complaints;
CREATE POLICY "complaints_resident_insert" ON public.complaints
    FOR INSERT TO authenticated
    WITH CHECK (
        resident_id = auth.uid()
    );

-- Allow unauthenticated residents to submit guest complaints (resident_id MUST be null)
DROP POLICY IF EXISTS "complaints_anon_insert" ON public.complaints;
CREATE POLICY "complaints_anon_insert" ON public.complaints
    FOR INSERT TO anon
    WITH CHECK (
        resident_id IS NULL 
        AND reference_no IS NOT NULL 
        AND resident_email IS NOT NULL
    );

-- Only Staff and Admin can update complaint progress
DROP POLICY IF EXISTS "complaints_staff_update" ON public.complaints;
CREATE POLICY "complaints_staff_update" ON public.complaints
    FOR UPDATE TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- =========================================================================
-- 4. COMPLAINT STATUS HISTORY POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "history_select_policy" ON public.complaint_status_history;
CREATE POLICY "history_select_policy" ON public.complaint_status_history
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR complaint_id IN (
            SELECT id FROM public.complaints WHERE resident_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "history_staff_insert" ON public.complaint_status_history;
CREATE POLICY "history_staff_insert" ON public.complaint_status_history
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

-- =========================================================================
-- 5. COMPLAINT EVIDENCE POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "evidence_select_policy" ON public.complaint_evidence;
CREATE POLICY "evidence_select_policy" ON public.complaint_evidence
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR complaint_id IN (
            SELECT id FROM public.complaints WHERE resident_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "evidence_insert_policy" ON public.complaint_evidence;
CREATE POLICY "evidence_insert_policy" ON public.complaint_evidence
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_staff()
        OR complaint_id IN (
            SELECT id FROM public.complaints WHERE resident_id = auth.uid()
        )
    );

-- =========================================================================
-- 6. COMPLAINT ASSIGNMENTS POLICIES
-- =========================================================================
DROP POLICY IF EXISTS "assignments_select_policy" ON public.complaint_assignments;
CREATE POLICY "assignments_select_policy" ON public.complaint_assignments
    FOR SELECT TO authenticated
    USING (
        public.is_staff()
        OR complaint_id IN (
            SELECT id FROM public.complaints WHERE resident_id = auth.uid()
        )
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
        OR complaint_id IN (
            SELECT id FROM public.complaints WHERE resident_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "followups_insert_policy" ON public.complaint_followups;
CREATE POLICY "followups_insert_policy" ON public.complaint_followups
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_staff()
        OR (
            complaint_id IN (
                SELECT id FROM public.complaints WHERE resident_id = auth.uid()
            )
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
        OR complaint_id IN (
            SELECT id FROM public.complaints WHERE resident_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "resolutions_staff_insert" ON public.complaint_resolutions;
CREATE POLICY "resolutions_staff_insert" ON public.complaint_resolutions
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff());

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
        AND complaint_id IN (
            SELECT id FROM public.complaints 
            WHERE resident_id = auth.uid() AND status = 'Resolved'
        )
    );

-- =========================================================================
-- 10. AI CLASSIFICATION LOGS POLICIES
-- Internal engine audit; strictly restricted to Staff and Admin
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
-- Public can read active rules to know available complaint categories
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
-- 13. AUDIT LOGS POLICIES
-- Immutable append-only audit trail; strictly restricted to Admin
-- =========================================================================
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- No UPDATE or DELETE policy on audit_logs (Strict Immutability)

-- =========================================================================
-- 14. SECURE PUBLIC COMPLAINT TRACKING RPC
-- Allows anonymous or registered citizens to track complaint status by reference_no
-- Returns strictly non-PII tracking info without opening the complaints table.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.track_complaint_status(
    p_reference_no TEXT,
    p_verification_phone TEXT DEFAULT NULL
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
      AND (
          p_verification_phone IS NULL 
          OR c.resident_phone LIKE '%' || RIGHT(TRIM(p_verification_phone), 4)
      )
    LIMIT 1;
END;
$$;

-- Grant execution of tracking RPC to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.track_complaint_status(TEXT, TEXT) TO anon, authenticated;
