import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all financial data in parallel
        const [budgets, goals, investments, bills, subscriptions, valuables, budgetTransactions] = await Promise.all([
            base44.entities.Budget.filter({}),
            base44.entities.FinancialGoal.filter({}),
            base44.entities.Investment.filter({}),
            base44.entities.BillPayment.filter({}),
            base44.entities.Subscription.filter({}),
            base44.entities.ValuableItem.filter({}),
            base44.entities.BudgetTransaction.filter({})
        ]);

        // Calculate Net Worth
        const investmentValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
        const valuablesValue = valuables.reduce((sum, v) => sum + (v.estimated_value || 0), 0);
        const netWorth = investmentValue + valuablesValue;

        // Calculate Cash Flow
        const totalBudget = budgets.reduce((sum, b) => sum + (b.monthly_limit || 0), 0);
        const totalSpending = budgets.reduce((sum, b) => sum + (b.current_spending || 0), 0);
        const monthlyRecurring = bills.reduce((sum, b) => sum + (b.amount || 0), 0) + 
                                 subscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
        const monthlyCashFlow = totalBudget - totalSpending - monthlyRecurring;

        // Calculate Budget Adherence Score
        let adherenceScore = 0;
        let adherenceCount = 0;
        budgets.forEach(b => {
            if (b.monthly_limit > 0) {
                const utilization = (b.current_spending / b.monthly_limit) * 100;
                const score = utilization <= 100 ? 100 - utilization : Math.max(0, 100 - (utilization - 100) * 2);
                adherenceScore += score;
                adherenceCount++;
            }
        });
        const finalAdherenceScore = adherenceCount > 0 ? Math.round(adherenceScore / adherenceCount) : 0;

        // Calculate Goal Progress
        const activeGoals = goals.filter(g => g.status === 'active');
        let totalGoalProgress = 0;
        activeGoals.forEach(g => {
            if (g.target_amount > 0) {
                totalGoalProgress += (g.current_amount / g.target_amount) * 100;
            }
        });
        const avgGoalProgress = activeGoals.length > 0 ? totalGoalProgress / activeGoals.length : 0;

        // Budget Performance by Category
        const categoryPerformance = {};
        budgets.forEach(b => {
            const utilization = b.monthly_limit > 0 ? (b.current_spending / b.monthly_limit) * 100 : 0;
            categoryPerformance[b.category] = {
                budget: b.monthly_limit,
                spent: b.current_spending,
                utilization: utilization,
                remaining: b.monthly_limit - b.current_spending,
                status: utilization > 100 ? 'over' : utilization > 80 ? 'warning' : 'good'
            };
        });

        // Investment Performance
        const investmentPerformance = investments.map(i => ({
            name: i.name,
            type: i.type,
            value: i.current_value,
            roi: i.roi || 0,
            risk: i.risk_level
        }));

        // Goal Status
        const goalStatus = activeGoals.map(g => {
            const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const monthsRemaining = g.target_date ? 
                Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : null;
            const requiredMonthly = monthsRemaining && monthsRemaining > 0 ? 
                (g.target_amount - g.current_amount) / monthsRemaining : 0;
            
            return {
                name: g.title,
                type: g.goal_type,
                progress: progress,
                current: g.current_amount,
                target: g.target_amount,
                monthsRemaining: monthsRemaining,
                requiredMonthly: requiredMonthly,
                currentContribution: g.monthly_contribution || 0,
                onTrack: g.monthly_contribution >= requiredMonthly
            };
        });

        // Spending Trends (last 6 months)
        const spendingTrends = {};
        budgetTransactions.forEach(tx => {
            const month = tx.transaction_date?.substring(0, 7);
            if (month) {
                spendingTrends[month] = (spendingTrends[month] || 0) + tx.amount;
            }
        });

        // AI Analysis
        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this comprehensive financial health snapshot and provide actionable insights:

NET WORTH: $${netWorth.toLocaleString()}
- Investments: $${investmentValue.toLocaleString()}
- Valuables: $${valuablesValue.toLocaleString()}

CASH FLOW:
- Monthly Budget: $${totalBudget.toLocaleString()}
- Monthly Spending: $${totalSpending.toLocaleString()}
- Recurring Costs: $${monthlyRecurring.toLocaleString()}
- Net Cash Flow: $${monthlyCashFlow.toLocaleString()}

BUDGET ADHERENCE SCORE: ${finalAdherenceScore}/100

GOAL PROGRESS: ${avgGoalProgress.toFixed(1)}% average across ${activeGoals.length} goals

CATEGORY PERFORMANCE:
${JSON.stringify(categoryPerformance, null, 2)}

INVESTMENT PERFORMANCE:
${JSON.stringify(investmentPerformance, null, 2)}

GOAL STATUS:
${JSON.stringify(goalStatus, null, 2)}

Provide a comprehensive financial health assessment with specific, actionable recommendations.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    overall_health_score: {
                        type: 'number',
                        description: 'Overall financial health score 0-100'
                    },
                    health_rating: {
                        type: 'string',
                        enum: ['excellent', 'good', 'fair', 'needs_improvement', 'critical']
                    },
                    executive_summary: {
                        type: 'string',
                        description: 'Brief overview of financial health'
                    },
                    strengths: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    weaknesses: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    immediate_actions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                action: { type: 'string' },
                                impact: { type: 'string' },
                                priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                            }
                        }
                    },
                    long_term_recommendations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    cash_flow_assessment: {
                        type: 'string'
                    },
                    net_worth_trajectory: {
                        type: 'string',
                        description: 'Predicted net worth growth trajectory'
                    },
                    goal_achievement_likelihood: {
                        type: 'string'
                    },
                    risk_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    opportunities: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            metrics: {
                net_worth: netWorth,
                investment_value: investmentValue,
                valuables_value: valuablesValue,
                monthly_cash_flow: monthlyCashFlow,
                total_budget: totalBudget,
                total_spending: totalSpending,
                recurring_costs: monthlyRecurring,
                budget_adherence_score: finalAdherenceScore,
                goal_progress: avgGoalProgress,
                active_goals_count: activeGoals.length,
                investment_count: investments.length
            },
            category_performance: categoryPerformance,
            investment_performance: investmentPerformance,
            goal_status: goalStatus,
            spending_trends: spendingTrends,
            ai_insights: aiAnalysis
        });

    } catch (error) {
        console.error('Financial health dashboard error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});