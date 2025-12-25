import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { advice_type, include_accounting_data = true, include_market_data = true } = await req.json();

        // Fetch real-time market data
        let marketData = null;
        if (include_market_data) {
            try {
                const marketResult = await base44.functions.invoke('fetchMarketPrices', {});
                marketData = marketResult.data;
            } catch (error) {
                console.log('Failed to fetch market data:', error);
            }
        }

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

        // Risk profile assessment - Fetch from user preferences
        let userRiskTolerance = user.risk_tolerance || 'medium';
        let userInvestmentHorizon = user.investment_horizon || 'medium-term';
        
        // Override with goal-based assessment if applicable
        const retirementGoal = financialGoals.find(g => g.goal_type === 'retirement');
        if (retirementGoal) {
            const yearsToRetirement = (new Date(retirementGoal.target_date) - now) / (1000 * 60 * 60 * 24 * 365);
            if (yearsToRetirement > 15) userInvestmentHorizon = 'long-term';
            else if (yearsToRetirement > 5) userInvestmentHorizon = 'medium-term';
            else userInvestmentHorizon = 'short-term';
        }
        
        const riskProfile = {
            age: user.age || 40,
            risk_tolerance: userRiskTolerance,
            investment_horizon: userInvestmentHorizon,
            current_volatility: investmentReturn > 10 ? 'high' : investmentReturn > 0 ? 'medium' : 'low'
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

USER RISK PROFILE & PREFERENCES:
- Investment Horizon: ${riskProfile.investment_horizon}
- Risk Tolerance: ${riskProfile.risk_tolerance}
- Current Portfolio Volatility: ${riskProfile.current_volatility}
- Age: ${riskProfile.age}

${marketData ? `
REAL-TIME MARKET DATA:
- S&P 500: ${marketData.sp500} (${marketData.sp500_change >= 0 ? '+' : ''}${marketData.sp500_change}%)
- VTI (Total Market): $${marketData.vti} (${marketData.vti_change >= 0 ? '+' : ''}${marketData.vti_change}%)
- AGG (Bonds): $${marketData.bonds} (${marketData.bonds_change >= 0 ? '+' : ''}${marketData.bonds_change}%)
- Gold: $${marketData.gold} (${marketData.gold_change >= 0 ? '+' : ''}${marketData.gold_change}%)
- Market Sentiment: ${marketData.market_sentiment}
- VIX (Volatility Index): ${marketData.vix}
` : ''}

${accountingData ? `
EXTERNAL ACCOUNTING DATA (${accountingData.source}):
${JSON.stringify(accountingData, null, 2)}
` : ''}

Budget Status:
${budgetStatus.map(b => `- ${b.category}: $${b.spent.toFixed(2)} / $${b.budget} (${b.percentage.toFixed(0)}%)`).join('\n')}

Active Financial Goals (${goalsAnalysis.length}):
${goalsAnalysis.map(g => `- ${g.title} (${g.on_track ? 'ON TRACK' : 'BEHIND'}): ${g.progress}% complete, needs $${g.required_monthly}/month (currently $${g.current_contribution}/month)`).join('\n')}

Category Spending (This Month):
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

Recurring Subscriptions:
${subscriptions.filter(s => s.status === 'active').map(s => `- ${s.name}: $${s.billing_amount}/${s.billing_frequency}`).join('\n')}

Bill Payment Patterns:
${billPayments.filter(b => b.status === 'active').map(b => `- ${b.name}: $${b.amount}/${b.frequency} (Due: ${b.next_due_date || 'Not set'})`).join('\n')}

ADVICE REQUEST: ${advice_type || 'comprehensive financial review with personalized investment recommendations based on risk tolerance and current market conditions'}

CRITICAL INSTRUCTIONS:
1. Analyze spending patterns from budget and bill payment data to identify savings opportunities
2. Suggest specific investment opportunities based on identified potential savings
3. Base ALL investment recommendations on the user's stated risk tolerance and investment horizon
4. **USE REAL-TIME MARKET DATA** to inform investment recommendations and timing
5. Analyze current market sentiment and volatility to suggest optimal entry points
6. Consider sector rotation opportunities based on current market trends
7. Integrate budget optimization with investment strategy - show how reducing certain expenses can fund investments
8. Provide specific rebalancing actions based on current market valuations
9. Highlight diversification opportunities in undervalued sectors

Provide advice in JSON format:
1. financial_health_score - Overall score 1-10
2. health_assessment - Brief assessment (2 sentences)
3. budgeting_advice - Object with:
   - current_status: Brief status
   - recommendations: Array of 3-4 specific actions
   - spending_red_flags: Array of concerning spending patterns
   - optimization_opportunities: Array of ways to optimize spending WITH estimated monthly savings amount
   - potential_monthly_savings: Total estimated savings from optimization opportunities
4. investment_advice - Object with:
   - portfolio_assessment: Brief assessment aligned with user's risk tolerance
   - strategy_recommendations: Array of 4-5 specific investment actions TAILORED to user's risk profile and investment horizon
   - risk_analysis: Risk level assessment and alignment with user's stated risk tolerance
   - diversification_score: Score 1-10
   - recommended_allocations: Object with suggested % allocations (stocks, bonds, real_estate, crypto, cash) - MUST align with risk tolerance (conservative=more bonds/cash, aggressive=more stocks/growth)
   - specific_recommendations: Array of 3-4 specific ETFs/funds to consider with ticker symbols, aligned with risk tolerance
   - rebalancing_advice: When and how to rebalance
   - savings_to_investment_plan: Specific plan to redirect identified budget savings into investments (e.g., "Cancel unused subscription ($50/mo) → invest in VTI")
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
10. proactive_alerts - Array of 3-4 proactive suggestions considering current market conditions and upcoming deadlines (e.g., "Tax season approaching - consider maxing 401k", "Interest rates dropped - refinance mortgage", "Market volatility - opportunity to buy the dip if aligned with risk tolerance")
11. spending_to_investment_opportunities - Array of 3-5 SPECIFIC recommendations linking budget optimization to investment opportunities (e.g., "Reduce dining out by $200/mo → Increase monthly contribution to VTI ETF ($200/mo = $2,400/year + compound growth)")
11. financial_forecast - Object with:
    - six_month_projection: Expected financial position in 6 months
    - one_year_projection: Expected position in 1 year
    - retirement_readiness: Assessment of retirement preparedness
    - net_worth_trajectory: Projected net worth growth
12. tax_optimization - Object with:
    - current_efficiency: Tax efficiency assessment
    - strategies: Array of 2-3 tax optimization strategies
    - estimated_savings: Estimated annual tax savings

IMPORTANT: 
- Be specific, actionable, and encouraging
- Use actual numbers from their data
- For investment recommendations, suggest specific, low-cost index funds and ETFs that match their risk tolerance
- Make clear connections between spending reductions and investment opportunities
- Consider current market conditions (end of 2025) when making recommendations
- Respect the user's stated risk tolerance - don't recommend aggressive investments to conservative investors or vice versa`;

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
                            optimization_opportunities: { type: 'array', items: { type: 'string' } },
                            potential_monthly_savings: { type: 'number' }
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
                            rebalancing_advice: { type: 'string' },
                            savings_to_investment_plan: { type: 'string' }
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
                    spending_to_investment_opportunities: { type: 'array', items: { type: 'string' } },
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