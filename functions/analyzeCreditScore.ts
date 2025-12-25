import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { credit_score_id } = await req.json();

        // Get the credit score record
        const scores = await base44.entities.CreditScore.filter({ id: credit_score_id });
        if (scores.length === 0) {
            return Response.json({ error: 'Credit score not found' }, { status: 404 });
        }

        const creditScore = scores[0];

        // AI Analysis
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this credit score profile and provide actionable insights:

CREDIT SCORE: ${creditScore.score} (${creditScore.score_range})
Previous Score: ${creditScore.previous_score || 'N/A'}
Change: ${creditScore.score_change > 0 ? '+' : ''}${creditScore.score_change || 0}

BREAKDOWN:
- Payment History Score: ${creditScore.payment_history}/100
- Credit Utilization: ${creditScore.credit_utilization}%
- Average Credit Age: ${creditScore.credit_age} months
- Total Accounts: ${creditScore.total_accounts}
- Hard Inquiries (12 months): ${creditScore.hard_inquiries}
- Derogatory Marks: ${creditScore.derogatory_marks}
- On-Time Payments: ${creditScore.on_time_payments}%

FINANCIAL DATA:
- Total Debt: $${creditScore.total_debt.toLocaleString()}
- Available Credit: $${creditScore.available_credit.toLocaleString()}

Provide:
1. Overall assessment of credit health
2. Top 3 factors positively impacting the score
3. Top 3 factors negatively impacting the score
4. Immediate action items to improve score
5. Long-term strategies for excellent credit
6. Estimated time to reach next score tier
7. Risk factors to watch out for`,
            response_json_schema: {
                type: 'object',
                properties: {
                    overall_assessment: { type: 'string' },
                    health_rating: {
                        type: 'string',
                        enum: ['critical', 'needs_improvement', 'fair', 'good', 'excellent']
                    },
                    positive_factors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                factor: { type: 'string' },
                                impact: { type: 'string' }
                            }
                        }
                    },
                    negative_factors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                factor: { type: 'string' },
                                impact: { type: 'string' },
                                priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                            }
                        }
                    },
                    immediate_actions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                action: { type: 'string' },
                                expected_impact: { type: 'string' },
                                timeframe: { type: 'string' }
                            }
                        }
                    },
                    long_term_strategies: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    next_tier_estimate: { type: 'string' },
                    risk_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    credit_utilization_recommendation: { type: 'string' },
                    score_improvement_potential: {
                        type: 'object',
                        properties: {
                            in_30_days: { type: 'number' },
                            in_90_days: { type: 'number' },
                            in_12_months: { type: 'number' }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            analysis: analysis,
            credit_score: creditScore
        });

    } catch (error) {
        console.error('Analyze credit score error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});