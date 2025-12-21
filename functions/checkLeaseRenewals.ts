import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all properties with active leases
        const properties = await base44.asServiceRole.entities.Property.list();
        const today = new Date();
        const notificationsSent = [];

        for (const property of properties) {
            if (!property.lease_end_date || !property.tenant_email) continue;

            const leaseEndDate = new Date(property.lease_end_date);
            const daysUntilExpiry = Math.ceil((leaseEndDate - today) / (1000 * 60 * 60 * 24));

            // Check notification preferences
            const prefs = await base44.asServiceRole.entities.TenantNotificationPreference.filter({
                tenant_email: property.tenant_email
            });
            const preferences = prefs[0] || { lease_expiring_days_before: 60 };
            const notifyDaysBefore = preferences.lease_expiring_days_before || 60;

            // Send notification at configured threshold (e.g., 60 days before)
            if (daysUntilExpiry === notifyDaysBefore && daysUntilExpiry > 0) {
                await base44.asServiceRole.functions.invoke('createTenantNotification', {
                    tenant_email: property.tenant_email,
                    property_id: property.id,
                    property_name: property.name,
                    notification_type: 'lease_expiring',
                    title: 'Lease Expiring Soon',
                    message: `Your lease for ${property.name} expires in ${daysUntilExpiry} days on ${leaseEndDate.toLocaleDateString()}. A renewal offer will be sent soon.`,
                    priority: 'high',
                    metadata: {
                        days_until_expiry: daysUntilExpiry,
                        lease_end_date: property.lease_end_date
                    }
                });

                // Notify property manager
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: property.created_by,
                    subject: `Lease Expiring - ${property.name}`,
                    body: `The lease for ${property.name} (Tenant: ${property.tenant_name}) expires in ${daysUntilExpiry} days. Consider sending a renewal offer.`
                });

                notificationsSent.push({
                    property: property.name,
                    tenant: property.tenant_email,
                    days_until_expiry: daysUntilExpiry
                });
            }
        }

        return Response.json({
            success: true,
            notifications_sent: notificationsSent.length,
            details: notificationsSent
        });

    } catch (error) {
        console.error('Check lease renewals error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});