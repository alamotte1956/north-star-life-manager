import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { communication_type, recipient_info, context, tone, linked_entity_type, linked_entity_id, template_type } = await req.json();

        // Fetch linked entity context if provided
        let entityContext = '';
        if (linked_entity_type && linked_entity_id) {
            try {
                const entity = await base44.asServiceRole.entities[linked_entity_type].filter({ id: linked_entity_id });
                if (entity?.[0]) {
                    entityContext = `\n\nLinked ${linked_entity_type} Context:\n${JSON.stringify(entity[0], null, 2)}`;
                }
            } catch (e) {
                console.log('Could not fetch entity context:', e.message);
            }
        }

        // Build AI prompt based on communication type
        let prompt = '';
        
        if (template_type) {
            // Generate template-based message
            const templates = {
                rent_reminder: `Draft a polite rent payment reminder ${communication_type === 'sms' ? 'text message (keep under 160 characters)' : 'email'} to a tenant. Include payment due date, amount, and payment instructions.`,
                maintenance_update: `Draft a ${communication_type === 'sms' ? 'brief text message' : 'professional email'} updating a tenant about maintenance work. Include what work is being done, when, and any actions they need to take.`,
                lease_renewal: `Draft a ${communication_type === 'sms' ? 'text message' : 'formal email'} regarding lease renewal. Include current lease end date, renewal terms, and response deadline.`,
                payment_confirmation: `Draft a ${communication_type === 'sms' ? 'text message' : 'email'} confirming receipt of payment. Include amount, date, and payment method.`,
                welcome_new_tenant: `Draft a warm welcome ${communication_type === 'sms' ? 'text message' : 'email'} to a new tenant. Include move-in details, contact information, and helpful resources.`,
                property_inquiry: `Draft a professional response ${communication_type === 'sms' ? 'text message' : 'email'} to a property inquiry. Include property details, viewing availability, and next steps.`,
                bill_reminder: `Draft a ${communication_type === 'sms' ? 'brief text' : 'email'} reminding about an upcoming bill payment. Include due date, amount, and payment method.`,
                appointment_confirmation: `Draft a ${communication_type === 'sms' ? 'text message' : 'email'} confirming an appointment. Include date, time, location, and what to bring.`,
                follow_up: `Draft a ${communication_type === 'sms' ? 'text message' : 'email'} following up on a previous conversation. Be friendly and check if they need any additional information.`
            };

            prompt = `${templates[template_type] || 'Draft a professional communication.'}

Tone: ${tone || 'professional and friendly'}
Context: ${context || 'No additional context provided'}
Recipient: ${recipient_info || 'Recipient'}
${entityContext}

Generate ${communication_type === 'sms' ? 'a concise SMS message (under 160 characters if possible, max 300)' : 'an email with subject line and body'}.

For emails, format as JSON:
{
    "subject": "subject line",
    "body": "email body with proper paragraphs"
}

For SMS, return just the message text as a string.`;
        } else {
            // Free-form AI drafting
            prompt = `Draft a ${tone || 'professional'} ${communication_type} message.

Recipient: ${recipient_info || 'Recipient'}
Context/Instructions: ${context || 'General communication'}
${entityContext}

${communication_type === 'sms' ? 'Keep the message concise (under 300 characters). Return just the text.' : 'Create an email with subject and body. Format as JSON with "subject" and "body" fields.'}`;
        }

        // Generate with AI
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: communication_type === 'email' ? {
                type: 'object',
                properties: {
                    subject: { type: 'string' },
                    body: { type: 'string' },
                    suggested_priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
                    suggested_tags: { type: 'array', items: { type: 'string' } }
                },
                required: ['subject', 'body']
            } : null
        });

        // For SMS, result is a string; for email, it's an object
        const draftedMessage = communication_type === 'email' ? result : { body: result, subject: null };

        return Response.json({
            status: 'success',
            message: draftedMessage,
            ai_generated: true,
            communication_type,
            template_type
        });

    } catch (error) {
        console.error('Draft communication error:', error);
        return Response.json({ 
            error: error.message,
            status: 'failed'
        }, { status: 500 });
    }
});