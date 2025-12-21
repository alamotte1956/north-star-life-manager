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

        // Enhanced RLS policies for role-based access
        const rlsPolicies = `
-- Drop existing policies
DROP POLICY IF EXISTS documents_family_view ON documents;
DROP POLICY IF EXISTS documents_family_insert ON documents;
DROP POLICY IF EXISTS documents_family_update ON documents;
DROP POLICY IF EXISTS documents_family_delete ON documents;

-- Create function to check user role permissions
CREATE OR REPLACE FUNCTION check_user_document_permission(
    p_user_email TEXT,
    p_family_id TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_role_permissions JSONB;
BEGIN
    -- Get user's base role (admin check)
    SELECT role INTO v_user_role
    FROM users
    WHERE email = p_user_email AND family_id = p_family_id;
    
    -- Admins have all permissions
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Get user's custom role permissions
    SELECT permissions INTO v_role_permissions
    FROM family_member_roles
    WHERE user_email = p_user_email AND family_id = p_family_id;
    
    -- Check if permission exists for action
    IF v_role_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE(
        (v_role_permissions->'documents'->p_action)::BOOLEAN,
        FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View policy with role check
CREATE POLICY documents_family_view ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt()->>'email' 
            AND users.family_id = documents.family_id
        )
        AND check_user_document_permission(
            auth.jwt()->>'email',
            documents.family_id,
            'view'
        )
    );

-- Insert policy with role check
CREATE POLICY documents_family_insert ON documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt()->>'email' 
            AND users.family_id = documents.family_id
        )
        AND check_user_document_permission(
            auth.jwt()->>'email',
            documents.family_id,
            'edit'
        )
    );

-- Update policy with role check
CREATE POLICY documents_family_update ON documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt()->>'email' 
            AND users.family_id = documents.family_id
        )
        AND check_user_document_permission(
            auth.jwt()->>'email',
            documents.family_id,
            'edit'
        )
    );

-- Delete policy with role check
CREATE POLICY documents_family_delete ON documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt()->>'email' 
            AND users.family_id = documents.family_id
        )
        AND check_user_document_permission(
            auth.jwt()->>'email',
            documents.family_id,
            'delete'
        )
    );

-- Similar policies for document_folders table
CREATE POLICY folders_family_view ON document_folders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt()->>'email' 
            AND users.family_id = document_folders.family_id
        )
        AND check_user_document_permission(
            auth.jwt()->>'email',
            document_folders.family_id,
            'view'
        )
    );

CREATE POLICY folders_family_manage ON document_folders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt()->>'email' 
            AND users.family_id = document_folders.family_id
        )
        AND check_user_document_permission(
            auth.jwt()->>'email',
            document_folders.family_id,
            'edit'
        )
    );
`;

        const { error } = await supabase.rpc('exec_sql', { sql: rlsPolicies });

        if (error) {
            console.error('RLS update error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ 
            success: true, 
            message: 'Role-based RLS policies updated successfully' 
        });
    } catch (error) {
        console.error('Error updating RLS:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});