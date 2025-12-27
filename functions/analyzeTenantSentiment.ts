import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message_text, tenant_name, property_name } = await req.json();

        if (!message_text) {
            return Response.json({ error: 'Message text required' }, { status: 400 });
        }

        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze the sentiment and urgency of this tenant communication:

Message: "${message_text}"
${tenant_name ? `From: ${tenant_name}` : ''}
${property_name ? `Property: ${property_name}` : ''}

Provide:
1. Overall sentiment (positive, neutral, negative, very_negative)
2. Urgency level (low, medium, high, critical)
3. Emotion indicators (e.g., frustrated, satisfied, angry, confused)
4. Key concerns or topics mentioned
5. Recommended response approach
6. Any red flags (legal issues, safety concerns, threats, etc.)`,
            response_json_schema: {
                type: 'object',
                properties: {
                    sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative', 'very_negative'] },
                    urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    emotions: { type: 'array', items: { type: 'string' } },
                    key_concerns: { type: 'array', items: { type: 'string' } },
                    topics: { type: 'array', items: { type: 'string' } },
                    recommended_approach: { type: 'string' },
                    red_flags: { type: 'array', items: { type: 'string' } },
                    summary: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Analyze sentiment error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});