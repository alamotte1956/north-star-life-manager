import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all financial data
        const [transactions, properties, subscriptions, investments, budgets, goals] = await Promise.all([
            base44.asServiceRole.entities.Transaction.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Property.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Subscription.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Investment.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Budget.filter({ created_by: user.email }),
            base44.asServiceRole.entities.FinancialGoal.filter({ created_by: user.email })
        ]);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Calculate current period metrics
        const thisMonthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
        });

        const lastMonthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth;
        });

        const ytdTransactions = transactions.filter(t => {
            return new Date(t.date).getFullYear() === currentYear;
        });

        const income = {
            this_month: thisMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            last_month: lastMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            ytd: ytdTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
        };

        const expenses = {
            this_month: Math.abs(thisMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
            last_month: Math.abs(lastMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
            ytd: Math.abs(ytdTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
        };

        // Category breakdown
        const categoryBreakdown = {};
        ytdTransactions.filter(t => t.amount < 0).forEach(t => {
            const cat = t.category || 'other';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Math.abs(t.amount);
        });

        // Investment portfolio value
        const portfolioValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const portfolioCost = investments.reduce((sum, inv) => sum + (inv.cost_basis || 0), 0);
        const portfolioGain = portfolioValue - portfolioCost;

        // Property portfolio
        const propertyValue = properties.reduce((sum, p) => sum + (p.current_value || 0), 0);
        const propertyRent = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);

        // Prepare data for AI analysis
        const dataSummary = {
            current_metrics: {
                income_this_month: income.this_month,
                expenses_this_month: expenses.this_month,
                net_this_month: income.this_month - expenses.this_month,
                income_ytd: income.ytd,
                expenses_ytd: expenses.ytd,
                net_ytd: income.ytd - expenses.ytd,
                monthly_burn_rate: expenses.this_month
            },
            trends: {
                income_change_mom: income.this_month - income.last_month,
                expense_change_mom: expenses.this_month - expenses.last_month
            },
            portfolio: {
                investment_value: portfolioValue,
                investment_gain: portfolioGain,
                property_value: propertyValue,
                monthly_rental_income: propertyRent
            },
            spending_by_category: categoryBreakdown,
            subscriptions: {
                total: subscriptions.length,
                monthly_cost: subscriptions.filter(s => s.billing_frequency === 'monthly')
                    .reduce((sum, s) => sum + (s.billing_amount || 0), 0)
            },
            goals: goals.map(g => ({
                title: g.title,
                target: g.target_amount,
                current: g.current_amount,
                monthly_contribution: g.monthly_contribution,
                target_date: g.target_date
            })),
            recent_large_expenses: ytdTransactions
                .filter(t => t.amount < -1000)
                .sort((a, b) => a.amount - b.amount)
                .slice(0, 10)
                .map(t => ({ amount: t.amount, category: t.category, description: t.description }))
        };

        // Call AI for comprehensive analysis and forecasting
        const aiInsights = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Analyze this comprehensive financial data and provide detailed insights and forecasting:

${JSON.stringify(dataSummary, null, 2)}

Provide:
1. financial_health_score: Overall financial health (0-100)
2. cash_flow_analysis: Detailed analysis of current cash flow patterns
3. spending_insights: Key insights about spending behavior and patterns
4. income_analysis: Analysis of income sources and stability
5. forecast_3_months: Predicted income, expenses, and net for next 3 months based on historical data
6. forecast_6_months: Predicted metrics for 6 months out
7. forecast_12_months: Predicted metrics for 12 months out
8. savings_rate: Current savings rate percentage
9. recommendations: Array of specific actionable recommendations to improve financial health
10. risk_factors: Array of financial risks or concerns
11. opportunities: Array of opportunities to optimize finances
12. goal_progress_analysis: Assessment of progress toward financial goals
13. budget_recommendations: Suggested budget adjustments based on spending patterns

For forecasts, consider:
- Historical spending patterns
- Known recurring expenses (subscriptions)
- Rental income
- Seasonal variations
- Current trends`,
            response_json_schema: {
                type: "object",
                properties: {
                    financial_health_score: { type: "number" },
                    cash_flow_analysis: { type: "string" },
                    spending_insights: { type: "string" },
                    income_analysis: { type: "string" },
                    forecast_3_months: {
                        type: "object",
                        properties: {
                            income: { type: "number" },
                            expenses: { type: "number" },
                            net: { type: "number" }
                        }
                    },
                    forecast_6_months: {
                        type: "object",
                        properties: {
                            income: { type: "number" },
                            expenses: { type: "number" },
                            net: { type: "number" }
                        }
                    },
                    forecast_12_months: {
                        type: "object",
                        properties: {
                            income: { type: "number" },
                            expenses: { type: "number" },
                            net: { type: "number" }
                        }
                    },
                    savings_rate: { type: "number" },
                    recommendations: { type: "array", items: { type: "string" } },
                    risk_factors: { type: "array", items: { type: "string" } },
                    opportunities: { type: "array", items: { type: "string" } },
                    goal_progress_analysis: { type: "string" },
                    budget_recommendations: { type: "array", items: { type: "string" } }
                }
            }
        });

        return Response.json({
            success: true,
            insights: {
                ...aiInsights,
                current_metrics: {
                    income_this_month: income.this_month,
                    expenses_this_month: expenses.this_month,
                    net_this_month: income.this_month - expenses.this_month,
                    income_ytd: income.ytd,
                    expenses_ytd: expenses.ytd,
                    net_ytd: income.ytd - expenses.ytd,
                    portfolio_value: portfolioValue,
                    portfolio_gain: portfolioGain,
                    property_value: propertyValue,
                    monthly_rent: propertyRent
                },
                category_breakdown: categoryBreakdown,
                trends: {
                    income_change: ((income.this_month - income.last_month) / income.last_month * 100).toFixed(1),
                    expense_change: ((expenses.this_month - expenses.last_month) / expenses.last_month * 100).toFixed(1)
                }
            }
        });

    } catch (error) {
        console.error('Financial insights error:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});