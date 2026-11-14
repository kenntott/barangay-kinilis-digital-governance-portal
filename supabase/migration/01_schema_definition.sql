-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- FILE 1: POSTGRESQL SCHEMA DEFINITION
-- 100% Exact Alignment with 13-Table MySQL Schema (barangay_kinilis_db)
-- Includes: Constraints, Foreign Keys, Indexes, Extensions & Compatibility Views
-- =========================================================================

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. PROFILES (Original MySQL: users)
-- Linked to Supabase auth.users via UUID primary key
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'staff', 'admin')),
    phone TEXT,
    purok TEXT DEFAULT 'Brgy. Kinilis, Polomolok',
    avatar_url TEXT,
    department TEXT,
    position TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    legacy_user_id INT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_legacy_id ON public.profiles(legacy_user_id);

-- -------------------------------------------------------------------------
-- 2. DEPARTMENTS (Original MySQL: departments)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    head_officer TEXT,
    staff_count INT DEFAULT 1 CHECK (staff_count >= 0),
    sla_hours INT DEFAULT 48 CHECK (sla_hours > 0),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    legacy_dept_id INT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_status ON public.departments(status);

-- -------------------------------------------------------------------------
-- 3. COMPLAINTS (Original MySQL: complaints)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_no TEXT UNIQUE NOT NULL,
    resident_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Assigned', 'In Progress', 'Under Review', 'Resolved', 'Dismissed')),
    location TEXT NOT NULL,
    incident_date DATE,
    incident_time TEXT,
    resident_name TEXT NOT NULL,
    resident_email TEXT NOT NULL,
    resident_phone TEXT,
    preferred_contact TEXT DEFAULT 'Phone' CHECK (preferred_contact IN ('Phone', 'Email', 'In-Person', 'SMS')),
    target_resolution_date TIMESTAMPTZ,
    is_overdue BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    legacy_complaint_id INT UNIQUE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_reference_no ON public.complaints(reference_no);
CREATE INDEX IF NOT EXISTS idx_complaints_resident_id ON public.complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_submitted_at ON public.complaints(submitted_at DESC);

-- -------------------------------------------------------------------------
-- 4. COMPLAINT STATUS HISTORY (Original MySQL: complaint_status_history)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    action_title TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by_name TEXT,
    performed_by_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_complaint_id ON public.complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON public.complaint_status_history(created_at);

-- -------------------------------------------------------------------------
-- 5. COMPLAINT EVIDENCE (Original MySQL: complaint_evidence)
-- Stores metadata of private uploaded files
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size TEXT,
    file_type TEXT,
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_complaint_id ON public.complaint_evidence(complaint_id);

-- -------------------------------------------------------------------------
-- 6. COMPLAINT ASSIGNMENTS (Original MySQL: complaint_assignments)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    assigned_staff TEXT,
    assigned_by_name TEXT,
    routing_status TEXT DEFAULT 'Automatically Routed',
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_assignments_complaint_id ON public.complaint_assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_assignments_department ON public.complaint_assignments(department_name);

-- -------------------------------------------------------------------------
-- 7. COMPLAINT FOLLOWUPS (Original MySQL: complaint_followups)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_complaint_id ON public.complaint_followups(complaint_id);

-- -------------------------------------------------------------------------
-- 8. COMPLAINT RESOLUTIONS (Original MySQL: complaint_resolutions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID UNIQUE NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    resolved_by TEXT NOT NULL,
    summary TEXT NOT NULL,
    evidence_url TEXT,
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resolutions_complaint_id ON public.complaint_resolutions(complaint_id);

-- -------------------------------------------------------------------------
-- 9. RESIDENT FEEDBACK (Original MySQL: resident_feedback)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resident_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID UNIQUE NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_status TEXT DEFAULT 'Accepted',
    rating INT CHECK (rating BETWEEN 1 AND 5),
    satisfaction_level TEXT,
    comments TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_complaint_id ON public.resident_feedback(complaint_id);

-- -------------------------------------------------------------------------
-- 10. AI CLASSIFICATION LOGS (Original MySQL: ai_classification_logs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_classification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    suggested_department TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    reasoning TEXT,
    keywords JSONB,
    was_overridden BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    overridden_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_complaint_id ON public.ai_classification_logs(complaint_id);

-- -------------------------------------------------------------------------
-- 11. COMPLAINT ROUTING RULES (Original MySQL: complaint_routing_rules)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_routing_rules (
    id SERIAL PRIMARY KEY,
    category TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    default_priority TEXT NOT NULL DEFAULT 'Medium',
    keywords JSONB NOT NULL,
    assigned_staff TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_category ON public.complaint_routing_rules(category);

-- -------------------------------------------------------------------------
-- 12. NOTIFICATIONS (Original MySQL: notifications)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT DEFAULT 'all',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_no TEXT,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- -------------------------------------------------------------------------
-- 13. AUDIT LOGS (Original MySQL: audit_logs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT NOT NULL,
    user_role TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_ref TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_ref);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);

-- -------------------------------------------------------------------------
-- COMPATIBILITY VIEWS
-- For frontend components querying `ai_classification_results` or `complaint_routing`
-- Ensures zero database duplication while providing backward API compatibility.
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.ai_classification_results AS
SELECT 
    id,
    complaint_id,
    category,
    priority,
    suggested_department,
    confidence,
    reasoning,
    keywords,
    created_at AS classified_at
FROM public.ai_classification_logs;

CREATE OR REPLACE VIEW public.complaint_routing AS
SELECT 
    id,
    complaint_id,
    department_name,
    assigned_staff,
    routing_status,
    assigned_at AS routed_at
FROM public.complaint_assignments;
