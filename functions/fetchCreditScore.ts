import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // SIMULATION: In production, this would integrate with Experian/Equifax API
        // For demo purposes, we'll generate realistic credit data
        
        const existingScores = await base44.entities.CreditScore.filter({ 
            user_email: user.email 
        }, '-report_date', 1);
        
        const previousScore = existingScores.length > 0 ? 
            existingScores[0].score : null;

        // Generate realistic credit score data
        const baseScore = previousScore || (650 + Math.floor(Math.random() * 150));
        const scoreChange = previousScore ? 
            Math.floor(Math.random() * 21) - 10 : 0;
        const newScore = Math.min(850, Math.max(300, baseScore + scoreChange));

        const getScoreRange = (score) => {
            if (score >= 800) return 'excellent';
            if (score >= 740) return 'very_good';
            if (score >= 670) return 'good';
            if (score >= 580) return 'fair';
            return 'poor';
        };

        const creditData = {
            user_email: user.email,
            score: newScore,
            score_range: getScoreRange(newScore),
            previous_score: previousScore,
            score_change: scoreChange,
            report_date: new Date().toISOString().split('T')[0],
            payment_history: 85 + Math.floor(Math.random() * 15),
            credit_utilization: 15 + Math.floor(Math.random() * 40),
            credit_age: 60 + Math.floor(Math.random() * 120),
            total_accounts: 5 + Math.floor(Math.random() * 15),
            hard_inquiries: Math.floor(Math.random() * 5),
            derogatory_marks: Math.floor(Math.random() * 3),
            total_debt: 5000 + Math.floor(Math.random() * 50000),
            available_credit: 10000 + Math.floor(Math.random() * 40000),
            on_time_payments: 90 + Math.floor(Math.random() * 10),
            provider: ['Experian', 'Equifax', 'TransUnion'][Math.floor(Math.random() * 3)],
            linked: true
        };

        // Save to database
        const savedScore = await base44.entities.CreditScore.create(creditData);

        return Response.json({
            success: true,
            message: 'Credit score updated successfully',
            credit_score: savedScore
        });

    } catch (error) {
        console.error('Fetch credit score error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});