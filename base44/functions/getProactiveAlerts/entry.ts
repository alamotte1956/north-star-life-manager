import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all relevant data
        const [
            billPayments,
            transactions,
            investments,
            subscriptions,
            medications,
            healthRecords,
            wearableData,
            maintenanceTasks,
            financialGoals,
            budgets
        ] = await Promise.all([
            base44.entities.BillPayment.list(),
            base44.entities.Transaction.list('-date', 50),
            base44.entities.Investment.list(),
            base44.entities.Subscription.list(),
            base44.entities.Medication.list(),
            base44.entities.HealthRecord.list('-date', 20),
            base44.entities.WearableData.list('-date', 7),
            base44.entities.MaintenanceTask.list(),
            base44.entities.FinancialGoal.list(),
            base44.entities.Budget.list()
        ]);

        const now = new Date();
        const alerts = [];
        const suggestions = [];
        const automationOpportunities = [];

        // === FINANCIAL ALERTS ===

        // Bills due soon without sufficient funds
        const upcomingBills = billPayments.filter(bill => {
            if (bill.status !== 'active') return false;
            const nextDate = new Date(bill.next_payment_date);
            const daysUntil = (nextDate - now) / (1000 * 60 * 60 * 24);
            return daysUntil <= 7 && daysUntil >= 0;
        });

        const totalUpcomingBills = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
        const recentIncome = transactions
            .filter(t => t.amount > 0)
            .slice(0, 10)
            .reduce((sum, t) => sum + t.amount, 0);

        if (totalUpcomingBills > recentIncome * 0.5) {
            alerts.push({
                type: 'warning',
                category: 'financial',
                title: 'Upcoming Bills Alert',
                message: `You have $${totalUpcomingBills.toFixed(2)} in bills due within 7 days. Review your cash flow.`,
                priority: 'high',
                action: 'View Bills'
            });
        }

        // Budget overruns
        const currentMonth = now.getMonth();
        const currentMonthSpending = {};
        
        transactions.forEach(t => {
            if (t.amount < 0 && new Date(t.date).getMonth() === currentMonth) {
                currentMonthSpending[t.category] = (currentMonthSpending[t.category] || 0) + Math.abs(t.amount);
            }
        });

        budgets.forEach(budget => {
            const spent = currentMonthSpending[budget.category] || 0;
            const threshold = budget.amount * (budget.alert_threshold / 100);
            
            if (spent >= threshold) {
                alerts.push({
                    type: spent >= budget.amount ? 'critical' : 'warning',
                    category: 'financial',
                    title: 'Budget Alert',
                    message: `${budget.category} spending: $${spent.toFixed(2)} / $${budget.amount} (${((spent/budget.amount)*100).toFixed(0)}%)`,
                    priority: spent >= budget.amount ? 'high' : 'medium'
                });
            }
        });

        // Investment opportunities
        const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalCash = transactions.filter(t => t.category === 'income').slice(0, 5).reduce((sum, t) => sum + t.amount, 0);
        
        if (totalCash > totalInvestmentValue * 0.1 && totalInvestmentValue > 0) {
            suggestions.push({
                category: 'investment',
                title: 'Investment Opportunity',
                message: 'You have significant cash that could be invested. Consider diversifying your portfolio.',
                action: 'View Investments'
            });
        }

        // === HEALTH ALERTS ===

        // Medication adherence issues
        const activeMeds = medications.filter(m => m.active);
        activeMeds.forEach(med => {
            const log = med.adherence_log || [];
            const last7Days = log.slice(-7);
            if (last7Days.length > 0) {
                const adherenceRate = (last7Days.filter(l => l.taken).length / last7Days.length) * 100;
                if (adherenceRate < 80) {
                    alerts.push({
                        type: 'warning',
                        category: 'health',
                        title: 'Medication Adherence',
                        message: `${med.name}: ${adherenceRate.toFixed(0)}% adherence. Consider setting reminders.`,
                        priority: 'high'
                    });
                }
            }

            // Low quantity alert
            if (med.quantity_remaining && med.quantity_remaining <= 7) {
                alerts.push({
                    type: 'warning',
                    category: 'health',
                    title: 'Refill Needed',
                    message: `${med.name}: Only ${med.quantity_remaining} doses remaining.`,
                    priority: 'high',
                    action: 'Contact Pharmacy'
                });
            }
        });

        // Health metrics anomalies
        const recentHeartRate = wearableData.filter(d => d.data_type === 'heart_rate');
        if (recentHeartRate.length > 3) {
            const avgHR = recentHeartRate.reduce((sum, d) => sum + d.value, 0) / recentHeartRate.length;
            const maxHR = Math.max(...recentHeartRate.map(d => d.value));
            
            if (maxHR > 100 || avgHR > 85) {
                alerts.push({
                    type: 'info',
                    category: 'health',
                    title: 'Elevated Heart Rate',
                    message: `Average heart rate: ${avgHR.toFixed(0)} bpm. Consider consulting your doctor if sustained.`,
                    priority: 'medium'
                });
            }
        }

        const recentSleep = wearableData.filter(d => d.data_type === 'sleep');
        if (recentSleep.length > 3) {
            const avgSleepHours = recentSleep.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / recentSleep.length / 60;
            
            if (avgSleepHours < 6) {
                alerts.push({
                    type: 'warning',
                    category: 'health',
                    title: 'Insufficient Sleep',
                    message: `Average sleep: ${avgSleepHours.toFixed(1)} hours. Aim for 7-9 hours for optimal health.`,
                    priority: 'medium'
                });
            }
        }

        // === SUBSCRIPTION OPTIMIZATION ===

        const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
        const totalSubscriptionCost = activeSubscriptions.reduce((sum, s) => {
            const monthly = s.billing_frequency === 'monthly' ? s.billing_amount :
                           s.billing_frequency === 'annual' ? s.billing_amount / 12 :
                           s.billing_amount / 3;
            return sum + monthly;
        }, 0);

        if (totalSubscriptionCost > 200) {
            suggestions.push({
                category: 'financial',
                title: 'Subscription Optimization',
                message: `You're spending $${totalSubscriptionCost.toFixed(2)}/month on subscriptions. Review for unused services.`,
                action: 'View Subscriptions'
            });
        }

        // === MAINTENANCE ALERTS ===

        const overdueTasks = maintenanceTasks.filter(task => {
            if (task.status === 'completed') return false;
            const dueDate = new Date(task.next_due_date);
            return dueDate < now;
        });

        if (overdueTasks.length > 0) {
            alerts.push({
                type: 'critical',
                category: 'maintenance',
                title: 'Overdue Maintenance',
                message: `${overdueTasks.length} maintenance task${overdueTasks.length > 1 ? 's' : ''} overdue.`,
                priority: 'high',
                action: 'View Tasks'
            });
        }

        // === FINANCIAL GOAL PROGRESS ===

        const activeGoals = financialGoals.filter(g => g.status === 'active');
        activeGoals.forEach(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const targetDate = new Date(goal.target_date);
            const monthsRemaining = (targetDate - now) / (1000 * 60 * 60 * 24 * 30);
            const requiredMonthly = monthsRemaining > 0 ? (goal.target_amount - goal.current_amount) / monthsRemaining : 0;

            if (goal.monthly_contribution < requiredMonthly * 0.8 && monthsRemaining > 0 && monthsRemaining < 12) {
                alerts.push({
                    type: 'info',
                    category: 'financial',
                    title: 'Goal Progress Alert',
                    message: `${goal.title}: Increase monthly contribution to $${requiredMonthly.toFixed(2)} to meet target.`,
                    priority: 'medium'
                });
            }
        });

        // === AUTOMATION OPPORTUNITIES ===

        // Recurring transactions that could be auto-categorized
        const uncategorizedTransactions = transactions.filter(t => t.category === 'other').length;
        if (uncategorizedTransactions > 5) {
            automationOpportunities.push({
                title: 'Auto-Categorization',
                message: `${uncategorizedTransactions} uncategorized transactions. Enable AI auto-categorization.`,
                action: 'Setup Automation'
            });
        }

        // Bills that could be on auto-pay
        const manualBills = billPayments.filter(b => b.status === 'active' && !b.auto_pay_enabled);
        if (manualBills.length > 3) {
            automationOpportunities.push({
                title: 'Enable Auto-Pay',
                message: `${manualBills.length} bills could be set to auto-pay. Save time and avoid late fees.`,
                action: 'Setup Auto-Pay'
            });
        }

        // === GENERATE AI SUMMARY ===

        const contextSummary = `
User has:
- ${upcomingBills.length} bills due in next 7 days totaling $${totalUpcomingBills.toFixed(2)}
- ${alerts.length} active alerts (${alerts.filter(a => a.priority === 'high').length} high priority)
- ${activeSubscriptions.length} active subscriptions costing $${totalSubscriptionCost.toFixed(2)}/month
- ${activeMeds.length} active medications
- ${overdueTasks.length} overdue maintenance tasks
- ${activeGoals.length} active financial goals

Recent spending: $${Math.abs(transactions.filter(t => t.amount < 0).slice(0, 10).reduce((sum, t) => sum + t.amount, 0)).toFixed(2)}
Investment portfolio value: $${totalInvestmentValue.toFixed(2)}
`;

        const aiPrompt = `You are a proactive life management assistant. Based on this data, provide a brief personalized insight and one key recommendation.

${contextSummary}

Top Alerts:
${alerts.slice(0, 3).map(a => `- ${a.title}: ${a.message}`).join('\n')}

Provide response in JSON format:
1. daily_insight - One sentence personalized insight about their day/week (encouraging and specific)
2. key_recommendation - One actionable recommendation (specific and helpful)

Keep it friendly, concise, and actionable.`;

        let aiInsight = null;
        try {
            aiInsight = await base44.integrations.Core.InvokeLLM({
                prompt: aiPrompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        daily_insight: { type: 'string' },
                        key_recommendation: { type: 'string' }
                    }
                }
            });
        } catch (error) {
            console.error('AI insight generation failed:', error);
        }

        return Response.json({
            success: true,
            alerts: alerts.sort((a, b) => {
                const priority = { high: 3, medium: 2, low: 1 };
                return priority[b.priority] - priority[a.priority];
            }),
            suggestions,
            automation_opportunities: automationOpportunities,
            ai_insight: aiInsight,
            summary: {
                total_alerts: alerts.length,
                high_priority_alerts: alerts.filter(a => a.priority === 'high').length,
                upcoming_bills: upcomingBills.length,
                upcoming_bills_total: totalUpcomingBills,
                overdue_tasks: overdueTasks.length
            }
        });

    } catch (error) {
        console.error('Proactive alerts error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});