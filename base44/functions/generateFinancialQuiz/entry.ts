import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { topic, difficulty } = await req.json();

        const quiz = await base44.integrations.Core.InvokeLLM({
            prompt: `Create an interactive financial literacy quiz on: "${topic}"
Difficulty level: ${difficulty || 'intermediate'}

Generate 5 multiple-choice questions that:
1. Test practical understanding, not just memorization
2. Include real-world scenarios
3. Have clear explanations for correct answers
4. Build on each other progressively

Each question should have 4 answer options with only one correct answer.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    quiz_title: { type: 'string' },
                    description: { type: 'string' },
                    questions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                question: { type: 'string' },
                                options: { type: 'array', items: { type: 'string' } },
                                correct_answer_index: { type: 'number' },
                                explanation: { type: 'string' },
                                difficulty: { type: 'string' }
                            }
                        }
                    },
                    learning_objectives: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return Response.json({
            success: true,
            quiz
        });

    } catch (error) {
        console.error('Generate quiz error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});