import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { startOfMonth, endOfMonth } from 'npm:date-fns';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all active budgets
        const budgets = await base44.asServiceRole.entities.Budget.list();
        
        for (const budget of budgets) {
            const periodStart = new Date(budget.period_start);
            const periodEnd = new Date(budget.period_end);
            const today = new Date();
            
            // Only sync budgets within current period
            if (today < periodStart || today > periodEnd) continue;
            
            // Get existing transactions for this budget
            const existingTransactions = await base44.asServiceRole.entities.BudgetTransaction.filter({
                budget_id: budget.id
            });
            
            const existingBillIds = existingTransactions
                .filter(t => t.source_type === 'bill_payment')
                .map(t => t.source_id);
            
            const existingSubIds = existingTransactions
                .filter(t => t.source_type === 'subscription')
                .map(t => t.source_id);
            
            let totalSpending = 0;
            
            // Sync bill payments
            const bills = await base44.asServiceRole.entities.BillPayment.filter({
                status: 'paid'
            });
            
            for (const bill of bills) {
                if (!bill.due_date) continue;
                
                const billDate = new Date(bill.due_date);
                if (billDate >= periodStart && billDate <= periodEnd) {
                    // Map bill category to budget category
                    if (bill.category === budget.category && !existingBillIds.includes(bill.id)) {
                        // Auto-categorize using AI
                        let aiCategory = budget.category;
                        let aiConfidence = 1.0;
                        try {
                            const catResult = await base44.asServiceRole.functions.invoke('categorizeTransaction', {
                                description: bill.bill_name,
                                merchant: bill.merchant || bill.bill_name,
                                amount: bill.amount,
                                transaction_type: 'budget'
                            });
                            if (catResult.data.success) {
                                aiCategory = catResult.data.category;
                                aiConfidence = catResult.data.confidence;
                            }
                        } catch (error) {
                            console.error('Auto-categorization failed, using budget category');
                        }
                        
                        await base44.asServiceRole.entities.BudgetTransaction.create({
                            budget_id: budget.id,
                            category: aiCategory,
                            amount: bill.amount,
                            description: bill.bill_name,
                            transaction_date: bill.due_date,
                            source_type: 'bill_payment',
                            source_id: bill.id,
                            ai_confidence: aiConfidence
                        });
                        totalSpending += bill.amount;
                    }
                }
            }
            
            // Sync subscriptions
            const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                status: 'active'
            });
            
            for (const sub of subscriptions) {
                if (sub.category === budget.category && !existingSubIds.includes(sub.id)) {
                    // Calculate subscription cost for the period
                    const monthsInPeriod = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24 * 30));
                    const periodCost = (sub.monthly_cost || 0) * monthsInPeriod;
                    
                    await base44.asServiceRole.entities.BudgetTransaction.create({
                        budget_id: budget.id,
                        category: budget.category,
                        amount: periodCost,
                        description: `${sub.name} subscription`,
                        transaction_date: budget.period_start,
                        source_type: 'subscription',
                        source_id: sub.id
                    });
                    totalSpending += periodCost;
                }
            }
            
            // Recalculate total spending from all transactions
            const allTransactions = await base44.asServiceRole.entities.BudgetTransaction.filter({
                budget_id: budget.id
            });
            
            const currentSpending = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            
            // Update budget with current spending
            await base44.asServiceRole.entities.Budget.update(budget.id, {
                current_spending: currentSpending
            });
        }
        
        return Response.json({ success: true, budgets_synced: budgets.length });
        
    } catch (error) {
        console.error('Error syncing budget transactions:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});