import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all active subscriptions
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            created_by: user.email,
            status: 'active'
        });

        // Get notification rules
        const rules = await base44.asServiceRole.entities.Automation.filter({
            created_by: user.email,
            trigger_type: 'email',
            action_type: 'send_notification',
            enabled: true
        });

        const today = new Date();
        const notifications = [];

        for (const sub of subscriptions) {
            if (!sub.next_billing_date) continue;

            const billingDate = new Date(sub.next_billing_date);
            const daysUntil = Math.ceil((billingDate - today) / (1000 * 60 * 60 * 24));

            // Check if any rule should trigger
            for (const rule of rules) {
                const notifyBefore = rule.action_config?.notify_days_before || 5;
                
                if (daysUntil <= notifyBefore && daysUntil > 0) {
                    // Send notification
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        subject: `Subscription Renewal Reminder: ${sub.name}`,
                        body: `Your subscription to ${sub.name} will renew in ${daysUntil} days on ${sub.next_billing_date}.
                        
Amount: $${sub.billing_amount}
Frequency: ${sub.billing_frequency}

Manage your subscriptions: ${Deno.env.get('BASE_URL') || 'https://app.base44.com'}/Subscriptions`
                    });

                    notifications.push({
                        subscription: sub.name,
                        days_until: daysUntil,
                        amount: sub.billing_amount
                    });
                }
            }
        }

        return Response.json({
            success: true,
            checked: subscriptions.length,
            notifications_sent: notifications.length,
            notifications
        });

    } catch (error) {
        console.error('Renewal check error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});