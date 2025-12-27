import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { assignment_id, status, work_performed, photos, labor_hours, total_cost } = await req.json();

        // Fetch assignment
        const assignments = await base44.asServiceRole.entities.MaintenanceAssignment.filter({ id: assignment_id });
        if (!assignments.length) {
            return Response.json({ error: 'Assignment not found' }, { status: 404 });
        }

        const assignment = assignments[0];

        // Update assignment
        const updateData = { status };
        
        if (status === 'in_progress' && !assignment.check_in_time) {
            updateData.check_in_time = new Date().toISOString();
        }
        
        if (status === 'completed') {
            updateData.completion_time = new Date().toISOString();
            updateData.work_performed = work_performed;
            updateData.labor_hours = labor_hours;
            updateData.total_cost = total_cost;
            if (photos) updateData.report_photos = photos;
        }

        await base44.asServiceRole.entities.MaintenanceAssignment.update(assignment_id, updateData);

        // Update related maintenance task
        const taskStatusMap = {
            'in_progress': 'in_progress',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };

        if (taskStatusMap[status]) {
            await base44.asServiceRole.entities.MaintenanceTask.update(assignment.maintenance_task_id, {
                status: taskStatusMap[status],
                last_completed: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined
            });
        }

        // Get tenant email from property
        const properties = await base44.asServiceRole.entities.Property.filter({ name: assignment.property_name });
        const property = properties[0];

        // Notify tenant of progress
        if (property?.tenant_email) {
            const notificationMessages = {
                'in_progress': `Work has started on your maintenance request at ${assignment.property_name}.`,
                'completed': `Great news! The maintenance work at ${assignment.property_name} has been completed. Please provide feedback on the service.`,
                'cancelled': `The maintenance appointment at ${assignment.property_name} has been cancelled. We'll reschedule soon.`
            };

            if (notificationMessages[status]) {
                await base44.asServiceRole.functions.invoke('createTenantNotification', {
                    tenant_email: property.tenant_email,
                    property_id: property.id,
                    property_name: assignment.property_name,
                    notification_type: status === 'completed' ? 'maintenance_completed' : 'maintenance_update',
                    title: `Maintenance ${status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Cancelled'}`,
                    message: notificationMessages[status],
                    priority: status === 'completed' ? 'medium' : 'low'
                });
            }
        }

        return Response.json({
            success: true,
            assignment_id,
            new_status: status
        });

    } catch (error) {
        console.error('Update progress error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});