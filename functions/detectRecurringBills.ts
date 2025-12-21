import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all transactions from the last 6 months
        const transactions = await base44.entities.Transaction.list('-date', 500);
        
        // Group transactions by merchant
        const merchantGroups = {};
        transactions.forEach(txn => {
            if (txn.amount < 0 && txn.merchant) { // Only expenses
                if (!merchantGroups[txn.merchant]) {
                    merchantGroups[txn.merchant] = [];
                }
                merchantGroups[txn.merchant].push({
                    date: txn.date,
                    amount: Math.abs(txn.amount),
                    description: txn.description,
                    category: txn.category
                });
            }
        });

        // Analyze each merchant for recurring patterns
        const recurringBills = [];
        
        for (const [merchant, txns] of Object.entries(merchantGroups)) {
            if (txns.length < 2) continue; // Need at least 2 transactions
            
            // Sort by date
            txns.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate intervals between transactions
            const intervals = [];
            for (let i = 1; i < txns.length; i++) {
                const days = Math.round(
                    (new Date(txns[i].date) - new Date(txns[i-1].date)) / (1000 * 60 * 60 * 24)
                );
                intervals.push(days);
            }
            
            // Check if intervals are consistent (within 5 days variance)
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const isRecurring = intervals.every(interval => 
                Math.abs(interval - avgInterval) <= 5
            );
            
            if (isRecurring) {
                // Determine frequency
                let frequency = 'monthly';
                if (avgInterval <= 10) frequency = 'weekly';
                else if (avgInterval <= 17) frequency = 'biweekly';
                else if (avgInterval <= 35) frequency = 'monthly';
                else if (avgInterval <= 100) frequency = 'quarterly';
                else frequency = 'annual';
                
                // Calculate average amount
                const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
                const amountVariance = Math.max(...txns.map(t => t.amount)) - Math.min(...txns.map(t => t.amount));
                
                // Calculate confidence score
                const consistencyScore = intervals.length >= 3 ? 90 : 70;
                const amountConsistency = amountVariance < (avgAmount * 0.1) ? 100 : 80;
                const confidence = Math.round((consistencyScore + amountConsistency) / 2);
                
                // Estimate next payment date
                const lastDate = new Date(txns[txns.length - 1].date);
                const nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + avgInterval);
                
                recurringBills.push({
                    merchant,
                    amount: Math.round(avgAmount * 100) / 100,
                    frequency,
                    category: txns[0].category || 'other',
                    transaction_count: txns.length,
                    avg_interval_days: Math.round(avgInterval),
                    confidence_score: confidence,
                    last_payment_date: txns[txns.length - 1].date,
                    last_amount: txns[txns.length - 1].amount,
                    next_estimated_date: nextDate.toISOString().split('T')[0],
                    due_day: nextDate.getDate()
                });
            }
        }

        // Sort by confidence score
        recurringBills.sort((a, b) => b.confidence_score - a.confidence_score);

        // Check which bills are already saved
        const existingBills = await base44.entities.BillPayment.list();
        const existingMerchants = new Set(existingBills.map(b => b.merchant));
        
        const newBills = recurringBills.filter(b => !existingMerchants.has(b.merchant));

        return Response.json({
            success: true,
            detected_bills: recurringBills,
            new_suggestions: newBills,
            existing_count: existingMerchants.size
        });

    } catch (error) {
        console.error('Detect bills error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});