import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Master Admin can update users
        if (user.user_type !== 'master_admin' && user.role !== 'admin') {
            return Response.json({ error: 'Access denied. Master Admin only.' }, { status: 403 });
        }

        const { userId, userData } = await req.json();

        // Use service role to update user
        await base44.asServiceRole.entities.User.update(userId, userData);

        return Response.json({ 
            success: true
        });

    } catch (error) {
        console.error('Update user error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});