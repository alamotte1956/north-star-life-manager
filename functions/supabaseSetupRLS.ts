import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        );

        // SQL to create documents table with RLS
        const createTableSQL = `
-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_name TEXT NOT NULL,
    family_code TEXT UNIQUE NOT NULL,
    primary_admin_email TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'free',
    storage_quota_gb NUMERIC DEFAULT 5,
    storage_used_gb NUMERIC DEFAULT 0,
    member_limit INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (for family mapping)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
    custom_role_id TEXT,
    phone TEXT,
    profile_picture TEXT,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table with family_id
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    title TEXT,
    category TEXT,
    document_type TEXT,
    extracted_text TEXT,
    extracted_data JSONB,
    expiry_date DATE,
    amount NUMERIC,
    linked_entity_type TEXT,
    linked_entity_id TEXT,
    linked_entity_name TEXT,
    analysis_status TEXT DEFAULT 'pending',
    cabin_related BOOLEAN DEFAULT false,
    ai_summary TEXT,
    key_points TEXT[],
    action_items TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Family members can view family documents" ON public.documents;
DROP POLICY IF EXISTS "Family members can insert family documents" ON public.documents;
DROP POLICY IF EXISTS "Family members can update family documents" ON public.documents;
DROP POLICY IF EXISTS "Family members can delete family documents" ON public.documents;

-- Family RLS policies
DROP POLICY IF EXISTS "Users can view their own family" ON public.families;
DROP POLICY IF EXISTS "Users can update their own family" ON public.families;

CREATE POLICY "Users can view their own family"
    ON public.families FOR SELECT
    USING (id IN (SELECT family_id FROM public.users WHERE email = current_setting('request.headers', true)::json->>'user-email'));

CREATE POLICY "Admins can update their family"
    ON public.families FOR UPDATE
    USING (primary_admin_email = current_setting('request.headers', true)::json->>'user-email');

-- User RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view family members" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (email = current_setting('request.headers', true)::json->>'user-email');

CREATE POLICY "Users can view family members"
    ON public.users FOR SELECT
    USING (family_id IN (SELECT family_id FROM public.users WHERE email = current_setting('request.headers', true)::json->>'user-email'));

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (email = current_setting('request.headers', true)::json->>'user-email');

-- Document RLS policies - Family-based isolation
CREATE POLICY "Family members can view family documents"
    ON public.documents FOR SELECT
    USING (
        family_id IN (SELECT family_id FROM public.users WHERE email = current_setting('request.headers', true)::json->>'user-email')
        OR (family_id IS NULL AND user_email = current_setting('request.headers', true)::json->>'user-email')
    );

CREATE POLICY "Family members can insert family documents"
    ON public.documents FOR INSERT
    WITH CHECK (
        family_id IN (SELECT family_id FROM public.users WHERE email = current_setting('request.headers', true)::json->>'user-email')
        OR (family_id IS NULL AND user_email = current_setting('request.headers', true)::json->>'user-email')
    );

CREATE POLICY "Family members can update family documents"
    ON public.documents FOR UPDATE
    USING (
        family_id IN (SELECT family_id FROM public.users WHERE email = current_setting('request.headers', true)::json->>'user-email')
        OR (family_id IS NULL AND user_email = current_setting('request.headers', true)::json->>'user-email')
    );

CREATE POLICY "Family members can delete family documents"
    ON public.documents FOR DELETE
    USING (
        family_id IN (SELECT family_id FROM public.users WHERE email = current_setting('request.headers', true)::json->>'user-email')
        OR (family_id IS NULL AND user_email = current_setting('request.headers', true)::json->>'user-email')
    );

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies (user-email based folders)
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view family files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete family files" ON storage.objects;

-- Allow users to view their own uploaded files (by folder)
CREATE POLICY "Users can view their own files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'user-email');

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'user-email');

-- Family members can view files from other family members
CREATE POLICY "Family members can view family files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' 
        AND (storage.foldername(name))[1] IN (
            SELECT email FROM public.users 
            WHERE family_id IN (
                SELECT family_id FROM public.users 
                WHERE email = current_setting('request.headers', true)::json->>'user-email'
            )
        )
    );

-- Allow deletion of own files
CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'user-email');

-- Family members can delete family files
CREATE POLICY "Family members can delete family files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents' 
        AND (storage.foldername(name))[1] IN (
            SELECT email FROM public.users 
            WHERE family_id IN (
                SELECT family_id FROM public.users 
                WHERE email = current_setting('request.headers', true)::json->>'user-email'
            )
        )
    );
`;

        return Response.json({
            success: true,
            message: 'RLS setup complete. Run this SQL in your Supabase SQL Editor:',
            sql: createTableSQL,
            instructions: [
                '1. Go to Supabase Dashboard → SQL Editor',
                '2. Create a new query',
                '3. Paste the SQL above',
                '4. Click Run',
                '5. Verify table and policies are created'
            ]
        });

    } catch (error) {
        console.error('Setup RLS error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});