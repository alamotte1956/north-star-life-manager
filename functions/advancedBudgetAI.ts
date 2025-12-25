import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all financial data
        const [budgets, budgetTransactions, bills, subscriptions, investments, goals, documents] = await Promise.all([
            base44.entities.Budget.filter({}),
            base44.entities.BudgetTransaction.filter({}),
            base44.entities.BillPayment.filter({}),
            base44.entities.Subscription.filter({}),
            base44.entities.Investment.filter({}),
            base44.entities.FinancialGoal.filter({}),
            base44.entities.Document.filter({ category: 'financial' })
        ]);

        // Calculate spending patterns by category and time
        const spendingByCategory = {};
        const monthlySpending = {};
        
        budgetTransactions.forEach(tx => {
            const category = tx.category || 'other';
            const month = tx.transaction_date?.substring(0, 7) || '';
            
            spendingByCategory[category] = (spendingByCategory[category] || 0) + tx.amount;
            monthlySpending[month] = (monthlySpending[month] || 0) + tx.amount;
        });

        // Calculate budget utilization
        const budgetHealth = budgets.map(b => {
            const utilization = b.monthly_limit > 0 ? (b.current_spending / b.monthly_limit) * 100 : 0;
            const remaining = b.monthly_limit - b.current_spending;
            const daysRemaining = Math.ceil((new Date(b.period_end) - new Date()) / (1000 * 60 * 60 * 24));
            const dailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
            
            return {
                category: b.category,
                utilization,
                remaining,
                dailyBudget,
                daysRemaining,
                limit: b.monthly_limit,
                spent: b.current_spending
            };
        });

        // Calculate recurring costs
        const monthlyBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
        const monthlySubscriptions = subscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
        const totalRecurring = monthlyBills + monthlySubscriptions;

        // Goal pressure analysis
        const activeGoals = goals.filter(g => g.status === 'active');
        const totalMonthlyGoalContributions = activeGoals.reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);

        // Investment income potential
        const totalInvestmentValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
        const avgInvestmentReturn = investments.length > 0 
            ? investments.reduce((sum, i) => sum + ((i.roi || 0) / 100), 0) / investments.length 
            : 0;

        // Recent financial documents for income/expense prediction
        const recentFinancialDocs = documents
            .filter(d => d.extracted_data?.total_amount)
            .slice(0, 10);

        // Build comprehensive financial snapshot
        const financialSnapshot = {
            total_monthly_budget: budgets.reduce((sum, b) => sum + b.monthly_limit, 0),
            total_monthly_spending: budgets.reduce((sum, b) => sum + b.current_spending, 0),
            monthly_recurring_costs: totalRecurring,
            monthly_goal_contributions: totalMonthlyGoalContributions,
            investment_portfolio_value: totalInvestmentValue,
            avg_investment_return: avgInvestmentReturn,
            spending_by_category: spendingByCategory,
            monthly_spending_trend: monthlySpending,
            budget_health: budgetHealth,
            active_goals_count: activeGoals.length,
            high_priority_goals: activeGoals.filter(g => g.priority === 'high').length
        };

        // Advanced AI Analysis
        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an advanced financial AI advisor. Analyze this comprehensive financial data and provide detailed, actionable insights.

FINANCIAL SNAPSHOT:
${JSON.stringify(financialSnapshot, null, 2)}

RECENT FINANCIAL DOCUMENTS:
${JSON.stringify(recentFinancialDocs.map(d => ({
    type: d.document_type,
    amount: d.extracted_data?.total_amount,
    date: d.extracted_data?.transaction_date,
    vendor: d.extracted_data?.vendor_name,
    category: d.category
})), null, 2)}

Provide:
1. ANOMALY DETECTION: Identify unusual spending patterns, sudden increases, or suspicious transactions
2. PREDICTIVE FORECASTING: Forecast next 3 months spending and potential budget shortfalls with specific amounts
3. PROACTIVE ADJUSTMENTS: Suggest specific budget adjustments based on trends and goals
4. INCOME OPPORTUNITIES: Identify ways to increase income based on current financial situation
5. RISK ASSESSMENT: Assess financial risks and vulnerabilities
6. GOAL IMPACT: Analyze how current spending affects financial goals achievement`,
            response_json_schema: {
                type: 'object',
                properties: {
                    anomalies: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                                description: { type: 'string' },
                                detected_amount: { type: 'number' },
                                expected_amount: { type: 'number' },
                                recommendation: { type: 'string' }
                            }
                        }
                    },
                    forecast: {
                        type: 'object',
                        properties: {
                            next_month: {
                                type: 'object',
                                properties: {
                                    predicted_spending: { type: 'number' },
                                    predicted_income: { type: 'number' },
                                    surplus_deficit: { type: 'number' },
                                    confidence: { type: 'number' }
                                }
                            },
                            two_months: {
                                type: 'object',
                                properties: {
                                    predicted_spending: { type: 'number' },
                                    predicted_income: { type: 'number' },
                                    surplus_deficit: { type: 'number' }
                                }
                            },
                            three_months: {
                                type: 'object',
                                properties: {
                                    predicted_spending: { type: 'number' },
                                    predicted_income: { type: 'number' },
                                    surplus_deficit: { type: 'number' }
                                }
                            },
                            shortfall_warnings: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        month: { type: 'string' },
                                        category: { type: 'string' },
                                        expected_shortfall: { type: 'number' },
                                        reason: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    proactive_adjustments: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                current_budget: { type: 'number' },
                                recommended_budget: { type: 'number' },
                                reason: { type: 'string' },
                                impact: { type: 'string' },
                                priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] }
                            }
                        }
                    },
                    income_opportunities: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                opportunity: { type: 'string' },
                                potential_monthly_income: { type: 'number' },
                                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                                timeline: { type: 'string' }
                            }
                        }
                    },
                    risk_assessment: {
                        type: 'object',
                        properties: {
                            overall_risk_level: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
                            risks: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        risk: { type: 'string' },
                                        severity: { type: 'string' },
                                        mitigation: { type: 'string' }
                                    }
                                }
                            },
                            emergency_fund_status: { type: 'string' },
                            debt_risk: { type: 'string' }
                        }
                    },
                    goal_impact_analysis: {
                        type: 'object',
                        properties: {
                            goals_at_risk: { type: 'array', items: { type: 'string' } },
                            recommended_reallocation: { type: 'string' },
                            optimization_potential: { type: 'string' }
                        }
                    },
                    executive_summary: { type: 'string' },
                    priority_actions: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        // Auto-create budget adjustment recommendations
        const adjustmentTasks = [];
        for (const adjustment of aiAnalysis.proactive_adjustments || []) {
            if (adjustment.priority === 'urgent' || adjustment.priority === 'high') {
                adjustmentTasks.push({
                    category: adjustment.category,
                    current: adjustment.current_budget,
                    recommended: adjustment.recommended_budget,
                    reason: adjustment.reason,
                    impact: adjustment.impact,
                    priority: adjustment.priority
                });
            }
        }

        return Response.json({
            success: true,
            timestamp: new Date().toISOString(),
            financial_snapshot: financialSnapshot,
            ai_analysis: aiAnalysis,
            adjustment_tasks: adjustmentTasks,
            summary: {
                anomalies_detected: aiAnalysis.anomalies?.length || 0,
                shortfall_warnings: aiAnalysis.forecast?.shortfall_warnings?.length || 0,
                proactive_adjustments: aiAnalysis.proactive_adjustments?.length || 0,
                risk_level: aiAnalysis.risk_assessment?.overall_risk_level,
                next_month_forecast: aiAnalysis.forecast?.next_month
            }
        });

    } catch (error) {
        console.error('Advanced budget AI error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});