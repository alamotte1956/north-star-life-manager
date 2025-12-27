import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { 
            tenant_email, 
            property_id, 
            property_name,
            notification_type, 
            title, 
            message, 
            priority = 'medium',
            action_url,
            metadata 
        } = await req.json();

        // Check tenant's notification preferences
        const prefs = await base44.asServiceRole.entities.TenantNotificationPreference.filter({ 
            tenant_email 
        });

        const preferences = prefs[0] || { in_app_enabled: true };

        // Check if this notification type is enabled
        const typeEnabled = preferences[`${notification_type}_enabled`];
        
        if (typeEnabled === false) {
            return Response.json({ 
                success: true, 
                message: 'Notification skipped (disabled by user)' 
            });
        }

        // Create in-app notification
        if (preferences.in_app_enabled !== false) {
            await base44.asServiceRole.entities.TenantNotification.create({
                tenant_email,
                property_id,
                property_name,
                notification_type,
                title,
                message,
                priority,
                action_url,
                metadata,
                read: false
            });
        }

        // Send email notification if enabled
        if (preferences.email_enabled) {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: tenant_email,
                subject: title,
                body: message
            });
        }

        return Response.json({ 
            success: true, 
            message: 'Notification created successfully' 
        });

    } catch (error) {
        console.error('Create notification error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});