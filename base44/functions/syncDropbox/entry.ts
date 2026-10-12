import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, document_id } = await req.json();

        const dropboxToken = Deno.env.get('DROPBOX_ACCESS_TOKEN');
        
        if (!dropboxToken) {
            return Response.json({ 
                error: 'Dropbox not connected. Please authorize Dropbox first.' 
            }, { status: 400 });
        }

        if (action === 'backup_document') {
            // Get document from database
            const document = await base44.entities.Document.get(document_id);
            
            if (!document || !document.file_url) {
                throw new Error('Document not found');
            }

            // Download the file
            const fileResponse = await fetch(document.file_url);
            const fileBlob = await fileResponse.arrayBuffer();

            // Upload to Dropbox
            const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${dropboxToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/NorthStar/${document.category}/${document.title}`,
                        mode: 'add',
                        autorename: true
                    })
                },
                body: fileBlob
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.text();
                throw new Error(`Dropbox upload failed: ${error}`);
            }

            const uploadData = await uploadResponse.json();

            // Update document with backup info
            await base44.entities.Document.update(document_id, {
                notes: `${document.notes || ''}\n[Backed up to Dropbox: ${uploadData.path_display}]`
            });

            return Response.json({
                success: true,
                dropbox_path: uploadData.path_display,
                message: 'Document backed up to Dropbox successfully'
            });
        }

        if (action === 'backup_all') {
            const documents = await base44.entities.Document.list();
            let backed_up = 0;

            for (const doc of documents.slice(0, 10)) {
                try {
                    const result = await base44.functions.invoke('syncDropbox', {
                        action: 'backup_document',
                        document_id: doc.id
                    });
                    if (result.data.success) backed_up++;
                } catch (err) {
                    console.error(`Failed to backup ${doc.title}:`, err);
                }
            }

            return Response.json({
                success: true,
                backed_up_count: backed_up,
                total_documents: documents.length,
                message: `Backed up ${backed_up} documents to Dropbox`
            });
        }

        return Response.json({
            success: true,
            message: 'Dropbox integration ready'
        });

    } catch (error) {
        console.error('Dropbox sync error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});