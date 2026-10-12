import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Note: This requires Xero OAuth setup
        // For now, return placeholder indicating setup needed
        
        return Response.json({
            success: false,
            message: 'Xero integration requires OAuth setup. Connect via Integrations page.',
            setup_required: true
        });

    } catch (error) {
        console.error('Xero sync error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});