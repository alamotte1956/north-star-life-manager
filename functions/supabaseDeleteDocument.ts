import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_id } = await req.json();

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        );

        // Get document to verify ownership and get file path
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', document_id)
            .eq('user_email', user.email)
            .single();

        if (fetchError || !doc) {
            return Response.json({ error: 'Document not found or access denied' }, { status: 404 });
        }

        // Delete file from storage
        const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([doc.file_path]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
        }

        // Delete from database (RLS ensures only owner can delete)
        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', document_id)
            .eq('user_email', user.email);

        if (deleteError) {
            return Response.json({ error: deleteError.message }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('Delete document error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});