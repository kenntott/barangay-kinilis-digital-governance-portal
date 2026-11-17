-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- REVIEW REVISION 1: STORAGE BUCKETS & ACCESS POLICIES
-- File: supabase/review/03_storage_buckets_policies.sql
-- Expected Path Format: {reference_no}/{filename} (e.g. KIN-2026-000123/evidence_photo.jpg)
-- Fixes: Eliminates broad staff access, locks down update/delete to Admin,
--        Enforces verified complaint ownership on uploads and downloads.
-- =========================================================================

-- 1. Create Private Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-evidence',
    'complaint-evidence',
    false, -- STRICTLY PRIVATE: No public direct URL access
    10485760, -- 10MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resolution-proofs',
    'resolution-proofs',
    false, -- STRICTLY PRIVATE
    10485760, -- 10MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- -------------------------------------------------------------------------
-- 2. STORAGE POLICIES: COMPLAINT EVIDENCE
-- -------------------------------------------------------------------------

-- Resident upload: Authenticated resident can upload ONLY into the folder named
-- after their own complaint reference number. Staff/Admin can also upload.
DROP POLICY IF EXISTS "resident_upload_evidence" ON storage.objects;
CREATE POLICY "resident_upload_evidence" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'complaint-evidence'
        AND (
            public.is_admin()
            OR (
                public.is_staff() AND EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND (c.category = public.get_auth_department() OR public.is_staff_assigned_to_complaint(c.id, auth.uid()))
                )
            )
            OR (
                EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND c.resident_id = auth.uid()
                )
            )
        )
    );

-- Read evidence: Resident can download ONLY evidence belonging to their own complaint.
-- Staff can download ONLY evidence within their department or assigned complaint.
DROP POLICY IF EXISTS "authenticated_read_evidence" ON storage.objects;
CREATE POLICY "authenticated_read_evidence" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'complaint-evidence'
        AND (
            public.is_admin()
            OR (
                public.is_staff() AND EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND (c.category = public.get_auth_department() OR public.is_staff_assigned_to_complaint(c.id, auth.uid()))
                )
            )
            OR (
                EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND c.resident_id = auth.uid()
                )
            )
        )
    );

-- Tamper-Resistance: Evidence files CANNOT be overwritten or deleted by staff or residents
DROP POLICY IF EXISTS "admin_only_evidence_update" ON storage.objects;
CREATE POLICY "admin_only_evidence_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'complaint-evidence' AND public.is_admin());

DROP POLICY IF EXISTS "admin_only_evidence_delete" ON storage.objects;
CREATE POLICY "admin_only_evidence_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'complaint-evidence' AND public.is_admin());

-- -------------------------------------------------------------------------
-- 3. STORAGE POLICIES: RESOLUTION PROOFS
-- -------------------------------------------------------------------------

-- Staff upload: Only assigned staff or administrators can upload resolution proofs
DROP POLICY IF EXISTS "staff_upload_resolution_proof" ON storage.objects;
CREATE POLICY "staff_upload_resolution_proof" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'resolution-proofs'
        AND (
            public.is_admin()
            OR (
                public.is_staff() AND EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND (c.category = public.get_auth_department() OR public.is_staff_assigned_to_complaint(c.id, auth.uid()))
                )
            )
        )
    );

-- Read proof: The resident whose complaint was resolved, the assigned staff, or the admin
DROP POLICY IF EXISTS "read_resolution_proof" ON storage.objects;
CREATE POLICY "read_resolution_proof" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'resolution-proofs'
        AND (
            public.is_admin()
            OR (
                public.is_staff() AND EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND (c.category = public.get_auth_department() OR public.is_staff_assigned_to_complaint(c.id, auth.uid()))
                )
            )
            OR (
                EXISTS (
                    SELECT 1 FROM public.complaints c
                    WHERE c.reference_no = (storage.foldername(name))[1]
                      AND c.resident_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "admin_only_resolution_update" ON storage.objects;
CREATE POLICY "admin_only_resolution_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'resolution-proofs' AND public.is_admin());

DROP POLICY IF EXISTS "admin_only_resolution_delete" ON storage.objects;
CREATE POLICY "admin_only_resolution_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'resolution-proofs' AND public.is_admin());
