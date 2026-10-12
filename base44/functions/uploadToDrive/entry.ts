import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url, file_name } = await req.json();

        if (!file_url || !file_name) {
            return Response.json({ error: 'file_url and file_name required' }, { status: 400 });
        }

        // Get Google Drive access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

        // Download file from URL
        const fileResponse = await fetch(file_url);
        const fileBlob = await fileResponse.blob();

        // Upload to Google Drive
        const metadata = {
            name: file_name,
            mimeType: fileBlob.type
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileBlob);

        const driveResponse = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            }
        );

        if (!driveResponse.ok) {
            throw new Error('Failed to upload to Google Drive');
        }

        const driveFile = await driveResponse.json();

        return Response.json({
            success: true,
            drive_file_id: driveFile.id,
            drive_file_name: driveFile.name,
            message: 'File uploaded to Google Drive'
        });

    } catch (error) {
        console.error('Drive upload error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});