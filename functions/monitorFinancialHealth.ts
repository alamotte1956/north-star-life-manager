import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all relevant financial data
        const [budgets, investments, transactions, subscriptions, bills, goals] = await Promise.all([
            base44.entities.Budget.filter({ created_by: user.email }),
            base44.entities.Investment.filter({ created_by: user.email }),
            base44.entities.BudgetTransaction.filter({ created_by: user.email }),
            base44.entities.Subscription.filter({ created_by: user.email, status: 'active' }),
            base44.entities.BillPayment.filter({ created_by: user.email }),
            base44.entities.FinancialGoal.filter({ created_by: user.email })
        ]);

        const alerts = [];

        // 1. Budget Overspending Alerts
        for (const budget of budgets) {
            const spending = budget.current_spending || 0;
            const limit = budget.monthly_limit || 0;
            const percentage = limit > 0 ? (spending / limit) * 100 : 0;

            if (percentage > 90 && percentage <= 100) {
                alerts.push({
                    type: 'budget_warning',
                    severity: 'medium',
                    title: `${budget.category} Budget Near Limit`,
                    message: `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget ($${spending.toFixed(2)} of $${limit})`,
                    actionable_advice: `Consider reducing spending in this category for the remainder of the period, or review if your budget needs adjustment.`,
                    data: { budget_id: budget.id, spending, limit, percentage }
                });
            } else if (percentage > 100) {
                alerts.push({
                    type: 'budget_exceeded',
                    severity: 'high',
                    title: `${budget.category} Budget Exceeded`,
                    message: `You've exceeded your ${budget.category} budget by $${(spending - limit).toFixed(2)} (${percentage.toFixed(0)}%)`,
                    actionable_advice: `Review transactions in this category to identify areas for reduction. Consider setting alerts at 80% to catch this earlier next time.`,
                    data: { budget_id: budget.id, spending, limit, percentage, overage: spending - limit }
                });
            }
        }

        // 2. Investment Volatility Alerts
        if (investments.length > 0) {
            for (const investment of investments) {
                const returnPercent = investment.unrealized_gain_loss_percent || 0;
                
                if (returnPercent < -15) {
                    alerts.push({
                        type: 'investment_decline',
                        severity: 'high',
                        title: `${investment.account_name} Significant Loss`,
                        message: `${investment.account_name} is down ${Math.abs(returnPercent).toFixed(2)}%`,
                        actionable_advice: `Review this investment's fundamentals. Consider if this aligns with your long-term strategy or if rebalancing is needed. Avoid panic selling - consult with a financial advisor if concerned.`,
                        data: { investment_id: investment.id, return_percent: returnPercent }
                    });
                }
            }

            // Portfolio concentration risk
            const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
            const maxInvestment = Math.max(...investments.map(inv => inv.current_value || 0));
            const concentration = totalValue > 0 ? (maxInvestment / totalValue) * 100 : 0;

            if (concentration > 40 && investments.length > 1) {
                alerts.push({
                    type: 'concentration_risk',
                    severity: 'medium',
                    title: 'Portfolio Concentration Risk',
                    message: `${concentration.toFixed(0)}% of your portfolio is in a single investment`,
                    actionable_advice: `Consider diversifying to reduce risk. A well-balanced portfolio typically limits single positions to 15-20% of total value.`,
                    data: { concentration_percent: concentration }
                });
            }
        }

        // 3. Subscription Change Detection
        const recentTransactions = transactions
            .filter(t => t.source_type === 'subscription')
            .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
            .slice(0, 20);

        for (const sub of subscriptions) {
            const subTransactions = recentTransactions
                .filter(t => t.source_id === sub.id)
                .slice(0, 3);

            if (subTransactions.length >= 2) {
                const amounts = subTransactions.map(t => t.amount);
                const latestAmount = amounts[0];
                const avgPrevious = amounts.slice(1).reduce((a, b) => a + b, 0) / (amounts.length - 1);
                
                const changePercent = ((latestAmount - avgPrevious) / avgPrevious) * 100;

                if (Math.abs(changePercent) > 20) {
                    alerts.push({
                        type: 'subscription_change',
                        severity: changePercent > 0 ? 'medium' : 'low',
                        title: `${sub.name} Price ${changePercent > 0 ? 'Increase' : 'Decrease'}`,
                        message: `${sub.name} changed from $${avgPrevious.toFixed(2)} to $${latestAmount.toFixed(2)} (${Math.abs(changePercent).toFixed(0)}% ${changePercent > 0 ? 'increase' : 'decrease'})`,
                        actionable_advice: changePercent > 0 
                            ? `Review if you're still getting value from this subscription. Consider downgrading or canceling if usage is low.`
                            : `Great! You're now saving $${(avgPrevious - latestAmount).toFixed(2)}/month on this subscription.`,
                        data: { subscription_id: sub.id, old_amount: avgPrevious, new_amount: latestAmount, change_percent: changePercent }
                    });
                }
            }
        }

        // 4. Unused Subscriptions
        const totalSubCost = subscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
        if (totalSubCost > 100) {
            alerts.push({
                type: 'high_subscription_cost',
                severity: 'low',
                title: 'High Subscription Spending',
                message: `You're spending $${totalSubCost.toFixed(2)}/month on ${subscriptions.length} subscriptions`,
                actionable_advice: `Review all subscriptions to ensure you're actively using them. Cancel unused ones to save money. Even eliminating 2-3 can save $300+/year.`,
                data: { total_cost: totalSubCost, count: subscriptions.length }
            });
        }

        // 5. Goal Progress Alerts
        for (const goal of goals) {
            const progress = goal.target_amount > 0 
                ? ((goal.current_amount || 0) / goal.target_amount) * 100 
                : 0;

            if (goal.target_date) {
                const daysUntilTarget = Math.ceil(
                    (new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)
                );

                if (daysUntilTarget > 0 && daysUntilTarget < 90 && progress < 80) {
                    const remainingAmount = goal.target_amount - (goal.current_amount || 0);
                    const monthsRemaining = daysUntilTarget / 30;
                    const neededMonthly = remainingAmount / monthsRemaining;

                    alerts.push({
                        type: 'goal_behind_schedule',
                        severity: 'medium',
                        title: `${goal.title} Behind Schedule`,
                        message: `Only ${progress.toFixed(0)}% complete with ${daysUntilTarget} days until target date`,
                        actionable_advice: `To reach your goal, you'll need to contribute $${neededMonthly.toFixed(2)}/month. Consider increasing contributions or adjusting the target date.`,
                        data: { 
                            goal_id: goal.id, 
                            progress, 
                            days_remaining: daysUntilTarget,
                            needed_monthly: neededMonthly 
                        }
                    });
                }
            }
        }

        // 6. Overdue Bills
        const overdueBills = bills.filter(b => {
            if (b.status === 'paid' || !b.due_date) return false;
            return new Date(b.due_date) < new Date();
        });

        if (overdueBills.length > 0) {
            const totalOverdue = overdueBills.reduce((sum, b) => sum + (b.amount || 0), 0);
            alerts.push({
                type: 'overdue_bills',
                severity: 'high',
                title: `${overdueBills.length} Overdue Bill${overdueBills.length > 1 ? 's' : ''}`,
                message: `You have $${totalOverdue.toFixed(2)} in overdue bills`,
                actionable_advice: `Pay these bills immediately to avoid late fees and credit score impact. Set up auto-pay for recurring bills to prevent this in the future.`,
                data: { count: overdueBills.length, total_amount: totalOverdue, bills: overdueBills.map(b => b.bill_name) }
            });
        }

        // Use AI to prioritize and enhance alerts
        if (alerts.length > 0) {
            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these financial alerts and provide an overall financial health assessment:

Alerts:
${alerts.map((a, i) => `${i+1}. [${a.severity.toUpperCase()}] ${a.title}: ${a.message}`).join('\n')}

User Context:
- Total Budgets: ${budgets.length}
- Total Investments: ${investments.length}
- Active Subscriptions: ${subscriptions.length}
- Financial Goals: ${goals.length}

Provide:
1. Overall health score (0-100)
2. Priority ranking of top 3 most urgent alerts (by index)
3. A brief personalized message about their financial health
4. One key action they should take today`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        health_score: { type: 'number' },
                        priority_alert_indices: { type: 'array', items: { type: 'number' } },
                        health_message: { type: 'string' },
                        key_action: { type: 'string' }
                    }
                }
            });

            return Response.json({
                success: true,
                alerts,
                ai_summary: aiAnalysis,
                total_alerts: alerts.length,
                high_severity: alerts.filter(a => a.severity === 'high').length,
                medium_severity: alerts.filter(a => a.severity === 'medium').length
            });
        }

        return Response.json({
            success: true,
            alerts: [],
            ai_summary: {
                health_score: 95,
                health_message: "Your finances are looking great! No immediate concerns detected.",
                key_action: "Keep up the good work with your budgeting and saving."
            },
            total_alerts: 0
        });

    } catch (error) {
        console.error('Monitor financial health error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});