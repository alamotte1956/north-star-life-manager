import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch portfolio
        const investments = await base44.entities.Investment.list();

        if (investments.length === 0) {
            return Response.json({ 
                success: false,
                message: 'No investments to monitor'
            });
        }

        const assetTypes = [...new Set(investments.map(inv => inv.asset_type))];
        const topHoldings = investments
            .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
            .slice(0, 5);

        const monitoring = await base44.integrations.Core.InvokeLLM({
            prompt: `Monitor market trends and provide portfolio alerts:

USER'S PORTFOLIO HOLDINGS:
${investments.map(inv => `- ${inv.name} (${inv.asset_type}): ${inv.shares} shares @ $${inv.current_price}, Total: $${inv.current_value}`).join('\n')}

TOP HOLDINGS:
${topHoldings.map(inv => `- ${inv.name}: $${inv.current_value} (${((inv.current_value / investments.reduce((sum, i) => sum + i.current_value, 0)) * 100).toFixed(1)}%)`).join('\n')}

ASSET TYPES IN PORTFOLIO: ${assetTypes.join(', ')}

Using current market data and trends:
1. Identify any immediate risks or opportunities for these holdings
2. Assess market sentiment for each asset type
3. Flag any concerning trends (sector issues, market volatility, economic factors)
4. Provide actionable opportunities
5. Risk alerts with severity levels
6. Timing recommendations (buy/sell/hold)`,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    overall_market_sentiment: { type: 'string', enum: ['bullish', 'neutral', 'bearish', 'very_bearish'] },
                    alerts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['risk', 'opportunity', 'warning', 'info'] },
                                severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                                title: { type: 'string' },
                                message: { type: 'string' },
                                affected_holdings: { type: 'array', items: { type: 'string' } },
                                recommended_action: { type: 'string' },
                                time_sensitivity: { type: 'string' }
                            }
                        }
                    },
                    market_trends: {
                        type: 'object',
                        properties: {
                            stocks: { type: 'string' },
                            bonds: { type: 'string' },
                            crypto: { type: 'string' },
                            real_estate: { type: 'string' }
                        }
                    },
                    opportunities: { type: 'array', items: { type: 'string' } },
                    risk_factors: { type: 'array', items: { type: 'string' } },
                    timing_recommendations: { type: 'array', items: { type: 'string' } },
                    summary: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            monitoring,
            monitored_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Market monitoring error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});