import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { assignment_id, preferred_dates } = await req.json();

        // Fetch assignment and vendor
        const assignments = await base44.asServiceRole.entities.MaintenanceAssignment.filter({ id: assignment_id });
        if (!assignments.length) {
            return Response.json({ error: 'Assignment not found' }, { status: 404 });
        }

        const assignment = assignments[0];
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: assignment.vendor_id });
        const vendor = vendors[0];

        // Get vendor's existing assignments
        const existingAssignments = await base44.asServiceRole.entities.MaintenanceAssignment.filter({
            vendor_id: vendor.id,
            status: 'scheduled'
        });

        // Use AI to optimize scheduling
        const aiPrompt = `You are a scheduling optimization AI. Find the best time slot for this maintenance task.

VENDOR AVAILABILITY:
${JSON.stringify(vendor.availability_schedule || {}, null, 2)}

EXISTING SCHEDULED JOBS:
${existingAssignments.map(a => `- ${a.scheduled_date} ${a.scheduled_time_slot}`).join('\n')}

PREFERRED DATES:
${preferred_dates ? preferred_dates.join(', ') : 'No preference'}

Find optimal date and 3-hour time slot (e.g., "9:00 AM - 12:00 PM"). Consider:
- Vendor availability
- Travel time between jobs
- No double-booking
- Prefer morning slots

Return JSON with recommended schedule.`;

        const schedule = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommended_date: { type: 'string' },
                    recommended_time_slot: { type: 'string' },
                    reasoning: { type: 'string' },
                    alternative_slots: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                date: { type: 'string' },
                                time_slot: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        // Update assignment with schedule
        await base44.asServiceRole.entities.MaintenanceAssignment.update(assignment_id, {
            scheduled_date: schedule.recommended_date,
            scheduled_time_slot: schedule.recommended_time_slot,
            status: 'scheduled'
        });

        return Response.json({
            success: true,
            schedule,
            assignment_id
        });

    } catch (error) {
        console.error('Optimize schedule error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});