import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { risk_tolerance, time_horizon, investment_goals } = await req.json();

        // Fetch current portfolio
        const investments = await base44.entities.Investment.list();
        const goals = await base44.entities.FinancialGoal.list();
        
        const currentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);

        const strategy = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate a personalized investment strategy:

INVESTOR PROFILE:
- Risk Tolerance: ${risk_tolerance || 'moderate'}
- Time Horizon: ${time_horizon || 'medium-term (5-10 years)'}
- Investment Goals: ${investment_goals || 'wealth accumulation'}

CURRENT PORTFOLIO:
- Total Value: $${currentValue}
- Number of Holdings: ${investments.length}
${investments.length > 0 ? `- Current Assets:\n${investments.map(inv => `  • ${inv.name} (${inv.asset_type}): $${inv.current_value}`).join('\n')}` : '- No current investments'}

FINANCIAL GOALS:
${goals.length > 0 ? goals.map(g => `- ${g.title}: $${g.target_amount} target by ${g.target_date}`).join('\n') : 'No specific goals set'}

Create comprehensive investment strategy including:
1. Recommended asset allocation percentages
2. Specific investment types to consider
3. Timeline and milestones
4. Expected returns (realistic range)
5. Risk management approach
6. Tax optimization strategies
7. Rebalancing frequency
8. Action steps (prioritized)
9. Things to avoid
10. Long-term wealth building path`,
            response_json_schema: {
                type: 'object',
                properties: {
                    strategy_name: { type: 'string' },
                    recommended_allocation: {
                        type: 'object',
                        properties: {
                            stocks: { type: 'number' },
                            bonds: { type: 'number' },
                            real_estate: { type: 'number' },
                            crypto: { type: 'number' },
                            cash: { type: 'number' },
                            alternative: { type: 'number' }
                        }
                    },
                    investment_types: { type: 'array', items: { type: 'string' } },
                    timeline_milestones: { type: 'array', items: { type: 'string' } },
                    expected_returns: {
                        type: 'object',
                        properties: {
                            conservative: { type: 'string' },
                            moderate: { type: 'string' },
                            aggressive: { type: 'string' }
                        }
                    },
                    risk_management: { type: 'string' },
                    tax_strategies: { type: 'array', items: { type: 'string' } },
                    rebalancing_frequency: { type: 'string' },
                    action_steps: { type: 'array', items: { type: 'string' } },
                    things_to_avoid: { type: 'array', items: { type: 'string' } },
                    wealth_building_path: { type: 'string' },
                    summary: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            strategy
        });

    } catch (error) {
        console.error('Investment strategy generation error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});