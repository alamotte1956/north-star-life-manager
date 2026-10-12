import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { maintenance_task_id } = await req.json();

        // Fetch task details
        const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({ id: maintenance_task_id });
        if (!tasks.length) {
            return Response.json({ error: 'Task not found' }, { status: 404 });
        }

        const task = tasks[0];

        // Fetch property to get location
        const properties = await base44.asServiceRole.entities.Property.filter({ name: task.property_name });
        const property = properties[0];

        // Get all vendors
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ available: true });

        // Use AI to analyze and rank vendors
        const aiPrompt = `You are a maintenance scheduling AI. Analyze vendors and recommend the best match for this task.

MAINTENANCE TASK:
- Type: ${task.category}
- Title: ${task.title}
- Property: ${task.property_name}
- Description: ${task.notes || 'N/A'}
- Due Date: ${task.next_due_date}

AVAILABLE VENDORS:
${vendors.map(v => `
- ${v.company_name}
  Specialties: ${v.specialties.join(', ')}
  Rate: $${v.hourly_rate}/hr
  Rating: ${v.rating || 'N/A'}/5
  Jobs Completed: ${v.total_jobs_completed}
  Insurance: ${v.insurance_verified ? 'Yes' : 'No'}
`).join('\n')}

Rank the top 3 vendors and explain why each is suitable. Consider:
- Specialty match
- Experience/rating
- Cost effectiveness
- Insurance verification

Return JSON with top 3 recommendations.`;

        const aiRecommendation = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                vendor_company: { type: 'string' },
                                score: { type: 'number' },
                                reasoning: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        const topVendor = vendors.find(v => 
            v.company_name === aiRecommendation.recommendations[0]?.vendor_company
        );

        if (!topVendor) {
            return Response.json({ error: 'No suitable vendor found' }, { status: 404 });
        }

        // Create assignment
        const assignment = await base44.asServiceRole.entities.MaintenanceAssignment.create({
            maintenance_task_id: task.id,
            vendor_id: topVendor.id,
            vendor_name: topVendor.company_name,
            property_id: property?.id,
            property_name: task.property_name,
            status: 'assigned',
            ai_assignment_score: aiRecommendation.recommendations[0].score,
            created_by: user.email
        });

        // Update task
        await base44.asServiceRole.entities.MaintenanceTask.update(task.id, {
            assigned_to: topVendor.email,
            provider_name: topVendor.company_name,
            provider_contact: topVendor.phone,
            estimated_cost: topVendor.hourly_rate * 2 // Estimate 2 hours
        });

        // Notify vendor
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: topVendor.email,
            subject: `New Maintenance Assignment - ${task.property_name}`,
            body: `You have been assigned a new maintenance task:\n\n${task.title}\n${task.property_name}\n\nPlease log in to view details and schedule the service.`
        });

        return Response.json({
            success: true,
            assignment,
            vendor: topVendor,
            all_recommendations: aiRecommendation.recommendations
        });

    } catch (error) {
        console.error('Auto-assign vendor error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});