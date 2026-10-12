import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id, question, conversation_history } = await req.json();

        // Fetch property and related data
        const [property, maintenanceTasks, documents, rentPayments] = await Promise.all([
            base44.asServiceRole.entities.Property.filter({ id: property_id }),
            base44.asServiceRole.entities.MaintenanceTask.filter({}),
            base44.asServiceRole.entities.Document.filter({}),
            base44.asServiceRole.entities.RentPayment.filter({ property_id })
        ]);

        if (!property.length || property[0].created_by !== user.email) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        const propertyData = property[0];
        const propertyTasks = maintenanceTasks.filter(t => t.property_name === propertyData.name);
        const propertyDocs = documents.filter(d => d.linked_entity_id === property_id);

        // Build context for AI
        const contextPrompt = `You are a helpful property assistant chatbot for "${propertyData.name}". You help tenants with information about their property, maintenance, documents, and rent payments.

PROPERTY INFORMATION:
- Name: ${propertyData.name}
- Type: ${propertyData.property_type}
- Address: ${propertyData.address || 'N/A'}
- Tenant: ${propertyData.tenant_name || 'N/A'}
- Lease Start: ${propertyData.lease_start_date || 'N/A'}
- Lease End: ${propertyData.lease_end_date || 'N/A'}
- Monthly Rent: $${propertyData.monthly_rent || 'N/A'}

MAINTENANCE TASKS (Last 5):
${propertyTasks.slice(0, 5).map(t => `- ${t.title} (${t.category}, Due: ${t.next_due_date || 'TBD'}, Status: ${t.status})`).join('\n')}

RECENT DOCUMENTS:
${propertyDocs.slice(0, 5).map(d => `- ${d.title} (${d.document_type}, Category: ${d.category})`).join('\n')}

RENT PAYMENTS (Recent):
${rentPayments.slice(0, 3).map(p => `- Due: ${p.due_date}, Amount: $${p.amount}, Status: ${p.status}`).join('\n')}

CONVERSATION HISTORY:
${conversation_history ? JSON.stringify(conversation_history, null, 2) : 'None'}

TENANT QUESTION: ${question}

Provide a helpful, accurate, and friendly response. If you don't have specific information, say so politely. Keep responses concise but informative. If asked about maintenance, rent, or documents, refer to the data provided above.`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: contextPrompt
        });

        return Response.json({
            success: true,
            response: aiResponse,
            context_used: {
                property: propertyData.name,
                maintenance_tasks: propertyTasks.length,
                documents: propertyDocs.length,
                rent_records: rentPayments.length
            }
        });

    } catch (error) {
        console.error('Tenant chatbot error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});