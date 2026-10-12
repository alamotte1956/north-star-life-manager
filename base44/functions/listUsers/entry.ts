import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Master Admin can list users
        if (user.user_type !== 'master_admin' && user.role !== 'admin') {
            return Response.json({ error: 'Access denied. Master Admin only.' }, { status: 403 });
        }

        // Use service role to list all users
        const users = await base44.asServiceRole.entities.User.list();

        return Response.json({ 
            success: true, 
            users 
        });

    } catch (error) {
        console.error('List users error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});