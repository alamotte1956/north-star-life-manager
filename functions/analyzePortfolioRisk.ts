import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all investments
        const investments = await base44.entities.Investment.list();
        
        if (investments.length === 0) {
            return Response.json({ 
                success: false,
                message: 'No investments found to analyze'
            });
        }

        // Fetch financial goals for context
        const goals = await base44.entities.FinancialGoal.list();

        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this investment portfolio for risk and diversification:

PORTFOLIO:
${investments.map(inv => `- ${inv.name}: ${inv.asset_type} ($${inv.current_value}, ${inv.shares} shares @ $${inv.current_price})`).join('\n')}

FINANCIAL GOALS:
${goals.length > 0 ? goals.map(g => `- ${g.title} (${g.goal_type}): Target $${g.target_amount}, Current: $${g.current_amount}`).join('\n') : 'No goals set'}

Provide comprehensive analysis:
1. Overall portfolio risk level (low/moderate/high/very_high)
2. Risk score (0-100)
3. Diversification score (0-100) - how well diversified
4. Asset allocation breakdown
5. Concentration risks (any over-exposure)
6. Sector/asset type distribution
7. Volatility assessment
8. Key risk factors identified
9. Diversification gaps
10. Risk mitigation recommendations`,
            response_json_schema: {
                type: 'object',
                properties: {
                    risk_level: { type: 'string', enum: ['low', 'moderate', 'high', 'very_high'] },
                    risk_score: { type: 'number' },
                    diversification_score: { type: 'number' },
                    asset_allocation: {
                        type: 'object',
                        properties: {
                            stocks: { type: 'number' },
                            bonds: { type: 'number' },
                            crypto: { type: 'number' },
                            real_estate: { type: 'number' },
                            commodities: { type: 'number' },
                            cash: { type: 'number' },
                            other: { type: 'number' }
                        }
                    },
                    concentration_risks: { type: 'array', items: { type: 'string' } },
                    sector_distribution: { type: 'object' },
                    volatility_assessment: { type: 'string' },
                    key_risks: { type: 'array', items: { type: 'string' } },
                    diversification_gaps: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    summary: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            analysis,
            portfolio_value: investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0)
        });

    } catch (error) {
        console.error('Portfolio risk analysis error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});