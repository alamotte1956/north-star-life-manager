import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get all budgets
        const budgets = await base44.entities.Budget.list();
        
        // Get all transactions
        const transactions = await base44.entities.BudgetTransaction.list();
        
        // Analyze each budget
        const budgetAnalysis = budgets.map(budget => {
            const budgetTransactions = transactions.filter(t => t.budget_id === budget.id);
            const spent = budgetTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const percentage = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
            const remaining = budget.monthly_limit - spent;
            
            return {
                category: budget.category,
                limit: budget.monthly_limit,
                spent,
                remaining,
                percentage: percentage.toFixed(1),
                status: percentage > 100 ? 'over' : percentage >= budget.alert_threshold ? 'warning' : 'good',
                transaction_count: budgetTransactions.length
            };
        });
        
        // Calculate totals
        const totalLimit = budgets.reduce((sum, b) => sum + (b.monthly_limit || 0), 0);
        const totalSpent = budgetAnalysis.reduce((sum, b) => sum + b.spent, 0);
        const overBudgetCategories = budgetAnalysis.filter(b => b.status === 'over');
        const warningCategories = budgetAnalysis.filter(b => b.status === 'warning');
        
        // Prepare data for AI analysis
        const analysisData = {
            budgets: budgetAnalysis,
            totals: {
                total_limit: totalLimit,
                total_spent: totalSpent,
                total_remaining: totalLimit - totalSpent,
                overall_percentage: totalLimit > 0 ? ((totalSpent / totalLimit) * 100).toFixed(1) : 0
            },
            alerts: {
                over_budget_count: overBudgetCategories.length,
                warning_count: warningCategories.length,
                over_budget_categories: overBudgetCategories.map(b => b.category),
                warning_categories: warningCategories.map(b => b.category)
            }
        };
        
        // Generate AI insights
        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this budget performance data and provide actionable insights:

${JSON.stringify(analysisData, null, 2)}

Provide:
1. Overall budget health assessment
2. Categories requiring immediate attention
3. Spending patterns and trends
4. Forecast for end-of-period based on current spending rate
5. Specific recommendations to stay within budget
6. Opportunities to reallocate budget across categories`,
            response_json_schema: {
                type: 'object',
                properties: {
                    health_assessment: { type: 'string' },
                    attention_required: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    spending_patterns: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    forecast: { type: 'string' },
                    recommendations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    reallocation_opportunities: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });
        
        return Response.json({
            success: true,
            analysis: analysisData,
            ai_insights: aiResponse
        });
        
    } catch (error) {
        console.error('Error analyzing budget:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});