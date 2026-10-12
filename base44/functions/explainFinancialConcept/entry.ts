import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { concept, context } = await req.json();

        if (!concept) {
            return Response.json({ error: 'Concept required' }, { status: 400 });
        }

        const explanation = await base44.integrations.Core.InvokeLLM({
            prompt: `Explain this financial concept in simple, easy-to-understand terms: "${concept}"

${context ? `User context: ${context}` : ''}

Provide:
1. A simple definition (2-3 sentences)
2. Why it matters (practical importance)
3. A real-world example
4. Common misconceptions
5. How it applies to everyday financial decisions
6. Next steps to learn more

Use analogies and everyday language. Avoid jargon unless necessary, and explain any technical terms used.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    simple_definition: { type: 'string' },
                    why_it_matters: { type: 'string' },
                    real_world_example: { type: 'string' },
                    common_misconceptions: { type: 'array', items: { type: 'string' } },
                    practical_application: { type: 'string' },
                    next_steps: { type: 'array', items: { type: 'string' } },
                    related_concepts: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return Response.json({
            success: true,
            concept,
            explanation
        });

    } catch (error) {
        console.error('Explain concept error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});