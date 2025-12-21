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

        // Get user's family_id
        const base44Users = await base44.entities.User.filter({ email: user.email });
        const family_id = base44Users[0]?.family_id;

        // Get document to verify ownership/family access and get file path
        let docQuery = supabase
            .from('documents')
            .select('*')
            .eq('id', document_id);

        if (family_id) {
            docQuery = docQuery.eq('family_id', family_id);
        } else {
            docQuery = docQuery.eq('user_email', user.email);
        }

        const { data: doc, error: fetchError } = await docQuery.single();

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

        // Delete from database (RLS ensures only family members can delete)
        let deleteQuery = supabase
            .from('documents')
            .delete()
            .eq('id', document_id);

        if (family_id) {
            deleteQuery = deleteQuery.eq('family_id', family_id);
        } else {
            deleteQuery = deleteQuery.eq('user_email', user.email);
        }

        const { error: deleteError } = await deleteQuery;

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