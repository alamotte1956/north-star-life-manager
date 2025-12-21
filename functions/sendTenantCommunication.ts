import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id, tenant_email, message_type, custom_message } = await req.json();

        // Fetch property and related data
        const property = await base44.asServiceRole.entities.Property.filter({ id: property_id });
        if (!property.length || property[0].created_by !== user.email) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        const propertyData = property[0];
        const targetEmail = tenant_email || propertyData.tenant_email;

        if (!targetEmail) {
            return Response.json({ error: 'No tenant email found' }, { status: 400 });
        }

        // Fetch relevant context based on message type
        let context = {};
        if (message_type === 'maintenance_update') {
            const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({ 
                property_name: propertyData.name 
            });
            context.pending_tasks = tasks.filter(t => t.status !== 'completed');
        } else if (message_type === 'document_expiry') {
            const docs = await base44.asServiceRole.entities.Document.filter({ 
                linked_entity_id: property_id 
            });
            const now = new Date();
            context.expiring_docs = docs.filter(d => {
                if (!d.expiry_date) return false;
                const daysUntil = Math.ceil((new Date(d.expiry_date) - now) / (1000 * 60 * 60 * 24));
                return daysUntil <= 60 && daysUntil > 0;
            });
        } else if (message_type === 'rent_reminder') {
            const payments = await base44.asServiceRole.entities.RentPayment.filter({ 
                property_id,
                status: 'pending'
            });
            context.pending_payments = payments;
        }

        // Generate AI-powered message
        const aiPrompt = `You are a professional property manager assistant. Generate a ${message_type === 'custom' ? 'professional' : message_type.replace('_', ' ')} communication for a tenant.

PROPERTY: ${propertyData.name}
TENANT: ${propertyData.tenant_name || 'Tenant'}
MESSAGE TYPE: ${message_type}

${custom_message ? `CUSTOM MESSAGE: ${custom_message}` : ''}

CONTEXT:
${JSON.stringify(context, null, 2)}

Generate a professional, friendly, and clear email message. Include:
- Appropriate greeting
- Clear purpose statement
- Relevant details (dates, amounts, etc.)
- Call to action if needed
- Professional closing

Return JSON with:
- subject: Email subject line
- body: Email body (use proper paragraphs, keep professional but warm tone)
- urgency: low/medium/high`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    subject: { type: 'string' },
                    body: { type: 'string' },
                    urgency: { type: 'string' }
                },
                required: ['subject', 'body']
            }
        });

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: `${user.full_name || 'Property Manager'} - ${propertyData.name}`,
            to: targetEmail,
            subject: aiResponse.subject,
            body: aiResponse.body
        });

        return Response.json({
            success: true,
            message: 'Communication sent successfully',
            preview: {
                to: targetEmail,
                subject: aiResponse.subject,
                body: aiResponse.body,
                urgency: aiResponse.urgency
            }
        });

    } catch (error) {
        console.error('Tenant communication error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});