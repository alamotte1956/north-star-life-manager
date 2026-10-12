import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subscription } = await req.json();

        // Store subscription in user preferences
        const users = await base44.entities.User.filter({ email: user.email });
        
        if (users.length > 0) {
            const userRecord = users[0];
            const preferences = userRecord.preferences || {};
            
            await base44.entities.User.update(userRecord.id, {
                preferences: {
                    ...preferences,
                    push_subscription: subscription
                }
            });
        } else {
            await base44.entities.User.create({
                email: user.email,
                preferences: {
                    push_subscription: subscription
                }
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});