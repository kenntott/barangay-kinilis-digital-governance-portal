-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- FILE 4: ACCURATE DATA SEED & MIGRATION SCRIPT
-- Source: Exact Live Rows from MySQL `barangay_kinilis_db`
-- Strict Verification: Zero Invented Data, Zero Direct Writes to auth.users
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- PRE-MIGRATION SAFETY CHECK: SUPABASE AUTH USERS & PROFILE INTEGRITY
-- -------------------------------------------------------------------------
-- Since `public.profiles.id` is a foreign key referencing `auth.users(id)`,
-- the 5 official auth accounts must be provisioned in `auth.users` FIRST.
-- This block validates:
--   1. All 5 official email accounts exist in auth.users.
--   2. No duplicate or case-variant email accounts exist in auth.users.
--   3. Existing profiles are strictly consistent with auth.users (no mismatched UUIDs).
--   4. No silent reassignment of profile records between different Auth users.
DO $$
DECLARE
    v_missing_count INTEGER;
    v_missing_emails TEXT;
    v_duplicate_emails TEXT;
    v_mismatched_profiles TEXT;
BEGIN
    -- 1. Check for missing official auth accounts
    SELECT COUNT(*), COALESCE(string_agg(required.email, ', '), '')
    INTO v_missing_count, v_missing_emails
    FROM (
        VALUES 
            ('juan.delacruz@kinilis.gov.ph'),
            ('maria.santos@kinilis.gov.ph'),
            ('admin@kinilis.gov.ph'),
            ('roberto.cruz@kinilis.gov.ph'),
            ('elena.ramos@kinilis.gov.ph')
    ) AS required(email)
    LEFT JOIN auth.users u ON lower(u.email) = lower(required.email)
    WHERE u.id IS NULL;

    IF v_missing_count > 0 THEN
        RAISE EXCEPTION 'PREREQUISITE UNFULFILLED: % of 5 required auth accounts are missing from auth.users (%). Please run node supabase/scripts/05_secure_auth_migration.js first to provision the 5 official user accounts in Supabase Auth before executing this data seed script.', v_missing_count, v_missing_emails;
    END IF;

    -- 2. Check for duplicate or case-variant emails in auth.users
    SELECT string_agg(dupes.email || ' (' || dupes.cnt::text || ' accounts)', ', ')
    INTO v_duplicate_emails
    FROM (
        SELECT lower(email) AS email, COUNT(*) AS cnt
        FROM auth.users
        WHERE lower(email) IN (
            'juan.delacruz@kinilis.gov.ph',
            'maria.santos@kinilis.gov.ph',
            'admin@kinilis.gov.ph',
            'roberto.cruz@kinilis.gov.ph',
            'elena.ramos@kinilis.gov.ph'
        )
        GROUP BY lower(email)
        HAVING COUNT(*) > 1
    ) dupes;

    IF v_duplicate_emails IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE AUTH USERS DETECTED: Multiple auth.users accounts found for: %. Resolve email duplicates in auth.users before proceeding.', v_duplicate_emails;
    END IF;

    -- 3. Check for existing profiles linked to a mismatched Auth UUID
    SELECT string_agg(p.email || ' [Profile UUID: ' || p.id::text || ' vs Auth UUID: ' || u.id::text || ']', ', ')
    INTO v_mismatched_profiles
    FROM public.profiles p
    JOIN auth.users u ON lower(p.email) = lower(u.email)
    WHERE p.id <> u.id;

    IF v_mismatched_profiles IS NOT NULL THEN
        RAISE EXCEPTION 'PROFILE-AUTH IDENTITY MISMATCH: Existing profile is linked to a different Auth UUID than auth.users: %. Halting migration to prevent inconsistent or silent reassignment.', v_mismatched_profiles;
    END IF;
END $$;

-- -------------------------------------------------------------------------
-- 1. DEPARTMENTS (6 Official Barangay Units)
-- -------------------------------------------------------------------------

INSERT INTO public.departments (
    id, name, description, head_officer, staff_count, sla_hours, status, legacy_dept_id, created_at
) VALUES (
    'd1111111-1111-4111-8111-111111111111',
    'Sanitation Department',
    'Manages solid waste collection, street cleaning, and environmental hygiene.',
    'Maria Santos',
    8,
    48,
    'Active',
    1,
    '2026-11-13 16:05:22'
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    head_officer = EXCLUDED.head_officer,
    staff_count = EXCLUDED.staff_count,
    sla_hours = EXCLUDED.sla_hours,
    status = EXCLUDED.status,
    legacy_dept_id = EXCLUDED.legacy_dept_id;
INSERT INTO public.departments (
    id, name, description, head_officer, staff_count, sla_hours, status, legacy_dept_id, created_at
) VALUES (
    'd2222222-2222-4222-8222-222222222222',
    'Peace & Order Bureau',
    'Handles community security, barangay tanod patrol, noise, and dispute conciliation.',
    'Officer Cardo Dimaano',
    12,
    24,
    'Active',
    2,
    '2026-11-13 16:05:22'
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    head_officer = EXCLUDED.head_officer,
    staff_count = EXCLUDED.staff_count,
    sla_hours = EXCLUDED.sla_hours,
    status = EXCLUDED.status,
    legacy_dept_id = EXCLUDED.legacy_dept_id;
INSERT INTO public.departments (
    id, name, description, head_officer, staff_count, sla_hours, status, legacy_dept_id, created_at
) VALUES (
    'd3333333-3333-4333-8333-333333333333',
    'Infrastructure & Public Works',
    'Maintains barangay roads, streetlights, drainage canals, and public buildings.',
    'Engr. Roberto Cruz',
    6,
    72,
    'Active',
    3,
    '2026-11-13 16:05:22'
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    head_officer = EXCLUDED.head_officer,
    staff_count = EXCLUDED.staff_count,
    sla_hours = EXCLUDED.sla_hours,
    status = EXCLUDED.status,
    legacy_dept_id = EXCLUDED.legacy_dept_id;
INSERT INTO public.departments (
    id, name, description, head_officer, staff_count, sla_hours, status, legacy_dept_id, created_at
) VALUES (
    'd4444444-4444-4444-8444-444444444444',
    'Barangay Health Center',
    'Coordinates disease control, immunizations, maternal care, and community sanitation.',
    'Nurse Elena Ramos',
    10,
    48,
    'Active',
    4,
    '2026-11-13 16:05:22'
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    head_officer = EXCLUDED.head_officer,
    staff_count = EXCLUDED.staff_count,
    sla_hours = EXCLUDED.sla_hours,
    status = EXCLUDED.status,
    legacy_dept_id = EXCLUDED.legacy_dept_id;
INSERT INTO public.departments (
    id, name, description, head_officer, staff_count, sla_hours, status, legacy_dept_id, created_at
) VALUES (
    'd5555555-5555-4555-8555-555555555555',
    'Social Welfare Office',
    'Manages senior citizen aid, PWD support, educational assistance, and relief distribution.',
    'Social Worker Ana Garcia',
    5,
    96,
    'Active',
    5,
    '2026-11-13 16:05:22'
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    head_officer = EXCLUDED.head_officer,
    staff_count = EXCLUDED.staff_count,
    sla_hours = EXCLUDED.sla_hours,
    status = EXCLUDED.status,
    legacy_dept_id = EXCLUDED.legacy_dept_id;
INSERT INTO public.departments (
    id, name, description, head_officer, staff_count, sla_hours, status, legacy_dept_id, created_at
) VALUES (
    'd6666666-6666-4666-8666-666666666666',
    'Barangay Administrative Office',
    'Overlooks clearances, permits, secretarial records, and executive public service.',
    'Sec. Danilo Lopez',
    7,
    48,
    'Active',
    6,
    '2026-11-13 16:05:22'
) ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    head_officer = EXCLUDED.head_officer,
    staff_count = EXCLUDED.staff_count,
    sla_hours = EXCLUDED.sla_hours,
    status = EXCLUDED.status,
    legacy_dept_id = EXCLUDED.legacy_dept_id;

-- -------------------------------------------------------------------------
-- 2. COMPLAINT ROUTING RULES (6 Active AI Rules)
-- -------------------------------------------------------------------------

INSERT INTO public.complaint_routing_rules (
    id, category, department, default_priority, keywords, assigned_staff, is_active, updated_at
) VALUES (
    1,
    'Waste Management',
    'Sanitation Department',
    'Medium',
    '["garbage","basura","uncollected","waste","trash","smell","dumping","litter"]'::jsonb,
    'Maria Santos (Sanitation Officer)',
    TRUE,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    department = EXCLUDED.department,
    default_priority = EXCLUDED.default_priority,
    keywords = EXCLUDED.keywords,
    assigned_staff = EXCLUDED.assigned_staff,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;
INSERT INTO public.complaint_routing_rules (
    id, category, department, default_priority, keywords, assigned_staff, is_active, updated_at
) VALUES (
    2,
    'Peace & Order',
    'Peace & Order Bureau',
    'High',
    '["noise","ingay","fight","drunk","thief","security","curfew","gambling","riot","rowdy"]'::jsonb,
    'Tanod Desk Officer',
    TRUE,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    department = EXCLUDED.department,
    default_priority = EXCLUDED.default_priority,
    keywords = EXCLUDED.keywords,
    assigned_staff = EXCLUDED.assigned_staff,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;
INSERT INTO public.complaint_routing_rules (
    id, category, department, default_priority, keywords, assigned_staff, is_active, updated_at
) VALUES (
    3,
    'Infrastructure',
    'Infrastructure & Public Works',
    'Medium',
    '["road","kalsada","bridge","pothole","drainage","canal","street light","post","flood","baha","broken"]'::jsonb,
    'Engr. Roberto Cruz',
    TRUE,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    department = EXCLUDED.department,
    default_priority = EXCLUDED.default_priority,
    keywords = EXCLUDED.keywords,
    assigned_staff = EXCLUDED.assigned_staff,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;
INSERT INTO public.complaint_routing_rules (
    id, category, department, default_priority, keywords, assigned_staff, is_active, updated_at
) VALUES (
    4,
    'Health Services',
    'Barangay Health Center',
    'Medium',
    '["fever","dengue","mosquito","sick","clinic","medicine","vaccine","sanitation","covid","health"]'::jsonb,
    'Nurse Elena Ramos',
    TRUE,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    department = EXCLUDED.department,
    default_priority = EXCLUDED.default_priority,
    keywords = EXCLUDED.keywords,
    assigned_staff = EXCLUDED.assigned_staff,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;
INSERT INTO public.complaint_routing_rules (
    id, category, department, default_priority, keywords, assigned_staff, is_active, updated_at
) VALUES (
    5,
    'Social Welfare',
    'Social Welfare Office',
    'Low',
    '["senior","pwd","assistance","food pack","relief","aid","financial","indigent","solar"]'::jsonb,
    'Social Worker Ana Garcia',
    TRUE,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    department = EXCLUDED.department,
    default_priority = EXCLUDED.default_priority,
    keywords = EXCLUDED.keywords,
    assigned_staff = EXCLUDED.assigned_staff,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;
INSERT INTO public.complaint_routing_rules (
    id, category, department, default_priority, keywords, assigned_staff, is_active, updated_at
) VALUES (
    6,
    'Barangay Administration',
    'Barangay Administrative Office',
    'Low',
    '["clearance","permit","certificate","inquiry","schedule","fee","document","secretary"]'::jsonb,
    'Sec. Danilo Lopez',
    TRUE,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    department = EXCLUDED.department,
    default_priority = EXCLUDED.default_priority,
    keywords = EXCLUDED.keywords,
    assigned_staff = EXCLUDED.assigned_staff,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

-- Synchronize auto-increment sequence after explicit ID inserts
SELECT setval(
    pg_get_serial_sequence('public.complaint_routing_rules', 'id'),
    COALESCE(MAX(id), 1)
) FROM public.complaint_routing_rules;

-- -------------------------------------------------------------------------
-- 3. PROFILES SEED (5 Official Profiles)
-- Note: User identities are securely provisioned via File 5 (Auth Admin API).
-- This statement inserts or synchronizes profile metadata linked via legacy_user_id.
-- -------------------------------------------------------------------------

-- Profile: Juan dela Cruz (resident)
INSERT INTO public.profiles (
    id, full_name, email, role, phone, purok, department, position, status, legacy_user_id, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    'resident',
    '0917-123-4567',
    'Purok 3, Brgy. Kinilis, Polomolok',
    NULL,
    NULL,
    'Active',
    1,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    purok = EXCLUDED.purok,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    status = EXCLUDED.status,
    legacy_user_id = EXCLUDED.legacy_user_id;
-- Profile: Maria Santos (staff)
INSERT INTO public.profiles (
    id, full_name, email, role, phone, purok, department, position, status, legacy_user_id, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'maria.santos@kinilis.gov.ph'),
    'Maria Santos',
    'maria.santos@kinilis.gov.ph',
    'staff',
    '0920-987-6543',
    'Purok 1, Brgy. Kinilis',
    'Sanitation Department',
    'Sanitation Officer',
    'Active',
    2,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    purok = EXCLUDED.purok,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    status = EXCLUDED.status,
    legacy_user_id = EXCLUDED.legacy_user_id;
-- Profile: Admin Desk (Capt. Hon. Escabarte) (admin)
INSERT INTO public.profiles (
    id, full_name, email, role, phone, purok, department, position, status, legacy_user_id, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Admin Desk (Capt. Hon. Escabarte)',
    'admin@kinilis.gov.ph',
    'admin',
    '0918-000-1122',
    'Brgy. Hall Complex, Kinilis',
    'Barangay Administrative Office',
    'Barangay Administrator',
    'Active',
    3,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    purok = EXCLUDED.purok,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    status = EXCLUDED.status,
    legacy_user_id = EXCLUDED.legacy_user_id;
-- Profile: Engr. Roberto Cruz (staff)
INSERT INTO public.profiles (
    id, full_name, email, role, phone, purok, department, position, status, legacy_user_id, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'roberto.cruz@kinilis.gov.ph'),
    'Engr. Roberto Cruz',
    'roberto.cruz@kinilis.gov.ph',
    'staff',
    '0917-555-4433',
    'Purok 2, Brgy. Kinilis',
    'Infrastructure & Public Works',
    'Public Works Engineer',
    'Active',
    4,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    purok = EXCLUDED.purok,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    status = EXCLUDED.status,
    legacy_user_id = EXCLUDED.legacy_user_id;
-- Profile: Nurse Elena Ramos (staff)
INSERT INTO public.profiles (
    id, full_name, email, role, phone, purok, department, position, status, legacy_user_id, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'elena.ramos@kinilis.gov.ph'),
    'Nurse Elena Ramos',
    'elena.ramos@kinilis.gov.ph',
    'staff',
    '0922-111-9988',
    'Purok 4, Brgy. Kinilis',
    'Barangay Health Center',
    'Head Nurse',
    'Active',
    5,
    '2026-11-13 16:05:22'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    purok = EXCLUDED.purok,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    status = EXCLUDED.status,
    legacy_user_id = EXCLUDED.legacy_user_id;

-- -------------------------------------------------------------------------
-- 4. COMPLAINTS (9 Registered Records)
-- Notes on Data Integrity:
-- - Complaints 1-5 were filed by registered Resident Juan dela Cruz (resident_id = User 1).
-- - Complaints 6-9 were guest submissions where resident_id is genuinely NULL in MySQL.
--   We preserve resident_id = NULL exactly as recorded in the original source database.
-- -------------------------------------------------------------------------

INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'KIN-2026-000123',
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Garbage not collected along Purok 3 main street',
    'Unhygienic uncollected garbage piles left for 4 days near the corner store causing foul smell and attracting stray animals.',
    'Waste Management',
    'Medium',
    'In Progress',
    'Purok 3, Main Street, Brgy. Kinilis',
    '2026-04-26',
    '10:30 AM',
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    '0917-123-4567',
    'Phone',
    '2026-11-16 00:05:22',
    FALSE,
    'Dispatched 6-wheeler waste management truck to site.',
    1,
    '2026-11-13 16:05:22',
    '2026-11-13 16:05:22'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000002',
    'KIN-2026-000122',
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Deep pothole hazard on Purok 1 access road',
    'Large damaged road section causing motorcycle accidents near the elementary school perimeter line.',
    'Infrastructure',
    'High',
    'Assigned',
    'Purok 1 Road near Elementary School',
    '2026-04-25',
    '02:15 PM',
    'Pedro Penduko',
    'pedro@kinilis.gov.ph',
    '0918-999-8877',
    'SMS',
    '2026-11-15 00:05:22',
    FALSE,
    'Site inspection scheduled for tomorrow morning.',
    2,
    '2026-11-13 16:05:22',
    '2026-11-13 16:05:22'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000003',
    'KIN-2026-000121',
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Loud videoke past midnight at Purok 4',
    'Continuous loud music and videoke noise past 12:00 AM disturbing sleep on a weekday night.',
    'Peace & Order',
    'Low',
    'Submitted',
    'Purok 4 near basketball court',
    '2026-04-24',
    '11:45 PM',
    'Maria Clara',
    'maria.clara@kinilis.gov.ph',
    '0920-111-2233',
    'Phone',
    '2026-11-17 00:05:22',
    FALSE,
    'Pending Tanod night patrol assignment.',
    3,
    '2026-11-13 16:05:22',
    '2026-11-13 16:05:22'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000004',
    'KIN-2026-000120',
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Stagnant water breeding dengue mosquitoes in vacant lot',
    'Large open puddle and dumped tires holding stagnant rainwater after heavy typhoon downpour.',
    'Health Services',
    'High',
    'Resolved',
    'Purok 2 interior access path',
    '2026-04-22',
    '09:00 AM',
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    '0917-123-4567',
    'Email',
    '2026-11-13 00:05:22',
    FALSE,
    'Operation successful with zero new fever reports.',
    4,
    '2026-11-13 16:05:22',
    '2026-11-13 16:05:22'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000005',
    'KIN-2026-000118',
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Flash flooding risk due to clogged drainage culvert',
    'Heavy rain causes overflowing canal into 3 houses near Purok 5 bridge line due to trapped logs and trash.',
    'Infrastructure',
    'Urgent',
    'In Progress',
    'Purok 5 Drainage Canal near Creek Bridge',
    '2026-04-21',
    '08:30 AM',
    'Santanina Santos',
    'santanina@kinilis.gov.ph',
    '0919-888-7766',
    'Phone',
    '2026-11-14 12:05:22',
    FALSE,
    'Heavy machinery clearing debris currently.',
    5,
    '2026-11-13 16:05:22',
    '2026-11-13 16:05:22'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000006',
    'KIN-2026-000106',
    NULL,
    'Garbage not collected along Purok 3',
    'Piles of trash left on street',
    'Waste Management',
    'Medium',
    'Submitted',
    'Purok 3',
    '2026-11-13',
    '05:16 PM',
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    '',
    'Phone',
    '2026-11-16 17:16:57',
    FALSE,
    NULL,
    6,
    '2026-11-13 16:16:57',
    '2026-11-13 16:16:57'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'KIN-2026-000107',
    NULL,
    'Broken streetlamp pole sparking at Purok 2',
    'Electrical streetlamp is sparking intermittently near residential houses creating a fire risk.',
    'Infrastructure',
    'Urgent',
    'In Progress',
    'Purok 2 near basketball court',
    '2026-04-27',
    '08:00 PM',
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    '0917-111-2222',
    'Phone',
    '2026-11-14 17:16:57',
    FALSE,
    'Maintenance team dispatched with cherry picker truck',
    7,
    '2026-11-13 16:16:57',
    '2026-11-13 16:16:58'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000008',
    'KIN-2026-000108',
    NULL,
    'Garbage not collected along Purok 3',
    'Piles of trash left on street',
    'Waste Management',
    'Medium',
    'Submitted',
    'Purok 3',
    '2026-11-13',
    '05:17 PM',
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    '',
    'Phone',
    '2026-11-16 17:17:16',
    FALSE,
    NULL,
    8,
    '2026-11-13 16:17:16',
    '2026-11-13 16:17:16'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;
INSERT INTO public.complaints (
    id, reference_no, resident_id, title, description, category, priority, status,
    location, incident_date, incident_time, resident_name, resident_email, resident_phone,
    preferred_contact, target_resolution_date, is_overdue, remarks, legacy_complaint_id,
    submitted_at, updated_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'KIN-2026-000109',
    NULL,
    'Broken streetlamp pole sparking at Purok 2',
    'Electrical streetlamp is sparking intermittently near residential houses creating a fire risk.',
    'Infrastructure',
    'Urgent',
    'Resolved',
    'Purok 2 near basketball court',
    '2026-04-27',
    '08:00 PM',
    'Juan dela Cruz',
    'juan.delacruz@kinilis.gov.ph',
    '0917-111-2222',
    'Phone',
    '2026-11-14 17:17:17',
    FALSE,
    'Maintenance team dispatched with cherry picker truck',
    9,
    '2026-11-13 16:17:17',
    '2026-11-13 16:17:17'
) ON CONFLICT (reference_no) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    location = EXCLUDED.location,
    resident_name = EXCLUDED.resident_name,
    submitted_at = EXCLUDED.submitted_at;

-- -------------------------------------------------------------------------
-- 5. COMPLAINT STATUS HISTORY (19 Audit Milestones)
-- -------------------------------------------------------------------------

INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'Submitted',
    'Complaint Submitted',
    'Complaint registered online by resident Juan dela Cruz.',
    'Juan dela Cruz',
    'Resident',
    '2026-04-26 02:30:00'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'Under Review',
    'AI Classification Completed',
    'Classification engine suggested category Waste Management (92% confidence).',
    'System AI',
    'System',
    '2026-04-26 02:30:05'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'Assigned',
    'Department Assignment',
    'Routed to Sanitation Department under officer Maria Santos.',
    'Admin Desk',
    'Admin',
    '2026-04-26 02:35:00'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'Acknowledged',
    'Complaint Acknowledged',
    'Acknowledged by Maria Santos (Sanitation Officer).',
    'Maria Santos',
    'Staff',
    '2026-04-26 03:00:00'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'In Progress',
    'Field Dispatch',
    'Sanitation truck dispatched to clear Purok 3 main street.',
    'Maria Santos',
    'Staff',
    '2026-04-26 03:20:00'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000006',
    'Submitted',
    'Complaint Submitted',
    'Complaint registered online by Juan dela Cruz.',
    'Juan dela Cruz',
    'Resident',
    '2026-11-13 16:16:57'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000006',
    'Under Review',
    'AI Classified & Routed',
    'Automatically classified as Waste Management (94% confidence) and routed to Sanitation Department.',
    'System AI',
    'System',
    '2026-11-13 16:16:57'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'Submitted',
    'Complaint Submitted',
    'Complaint registered online by Juan dela Cruz.',
    'Juan dela Cruz',
    'Resident',
    '2026-11-13 16:16:57'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'Under Review',
    'AI Classified & Routed',
    'Automatically classified as Infrastructure (84% confidence) and routed to Infrastructure & Public Works.',
    'System AI',
    'System',
    '2026-11-13 16:16:57'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'In Progress',
    'Status Updated to In Progress',
    'Maintenance team dispatched with cherry picker truck',
    'Engr. Roberto Cruz',
    'Staff',
    '2026-11-13 16:16:58'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'In Progress',
    'Follow-up Information Added',
    'staff Engr. Roberto Cruz: Electrician is on site replacing the luminaire and securing wires.',
    'Engr. Roberto Cruz',
    'staff',
    '2026-11-13 16:16:58'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000008',
    'Submitted',
    'Complaint Submitted',
    'Complaint registered online by Juan dela Cruz.',
    'Juan dela Cruz',
    'Resident',
    '2026-11-13 16:17:16'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000008',
    'Under Review',
    'AI Classified & Routed',
    'Automatically classified as Waste Management (94% confidence) and routed to Sanitation Department.',
    'System AI',
    'System',
    '2026-11-13 16:17:16'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Submitted',
    'Complaint Submitted',
    'Complaint registered online by Juan dela Cruz.',
    'Juan dela Cruz',
    'Resident',
    '2026-11-13 16:17:17'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Under Review',
    'AI Classified & Routed',
    'Automatically classified as Infrastructure (84% confidence) and routed to Infrastructure & Public Works.',
    'System AI',
    'System',
    '2026-11-13 16:17:17'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'In Progress',
    'Status Updated to In Progress',
    'Maintenance team dispatched with cherry picker truck',
    'Engr. Roberto Cruz',
    'Staff',
    '2026-11-13 16:17:17'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'In Progress',
    'Follow-up Information Added',
    'staff Engr. Roberto Cruz: Electrician is on site replacing the luminaire and securing wires.',
    'Engr. Roberto Cruz',
    'staff',
    '2026-11-13 16:17:17'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Resolution Submitted',
    'Resolution Submitted by Staff',
    'Action taken: Replaced damaged photocell sensor, re-wired live connector, fully tested and working.. Awaiting resident review and verification.',
    'Engr. Roberto Cruz',
    'Staff',
    '2026-11-13 16:17:17'
);
INSERT INTO public.complaint_status_history (
    complaint_id, status, action_title, description, performed_by_name, performed_by_role, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Resolved',
    'Resident Verified Resolution',
    'Resident Juan dela Cruz verified and accepted resolution with a 5-star rating (Satisfied).',
    'Juan dela Cruz',
    'Resident',
    '2026-11-13 16:17:17'
);

-- -------------------------------------------------------------------------
-- 6. COMPLAINT ASSIGNMENTS (8 Dispatched Routing Records)
-- -------------------------------------------------------------------------

INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'Sanitation Department',
    'Maria Santos',
    'Admin Desk',
    'Automatically Routed',
    'Dispatched 6-wheeler truck',
    '2026-11-13 16:05:22',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000002',
    'Infrastructure & Public Works',
    'Engr. Roberto Cruz',
    'Admin Desk',
    'Automatically Routed',
    'Scheduled road patching',
    '2026-11-13 16:05:22',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000004',
    'Barangay Health Center',
    'Nurse Elena Ramos',
    'Admin Desk',
    'Automatically Routed',
    'Scheduled fogging operation',
    '2026-11-13 16:05:22',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000005',
    'Infrastructure & Public Works',
    'Engr. Roberto Cruz',
    'Admin Desk',
    'Escalated Urgently',
    'Emergency backhoe clearing',
    '2026-11-13 16:05:22',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000006',
    'Sanitation Department',
    'Maria Santos (Sanitation Officer)',
    'Classification Engine',
    'Automatically Routed',
    'Auto-routed based on Waste Management indicators.',
    '2026-11-13 16:16:57',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'Infrastructure & Public Works',
    'Engr. Roberto Cruz',
    'Classification Engine',
    'Automatically Routed',
    'Auto-routed based on Infrastructure indicators.',
    '2026-11-13 16:16:57',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000008',
    'Sanitation Department',
    'Maria Santos (Sanitation Officer)',
    'Classification Engine',
    'Automatically Routed',
    'Auto-routed based on Waste Management indicators.',
    '2026-11-13 16:17:16',
    TRUE
);
INSERT INTO public.complaint_assignments (
    complaint_id, department_name, assigned_staff, assigned_by_name, routing_status, notes, assigned_at, is_active
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Infrastructure & Public Works',
    'Engr. Roberto Cruz',
    'Classification Engine',
    'Automatically Routed',
    'Auto-routed based on Infrastructure indicators.',
    '2026-11-13 16:17:17',
    TRUE
);

-- -------------------------------------------------------------------------
-- 7. COMPLAINT RESOLUTIONS (2 Official Resolution Entries)
-- -------------------------------------------------------------------------

INSERT INTO public.complaint_resolutions (
    complaint_id, resolved_by, summary, evidence_url, resolved_at
) VALUES (
    'c0000000-0000-4000-8000-000000000004',
    'Nurse Elena Ramos',
    'Fogging conducted across all 4 streets of Purok 2. 50 dengue prevention kits turned over to Purok Leader.',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80',
    '2026-04-23 08:00:00'
) ON CONFLICT (complaint_id) DO UPDATE SET
    resolved_by = EXCLUDED.resolved_by,
    summary = EXCLUDED.summary,
    evidence_url = EXCLUDED.evidence_url,
    resolved_at = EXCLUDED.resolved_at;
INSERT INTO public.complaint_resolutions (
    complaint_id, resolved_by, summary, evidence_url, resolved_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Engr. Roberto Cruz',
    'Replaced damaged photocell sensor, re-wired live connector, fully tested and working.',
    NULL,
    '2026-11-13 16:17:17'
) ON CONFLICT (complaint_id) DO UPDATE SET
    resolved_by = EXCLUDED.resolved_by,
    summary = EXCLUDED.summary,
    evidence_url = EXCLUDED.evidence_url,
    resolved_at = EXCLUDED.resolved_at;

-- -------------------------------------------------------------------------
-- 8. RESIDENT FEEDBACK (2 Citizen Reviews)
-- -------------------------------------------------------------------------

INSERT INTO public.resident_feedback (
    complaint_id, resident_id, action_status, rating, satisfaction_level, comments, submitted_at
) VALUES (
    'c0000000-0000-4000-8000-000000000004',
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Accepted',
    5,
    'Very Satisfied',
    'Very fast response from the health center team! Thank you Barangay Kinilis!',
    '2026-04-23 09:30:00'
) ON CONFLICT (complaint_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    satisfaction_level = EXCLUDED.satisfaction_level,
    comments = EXCLUDED.comments;
INSERT INTO public.resident_feedback (
    complaint_id, resident_id, action_status, rating, satisfaction_level, comments, submitted_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    NULL,
    'Accepted',
    5,
    'Satisfied',
    'Streetlamp is brightly lit and no more sparks. Thank you barangay!',
    '2026-11-13 16:17:17'
) ON CONFLICT (complaint_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    satisfaction_level = EXCLUDED.satisfaction_level,
    comments = EXCLUDED.comments;

-- -------------------------------------------------------------------------
-- 9. COMPLAINT FOLLOWUPS (2 On-the-Ground Field Updates)
-- -------------------------------------------------------------------------

INSERT INTO public.complaint_followups (
    complaint_id, sender_name, sender_role, message, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'Engr. Roberto Cruz',
    'staff',
    'Electrician is on site replacing the luminaire and securing wires.',
    '2026-11-13 16:16:58'
);
INSERT INTO public.complaint_followups (
    complaint_id, sender_name, sender_role, message, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Engr. Roberto Cruz',
    'staff',
    'Electrician is on site replacing the luminaire and securing wires.',
    '2026-11-13 16:17:17'
);

-- -------------------------------------------------------------------------
-- 10. AI CLASSIFICATION LOGS (4 Classification Records)
-- -------------------------------------------------------------------------

INSERT INTO public.ai_classification_logs (
    complaint_id, category, priority, suggested_department, confidence, reasoning, keywords, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000006',
    'Waste Management',
    'Medium',
    'Sanitation Department',
    94,
    'Classification engine detected key indicators (garbage, trash) relating to waste management concerns in Barangay Kinilis. Automatically routed to Sanitation Department.',
    '["garbage","trash"]'::jsonb,
    '2026-11-13 16:16:57'
);
INSERT INTO public.ai_classification_logs (
    complaint_id, category, priority, suggested_department, confidence, reasoning, keywords, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000007',
    'Infrastructure',
    'Urgent',
    'Infrastructure & Public Works',
    84,
    'Classification engine detected key indicators (broken) relating to infrastructure concerns in Barangay Kinilis. Automatically routed to Infrastructure & Public Works.',
    '["broken"]'::jsonb,
    '2026-11-13 16:16:57'
);
INSERT INTO public.ai_classification_logs (
    complaint_id, category, priority, suggested_department, confidence, reasoning, keywords, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000008',
    'Waste Management',
    'Medium',
    'Sanitation Department',
    94,
    'Classification engine detected key indicators (garbage, trash) relating to waste management concerns in Barangay Kinilis. Automatically routed to Sanitation Department.',
    '["garbage","trash"]'::jsonb,
    '2026-11-13 16:17:16'
);
INSERT INTO public.ai_classification_logs (
    complaint_id, category, priority, suggested_department, confidence, reasoning, keywords, created_at
) VALUES (
    'c0000000-0000-4000-8000-000000000009',
    'Infrastructure',
    'Urgent',
    'Infrastructure & Public Works',
    84,
    'Classification engine detected key indicators (broken) relating to infrastructure concerns in Barangay Kinilis. Automatically routed to Infrastructure & Public Works.',
    '["broken"]'::jsonb,
    '2026-11-13 16:17:17'
);

-- -------------------------------------------------------------------------
-- 11. NOTIFICATIONS (16 System Alerts)
-- -------------------------------------------------------------------------

INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New complaint submitted',
    'KIN-2026-000123 - Garbage not collected along Purok 3 main street',
    'submission',
    'all',
    'KIN-2026-000123',
    FALSE,
    '2026-11-13 16:05:22'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'maria.santos@kinilis.gov.ph'),
    'Complaint routed automatically',
    'Routed to Sanitation Department under Maria Santos',
    'routing',
    'staff',
    'KIN-2026-000123',
    FALSE,
    '2026-11-13 16:05:22'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'juan.delacruz@kinilis.gov.ph'),
    'Status updated to In Progress',
    'KIN-2026-000123 status updated by Maria Santos',
    'status',
    'resident',
    'KIN-2026-000123',
    TRUE,
    '2026-11-13 16:05:22'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Urgent complaint alert',
    'KIN-2026-000118 - Flash flooding risk in Purok 5',
    'urgent',
    'admin',
    'KIN-2026-000118',
    FALSE,
    '2026-11-13 16:05:22'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New complaint submitted',
    'KIN-2026-000106 - Garbage not collected along Purok 3',
    'submission',
    'all',
    'KIN-2026-000106',
    FALSE,
    '2026-11-13 16:16:57'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New complaint submitted',
    'KIN-2026-000107 - Broken streetlamp pole sparking at Purok 2',
    'submission',
    'all',
    'KIN-2026-000107',
    FALSE,
    '2026-11-13 16:16:57'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Urgent complaint alert',
    'KIN-2026-000107 - High alert reported at Purok 2 near basketball court',
    'urgent',
    'admin',
    'KIN-2026-000107',
    FALSE,
    '2026-11-13 16:16:57'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Status updated to In Progress',
    'KIN-2026-000107 status updated by Engr. Roberto Cruz',
    'status',
    'resident',
    'KIN-2026-000107',
    FALSE,
    '2026-11-13 16:16:58'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New Message on Complaint',
    'KIN-2026-000107 - Engr. Roberto Cruz: Electrician is on site replacing the luminaire and securing wires.',
    'followup',
    'resident',
    'KIN-2026-000107',
    FALSE,
    '2026-11-13 16:16:58'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New complaint submitted',
    'KIN-2026-000108 - Garbage not collected along Purok 3',
    'submission',
    'all',
    'KIN-2026-000108',
    FALSE,
    '2026-11-13 16:17:16'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New complaint submitted',
    'KIN-2026-000109 - Broken streetlamp pole sparking at Purok 2',
    'submission',
    'all',
    'KIN-2026-000109',
    FALSE,
    '2026-11-13 16:17:17'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Urgent complaint alert',
    'KIN-2026-000109 - High alert reported at Purok 2 near basketball court',
    'urgent',
    'admin',
    'KIN-2026-000109',
    FALSE,
    '2026-11-13 16:17:17'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Status updated to In Progress',
    'KIN-2026-000109 status updated by Engr. Roberto Cruz',
    'status',
    'resident',
    'KIN-2026-000109',
    FALSE,
    '2026-11-13 16:17:17'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'New Message on Complaint',
    'KIN-2026-000109 - Engr. Roberto Cruz: Electrician is on site replacing the luminaire and securing wires.',
    'followup',
    'resident',
    'KIN-2026-000109',
    FALSE,
    '2026-11-13 16:17:17'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Resolution Submitted for Review',
    'KIN-2026-000109 - Staff submitted resolution details. Please review and verify.',
    'status',
    'resident',
    'KIN-2026-000109',
    FALSE,
    '2026-11-13 16:17:17'
);
INSERT INTO public.notifications (
    user_id, title, message, type, target_role, reference_no, is_read, created_at
) VALUES (
    (SELECT id FROM auth.users WHERE lower(email) = 'admin@kinilis.gov.ph'),
    'Resolution Verified & Accepted',
    'KIN-2026-000109 - Resident Juan dela Cruz verified and accepted resolution with a 5-star rating (Satisfied).',
    'status',
    'staff',
    'KIN-2026-000109',
    FALSE,
    '2026-11-13 16:17:17'
);

-- -------------------------------------------------------------------------
-- 12. AUDIT LOGS (16 Event Trail Records)
-- -------------------------------------------------------------------------

INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'System AI',
    'System',
    'AI Classified & Routed',
    'Classification Engine',
    'KIN-2026-000123',
    'Unclassified',
    'Waste Management -> Sanitation Dept',
    '127.0.0.1',
    '2026-04-26 02:30:05'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Maria Santos',
    'Staff',
    'Acknowledged Complaint',
    'Staff Portal',
    'KIN-2026-000123',
    'Pending',
    'In Progress',
    '127.0.0.1',
    '2026-04-26 03:00:00'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Admin Desk',
    'Admin',
    'Category Mapping Updated',
    'Routing Config',
    'Waste Management Rule',
    'Default Priority: Low',
    'Default Priority: Medium',
    '127.0.0.1',
    '2026-04-25 01:15:00'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Nurse Elena Ramos',
    'Staff',
    'Resolved Complaint',
    'Resolution Engine',
    'KIN-2026-000120',
    'In Progress',
    'Resolved',
    '127.0.0.1',
    '2026-04-23 08:00:00'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Juan dela Cruz',
    'resident',
    'User Signed In',
    'Auth Module',
    'juan.delacruz@kinilis.gov.ph',
    NULL,
    NULL,
    '::1',
    '2026-11-13 16:15:26'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Admin Desk (Capt. Hon. Escabarte)',
    'admin',
    'User Signed In',
    'Auth Module',
    'admin@kinilis.gov.ph',
    NULL,
    NULL,
    '::1',
    '2026-11-13 16:15:44'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Juan dela Cruz',
    'Resident',
    'Registered New Complaint',
    'Submission Module',
    'KIN-2026-000106',
    'None',
    'Waste Management -> Sanitation Department',
    '::1',
    '2026-11-13 16:16:57'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Juan dela Cruz',
    'Resident',
    'Registered New Complaint',
    'Submission Module',
    'KIN-2026-000107',
    'None',
    'Infrastructure -> Infrastructure & Public Works',
    '::1',
    '2026-11-13 16:16:57'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Engr. Roberto Cruz',
    'Staff',
    'Updated Complaint Status',
    'Workflow Engine',
    'KIN-2026-000107',
    'Submitted',
    'In Progress',
    '::1',
    '2026-11-13 16:16:58'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Juan dela Cruz',
    'Resident',
    'Registered New Complaint',
    'Submission Module',
    'KIN-2026-000108',
    'None',
    'Waste Management -> Sanitation Department',
    '::1',
    '2026-11-13 16:17:16'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Juan dela Cruz',
    'Resident',
    'Registered New Complaint',
    'Submission Module',
    'KIN-2026-000109',
    'None',
    'Infrastructure -> Infrastructure & Public Works',
    '::1',
    '2026-11-13 16:17:17'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Engr. Roberto Cruz',
    'Staff',
    'Updated Complaint Status',
    'Workflow Engine',
    'KIN-2026-000109',
    'Submitted',
    'In Progress',
    '::1',
    '2026-11-13 16:17:17'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Engr. Roberto Cruz',
    'Staff',
    'Submitted Complaint Resolution',
    'Resolution Module',
    'KIN-2026-000109',
    'In Progress',
    'Resolution Submitted',
    '::1',
    '2026-11-13 16:17:17'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Juan dela Cruz',
    'Resident',
    'Submitted Resolution Feedback',
    'Verification Module',
    'KIN-2026-000109',
    'Resolution Submitted',
    'Resolved',
    '::1',
    '2026-11-13 16:17:17'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Admin Desk (Capt. Hon. Escabarte)',
    'admin',
    'User Signed In',
    'Auth Module',
    'admin@kinilis.gov.ph',
    NULL,
    NULL,
    '::1',
    '2026-11-13 16:24:38'
);
INSERT INTO public.audit_logs (
    user_name, user_role, action, module, entity_ref, old_value, new_value, ip_address, created_at
) VALUES (
    'Admin Desk (Capt. Hon. Escabarte)',
    'admin',
    'User Signed In',
    'Auth Module',
    'admin@kinilis.gov.ph',
    NULL,
    NULL,
    '::1',
    '2026-11-13 17:04:59'
);

COMMIT;
