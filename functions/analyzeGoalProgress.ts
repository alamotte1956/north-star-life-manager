import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { goal_id } = await req.json();

        // Get the goal
        const goals = await base44.entities.FinancialGoal.filter({ id: goal_id });
        if (goals.length === 0) {
            return Response.json({ error: 'Goal not found' }, { status: 404 });
        }
        const goal = goals[0];

        // Get all budgets to analyze spending patterns
        const budgets = await base44.entities.Budget.filter({});
        
        // Get all investments
        const investments = await base44.entities.Investment.filter({});
        
        // Get bills and subscriptions
        const bills = await base44.entities.BillPayment.filter({});
        const subscriptions = await base44.entities.Subscription.filter({});

        // Calculate financial metrics
        const monthlyBudgetTotal = budgets.reduce((sum, b) => sum + (b.monthly_limit || 0), 0);
        const monthlySpending = budgets.reduce((sum, b) => sum + (b.current_spending || 0), 0);
        const monthlySavings = monthlyBudgetTotal - monthlySpending;
        
        const totalInvestmentValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
        const monthlyBillCost = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.amount || 0), 0);
        const monthlySubscriptionCost = subscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
        const monthlyFixedCosts = monthlyBillCost + monthlySubscriptionCost;

        // Calculate projected completion
        const remainingAmount = goal.target_amount - goal.current_amount;
        const monthsToGoal = goal.target_date ? 
            Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) : null;
        
        const monthlyContribution = goal.monthly_contribution || 0;
        const projectedMonthsToComplete = monthlyContribution > 0 ? 
            Math.ceil(remainingAmount / monthlyContribution) : null;

        // AI analysis
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this financial goal and provide actionable insights:

Goal: ${goal.goal_name}
Target Amount: $${goal.target_amount}
Current Progress: $${goal.current_amount} (${((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%)
Target Date: ${goal.target_date || 'Not set'}
Monthly Contribution: $${monthlyContribution}

Current Financial Situation:
- Monthly Budget Total: $${monthlyBudgetTotal}
- Monthly Spending: $${monthlySpending}
- Monthly Savings: $${monthlySavings}
- Total Investment Value: $${totalInvestmentValue}
- Monthly Fixed Costs (bills + subscriptions): $${monthlyFixedCosts}
- Months Until Target: ${monthsToGoal || 'Not set'}
- Projected Months to Complete: ${projectedMonthsToComplete || 'Cannot calculate'}

Provide:
1. Whether the goal is on track (based on monthly contribution vs remaining time)
2. Specific recommendations to accelerate progress (budget cuts, investment strategies, income opportunities)
3. Potential obstacles or concerns
4. Suggested adjustments to monthly contribution
5. Timeline reality check (is the target date achievable?)`,
            response_json_schema: {
                type: 'object',
                properties: {
                    on_track: { type: 'boolean' },
                    progress_status: { 
                        type: 'string',
                        enum: ['ahead', 'on_track', 'behind', 'at_risk']
                    },
                    monthly_contribution_recommendation: { type: 'number' },
                    savings_opportunities: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    budget_cut_suggestions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                current_spending: { type: 'number' },
                                recommended_spending: { type: 'number' },
                                monthly_savings: { type: 'number' }
                            }
                        }
                    },
                    investment_strategy: { type: 'string' },
                    obstacles: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    timeline_assessment: { type: 'string' },
                    next_steps: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    ai_summary: { type: 'string' }
                }
            }
        });

        // Calculate impact scenarios
        const scenarios = {
            current_pace: {
                months_to_goal: projectedMonthsToComplete,
                completion_date: projectedMonthsToComplete ? 
                    new Date(Date.now() + projectedMonthsToComplete * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                achieves_target: projectedMonthsToComplete && monthsToGoal ? 
                    projectedMonthsToComplete <= monthsToGoal : null
            },
            recommended_pace: {
                monthly_contribution: analysis.monthly_contribution_recommendation,
                months_to_goal: analysis.monthly_contribution_recommendation > 0 ? 
                    Math.ceil(remainingAmount / analysis.monthly_contribution_recommendation) : null,
                achieves_target: true
            },
            aggressive: {
                monthly_contribution: monthlyContribution * 1.5,
                months_to_goal: Math.ceil(remainingAmount / (monthlyContribution * 1.5)),
                savings_increase_needed: monthlyContribution * 0.5
            }
        };

        return Response.json({
            success: true,
            goal,
            financial_snapshot: {
                monthly_budget: monthlyBudgetTotal,
                monthly_spending: monthlySpending,
                monthly_savings: monthlySavings,
                total_investments: totalInvestmentValue,
                monthly_fixed_costs: monthlyFixedCosts
            },
            progress: {
                current_amount: goal.current_amount,
                target_amount: goal.target_amount,
                percentage: ((goal.current_amount / goal.target_amount) * 100).toFixed(1),
                remaining: remainingAmount,
                months_to_target: monthsToGoal,
                projected_months_to_complete: projectedMonthsToComplete
            },
            analysis,
            scenarios
        });

    } catch (error) {
        console.error('Goal analysis error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});