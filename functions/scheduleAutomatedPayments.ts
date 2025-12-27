import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all pending bills
        const bills = await base44.entities.BillPayment.filter({ status: 'pending' });
        
        // Get user's payment methods
        const paymentMethods = await base44.entities.PaymentMethod.filter({ 
            user_email: user.email,
            status: 'active'
        });

        if (paymentMethods.length === 0) {
            return Response.json({ 
                success: false,
                message: 'No active payment methods found',
                bills_analyzed: bills.length,
                payments_scheduled: 0
            });
        }

        const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];

        // Get existing scheduled payments to avoid duplicates
        const existingScheduled = await base44.entities.ScheduledPayment.filter({});
        const scheduledBillIds = new Set(existingScheduled.map(sp => sp.bill_payment_id));

        const today = new Date();
        const paymentsToSchedule = [];

        // AI Analysis for each bill
        for (const bill of bills) {
            // Skip if already scheduled
            if (scheduledBillIds.has(bill.id)) continue;

            const dueDate = new Date(bill.due_date);
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            // Only schedule bills due within 30 days
            if (daysUntilDue < 0 || daysUntilDue > 30) continue;

            // AI determines optimal payment date and whether approval is needed
            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this bill and determine the optimal payment schedule:

Bill Name: ${bill.bill_name}
Amount: $${bill.amount}
Due Date: ${bill.due_date}
Days Until Due: ${daysUntilDue}
Category: ${bill.category || 'Unknown'}
Is Recurring: ${bill.is_recurring || false}

Determine:
1. Optimal payment date (suggest 2-3 days before due date for safety)
2. Whether manual approval should be required based on amount
3. Confidence level in auto-scheduling this payment`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        recommended_payment_date: { type: 'string' },
                        requires_manual_approval: { type: 'boolean' },
                        approval_reason: { type: 'string' },
                        confidence: { type: 'number' },
                        risk_assessment: { type: 'string' }
                    }
                }
            });

            paymentsToSchedule.push({
                bill_payment_id: bill.id,
                bill_name: bill.bill_name,
                amount: bill.amount,
                payment_method_id: defaultPaymentMethod.id,
                scheduled_date: aiAnalysis.recommended_payment_date,
                due_date: bill.due_date,
                status: aiAnalysis.requires_manual_approval ? 'pending_approval' : 'approved',
                requires_approval: aiAnalysis.requires_manual_approval,
                ai_confidence: aiAnalysis.confidence,
                auto_scheduled: true
            });
        }

        // Create scheduled payments
        const created = [];
        for (const payment of paymentsToSchedule) {
            const scheduled = await base44.entities.ScheduledPayment.create(payment);
            created.push(scheduled);
        }

        return Response.json({
            success: true,
            bills_analyzed: bills.length,
            payments_scheduled: created.length,
            pending_approval: created.filter(p => p.status === 'pending_approval').length,
            auto_approved: created.filter(p => p.status === 'approved').length,
            scheduled_payments: created
        });

    } catch (error) {
        console.error('Schedule payments error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});