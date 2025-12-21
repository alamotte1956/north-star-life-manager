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
-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
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

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Create RLS policies
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (user_email = current_setting('request.headers', true)::json->>'user-email');

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (user_email = current_setting('request.headers', true)::json->>'user-email');

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (user_email = current_setting('request.headers', true)::json->>'user-email');

CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (user_email = current_setting('request.headers', true)::json->>'user-email');

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

CREATE POLICY "Users can view their own files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'user-email');

CREATE POLICY "Users can upload their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'user-email');

CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'user-email');
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