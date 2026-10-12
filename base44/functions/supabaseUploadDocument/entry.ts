import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');
        const documentMetadata = JSON.parse(formData.get('metadata') || '{}');

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Initialize Supabase with service role for upload (RLS still enforced via user_id)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        );

        // Create unique file path with user isolation
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.email}/${Date.now()}_${crypto.randomUUID()}.${fileExt}`;

        // Upload to Supabase Storage bucket 'documents'
        const fileBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return Response.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL (with RLS, only owner can access)
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

        // Get user's family_id from Base44
        const base44Users = await base44.entities.User.filter({ email: user.email });
        const family_id = base44Users[0]?.family_id;

        // Store metadata in Supabase database with RLS
        const { data: docRecord, error: dbError } = await supabase
            .from('documents')
            .insert({
                user_email: user.email,
                family_id: family_id,
                file_name: file.name,
                file_path: fileName,
                file_url: publicUrl,
                file_size: file.size,
                file_type: file.type,
                title: documentMetadata.title || file.name,
                category: documentMetadata.category || 'other',
                linked_entity_type: documentMetadata.linked_entity_type,
                linked_entity_id: documentMetadata.linked_entity_id,
                analysis_status: 'pending'
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Cleanup uploaded file if DB insert fails
            await supabase.storage.from('documents').remove([fileName]);
            return Response.json({ error: dbError.message }, { status: 500 });
        }

        // Also create in Base44 for backward compatibility
        await base44.entities.Document.create({
            title: documentMetadata.title || file.name,
            file_url: publicUrl,
            category: documentMetadata.category || 'other',
            linked_entity_type: documentMetadata.linked_entity_type,
            linked_entity_id: documentMetadata.linked_entity_id,
            linked_entity_name: documentMetadata.linked_entity_name,
            analysis_status: 'pending',
            supabase_doc_id: docRecord.id
        });

        // Trigger AI analysis
        if (file.type.includes('pdf') || file.type.includes('image')) {
            await base44.asServiceRole.functions.invoke('analyzeDocument', {
                document_id: docRecord.id,
                file_url: publicUrl,
                is_supabase: true
            });
        }

        return Response.json({
            success: true,
            document: docRecord,
            file_url: publicUrl
        });

    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});