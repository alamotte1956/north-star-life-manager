import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { startOfMonth } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { goal_id } = await req.json();

        // Get goal
        const goals = await base44.entities.FinancialGoal.filter({ id: goal_id, created_by: user.email });
        if (!goals.length) {
            return Response.json({ error: 'Goal not found' }, { status: 404 });
        }
        const goal = goals[0];

        // Get all transactions since goal creation
        const transactions = await base44.entities.Transaction.filter({
            created_by: user.email
        });

        // Calculate contributions (positive amounts in savings categories)
        const contributions = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                const goalDate = new Date(goal.created_date);
                return tDate >= goalDate && t.amount > 0 && 
                       (t.category === 'other' || t.notes?.includes(goal.title));
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const newAmount = parseFloat(goal.current_amount || 0) + contributions;
        const progress = (newAmount / goal.target_amount) * 100;

        // Update goal
        await base44.entities.FinancialGoal.update(goal_id, {
            current_amount: newAmount
        });

        // Generate motivational message
        let message = '';
        if (progress >= 100) {
            message = '🎉 Congratulations! You\'ve reached your goal!';
        } else if (progress >= 75) {
            message = '🔥 You\'re so close! Keep up the great work!';
        } else if (progress >= 50) {
            message = '💪 Halfway there! You\'re making excellent progress!';
        } else if (progress >= 25) {
            message = '🌟 Great start! Stay consistent!';
        } else {
            message = '🚀 Every step counts! Keep going!';
        }

        return Response.json({
            success: true,
            current_amount: newAmount,
            progress: progress.toFixed(1),
            message
        });

    } catch (error) {
        console.error('Update progress error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});