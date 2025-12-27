import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scenario = {} } = await req.json();

        // Fetch all financial data
        const [budgets, budgetTransactions, investments, goals, billPayments, subscriptions, properties, rentPayments] = await Promise.all([
            base44.entities.Budget.filter({}).catch(() => []),
            base44.entities.BudgetTransaction.filter({}).catch(() => []),
            base44.entities.Investment.filter({}).catch(() => []),
            base44.entities.FinancialGoal.filter({}).catch(() => []),
            base44.entities.BillPayment.filter({ status: 'active' }).catch(() => []),
            base44.entities.Subscription.filter({ status: 'active' }).catch(() => []),
            base44.entities.Property.filter({}).catch(() => []),
            base44.entities.RentPayment.filter({}).catch(() => [])
        ]);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Calculate current financial snapshot
        const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalPropertyValue = properties.reduce((sum, prop) => sum + (prop.purchase_price || prop.current_value || 0), 0);
        
        // Calculate monthly income
        const rentalIncome = rentPayments
            .filter(p => p.status === 'completed' && new Date(p.payment_date) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, p) => sum + p.amount, 0);
        
        // Calculate monthly expenses
        const recentTransactions = budgetTransactions.filter(t => 
            new Date(t.transaction_date) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        );
        const monthlyExpenses = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyBills = billPayments.reduce((sum, b) => {
            if (b.frequency === 'monthly') return sum + b.amount;
            if (b.frequency === 'annual') return sum + (b.amount / 12);
            if (b.frequency === 'quarterly') return sum + (b.amount / 3);
            return sum;
        }, 0);
        
        const monthlySubscriptions = subscriptions.reduce((sum, s) => {
            if (s.billing_frequency === 'monthly') return sum + s.billing_amount;
            if (s.billing_frequency === 'annual') return sum + (s.billing_amount / 12);
            if (s.billing_frequency === 'quarterly') return sum + (s.billing_amount / 3);
            return sum;
        }, 0);

        const totalMonthlyExpenses = monthlyExpenses + monthlyBills + monthlySubscriptions;
        const estimatedMonthlyIncome = rentalIncome + (scenario.monthly_income || 8000); // Default estimate
        const monthlySavings = estimatedMonthlyIncome - totalMonthlyExpenses;

        // Build context for AI
        const prompt = `You are a financial forecasting expert. Generate detailed financial projections based on the following data:

CURRENT FINANCIAL SNAPSHOT:
- Total Investment Portfolio Value: $${totalInvestmentValue.toFixed(2)}
- Total Property Value: $${totalPropertyValue.toFixed(2)}
- Current Net Worth: $${(totalInvestmentValue + totalPropertyValue).toFixed(2)}
- Monthly Income: $${estimatedMonthlyIncome.toFixed(2)}
- Monthly Expenses: $${totalMonthlyExpenses.toFixed(2)}
- Monthly Savings: $${monthlySavings.toFixed(2)}
- Savings Rate: ${((monthlySavings / estimatedMonthlyIncome) * 100).toFixed(1)}%

INVESTMENTS BREAKDOWN:
${investments.map(i => `- ${i.name}: $${i.current_value} (${i.asset_type})`).join('\n')}

FINANCIAL GOALS:
${goals.map(g => `- ${g.title}: Target $${g.target_amount} by ${g.target_date} (Current: $${g.current_progress || 0})`).join('\n')}

USER AGE: ${user.age || 40}

SCENARIO ADJUSTMENTS (What-If):
${scenario.monthly_income ? `- Adjusted Monthly Income: $${scenario.monthly_income}` : ''}
${scenario.monthly_savings_increase ? `- Increase Monthly Savings By: $${scenario.monthly_savings_increase}` : ''}
${scenario.investment_return_rate ? `- Expected Investment Return: ${scenario.investment_return_rate}%` : ''}
${scenario.expense_reduction ? `- Reduce Expenses By: $${scenario.expense_reduction}/month` : ''}
${scenario.one_time_windfall ? `- One-Time Windfall: $${scenario.one_time_windfall}` : ''}
${scenario.major_expense ? `- Major Expense in ${scenario.major_expense_year || 'Year 1'}: $${scenario.major_expense}` : ''}

INSTRUCTIONS:
1. Generate projections for 1-year, 5-year, and 10-year time horizons
2. Apply scenario adjustments if provided
3. Use realistic assumptions: 7-10% annual return for stocks, 3-5% for bonds, 2% inflation
4. Consider compound growth for investments
5. Account for monthly savings accumulation
6. Project retirement readiness (assume retirement at age 65)
7. Assess each financial goal's likelihood of achievement
8. Provide milestone predictions (when they'll reach $100K, $500K, $1M net worth)

Return JSON format:
{
    "projections": {
        "one_year": {
            "net_worth": number,
            "investment_value": number,
            "total_saved": number,
            "summary": "brief summary"
        },
        "five_year": {
            "net_worth": number,
            "investment_value": number,
            "total_saved": number,
            "summary": "brief summary"
        },
        "ten_year": {
            "net_worth": number,
            "investment_value": number,
            "total_saved": number,
            "summary": "brief summary"
        }
    },
    "retirement_readiness": {
        "estimated_retirement_savings": number,
        "years_until_retirement": number,
        "monthly_retirement_income_projection": number,
        "retirement_score": number (1-10),
        "assessment": "detailed assessment",
        "recommendations": ["array of recommendations"]
    },
    "goal_projections": [
        {
            "goal_name": "string",
            "current_amount": number,
            "target_amount": number,
            "projected_completion_date": "YYYY-MM-DD",
            "likelihood": "high/medium/low",
            "monthly_contribution_needed": number,
            "on_track": boolean,
            "analysis": "brief analysis"
        }
    ],
    "milestones": [
        {
            "milestone": "Net Worth $100K",
            "projected_date": "YYYY-MM-DD or 'Already achieved'",
            "months_away": number
        }
    ],
    "key_insights": ["array of 4-5 key insights"],
    "risks": ["array of 3-4 potential risks"],
    "opportunities": ["array of 3-4 opportunities"],
    "scenario_impact": "analysis of how the scenario changes outcomes (if scenario provided)"
}

Be realistic and data-driven. Highlight both positive trajectories and areas needing attention.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    projections: {
                        type: 'object',
                        properties: {
                            one_year: {
                                type: 'object',
                                properties: {
                                    net_worth: { type: 'number' },
                                    investment_value: { type: 'number' },
                                    total_saved: { type: 'number' },
                                    summary: { type: 'string' }
                                }
                            },
                            five_year: {
                                type: 'object',
                                properties: {
                                    net_worth: { type: 'number' },
                                    investment_value: { type: 'number' },
                                    total_saved: { type: 'number' },
                                    summary: { type: 'string' }
                                }
                            },
                            ten_year: {
                                type: 'object',
                                properties: {
                                    net_worth: { type: 'number' },
                                    investment_value: { type: 'number' },
                                    total_saved: { type: 'number' },
                                    summary: { type: 'string' }
                                }
                            }
                        }
                    },
                    retirement_readiness: {
                        type: 'object',
                        properties: {
                            estimated_retirement_savings: { type: 'number' },
                            years_until_retirement: { type: 'number' },
                            monthly_retirement_income_projection: { type: 'number' },
                            retirement_score: { type: 'number' },
                            assessment: { type: 'string' },
                            recommendations: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    goal_projections: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                goal_name: { type: 'string' },
                                current_amount: { type: 'number' },
                                target_amount: { type: 'number' },
                                projected_completion_date: { type: 'string' },
                                likelihood: { type: 'string' },
                                monthly_contribution_needed: { type: 'number' },
                                on_track: { type: 'boolean' },
                                analysis: { type: 'string' }
                            }
                        }
                    },
                    milestones: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                milestone: { type: 'string' },
                                projected_date: { type: 'string' },
                                months_away: { type: 'number' }
                            }
                        }
                    },
                    key_insights: { type: 'array', items: { type: 'string' } },
                    risks: { type: 'array', items: { type: 'string' } },
                    opportunities: { type: 'array', items: { type: 'string' } },
                    scenario_impact: { type: 'string' }
                }
            }
        });

        return Response.json({
            status: 'success',
            forecast: result,
            current_snapshot: {
                net_worth: totalInvestmentValue + totalPropertyValue,
                investment_value: totalInvestmentValue,
                property_value: totalPropertyValue,
                monthly_income: estimatedMonthlyIncome,
                monthly_expenses: totalMonthlyExpenses,
                monthly_savings: monthlySavings,
                savings_rate: (monthlySavings / estimatedMonthlyIncome) * 100
            },
            scenario_applied: scenario
        });

    } catch (error) {
        console.error('Forecast generation error:', error);
        return Response.json({ 
            error: error.message,
            status: 'failed'
        }, { status: 500 });
    }
});