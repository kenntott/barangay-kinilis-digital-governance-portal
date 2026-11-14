-- Barangay Kinilis AI Complaint System - PostgreSQL Database Schema & RLS Policies for Supabase

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'staff', 'admin')),
    phone TEXT,
    purok TEXT DEFAULT 'Brgy. Kinilis, Polomolok',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    head_officer TEXT,
    staff_count INT DEFAULT 1,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_no TEXT UNIQUE NOT NULL,
    resident_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Pending',
    location TEXT NOT NULL,
    incident_date DATE,
    incident_time TEXT,
    resident_name TEXT,
    resident_email TEXT,
    resident_phone TEXT,
    preferred_contact TEXT DEFAULT 'Phone',
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Classification Results Table
CREATE TABLE IF NOT EXISTS public.ai_classification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    suggested_department TEXT NOT NULL,
    confidence INT NOT NULL,
    reasoning TEXT,
    keywords JSONB,
    classified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Complaint Routing Table
CREATE TABLE IF NOT EXISTS public.complaint_routing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    assigned_staff TEXT,
    routing_status TEXT DEFAULT 'Automatically Routed',
    routed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Attachments Table
CREATE TABLE IF NOT EXISTS public.complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    target_role TEXT DEFAULT 'all',
    reference_no TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_ref TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Resident Feedback Table
CREATE TABLE IF NOT EXISTS public.resident_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    satisfaction_level TEXT,
    comments TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data can be read, created, and updated safely by anon & authenticated users
-- ==================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_classification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update access on profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow public read access on departments" ON public.departments;
DROP POLICY IF EXISTS "Allow insert access on departments" ON public.departments;
DROP POLICY IF EXISTS "Allow update access on departments" ON public.departments;

DROP POLICY IF EXISTS "Allow public read access on complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow insert access on complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow update access on complaints" ON public.complaints;

DROP POLICY IF EXISTS "Allow read access on ai_classification_results" ON public.ai_classification_results;
DROP POLICY IF EXISTS "Allow insert access on ai_classification_results" ON public.ai_classification_results;

DROP POLICY IF EXISTS "Allow read access on complaint_routing" ON public.complaint_routing;
DROP POLICY IF EXISTS "Allow insert access on complaint_routing" ON public.complaint_routing;

DROP POLICY IF EXISTS "Allow read access on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert access on audit_logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Allow read access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow insert access on notifications" ON public.notifications;

-- PROFILES POLICIES
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert access on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on profiles" ON public.profiles FOR UPDATE USING (true);

-- DEPARTMENTS POLICIES
CREATE POLICY "Allow public read access on departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow insert access on departments" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on departments" ON public.departments FOR UPDATE USING (true);

-- COMPLAINTS POLICIES
CREATE POLICY "Allow public read access on complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Allow insert access on complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on complaints" ON public.complaints FOR UPDATE USING (true);

-- AI CLASSIFICATION POLICIES
CREATE POLICY "Allow read access on ai_classification_results" ON public.ai_classification_results FOR SELECT USING (true);
CREATE POLICY "Allow insert access on ai_classification_results" ON public.ai_classification_results FOR INSERT WITH CHECK (true);

-- COMPLAINT ROUTING POLICIES
CREATE POLICY "Allow read access on complaint_routing" ON public.complaint_routing FOR SELECT USING (true);
CREATE POLICY "Allow insert access on complaint_routing" ON public.complaint_routing FOR INSERT WITH CHECK (true);

-- AUDIT LOGS POLICIES
CREATE POLICY "Allow read access on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert access on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Allow read access on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert access on notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- ==================================================
-- AUTOMATIC PROFILE CREATION TRIGGER FOR AUTH.USERS
-- Automatically creates a matching public.profiles row when a new user registers via Supabase Auth
-- ==================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, phone, purok)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'resident',
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'purok', 'Brgy. Kinilis, Polomolok')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
