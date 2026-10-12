import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scheduled_payment_id, action } = await req.json();

        if (!scheduled_payment_id || !action) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the scheduled payment
        const payments = await base44.entities.ScheduledPayment.filter({ id: scheduled_payment_id });
        if (payments.length === 0) {
            return Response.json({ error: 'Payment not found' }, { status: 404 });
        }

        const payment = payments[0];

        if (action === 'approve') {
            await base44.entities.ScheduledPayment.update(scheduled_payment_id, {
                status: 'approved',
                approved_by: user.email,
                approved_date: new Date().toISOString()
            });

            return Response.json({
                success: true,
                message: `Payment of $${payment.amount} for ${payment.bill_name} approved`,
                payment_id: scheduled_payment_id,
                scheduled_date: payment.scheduled_date
            });
        } else if (action === 'reject') {
            await base44.entities.ScheduledPayment.update(scheduled_payment_id, {
                status: 'cancelled'
            });

            return Response.json({
                success: true,
                message: `Payment cancelled`,
                payment_id: scheduled_payment_id
            });
        } else {
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Approve payment error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});