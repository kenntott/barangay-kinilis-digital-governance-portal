-- =========================================================================
-- BARANGAY KINILIS DIGITAL GOVERNANCE PORTAL
-- FILE 3: PRIVATE STORAGE BUCKETS & ACCESS POLICIES
-- Strict Zero-Public-Read on Resident Evidence and Sensitive Proofs
-- Buckets: complaint-evidence (Private), resolution-proofs (Private)
-- =========================================================================

-- 1. Create Private Storage Buckets (if not already created)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-evidence',
    'complaint-evidence',
    false, -- STRICTLY PRIVATE
    10485760, -- 10MB limit
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
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Storage RLS Policies on storage.objects

-- Allow authenticated residents to upload evidence for their own complaints
-- Expected path structure: complaint-evidence/{reference_no}/{filename}
DROP POLICY IF EXISTS "resident_upload_evidence" ON storage.objects;
CREATE POLICY "resident_upload_evidence" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'complaint-evidence'
        AND (
            public.is_staff()
            OR (
                EXISTS (
                    SELECT 1 FROM public.complaints
                    WHERE reference_no = (storage.foldername(name))[1]
                      AND resident_id = auth.uid()
                )
            )
        )
    );

-- Allow residents to download evidence only for complaints they own; Staff & Admin can view all
DROP POLICY IF EXISTS "authenticated_read_evidence" ON storage.objects;
CREATE POLICY "authenticated_read_evidence" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'complaint-evidence'
        AND (
            public.is_staff()
            OR (
                EXISTS (
                    SELECT 1 FROM public.complaints
                    WHERE reference_no = (storage.foldername(name))[1]
                      AND resident_id = auth.uid()
                )
            )
        )
    );

-- Resolution proofs: Only Staff and Admin can upload resolution evidence
DROP POLICY IF EXISTS "staff_upload_resolution_proof" ON storage.objects;
CREATE POLICY "staff_upload_resolution_proof" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'resolution-proofs'
        AND public.is_staff()
    );

-- Resolution proofs: Resident can download proof if it belongs to their resolved complaint; Staff/Admin can view
DROP POLICY IF EXISTS "read_resolution_proof" ON storage.objects;
CREATE POLICY "read_resolution_proof" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'resolution-proofs'
        AND (
            public.is_staff()
            OR (
                EXISTS (
                    SELECT 1 FROM public.complaints
                    WHERE reference_no = (storage.foldername(name))[1]
                      AND resident_id = auth.uid()
                )
            )
        )
    );
