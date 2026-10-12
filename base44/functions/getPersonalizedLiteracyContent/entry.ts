import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Gather user's financial context
        const [investments, goals, budgets, properties, subscriptions] = await Promise.all([
            base44.entities.Investment.filter({ created_by: user.email }),
            base44.entities.FinancialGoal.filter({ created_by: user.email }),
            base44.entities.Budget.filter({ created_by: user.email }),
            base44.entities.Property.filter({ created_by: user.email }),
            base44.entities.Subscription.filter({ created_by: user.email })
        ]);

        // Build user profile context
        const hasInvestments = investments.length > 0;
        const hasRealEstate = properties.length > 0;
        const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const hasRetirementGoal = goals.some(g => g.goal_type === 'retirement');
        const totalSubscriptions = subscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);

        // Generate personalized content using AI
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate personalized financial literacy content for this user:

Profile:
- Has investments: ${hasInvestments} (Total: $${totalInvestmentValue})
- Has real estate: ${hasRealEstate}
- Has retirement goal: ${hasRetirementGoal}
- Monthly subscriptions: $${totalSubscriptions}
- Active budgets: ${budgets.length}
- Financial goals: ${goals.length}

Generate:
1. 5 recommended learning topics (most relevant to their situation)
2. 3 key concepts they should understand
3. 3 educational content items (mix of articles, videos, guides)
4. 2 actionable tips based on their profile

Focus on practical, actionable education that helps them make better financial decisions.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommended_topics: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                                estimated_time: { type: 'string' },
                                icon: { type: 'string' }
                            }
                        }
                    },
                    key_concepts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                concept: { type: 'string' },
                                why_important: { type: 'string' },
                                simplified_explanation: { type: 'string' },
                                real_world_example: { type: 'string' }
                            }
                        }
                    },
                    educational_content: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                type: { type: 'string', enum: ['article', 'video', 'guide', 'tutorial'] },
                                description: { type: 'string' },
                                key_takeaways: { type: 'array', items: { type: 'string' } },
                                difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                                estimated_time: { type: 'string' }
                            }
                        }
                    },
                    actionable_tips: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                tip: { type: 'string' },
                                impact: { type: 'string' },
                                ease: { type: 'string', enum: ['easy', 'moderate', 'challenging'] }
                            }
                        }
                    },
                    personalized_message: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            content: result,
            user_context: {
                has_investments: hasInvestments,
                has_real_estate: hasRealEstate,
                has_retirement_goal: hasRetirementGoal,
                financial_complexity: calculateComplexity(investments, properties, goals, budgets)
            }
        });

    } catch (error) {
        console.error('Get literacy content error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});

function calculateComplexity(investments, properties, goals, budgets) {
    let score = 0;
    if (investments.length > 0) score += 2;
    if (investments.length > 5) score += 2;
    if (properties.length > 0) score += 2;
    if (goals.length > 3) score += 1;
    if (budgets.length > 5) score += 1;
    
    if (score >= 7) return 'advanced';
    if (score >= 4) return 'intermediate';
    return 'beginner';
}