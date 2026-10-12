import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { timeframe_days = 90 } = await req.json();

        // Fetch recent transactions
        const allTransactions = await base44.entities.Transaction.list();
        
        // Filter to timeframe
        const cutoffDate = new Date(Date.now() - timeframe_days * 24 * 60 * 60 * 1000);
        const transactions = allTransactions.filter(t => 
            new Date(t.date) >= cutoffDate
        );

        if (transactions.length === 0) {
            return Response.json({
                success: true,
                anomalies: [],
                message: 'No transactions found in specified timeframe'
            });
        }

        // Calculate statistical baselines
        const categoryStats = {};
        transactions.forEach(t => {
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = {
                    amounts: [],
                    merchants: new Set(),
                    count: 0,
                    total: 0
                };
            }
            categoryStats[t.category].amounts.push(Math.abs(t.amount));
            categoryStats[t.category].merchants.add(t.merchant);
            categoryStats[t.category].count++;
            categoryStats[t.category].total += Math.abs(t.amount);
        });

        // Calculate averages and standard deviations
        Object.keys(categoryStats).forEach(category => {
            const amounts = categoryStats[category].amounts;
            const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
            const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
            const stdDev = Math.sqrt(variance);
            
            categoryStats[category].average = avg;
            categoryStats[category].std_dev = stdDev;
            categoryStats[category].median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
        });

        // Prepare data for AI analysis
        const transactionSummary = transactions.map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            merchant: t.merchant,
            amount: t.amount,
            category: t.category,
            account: t.account,
            linked_entity: t.linked_entity_name
        }));

        // AI Anomaly Detection
        const analysisPrompt = `You are a financial fraud detection and error identification expert. Analyze these transactions for anomalies.

Transaction Data:
${JSON.stringify(transactionSummary, null, 2)}

Category Statistics (for baseline comparison):
${JSON.stringify(categoryStats, null, 2)}

Identify anomalies including:
1. **Unusual Amounts**: Transactions significantly larger than normal for that category (>2 standard deviations)
2. **Duplicate Transactions**: Same merchant, similar amounts, within short timeframe
3. **Suspicious Patterns**: Unusual transaction sequences or timing
4. **Category Mismatches**: Transactions that seem miscategorized based on description/merchant
5. **Potential Fraud**: Unknown merchants, unusual purchase patterns, geographic anomalies
6. **Data Entry Errors**: Decimal point errors, typos, missing negative signs
7. **Outliers**: Any transaction that stands out statistically

For each anomaly found, provide:
- Transaction ID
- Anomaly type (fraud_risk, duplicate, data_error, unusual_amount, suspicious_pattern, category_mismatch)
- Severity (low, medium, high, critical)
- Confidence score (0-100%)
- Detailed explanation
- Recommended action
- Related transactions (if applicable)

Return a JSON array of anomalies, sorted by severity and confidence.`;

        const aiResult = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    anomalies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                transaction_id: { type: 'string' },
                                transaction_description: { type: 'string' },
                                merchant: { type: 'string' },
                                amount: { type: 'number' },
                                date: { type: 'string' },
                                anomaly_type: { 
                                    type: 'string',
                                    enum: ['fraud_risk', 'duplicate', 'data_error', 'unusual_amount', 'suspicious_pattern', 'category_mismatch', 'outlier']
                                },
                                severity: { 
                                    type: 'string',
                                    enum: ['low', 'medium', 'high', 'critical']
                                },
                                confidence_score: { type: 'number' },
                                explanation: { type: 'string' },
                                recommended_action: { type: 'string' },
                                related_transaction_ids: { 
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                expected_value: { type: 'number' },
                                deviation_from_norm: { type: 'string' }
                            }
                        }
                    },
                    summary: {
                        type: 'object',
                        properties: {
                            total_anomalies: { type: 'number' },
                            critical_count: { type: 'number' },
                            high_count: { type: 'number' },
                            potential_fraud_count: { type: 'number' },
                            potential_errors_count: { type: 'number' },
                            estimated_financial_impact: { type: 'number' },
                            recommendations: { type: 'array', items: { type: 'string' } }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            timeframe_days,
            transactions_analyzed: transactions.length,
            category_baselines: categoryStats,
            ...aiResult
        });

    } catch (error) {
        console.error('Anomaly detection error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});