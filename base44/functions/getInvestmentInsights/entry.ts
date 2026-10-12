import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all user data
        const [investments, goals, transactions] = await Promise.all([
            base44.entities.Investment.list(),
            base44.entities.FinancialGoal.list(),
            base44.entities.Transaction.list('-date', 100)
        ]);

        // Calculate portfolio metrics
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalCost = investments.reduce((sum, inv) => sum + (inv.cost_basis || 0), 0);
        const totalGainLoss = totalValue - totalCost;
        const totalReturn = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0;

        // Asset allocation
        const allocation = {};
        investments.forEach(inv => {
            const type = inv.asset_type || 'other';
            allocation[type] = (allocation[type] || 0) + (inv.current_value || 0);
        });

        const allocationPercent = {};
        Object.entries(allocation).forEach(([type, value]) => {
            allocationPercent[type] = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;
        });

        // Account types
        const accountTypes = {};
        investments.forEach(inv => {
            const type = inv.account_type || 'other';
            accountTypes[type] = (accountTypes[type] || 0) + (inv.current_value || 0);
        });

        // Investment goals
        const investmentGoals = goals.filter(g => 
            g.goal_type === 'investment' || g.goal_type === 'retirement'
        );

        // Recent investment transactions
        const investmentTransactions = transactions.filter(t => 
            t.category === 'investment' || t.description?.toLowerCase().includes('invest')
        );

        const avgMonthlyInvestment = investmentTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0) / Math.max(investmentTransactions.length, 1);

        // Generate AI insights
        const prompt = `You are a financial advisor. Analyze this investment portfolio and provide personalized insights and recommendations.

Portfolio Overview:
- Total Value: $${totalValue.toLocaleString()}
- Total Cost Basis: $${totalCost.toLocaleString()}
- Total Gain/Loss: $${totalGainLoss.toLocaleString()} (${totalReturn.toFixed(2)}%)
- Number of Holdings: ${investments.length}

Asset Allocation:
${Object.entries(allocationPercent).map(([type, pct]) => `- ${type}: ${pct}%`).join('\n')}

Account Types:
${Object.entries(accountTypes).map(([type, value]) => `- ${type}: $${value.toLocaleString()}`).join('\n')}

Investment Goals:
${investmentGoals.map(g => `- ${g.title}: Target $${g.target_amount.toLocaleString()}, Current: $${g.current_amount.toLocaleString()}`).join('\n') || 'None set'}

Average Monthly Investment: $${avgMonthlyInvestment.toFixed(2)}

Top Holdings:
${investments.slice(0, 5).map(inv => 
    `- ${inv.ticker_symbol || inv.account_name}: $${(inv.current_value || 0).toLocaleString()} (${inv.unrealized_gain_loss_percent?.toFixed(1)}%)`
).join('\n')}

Provide analysis in JSON format with:
1. overall_assessment - Brief portfolio health assessment (2-3 sentences)
2. diversification_score - Score from 1-10
3. diversification_analysis - Analysis of diversification (2 sentences)
4. rebalancing_suggestions - Array of 2-3 specific rebalancing actions
5. risk_analysis - Brief risk assessment (2 sentences)
6. opportunities - Array of 2-3 investment opportunities based on current allocation
7. action_items - Array of 3-4 specific actionable next steps

Keep all text concise and actionable.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    overall_assessment: { type: 'string' },
                    diversification_score: { type: 'number' },
                    diversification_analysis: { type: 'string' },
                    rebalancing_suggestions: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    risk_analysis: { type: 'string' },
                    opportunities: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    action_items: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            insights: result,
            portfolio_metrics: {
                total_value: totalValue,
                total_cost: totalCost,
                total_gain_loss: totalGainLoss,
                total_return_percent: totalReturn,
                allocation: allocationPercent,
                holdings_count: investments.length
            }
        });

    } catch (error) {
        console.error('Investment insights error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});