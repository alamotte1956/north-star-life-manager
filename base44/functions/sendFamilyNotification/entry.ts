import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const {
            family_id,
            recipient_email,
            notification_type,
            title,
            message,
            priority = 'medium',
            action_url,
            metadata,
            triggered_by_email
        } = await req.json();

        // Create notification
        const notification = await base44.asServiceRole.entities.FamilyNotification.create({
            family_id,
            recipient_email,
            notification_type,
            title,
            message,
            priority,
            action_url,
            metadata,
            triggered_by_email
        });

        // Send push notification if recipient has it enabled
        if (recipient_email) {
            try {
                await base44.asServiceRole.functions.invoke('sendPushNotification', {
                    user_email: recipient_email,
                    title,
                    body: message,
                    data: {
                        type: notification_type,
                        notification_id: notification.id,
                        url: action_url || '/FamilyNotifications'
                    }
                });
            } catch (pushError) {
                console.error('Push notification failed:', pushError);
            }
        }

        return Response.json({ success: true, notification });
    } catch (error) {
        console.error('Error sending notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});