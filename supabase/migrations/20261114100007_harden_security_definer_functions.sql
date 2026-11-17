-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- FILE 06: HARDEN SECURITY DEFINER HELPER FUNCTIONS & RESTRICT EXECUTE
-- Review Path: supabase/review/06_harden_security_definer_functions.sql
-- Migration Path: supabase/migrations/20261114100007_harden_security_definer_functions.sql
-- Target: STAGING ONLY (jekpwngbjcfaxoukfuke)
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. HARDEN SECURITY DEFINER HELPER FUNCTIONS
-- Explicit search_path = '' prevents search-path hijacking attacks.
-- All table references are fully schema-qualified (public.profiles, etc.).
-- -------------------------------------------------------------------------

-- 1.1 is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin' AND status = 'Active'
    );
$$;

-- 1.2 is_staff()
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'Active'
    );
$$;

-- 1.3 get_auth_department()
CREATE OR REPLACE FUNCTION public.get_auth_department()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT department FROM public.profiles WHERE id = auth.uid();
$$;

-- 1.4 is_staff_assigned_to_complaint(p_complaint_id, p_user_id)
-- Hardening:
-- - Authenticated users cannot probe arbitrary user UUIDs; if p_user_id != auth.uid()
--   and the caller is not an active admin, the function returns FALSE immediately.
-- - Uses SET search_path = '' with fully qualified object names.
-- - Defaults p_user_id to auth.uid() while preserving the 2-argument signature for existing policies.
CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_complaint(
    p_complaint_id UUID, 
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_effective_user_id UUID;
BEGIN
    -- Authenticated caller scope restriction:
    IF auth.uid() IS NOT NULL THEN
        -- If caller attempts to query a user ID other than their own:
        IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
            -- Allow only active administrators to inspect other users' assignments
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin' AND status = 'Active'
            ) THEN
                RETURN FALSE;
            END IF;
            v_effective_user_id := p_user_id;
        ELSE
            v_effective_user_id := auth.uid();
        END IF;
    ELSE
        -- Internal execution (database owner, service_role, migrations)
        v_effective_user_id := p_user_id;
    END IF;

    IF v_effective_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 
        FROM public.complaint_assignments a
        JOIN public.profiles p ON p.id = v_effective_user_id
        WHERE a.complaint_id = p_complaint_id 
          AND (a.assigned_staff = p.full_name OR a.department_name = p.department)
          AND a.is_active = TRUE
    );
END;
$$;

-- -------------------------------------------------------------------------
-- 2. STRICT PERMISSION ENFORCEMENT
-- Explicitly revoke execution from PUBLIC and anon.
-- Grant execution strictly to authenticated and service_role.
-- -------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_auth_department() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff_assigned_to_complaint(UUID, UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_department() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_assigned_to_complaint(UUID, UUID) TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- 3. DECOUPLE PUBLIC POLICIES FROM STAFF/ADMIN CHECKS
-- Guarantees anon callers will never evaluate is_staff() or is_admin(),
-- preventing 'permission denied' errors on public read operations.
-- -------------------------------------------------------------------------

-- 3.1 departments select policy
DROP POLICY IF EXISTS "departments_read_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_anon_select" ON public.departments;
DROP POLICY IF EXISTS "departments_authenticated_select" ON public.departments;

CREATE POLICY "departments_anon_select" ON public.departments
    FOR SELECT TO anon
    USING (status = 'Active');

CREATE POLICY "departments_authenticated_select" ON public.departments
    FOR SELECT TO authenticated
    USING (status = 'Active' OR public.is_staff());

-- 3.2 complaint routing rules select policy
DROP POLICY IF EXISTS "rules_select_policy" ON public.complaint_routing_rules;
DROP POLICY IF EXISTS "rules_anon_select" ON public.complaint_routing_rules;
DROP POLICY IF EXISTS "rules_authenticated_select" ON public.complaint_routing_rules;

CREATE POLICY "rules_anon_select" ON public.complaint_routing_rules
    FOR SELECT TO anon
    USING (is_active = TRUE);

CREATE POLICY "rules_authenticated_select" ON public.complaint_routing_rules
    FOR SELECT TO authenticated
    USING (is_active = TRUE OR public.is_admin());

COMMIT;
