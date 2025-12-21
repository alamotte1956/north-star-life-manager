import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await base44.entities.User.filter({ email: user.email });
        
        if (users.length > 0) {
            const userRecord = users[0];
            const preferences = userRecord.preferences || {};
            delete preferences.push_subscription;
            
            await base44.entities.User.update(userRecord.id, {
                preferences
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error removing subscription:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});