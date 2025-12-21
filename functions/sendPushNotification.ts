import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { user_email, title, body, data } = await req.json();

        // Get user's push subscription
        const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
        
        if (!users.length || !users[0].preferences?.push_subscription) {
            return Response.json({ error: 'No subscription found' }, { status: 404 });
        }

        const subscription = JSON.parse(users[0].preferences.push_subscription);

        // Send push notification using Web Push API
        const webpush = (await import('npm:web-push@3.6.6')).default;
        
        webpush.setVapidDetails(
            'mailto:notifications@northstar.app',
            Deno.env.get('VAPID_PUBLIC_KEY'),
            Deno.env.get('VAPID_PRIVATE_KEY')
        );

        const payload = JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            badge: '/badge-96.png',
            data: data || {},
            timestamp: Date.now()
        });

        await webpush.sendNotification(subscription, payload);

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});