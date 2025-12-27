import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { timeframe = '30' } = await req.json().catch(() => ({}));

        // Fetch recent transactions
        const transactions = await base44.entities.Transaction.list('-date', 500);
        
        // Filter by timeframe
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));
        const recentTransactions = transactions.filter(t => 
            new Date(t.date) >= cutoffDate
        );

        // Fetch properties and vehicles for context
        const properties = await base44.entities.Property.list();
        const vehicles = await base44.entities.Vehicle.list();

        // Build spending summary
        const categorySpending = {};
        const propertySpending = {};
        const vehicleSpending = {};
        let totalSpending = 0;

        recentTransactions.forEach(t => {
            const amount = Math.abs(t.amount);
            totalSpending += amount;

            // Category spending
            if (!categorySpending[t.category]) {
                categorySpending[t.category] = { total: 0, count: 0, transactions: [] };
            }
            categorySpending[t.category].total += amount;
            categorySpending[t.category].count += 1;
            categorySpending[t.category].transactions.push(t);

            // Property spending
            if (t.linked_entity_type === 'Property' && t.linked_entity_name) {
                if (!propertySpending[t.linked_entity_name]) {
                    propertySpending[t.linked_entity_name] = { total: 0, count: 0 };
                }
                propertySpending[t.linked_entity_name].total += amount;
                propertySpending[t.linked_entity_name].count += 1;
            }

            // Vehicle spending
            if (t.linked_entity_type === 'Vehicle' && t.linked_entity_name) {
                if (!vehicleSpending[t.linked_entity_name]) {
                    vehicleSpending[t.linked_entity_name] = { total: 0, count: 0 };
                }
                vehicleSpending[t.linked_entity_name].total += amount;
                vehicleSpending[t.linked_entity_name].count += 1;
            }
        });

        // Generate AI insights
        const prompt = `Analyze this spending data and provide actionable insights.

Time Period: Last ${timeframe} days
Total Spending: $${totalSpending.toFixed(2)}
Number of Transactions: ${recentTransactions.length}

Spending by Category:
${Object.entries(categorySpending).map(([cat, data]) => 
    `- ${cat}: $${data.total.toFixed(2)} (${data.count} transactions, ${((data.total/totalSpending)*100).toFixed(1)}%)`
).join('\n')}

${Object.keys(propertySpending).length > 0 ? `
Property Spending:
${Object.entries(propertySpending).map(([name, data]) => 
    `- ${name}: $${data.total.toFixed(2)} (${data.count} transactions)`
).join('\n')}
` : ''}

${Object.keys(vehicleSpending).length > 0 ? `
Vehicle Spending:
${Object.entries(vehicleSpending).map(([name, data]) => 
    `- ${name}: $${data.total.toFixed(2)} (${data.count} transactions)`
).join('\n')}
` : ''}

Provide:
1. Key spending trends
2. Unusual spending patterns or anomalies
3. Cost-saving opportunities
4. Budget recommendations
5. Category insights
6. Property/vehicle cost warnings if applicable`;

        const insights = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    key_trends: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    anomalies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                description: { type: 'string' },
                                severity: {
                                    type: 'string',
                                    enum: ['low', 'medium', 'high']
                                }
                            }
                        }
                    },
                    cost_savings: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                opportunity: { type: 'string' },
                                estimated_savings: { type: 'number' },
                                action_steps: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                    budget_recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                recommended_budget: { type: 'number' },
                                current_spending: { type: 'number' },
                                reasoning: { type: 'string' }
                            }
                        }
                    },
                    category_insights: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                insight: { type: 'string' },
                                trend: {
                                    type: 'string',
                                    enum: ['increasing', 'stable', 'decreasing']
                                }
                            }
                        }
                    },
                    property_vehicle_warnings: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            timeframe: parseInt(timeframe),
            total_spending: totalSpending,
            transaction_count: recentTransactions.length,
            spending_by_category: categorySpending,
            spending_by_property: propertySpending,
            spending_by_vehicle: vehicleSpending,
            insights
        });

    } catch (error) {
        console.error('Spending insights error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});