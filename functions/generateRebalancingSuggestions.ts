import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { target_allocation } = await req.json();

        // Fetch portfolio
        const investments = await base44.entities.Investment.list();

        if (investments.length === 0) {
            return Response.json({ 
                success: false,
                message: 'No investments to rebalance'
            });
        }

        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);

        // Calculate current allocation
        const currentAllocation = {};
        investments.forEach(inv => {
            const type = inv.asset_type || 'other';
            currentAllocation[type] = (currentAllocation[type] || 0) + (inv.current_value || 0);
        });

        const rebalancing = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate portfolio rebalancing recommendations:

CURRENT PORTFOLIO VALUE: $${totalValue}

CURRENT ALLOCATION:
${Object.entries(currentAllocation).map(([type, value]) => 
    `- ${type}: $${value.toFixed(2)} (${((value / totalValue) * 100).toFixed(1)}%)`
).join('\n')}

CURRENT HOLDINGS:
${investments.map(inv => 
    `- ${inv.name} (${inv.asset_type}): $${inv.current_value} (${((inv.current_value / totalValue) * 100).toFixed(1)}%)`
).join('\n')}

${target_allocation ? `TARGET ALLOCATION:\n${JSON.stringify(target_allocation, null, 2)}` : 'No specific target provided - suggest optimal allocation'}

Provide detailed rebalancing plan:
1. Recommended actions (buy/sell/hold for each holding)
2. Dollar amounts to move
3. Priority order of transactions
4. Tax implications to consider
5. Transaction costs estimate
6. Expected outcome after rebalancing
7. Risk impact of rebalancing
8. Timeline for execution`,
            response_json_schema: {
                type: 'object',
                properties: {
                    rebalancing_needed: { type: 'boolean' },
                    severity: { type: 'string', enum: ['minor', 'moderate', 'significant', 'urgent'] },
                    recommended_actions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                holding: { type: 'string' },
                                action: { type: 'string', enum: ['buy', 'sell', 'hold'] },
                                amount: { type: 'number' },
                                percentage: { type: 'number' },
                                reason: { type: 'string' },
                                priority: { type: 'number' }
                            }
                        }
                    },
                    suggested_allocation: { type: 'object' },
                    total_transactions_value: { type: 'number' },
                    estimated_costs: { type: 'number' },
                    tax_considerations: { type: 'array', items: { type: 'string' } },
                    expected_outcome: { type: 'string' },
                    risk_impact: { type: 'string' },
                    execution_timeline: { type: 'string' },
                    step_by_step_plan: { type: 'array', items: { type: 'string' } },
                    summary: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            rebalancing,
            current_allocation: Object.entries(currentAllocation).reduce((obj, [type, value]) => {
                obj[type] = {
                    value,
                    percentage: (value / totalValue) * 100
                };
                return obj;
            }, {})
        });

    } catch (error) {
        console.error('Rebalancing suggestions error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});