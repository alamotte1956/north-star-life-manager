import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { advice_type, include_accounting_data = true } = await req.json();

        // Fetch comprehensive financial data
        const [
            transactions,
            budgets,
            financialGoals,
            investments,
            billPayments,
            subscriptions
        ] = await Promise.all([
            base44.entities.Transaction.list('-date', 100),
            base44.entities.Budget.list(),
            base44.entities.FinancialGoal.list(),
            base44.entities.Investment.list(),
            base44.entities.BillPayment.list(),
            base44.entities.Subscription.list()
        ]);

        // Fetch external accounting data if requested
        let accountingData = null;
        if (include_accounting_data) {
            try {
                // Try QuickBooks integration
                const qbResult = await base44.functions.invoke('syncQuickBooks', {});
                if (qbResult.data?.success) {
                    accountingData = {
                        source: 'QuickBooks',
                        ...qbResult.data
                    };
                }
            } catch (qbError) {
                // QuickBooks not available, try Xero
                try {
                    const xeroResult = await base44.functions.invoke('syncXero', {});
                    if (xeroResult.data?.success) {
                        accountingData = {
                            source: 'Xero',
                            ...xeroResult.data
                        };
                    }
                } catch (xeroError) {
                    console.log('No accounting software integrated');
                }
            }
        }

        // Calculate financial metrics
        const now = new Date();
        const currentMonth = now.getMonth();
        
        // Income and expenses
        const monthlyIncome = transactions
            .filter(t => t.amount > 0 && new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = Math.abs(transactions
            .filter(t => t.amount < 0 && new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0));

        // Category spending
        const categorySpending = {};
        transactions
            .filter(t => t.amount < 0 && new Date(t.date).getMonth() === currentMonth)
            .forEach(t => {
                categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
            });

        // Budget adherence
        const budgetStatus = budgets.map(b => {
            const spent = categorySpending[b.category] || 0;
            const percentage = (spent / b.amount) * 100;
            return { category: b.category, budget: b.amount, spent, percentage };
        });

        // Investment metrics
        const totalInvestmentValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
        const totalInvestmentCost = investments.reduce((sum, i) => sum + (i.cost_basis || 0), 0);
        const investmentReturn = totalInvestmentCost > 0 ? ((totalInvestmentValue - totalInvestmentCost) / totalInvestmentCost) * 100 : 0;

        // Debt and recurring payments
        const monthlyBills = billPayments
            .filter(b => b.status === 'active')
            .reduce((sum, b) => {
                const monthly = b.frequency === 'monthly' ? b.amount :
                               b.frequency === 'annual' ? b.amount / 12 :
                               b.frequency === 'quarterly' ? b.amount / 3 : 0;
                return sum + monthly;
            }, 0);

        const monthlySubscriptions = subscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => {
                const monthly = s.billing_frequency === 'monthly' ? s.billing_amount :
                               s.billing_frequency === 'annual' ? s.billing_amount / 12 :
                               s.billing_frequency === 'quarterly' ? s.billing_amount / 3 : 0;
                return sum + monthly;
            }, 0);

        // Financial goals progress
        const goalsAnalysis = financialGoals.filter(g => g.status === 'active').map(g => {
            const progress = (g.current_amount / g.target_amount) * 100;
            const targetDate = new Date(g.target_date);
            const monthsRemaining = Math.max(0, (targetDate - now) / (1000 * 60 * 60 * 24 * 30));
            const requiredMonthly = monthsRemaining > 0 ? (g.target_amount - g.current_amount) / monthsRemaining : 0;
            
            return {
                title: g.title,
                progress: progress.toFixed(1),
                current: g.current_amount,
                target: g.target_amount,
                months_remaining: monthsRemaining.toFixed(1),
                required_monthly: requiredMonthly.toFixed(2),
                current_contribution: g.monthly_contribution || 0,
                on_track: g.monthly_contribution >= requiredMonthly * 0.9
            };
        });

        // Financial health score
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
        const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyBills / monthlyIncome) * 100 : 0;

        // Risk profile assessment
        const riskProfile = {
            age: user.age || 40,
            investment_horizon: financialGoals.find(g => g.goal_type === 'retirement') ? 'long-term' : 'medium-term',
            volatility_tolerance: investmentReturn > 10 ? 'high' : investmentReturn > 0 ? 'medium' : 'conservative'
        };

        // Generate AI financial advice
        const advicePrompt = `You are a professional financial advisor and investment strategist. Provide comprehensive, personalized financial advice with actionable recommendations.

CLIENT FINANCIAL PROFILE:
Monthly Income: $${monthlyIncome.toFixed(2)}
Monthly Expenses: $${monthlyExpenses.toFixed(2)}
Net Savings: $${(monthlyIncome - monthlyExpenses).toFixed(2)}
Savings Rate: ${savingsRate.toFixed(1)}%

Monthly Bills: $${monthlyBills.toFixed(2)}
Monthly Subscriptions: $${monthlySubscriptions.toFixed(2)}
Debt-to-Income Ratio: ${debtToIncomeRatio.toFixed(1)}%

Investment Portfolio:
- Total Value: $${totalInvestmentValue.toFixed(2)}
- Total Return: ${investmentReturn.toFixed(1)}%
- Number of Holdings: ${investments.length}
- Asset Types: ${investments.map(i => i.asset_type).join(', ')}

RISK PROFILE:
- Investment Horizon: ${riskProfile.investment_horizon}
- Risk Tolerance: ${riskProfile.volatility_tolerance}

${accountingData ? `
EXTERNAL ACCOUNTING DATA (${accountingData.source}):
${JSON.stringify(accountingData, null, 2)}
` : ''}

Budget Status:
${budgetStatus.map(b => `- ${b.category}: $${b.spent.toFixed(2)} / $${b.budget} (${b.percentage.toFixed(0)}%)`).join('\n')}

Active Financial Goals (${goalsAnalysis.length}):
${goalsAnalysis.map(g => `- ${g.title} (${g.on_track ? 'ON TRACK' : 'BEHIND'}): ${g.progress}% complete, needs $${g.required_monthly}/month (currently $${g.current_contribution}/month)`).join('\n')}

Category Spending:
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

ADVICE REQUEST: ${advice_type || 'comprehensive financial review with investment recommendations'}

Provide advice in JSON format:
1. financial_health_score - Overall score 1-10
2. health_assessment - Brief assessment (2 sentences)
3. budgeting_advice - Object with:
   - current_status: Brief status
   - recommendations: Array of 3-4 specific actions
   - spending_red_flags: Array of concerning spending patterns
   - optimization_opportunities: Array of ways to optimize spending
4. investment_advice - Object with:
   - portfolio_assessment: Brief assessment
   - strategy_recommendations: Array of 4-5 specific investment actions based on risk profile
   - risk_analysis: Risk level and recommendations
   - diversification_score: Score 1-10
   - recommended_allocations: Object with suggested % allocations (stocks, bonds, real_estate, crypto, cash)
   - specific_recommendations: Array of 3-4 specific ETFs/funds to consider with ticker symbols
   - rebalancing_advice: When and how to rebalance
5. debt_management - Object with:
   - current_status: Assessment of debt situation
   - recommendations: Array of 2-3 debt management strategies
   - priority_payments: Array of bills to prioritize
   - consolidation_opportunities: Debt consolidation suggestions if applicable
6. goals_coaching - Object with:
   - overall_progress: Assessment of goal progress
   - recommendations: Array of 3-4 specific actions per goal
   - timeline_adjustments: Suggestions for goal timelines
7. savings_strategy - Object with:
   - recommended_savings_rate: Percentage (15-20% is healthy)
   - emergency_fund_status: Assessment and recommendation
   - automated_savings_plan: Specific plan
   - high_yield_opportunities: Where to park savings for best returns
8. action_plan - Object with:
   - immediate_actions: Array of 3 actions to take this week
   - short_term_actions: Array of 3 actions for this month
   - long_term_actions: Array of 2-3 actions for this quarter
9. estimated_impact - Expected financial improvement in dollars/month
10. proactive_alerts - Array of 3-4 proactive suggestions (e.g., "Tax season approaching - consider maxing 401k", "Interest rates dropped - refinance mortgage")
11. financial_forecast - Object with:
    - six_month_projection: Expected financial position in 6 months
    - one_year_projection: Expected position in 1 year
    - retirement_readiness: Assessment of retirement preparedness
    - net_worth_trajectory: Projected net worth growth
12. tax_optimization - Object with:
    - current_efficiency: Tax efficiency assessment
    - strategies: Array of 2-3 tax optimization strategies
    - estimated_savings: Estimated annual tax savings

Be specific, actionable, and encouraging. Use actual numbers from their data. For investment recommendations, suggest specific, low-cost index funds and ETFs.`;

        const advice = await base44.integrations.Core.InvokeLLM({
            prompt: advicePrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    financial_health_score: { type: 'number' },
                    health_assessment: { type: 'string' },
                    budgeting_advice: {
                        type: 'object',
                        properties: {
                            current_status: { type: 'string' },
                            recommendations: { type: 'array', items: { type: 'string' } },
                            spending_red_flags: { type: 'array', items: { type: 'string' } },
                            optimization_opportunities: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    investment_advice: {
                        type: 'object',
                        properties: {
                            portfolio_assessment: { type: 'string' },
                            strategy_recommendations: { type: 'array', items: { type: 'string' } },
                            risk_analysis: { type: 'string' },
                            diversification_score: { type: 'number' },
                            recommended_allocations: {
                                type: 'object',
                                properties: {
                                    stocks: { type: 'number' },
                                    bonds: { type: 'number' },
                                    real_estate: { type: 'number' },
                                    crypto: { type: 'number' },
                                    cash: { type: 'number' }
                                }
                            },
                            specific_recommendations: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        ticker: { type: 'string' },
                                        allocation: { type: 'number' },
                                        rationale: { type: 'string' }
                                    }
                                }
                            },
                            rebalancing_advice: { type: 'string' }
                        }
                    },
                    debt_management: {
                        type: 'object',
                        properties: {
                            current_status: { type: 'string' },
                            recommendations: { type: 'array', items: { type: 'string' } },
                            priority_payments: { type: 'array', items: { type: 'string' } },
                            consolidation_opportunities: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    goals_coaching: {
                        type: 'object',
                        properties: {
                            overall_progress: { type: 'string' },
                            recommendations: { type: 'array', items: { type: 'string' } },
                            timeline_adjustments: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    savings_strategy: {
                        type: 'object',
                        properties: {
                            recommended_savings_rate: { type: 'number' },
                            emergency_fund_status: { type: 'string' },
                            automated_savings_plan: { type: 'string' },
                            high_yield_opportunities: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    action_plan: {
                        type: 'object',
                        properties: {
                            immediate_actions: { type: 'array', items: { type: 'string' } },
                            short_term_actions: { type: 'array', items: { type: 'string' } },
                            long_term_actions: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    estimated_impact: { type: 'number' },
                    proactive_alerts: { type: 'array', items: { type: 'string' } },
                    financial_forecast: {
                        type: 'object',
                        properties: {
                            six_month_projection: { type: 'string' },
                            one_year_projection: { type: 'string' },
                            retirement_readiness: { type: 'string' },
                            net_worth_trajectory: { type: 'string' }
                        }
                    },
                    tax_optimization: {
                        type: 'object',
                        properties: {
                            current_efficiency: { type: 'string' },
                            strategies: { type: 'array', items: { type: 'string' } },
                            estimated_savings: { type: 'number' }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            advice,
            financial_snapshot: {
                monthly_income: monthlyIncome,
                monthly_expenses: monthlyExpenses,
                net_savings: monthlyIncome - monthlyExpenses,
                savings_rate: savingsRate,
                investment_value: totalInvestmentValue,
                investment_return: investmentReturn,
                monthly_recurring: monthlyBills + monthlySubscriptions,
                debt_to_income: debtToIncomeRatio,
                active_goals: goalsAnalysis.length,
                goals_on_track: goalsAnalysis.filter(g => g.on_track).length
            }
        });

    } catch (error) {
        console.error('Financial advice error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});