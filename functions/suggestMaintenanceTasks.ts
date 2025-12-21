import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all relevant data
        const [properties, maintenanceTasks, documents] = await Promise.all([
            base44.asServiceRole.entities.Property.filter({ created_by: user.email }),
            base44.asServiceRole.entities.MaintenanceTask.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Document.filter({ created_by: user.email })
        ]);

        // Prepare context for AI
        const propertyContext = properties.map(p => ({
            name: p.name,
            type: p.property_type,
            seasonal: p.seasonal,
            season_open: p.season_open,
            season_close: p.season_close,
            purchase_date: p.purchase_date
        }));

        const taskHistory = maintenanceTasks.map(t => ({
            title: t.title,
            property: t.property_name,
            category: t.category,
            frequency: t.frequency,
            last_completed: t.last_completed,
            next_due: t.next_due_date
        }));

        const relevantDocs = documents
            .filter(d => d.analysis_status === 'completed' && 
                        (d.category === 'property' || d.document_type?.toLowerCase().includes('manual') || 
                         d.document_type?.toLowerCase().includes('warranty')))
            .map(d => ({
                title: d.title,
                type: d.document_type,
                category: d.category,
                expiry_date: d.expiry_date,
                summary: d.ai_summary,
                linked_property: d.linked_entity_name,
                key_points: d.key_points
            }));

        // Call AI to generate suggestions
        const aiPrompt = `You are a property maintenance expert AI assistant. Based on the following data, suggest 5-8 proactive maintenance tasks that should be scheduled:

PROPERTIES:
${JSON.stringify(propertyContext, null, 2)}

EXISTING MAINTENANCE HISTORY:
${JSON.stringify(taskHistory, null, 2)}

RELEVANT DOCUMENTS (manuals, warranties, etc.):
${JSON.stringify(relevantDocs, null, 2)}

Generate maintenance task suggestions considering:
1. Property type and seasonal requirements
2. Common maintenance schedules (HVAC every 6 months, gutters in fall, pool opening/closing for seasonal properties)
3. Document expiry dates (warranties expiring soon may need inspection)
4. Appliance manuals suggest routine maintenance
5. Tasks not already scheduled in the history
6. Seasonal timing (suggest cabin opening tasks in spring, winterization in fall)

For each suggested task, provide:
- title: Clear, specific task name
- property_name: Which property it applies to
- category: One of (hvac, plumbing, electrical, landscaping, cleaning, security, pool, seasonal, inspection, other)
- frequency: One of (one_time, weekly, monthly, quarterly, semi_annual, annual)
- suggested_due_date: Date in YYYY-MM-DD format (consider current date: ${new Date().toISOString().split('T')[0]})
- priority: high/medium/low
- rationale: 1-2 sentence explanation why this task is recommended
- estimated_cost: Estimated cost in dollars (number only)
- suggested_provider: Type of professional needed (if any)

Return ONLY valid JSON array of task suggestions.`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    suggestions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                property_name: { type: 'string' },
                                category: { type: 'string' },
                                frequency: { type: 'string' },
                                suggested_due_date: { type: 'string' },
                                priority: { type: 'string' },
                                rationale: { type: 'string' },
                                estimated_cost: { type: 'number' },
                                suggested_provider: { type: 'string' }
                            },
                            required: ['title', 'property_name', 'category', 'suggested_due_date', 'rationale']
                        }
                    }
                },
                required: ['suggestions']
            }
        });

        return Response.json({
            success: true,
            suggestions: aiResponse.suggestions,
            context_summary: {
                properties_analyzed: properties.length,
                existing_tasks: maintenanceTasks.length,
                documents_reviewed: relevantDocs.length
            }
        });

    } catch (error) {
        console.error('Maintenance suggestion error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});