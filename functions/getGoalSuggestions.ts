import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { goal_id } = await req.json();

        if (!goal_id) {
            return Response.json({ error: 'goal_id required' }, { status: 400 });
        }

        // Get goal details
        const goals = await base44.entities.FinancialGoal.filter({ id: goal_id });
        const goal = goals[0];

        if (!goal) {
            return Response.json({ error: 'Goal not found' }, { status: 404 });
        }

        // Get user's recent transactions for context
        const transactions = await base44.entities.Transaction.list('-date', 100);
        
        // Calculate spending patterns
        const monthlySpending = {};
        transactions.forEach(t => {
            if (t.amount < 0) {
                monthlySpending[t.category] = (monthlySpending[t.category] || 0) + Math.abs(t.amount);
            }
        });

        // Calculate months remaining
        const now = new Date();
        const targetDate = new Date(goal.target_date);
        const monthsRemaining = Math.max(1, Math.round((targetDate - now) / (1000 * 60 * 60 * 24 * 30)));
        const amountRemaining = goal.target_amount - goal.current_amount;
        const requiredMonthly = amountRemaining / monthsRemaining;

        // Use AI to generate suggestions
        const prompt = `
You are a financial advisor. Analyze this financial goal and provide 3 specific, actionable suggestions to help reach it faster.

Goal Details:
- Type: ${goal.goal_type}
- Target: $${goal.target_amount}
- Current: $${goal.current_amount}
- Remaining: $${amountRemaining}
- Target Date: ${goal.target_date}
- Months Remaining: ${monthsRemaining}
- Required Monthly: $${requiredMonthly.toFixed(2)}
- Current Monthly Contribution: $${goal.monthly_contribution || 0}

Monthly Spending Pattern:
${Object.entries(monthlySpending).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

Provide 3 specific suggestions in a brief, encouraging paragraph (2-3 sentences). Focus on:
1. Adjusting spending in specific categories
2. Increasing contributions
3. Timeline optimization

Keep it concise and actionable.
`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    suggestions: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            suggestions: result.suggestions
        });

    } catch (error) {
        console.error('Goal suggestions error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});