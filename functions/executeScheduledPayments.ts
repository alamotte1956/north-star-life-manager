import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all approved payments scheduled for today or earlier
        const today = new Date().toISOString().split('T')[0];
        const scheduledPayments = await base44.entities.ScheduledPayment.filter({ 
            status: 'approved'
        });

        const paymentsToExecute = scheduledPayments.filter(p => p.scheduled_date <= today);

        const results = {
            processed: 0,
            successful: 0,
            failed: 0,
            details: []
        };

        for (const payment of paymentsToExecute) {
            try {
                // Update status to processing
                await base44.entities.ScheduledPayment.update(payment.id, {
                    status: 'processing'
                });

                // SIMULATION: In production, this would integrate with Stripe/Plaid/banking API
                // For now, we'll simulate the payment with 95% success rate
                const simulateSuccess = Math.random() < 0.95;

                if (simulateSuccess) {
                    const confirmationNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    await base44.entities.ScheduledPayment.update(payment.id, {
                        status: 'completed',
                        executed_date: new Date().toISOString(),
                        confirmation_number: confirmationNumber
                    });

                    // Mark bill as paid
                    await base44.entities.BillPayment.update(payment.bill_payment_id, {
                        status: 'paid',
                        paid_date: new Date().toISOString()
                    });

                    results.successful++;
                    results.details.push({
                        bill_name: payment.bill_name,
                        amount: payment.amount,
                        status: 'completed',
                        confirmation: confirmationNumber
                    });
                } else {
                    await base44.entities.ScheduledPayment.update(payment.id, {
                        status: 'failed',
                        failure_reason: 'Payment declined by provider (simulated)'
                    });

                    results.failed++;
                    results.details.push({
                        bill_name: payment.bill_name,
                        amount: payment.amount,
                        status: 'failed',
                        reason: 'Payment declined'
                    });
                }

                results.processed++;
            } catch (error) {
                console.error(`Failed to process payment ${payment.id}:`, error);
                results.failed++;
            }
        }

        return Response.json({
            success: true,
            ...results,
            total_scheduled: paymentsToExecute.length
        });

    } catch (error) {
        console.error('Execute payments error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});