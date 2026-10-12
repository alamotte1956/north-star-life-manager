import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function runs on a schedule (daily) to check and send reminders
        const { manual_payment_id } = await req.json().catch(() => ({}));

        // Use service role for automated checks
        const payments = await base44.asServiceRole.entities.RentPayment.list();
        const schedules = await base44.asServiceRole.entities.PaymentSchedule.filter({ active: true });

        const today = new Date();
        const remindersToSend = [];

        // Check each pending payment
        for (const payment of payments) {
            if (payment.status !== 'pending' && payment.status !== 'overdue') continue;

            const schedule = schedules.find(s => s.property_id === payment.property_id);
            if (!schedule || !schedule.auto_reminder_enabled) continue;

            const dueDate = new Date(payment.due_date);
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            // Send reminder if within reminder window
            if (daysDiff <= schedule.reminder_days_before && daysDiff >= 0 && !payment.reminder_sent) {
                remindersToSend.push({
                    payment,
                    schedule,
                    type: 'reminder',
                    days_until_due: daysDiff
                });
            }

            // Send late notice if past grace period
            if (daysDiff < -schedule.grace_period_days && !payment.late_notice_sent) {
                remindersToSend.push({
                    payment,
                    schedule,
                    type: 'late_notice',
                    days_overdue: Math.abs(daysDiff)
                });
            }

            // Update status to overdue if past due date
            if (daysDiff < 0 && payment.status === 'pending') {
                await base44.asServiceRole.entities.RentPayment.update(payment.id, {
                    status: 'overdue'
                });
            }
        }

        // Generate AI-personalized messages and send
        const results = [];
        for (const reminder of remindersToSend) {
            const { payment, schedule, type, days_until_due, days_overdue } = reminder;

            // Generate personalized message with AI
            const prompt = type === 'reminder'
                ? `Generate a friendly rent payment reminder for a tenant.
                
Property: ${payment.property_name}
Tenant: ${payment.tenant_name}
Amount: $${payment.amount}
Due Date: ${payment.due_date}
Days Until Due: ${days_until_due}

Create a professional, friendly reminder that:
1. Addresses the tenant by name
2. Mentions the property
3. States the amount and due date
4. Thanks them for being a good tenant
5. Provides payment instructions

Keep it warm and respectful.`
                : `Generate a late payment notice for a tenant.

Property: ${payment.property_name}
Tenant: ${payment.tenant_name}
Amount: $${payment.amount}
Due Date: ${payment.due_date}
Days Overdue: ${days_overdue}
Late Fee: ${schedule.late_fee_amount ? '$' + schedule.late_fee_amount : 'None'}

Create a professional but firm late notice that:
1. States rent is overdue
2. Mentions the grace period has passed
3. Lists any late fees
4. Requests immediate payment
5. Mentions potential consequences if not paid
6. Maintains professional tone

Keep it firm but respectful.`;

            const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        subject: { type: 'string' },
                        message: { type: 'string' },
                        tone: { type: 'string' }
                    }
                }
            });

            // Send via email
            if (schedule.reminder_channels.includes('email') && payment.tenant_email) {
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: payment.tenant_email,
                        subject: aiResult.subject,
                        body: aiResult.message
                    });

                    results.push({
                        payment_id: payment.id,
                        channel: 'email',
                        status: 'sent',
                        type
                    });
                } catch (error) {
                    results.push({
                        payment_id: payment.id,
                        channel: 'email',
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            // Send via SMS (placeholder - would need Twilio integration)
            if (schedule.reminder_channels.includes('sms') && payment.tenant_phone) {
                // SMS sending would go here with Twilio
                results.push({
                    payment_id: payment.id,
                    channel: 'sms',
                    status: 'not_implemented'
                });
            }

            // Update payment record
            if (type === 'reminder') {
                await base44.asServiceRole.entities.RentPayment.update(payment.id, {
                    reminder_sent: true,
                    reminder_sent_date: new Date().toISOString()
                });
            } else {
                await base44.asServiceRole.entities.RentPayment.update(payment.id, {
                    late_notice_sent: true,
                    late_notice_count: (payment.late_notice_count || 0) + 1
                });
            }
        }

        return Response.json({
            success: true,
            reminders_sent: results.length,
            results
        });

    } catch (error) {
        console.error('Reminder sending error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});