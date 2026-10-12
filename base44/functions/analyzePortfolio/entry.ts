import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all investments and financial goals
        const [investments, goals] = await Promise.all([
            base44.entities.Investment.filter({}),
            base44.entities.FinancialGoal.filter({ status: 'active' })
        ]);

        if (investments.length === 0) {
            return Response.json({ 
                success: false,
                message: 'No investments found to analyze'
            });
        }

        // Calculate portfolio metrics
        const totalValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
        const totalCost = investments.reduce((sum, i) => sum + (i.purchase_price || 0), 0);
        const totalGainLoss = totalValue - totalCost;
        const portfolioReturn = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0;

        // Asset allocation
        const allocation = {};
        investments.forEach(inv => {
            const type = inv.asset_type || 'Other';
            allocation[type] = (allocation[type] || 0) + (inv.current_value || 0);
        });

        // Risk profile
        const riskProfile = {
            high: investments.filter(i => i.risk_level === 'high').reduce((sum, i) => sum + (i.current_value || 0), 0),
            medium: investments.filter(i => i.risk_level === 'medium').reduce((sum, i) => sum + (i.current_value || 0), 0),
            low: investments.filter(i => i.risk_level === 'low').reduce((sum, i) => sum + (i.current_value || 0), 0)
        };

        // Individual performance
        const performanceData = investments.map(inv => {
            const gain = (inv.current_value || 0) - (inv.purchase_price || 0);
            const roi = inv.purchase_price > 0 ? ((gain / inv.purchase_price) * 100) : 0;
            return {
                name: inv.name || inv.symbol,
                symbol: inv.symbol,
                type: inv.asset_type,
                risk_level: inv.risk_level,
                current_value: inv.current_value,
                purchase_price: inv.purchase_price,
                roi: roi,
                gain: gain,
                allocation_percent: totalValue > 0 ? ((inv.current_value / totalValue) * 100) : 0
            };
        });

        // Find user's risk tolerance from goals
        const riskTolerance = goals.length > 0 && goals[0].risk_tolerance ? 
            goals[0].risk_tolerance : 'moderate';

        // AI Analysis
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this investment portfolio and provide comprehensive recommendations:

PORTFOLIO OVERVIEW:
- Total Value: $${totalValue.toLocaleString()}
- Total Cost Basis: $${totalCost.toLocaleString()}
- Total Gain/Loss: $${totalGainLoss.toLocaleString()}
- Portfolio Return: ${portfolioReturn.toFixed(2)}%

ASSET ALLOCATION:
${Object.entries(allocation).map(([type, value]) => 
    `- ${type}: $${value.toLocaleString()} (${((value/totalValue)*100).toFixed(1)}%)`
).join('\n')}

RISK PROFILE:
- High Risk: $${riskProfile.high.toLocaleString()} (${((riskProfile.high/totalValue)*100).toFixed(1)}%)
- Medium Risk: $${riskProfile.medium.toLocaleString()} (${((riskProfile.medium/totalValue)*100).toFixed(1)}%)
- Low Risk: $${riskProfile.low.toLocaleString()} (${((riskProfile.low/totalValue)*100).toFixed(1)}%)

USER RISK TOLERANCE: ${riskTolerance}

INDIVIDUAL HOLDINGS:
${performanceData.map(p => 
    `- ${p.name} (${p.type}): $${p.current_value.toLocaleString()}, ROI: ${p.roi.toFixed(2)}%, Risk: ${p.risk_level}`
).join('\n')}

ACTIVE FINANCIAL GOALS: ${goals.length}

Provide:
1. Overall portfolio health assessment
2. Identify underperforming assets (with specific recommendations)
3. Rebalancing strategy aligned with risk tolerance
4. Diversification recommendations
5. Market trend insights and opportunities
6. Risk management suggestions
7. Specific buy/sell/hold recommendations
8. Tax optimization strategies`,
            response_json_schema: {
                type: 'object',
                properties: {
                    overall_health: {
                        type: 'object',
                        properties: {
                            score: { type: 'number' },
                            rating: { type: 'string', enum: ['poor', 'fair', 'good', 'very_good', 'excellent'] },
                            summary: { type: 'string' }
                        }
                    },
                    underperforming_assets: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                asset_name: { type: 'string' },
                                issue: { type: 'string' },
                                recommendation: { type: 'string' },
                                action: { type: 'string', enum: ['sell', 'hold', 'reduce'] },
                                priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                            }
                        }
                    },
                    rebalancing_strategy: {
                        type: 'object',
                        properties: {
                            needed: { type: 'boolean' },
                            reason: { type: 'string' },
                            target_allocation: { type: 'object' },
                            actions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        action: { type: 'string' },
                                        asset_type: { type: 'string' },
                                        amount: { type: 'string' },
                                        reason: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    diversification_recommendations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    market_insights: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                trend: { type: 'string' },
                                impact: { type: 'string' },
                                opportunity: { type: 'string' }
                            }
                        }
                    },
                    risk_assessment: {
                        type: 'object',
                        properties: {
                            current_risk_level: { type: 'string' },
                            alignment_with_tolerance: { type: 'string' },
                            suggestions: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    buy_opportunities: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                asset_type: { type: 'string' },
                                reason: { type: 'string' },
                                allocation_suggestion: { type: 'string' }
                            }
                        }
                    },
                    tax_optimization: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    immediate_actions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                action: { type: 'string' },
                                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                                expected_impact: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            portfolio_metrics: {
                total_value: totalValue,
                total_cost: totalCost,
                total_gain_loss: totalGainLoss,
                portfolio_return: portfolioReturn,
                asset_allocation: allocation,
                risk_profile: riskProfile
            },
            performance_data: performanceData,
            ai_analysis: analysis
        });

    } catch (error) {
        console.error('Portfolio analysis error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});