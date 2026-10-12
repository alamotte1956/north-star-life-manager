import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all relevant data
        const [properties, maintenanceTasks, billPayments, rentPayments, documents, subscriptions] = await Promise.all([
            base44.entities.Property.list(),
            base44.entities.MaintenanceTask.list(),
            base44.entities.BillPayment.list(),
            base44.entities.RentPayment.filter({ status: 'pending' }),
            base44.entities.Document.list('-created_date', 50),
            base44.entities.Subscription.filter({ status: 'active' })
        ]);

        // Build context for AI
        const now = new Date();
        const upcomingMaintenance = maintenanceTasks.filter(t => {
            if (!t.next_due_date) return false;
            const dueDate = new Date(t.next_due_date);
            return dueDate > now;
        });

        const expiringDocuments = documents.filter(d => {
            if (!d.expiry_date) return false;
            const expiryDate = new Date(d.expiry_date);
            const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry > 0 && daysUntilExpiry < 90;
        });

        const upcomingBills = billPayments.filter(b => {
            if (!b.next_payment_date) return false;
            const paymentDate = new Date(b.next_payment_date);
            const daysUntil = (paymentDate - now) / (1000 * 60 * 60 * 24);
            return daysUntil > 0 && daysUntil < 30;
        });

        const prompt = `You are an AI assistant helping manage a user's properties, finances, and tasks. Based on the data below, suggest 5-8 actionable tasks they should add to their calendar.

PROPERTIES (${properties.length}):
${properties.map(p => `- ${p.name} (${p.property_type})${p.lease_end_date ? `, Lease ends: ${p.lease_end_date}` : ''}${p.seasonal ? ' (Seasonal)' : ''}`).join('\n')}

UPCOMING MAINTENANCE (${upcomingMaintenance.length}):
${upcomingMaintenance.slice(0, 10).map(t => `- ${t.title} (${t.property_name}): Due ${t.next_due_date}`).join('\n')}

EXPIRING DOCUMENTS (${expiringDocuments.length}):
${expiringDocuments.slice(0, 10).map(d => `- ${d.title} (${d.document_type}): Expires ${d.expiry_date}`).join('\n')}

UPCOMING BILLS (${upcomingBills.length}):
${upcomingBills.slice(0, 10).map(b => `- ${b.bill_name}: $${b.amount} due ${b.next_payment_date}`).join('\n')}

PENDING RENT PAYMENTS (${rentPayments.length}):
${rentPayments.slice(0, 5).map(r => `- ${r.property_name}: $${r.amount} due ${r.due_date}`).join('\n')}

ACTIVE SUBSCRIPTIONS (${subscriptions.length}):
${subscriptions.slice(0, 10).map(s => `- ${s.name}: ${s.billing_frequency} renewal${s.renewal_date ? ` on ${s.renewal_date}` : ''}`).join('\n')}

Based on this data, suggest practical tasks with:
1. Clear, actionable task titles
2. Suggested due dates (use relative dates like "in 7 days", "next week", "in 2 weeks")
3. Task category (maintenance, financial, administrative, seasonal, legal, other)
4. Priority (high, medium, low)
5. Brief reason/context for the task
6. Related entity (property name, document title, etc.)

Focus on:
- Upcoming lease renewals or important deadlines
- Property inspections before seasonal closings/openings
- Document renewals before expiration
- Proactive maintenance to prevent issues
- Financial reviews and payment preparations
- Tax-related tasks if approaching year-end
- Tenant communication needs

Return as JSON array of task suggestions.`;

        const suggestions = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    tasks: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                suggested_date: { type: 'string' },
                                category: { 
                                    type: 'string',
                                    enum: ['maintenance', 'financial', 'administrative', 'seasonal', 'legal', 'other']
                                },
                                priority: {
                                    type: 'string',
                                    enum: ['high', 'medium', 'low']
                                },
                                reason: { type: 'string' },
                                related_entity: { type: 'string' },
                                related_entity_type: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            suggestions: suggestions.tasks
        });

    } catch (error) {
        console.error('Task suggestions error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});