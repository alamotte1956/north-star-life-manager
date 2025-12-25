import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { inquiry_text, property_name, tenant_name, context } = await req.json();

        if (!inquiry_text) {
            return Response.json({ error: 'Inquiry text required' }, { status: 400 });
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a professional property manager drafting a response to a tenant inquiry.

Tenant Inquiry: "${inquiry_text}"

${property_name ? `Property: ${property_name}` : ''}
${tenant_name ? `Tenant: ${tenant_name}` : ''}
${context ? `Additional Context: ${context}` : ''}

Draft a professional, friendly, and helpful response. Be:
- Courteous and respectful
- Clear and concise
- Solution-oriented
- Professional but warm

Include appropriate acknowledgment of their concern and provide actionable next steps if applicable.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    drafted_response: { type: 'string' },
                    tone: { type: 'string', enum: ['professional', 'friendly', 'empathetic', 'urgent'] },
                    suggested_actions: { type: 'array', items: { type: 'string' } },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    category: { type: 'string', enum: ['maintenance', 'payment', 'complaint', 'question', 'other'] }
                }
            }
        });

        return Response.json({
            success: true,
            response
        });

    } catch (error) {
        console.error('Draft tenant response error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});