import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { entity_type, entity_id, insight_type } = await req.json();

        // Fetch comments for the entity
        const comments = await base44.entities.Comment.filter({
            entity_type,
            entity_id
        });

        // Fetch shared access info
        const sharedAccess = await base44.entities.SharedAccess.filter({
            entity_type,
            entity_id
        });

        if (insight_type === 'discussion_summary') {
            // Generate AI summary of discussion
            const prompt = `Analyze the following discussion comments and provide insights:

ENTITY TYPE: ${entity_type}
SHARED WITH: ${sharedAccess.length} people
COMMENTS (${comments.length}):
${comments.map((c, i) => `${i + 1}. ${c.created_by} (${new Date(c.created_date).toLocaleDateString()}): ${c.comment_text}`).join('\n')}

Provide a JSON response with:
1. summary - Brief 2-3 sentence summary of the discussion
2. key_points - Array of main points discussed
3. action_items - Array of actionable tasks mentioned or implied
4. decisions_made - Array of decisions that were made
5. questions_raised - Array of unanswered questions
6. sentiment - Overall sentiment (positive/neutral/concerned)
7. next_steps - Suggested next steps based on the discussion`;

            const insights = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string' },
                        key_points: { type: 'array', items: { type: 'string' } },
                        action_items: { type: 'array', items: { type: 'string' } },
                        decisions_made: { type: 'array', items: { type: 'string' } },
                        questions_raised: { type: 'array', items: { type: 'string' } },
                        sentiment: { type: 'string' },
                        next_steps: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            return Response.json({ success: true, insights });
        }

        if (insight_type === 'financial_goal_collaboration') {
            // Fetch the financial goal
            const goal = await base44.asServiceRole.entities.FinancialGoal.filter({ id: entity_id });
            if (!goal || goal.length === 0) {
                return Response.json({ error: 'Goal not found' }, { status: 404 });
            }

            const goalData = goal[0];

            const prompt = `Analyze this shared financial goal and provide collaboration insights:

GOAL: ${goalData.title}
TARGET: $${goalData.target_amount}
CURRENT: $${goalData.current_amount}
PROGRESS: ${((goalData.current_amount / goalData.target_amount) * 100).toFixed(1)}%
TARGET DATE: ${goalData.target_date}
MONTHLY CONTRIBUTION: $${goalData.monthly_contribution || 0}
SHARED WITH: ${sharedAccess.length} people

DISCUSSION COMMENTS:
${comments.map(c => `- ${c.created_by}: ${c.comment_text}`).join('\n')}

Provide a JSON response with:
1. collaboration_status - Assessment of how well the group is collaborating
2. contribution_analysis - Analysis of contribution patterns and fairness
3. decision_points - Key decisions the group should make
4. suggested_contribution_split - Suggested way to split contributions (if applicable)
5. timeline_assessment - Whether the timeline is realistic for the group
6. motivation_tips - Tips to keep the group motivated
7. potential_conflicts - Potential areas of conflict to address
8. recommended_actions - Specific actions for the group`;

            const insights = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        collaboration_status: { type: 'string' },
                        contribution_analysis: { type: 'string' },
                        decision_points: { type: 'array', items: { type: 'string' } },
                        suggested_contribution_split: { type: 'string' },
                        timeline_assessment: { type: 'string' },
                        motivation_tips: { type: 'array', items: { type: 'string' } },
                        potential_conflicts: { type: 'array', items: { type: 'string' } },
                        recommended_actions: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            return Response.json({ success: true, insights, goal_data: goalData });
        }

        if (insight_type === 'health_trends') {
            // Fetch health records for all shared users
            const allHealthRecords = await base44.asServiceRole.entities.HealthRecord.list();
            const allMedications = await base44.asServiceRole.entities.Medication.list();
            const allWearableData = await base44.asServiceRole.entities.WearableData.list();

            const prompt = `Analyze health data and collaboration for this shared health information:

ENTITY TYPE: ${entity_type}
SHARED WITH: ${sharedAccess.map(s => s.shared_with_email).join(', ')}

COMMENTS/DISCUSSIONS:
${comments.map(c => `- ${c.created_by}: ${c.comment_text}`).join('\n')}

Provide family/group health insights in JSON:
1. family_health_overview - Overall assessment of family health trends
2. common_concerns - Health concerns mentioned across the family
3. preventive_recommendations - Preventive care recommendations for the family
4. coordination_suggestions - How family members can coordinate care
5. shared_goals - Suggested shared health goals
6. caregiver_support - Tips for family members providing care
7. communication_tips - How to improve health-related communication
8. red_flags - Any concerning patterns that need attention`;

            const insights = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        family_health_overview: { type: 'string' },
                        common_concerns: { type: 'array', items: { type: 'string' } },
                        preventive_recommendations: { type: 'array', items: { type: 'string' } },
                        coordination_suggestions: { type: 'array', items: { type: 'string' } },
                        shared_goals: { type: 'array', items: { type: 'string' } },
                        caregiver_support: { type: 'array', items: { type: 'string' } },
                        communication_tips: { type: 'array', items: { type: 'string' } },
                        red_flags: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            return Response.json({ success: true, insights });
        }

        return Response.json({ error: 'Invalid insight_type' }, { status: 400 });

    } catch (error) {
        console.error('Collaboration insights error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});