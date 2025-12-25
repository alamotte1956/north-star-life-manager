import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all budget transactions
        const transactions = await base44.entities.BudgetTransaction.filter({
            created_by: user.email
        });

        if (transactions.length < 3) {
            return Response.json({
                success: true,
                detected_recurring: [],
                message: 'Not enough transaction history'
            });
        }

        // Group transactions by description similarity
        const groups = {};
        transactions.forEach(t => {
            const desc = (t.description || '').toLowerCase().trim();
            if (!desc) return;
            
            // Find similar group
            let matched = false;
            for (const groupKey in groups) {
                if (desc.includes(groupKey) || groupKey.includes(desc) || 
                    levenshteinDistance(desc, groupKey) < 3) {
                    groups[groupKey].push(t);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                groups[desc] = [t];
            }
        });

        // Analyze groups for recurring patterns
        const recurringItems = [];
        
        for (const [description, groupTransactions] of Object.entries(groups)) {
            if (groupTransactions.length < 2) continue;

            // Sort by date
            groupTransactions.sort((a, b) => 
                new Date(a.transaction_date) - new Date(b.transaction_date)
            );

            // Calculate intervals between transactions
            const intervals = [];
            for (let i = 1; i < groupTransactions.length; i++) {
                const diff = Math.abs(
                    new Date(groupTransactions[i].transaction_date) - 
                    new Date(groupTransactions[i-1].transaction_date)
                ) / (1000 * 60 * 60 * 24); // days
                intervals.push(diff);
            }

            // Check if intervals are consistent (within 5 days tolerance)
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const isConsistent = intervals.every(int => Math.abs(int - avgInterval) <= 5);

            if (isConsistent && avgInterval >= 20 && avgInterval <= 40) {
                // Likely monthly recurring
                const amounts = groupTransactions.map(t => t.amount);
                const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const amountVariance = Math.max(...amounts) - Math.min(...amounts);
                
                // Use AI to categorize and determine if it's a bill or subscription
                const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                    prompt: `Analyze this recurring transaction pattern:
                    
Description: ${groupTransactions[0].description}
Frequency: Every ~${Math.round(avgInterval)} days (monthly)
Average Amount: $${avgAmount.toFixed(2)}
Amount Range: $${Math.min(...amounts).toFixed(2)} - $${Math.max(...amounts).toFixed(2)}
Transaction Count: ${groupTransactions.length}

Determine:
1. Is this a bill or subscription?
2. What category best fits? (utilities, entertainment, insurance, services, etc.)
3. What's the merchant/provider name?
4. Is the amount variance normal or concerning?
5. Provide a confidence score (0-1) that this is truly recurring`,
                    response_json_schema: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['bill', 'subscription'] },
                            category: { type: 'string' },
                            merchant: { type: 'string' },
                            amount_variance_normal: { type: 'boolean' },
                            confidence: { type: 'number' },
                            reasoning: { type: 'string' }
                        }
                    }
                });

                if (aiAnalysis.confidence >= 0.6) {
                    recurringItems.push({
                        description: groupTransactions[0].description,
                        merchant: aiAnalysis.merchant,
                        type: aiAnalysis.type,
                        category: aiAnalysis.category,
                        average_amount: avgAmount,
                        frequency_days: Math.round(avgInterval),
                        transaction_count: groupTransactions.length,
                        amount_variance: amountVariance,
                        variance_normal: aiAnalysis.amount_variance_normal,
                        confidence: aiAnalysis.confidence,
                        reasoning: aiAnalysis.reasoning,
                        last_transaction_date: groupTransactions[groupTransactions.length - 1].transaction_date,
                        next_expected_date: calculateNextDate(
                            groupTransactions[groupTransactions.length - 1].transaction_date,
                            avgInterval
                        ),
                        sample_transactions: groupTransactions.slice(-3).map(t => ({
                            date: t.transaction_date,
                            amount: t.amount
                        }))
                    });
                }
            }
        }

        // Check for anomalies in existing recurring items
        const existingBills = await base44.entities.BillPayment.filter({
            created_by: user.email,
            is_recurring: true
        });

        const existingSubscriptions = await base44.entities.Subscription.filter({
            created_by: user.email,
            status: 'active'
        });

        const anomalies = [];

        // Check bills for anomalies
        for (const bill of existingBills) {
            const relatedTransactions = transactions.filter(t => 
                t.description && bill.bill_name && 
                t.description.toLowerCase().includes(bill.bill_name.toLowerCase())
            ).slice(-5);

            if (relatedTransactions.length >= 2) {
                const amounts = relatedTransactions.map(t => t.amount);
                const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const latestAmount = amounts[amounts.length - 1];
                
                // Check for significant variance (>20%)
                if (Math.abs(latestAmount - avgAmount) / avgAmount > 0.2) {
                    anomalies.push({
                        type: 'amount_change',
                        entity_type: 'bill',
                        entity_id: bill.id,
                        name: bill.bill_name,
                        expected_amount: avgAmount,
                        actual_amount: latestAmount,
                        variance_percent: ((latestAmount - avgAmount) / avgAmount * 100).toFixed(1),
                        severity: Math.abs(latestAmount - avgAmount) / avgAmount > 0.5 ? 'high' : 'medium'
                    });
                }
            }
        }

        return Response.json({
            success: true,
            detected_recurring: recurringItems,
            anomalies,
            total_analyzed: transactions.length
        });

    } catch (error) {
        console.error('Detect recurring bills error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});

// Helper function for string similarity
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

function calculateNextDate(lastDate, intervalDays) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + intervalDays);
    return date.toISOString().split('T')[0];
}