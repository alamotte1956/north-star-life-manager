import { createClient } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClient(
            Deno.env.get('BASE44_APP_ID'),
            Deno.env.get('BASE44_SERVICE_ROLE_KEY')
        );

        const today = new Date();
        const documents = await base44.entities.Document.list();

        const notifications = [];

        for (const doc of documents) {
            if (!doc.expiry_date) continue;

            const expiryDate = new Date(doc.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            // Get user's notification preferences
            const prefs = await base44.entities.NotificationPreference.filter({ 
                user_email: doc.created_by 
            });
            const userPref = prefs[0];

            const reminderDays = userPref?.document_expiry_days_before || 30;

            // Send notification if within reminder window
            if (daysUntilExpiry > 0 && daysUntilExpiry <= reminderDays) {
                const shouldNotify = !doc.expiry_notification_sent_date || 
                    (new Date(doc.expiry_notification_sent_date).getTime() < today.getTime() - 24 * 60 * 60 * 1000);

                if (shouldNotify) {
                    // Create in-app notification
                    await base44.entities.TenantNotification.create({
                        tenant_email: doc.created_by,
                        notification_type: 'document_expiry',
                        title: `Document Expiring Soon: ${doc.title}`,
                        message: `Your document "${doc.title}" will expire in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString()}.`,
                        priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
                        action_url: '/Vault',
                        metadata: {
                            document_id: doc.id,
                            expiry_date: doc.expiry_date,
                            days_until_expiry: daysUntilExpiry
                        }
                    });

                    // Send email if enabled
                    if (userPref?.email_enabled !== false) {
                        await base44.integrations.Core.SendEmail({
                            to: doc.created_by,
                            subject: `Document Expiring Soon: ${doc.title}`,
                            body: `
Hello,

Your document "${doc.title}" is expiring soon.

Expiry Date: ${expiryDate.toLocaleDateString()}
Days Remaining: ${daysUntilExpiry}
Category: ${doc.category || 'Not specified'}

Please review and renew this document if needed.

Best regards,
North Star Life Manager
                            `
                        });
                    }

                    // Update document to mark notification sent
                    await base44.entities.Document.update(doc.id, {
                        expiry_notification_sent_date: today.toISOString()
                    });

                    notifications.push({
                        document: doc.title,
                        user: doc.created_by,
                        days_until_expiry: daysUntilExpiry
                    });
                }
            }

            // Alert for expired documents
            if (daysUntilExpiry < 0) {
                const shouldNotify = !doc.expired_notification_sent || 
                    (new Date(doc.expired_notification_sent_date || 0).getTime() < today.getTime() - 7 * 24 * 60 * 60 * 1000);

                if (shouldNotify) {
                    await base44.entities.TenantNotification.create({
                        tenant_email: doc.created_by,
                        notification_type: 'document_expiry',
                        title: `Document Expired: ${doc.title}`,
                        message: `Your document "${doc.title}" expired ${Math.abs(daysUntilExpiry)} days ago. Please update or renew.`,
                        priority: 'urgent',
                        action_url: '/Vault',
                        metadata: {
                            document_id: doc.id,
                            expiry_date: doc.expiry_date,
                            days_past_expiry: Math.abs(daysUntilExpiry)
                        }
                    });

                    await base44.entities.Document.update(doc.id, {
                        expired_notification_sent_date: today.toISOString()
                    });
                }
            }
        }

        return Response.json({
            success: true,
            notifications_sent: notifications.length,
            notifications
        });

    } catch (error) {
        console.error('Check document expiry error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});