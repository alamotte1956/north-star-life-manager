import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // This function runs on a schedule to generate upcoming payment records
        const schedules = await base44.asServiceRole.entities.PaymentSchedule.filter({ active: true });
        
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const generatedPayments = [];

        for (const schedule of schedules) {
            // Check if payment for next period already exists
            const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), schedule.due_day);
            
            // Skip if already generated
            if (schedule.last_payment_generated) {
                const lastGen = new Date(schedule.last_payment_generated);
                if (lastGen >= today) continue;
            }

            // Check if payment already exists for this period
            const existingPayments = await base44.asServiceRole.entities.RentPayment.filter({
                property_id: schedule.property_id,
                due_date: dueDate.toISOString().split('T')[0]
            });

            if (existingPayments.length > 0) continue;

            // Create new payment record
            const payment = await base44.asServiceRole.entities.RentPayment.create({
                property_id: schedule.property_id,
                property_name: schedule.property_name,
                tenant_email: schedule.tenant_email,
                tenant_phone: schedule.tenant_phone,
                amount: schedule.amount,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'pending',
                reminder_sent: false,
                late_notice_sent: false,
                late_notice_count: 0
            });

            // Update schedule
            await base44.asServiceRole.entities.PaymentSchedule.update(schedule.id, {
                last_payment_generated: today.toISOString().split('T')[0]
            });

            generatedPayments.push({
                property_name: schedule.property_name,
                amount: schedule.amount,
                due_date: dueDate.toISOString().split('T')[0]
            });
        }

        return Response.json({
            success: true,
            payments_generated: generatedPayments.length,
            payments: generatedPayments
        });

    } catch (error) {
        console.error('Payment generation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});