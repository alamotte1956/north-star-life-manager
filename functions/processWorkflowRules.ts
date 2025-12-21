import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const {
            family_id,
            trigger_type,
            trigger_data
        } = await req.json();

        // Get active workflow rules for this family and trigger type
        const rules = await base44.asServiceRole.entities.WorkflowRule.filter({
            family_id,
            trigger_type,
            enabled: true
        });

        const results = [];

        for (const rule of rules) {
            // Check if conditions match
            if (!checkConditions(rule.trigger_conditions, trigger_data)) {
                continue;
            }

            // Execute action based on action_type
            let actionResult;
            switch (rule.action_type) {
                case 'assign_task':
                    actionResult = await assignTask(base44, family_id, rule, trigger_data);
                    break;
                case 'send_notification':
                    actionResult = await sendNotification(base44, family_id, rule, trigger_data);
                    break;
                case 'add_to_calendar':
                    actionResult = await addToCalendar(base44, family_id, rule, trigger_data);
                    break;
                case 'send_email':
                    actionResult = await sendEmail(base44, family_id, rule, trigger_data);
                    break;
            }

            // Update rule statistics
            await base44.asServiceRole.entities.WorkflowRule.update(rule.id, {
                last_triggered: new Date().toISOString(),
                trigger_count: (rule.trigger_count || 0) + 1
            });

            results.push({
                rule_id: rule.id,
                rule_name: rule.rule_name,
                action: rule.action_type,
                success: !!actionResult
            });
        }

        return Response.json({ 
            success: true, 
            processed_rules: results.length,
            results 
        });
    } catch (error) {
        console.error('Error processing workflow rules:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function checkConditions(conditions, data) {
    if (!conditions || Object.keys(conditions).length === 0) {
        return true; // No conditions means always trigger
    }

    for (const [key, value] of Object.entries(conditions)) {
        if (key === 'category' && data.category !== value) {
            return false;
        }
        if (key === 'days_before' && data.days_until_expiry > value) {
            return false;
        }
        if (key === 'folder_id' && data.folder_id !== value) {
            return false;
        }
    }

    return true;
}

async function assignTask(base44, family_id, rule, trigger_data) {
    const config = rule.action_config;
    
    const task = await base44.asServiceRole.entities.DocumentTask.create({
        family_id,
        document_id: trigger_data.document_id,
        document_title: trigger_data.document_title,
        task_title: config.task_title || 'Auto-assigned task',
        task_description: config.task_description || `Automated from rule: ${rule.rule_name}`,
        assigned_to_email: config.assigned_to_email,
        assigned_by_email: 'automation',
        priority: config.priority || 'medium',
        due_date: config.days_until_due 
            ? new Date(Date.now() + config.days_until_due * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null
    });

    // Send notification about task assignment
    await base44.asServiceRole.functions.invoke('sendFamilyNotification', {
        family_id,
        recipient_email: config.assigned_to_email,
        notification_type: 'task_assigned',
        title: 'Automated Task Assignment',
        message: `${config.task_title} - ${trigger_data.document_title}`,
        priority: config.priority || 'medium',
        triggered_by_email: 'automation',
        metadata: { task_id: task.id, rule_id: rule.id }
    });

    return task;
}

async function sendNotification(base44, family_id, rule, trigger_data) {
    const config = rule.action_config;
    
    await base44.asServiceRole.functions.invoke('sendFamilyNotification', {
        family_id,
        recipient_email: config.recipient_email || null,
        notification_type: 'document_uploaded',
        title: config.notification_title || 'Workflow Notification',
        message: config.notification_message || `Document uploaded: ${trigger_data.document_title}`,
        priority: config.priority || 'medium',
        triggered_by_email: 'automation',
        metadata: { rule_id: rule.id, document_id: trigger_data.document_id }
    });

    return true;
}

async function addToCalendar(base44, family_id, rule, trigger_data) {
    const config = rule.action_config;
    
    const dueDate = trigger_data.expiry_date || 
        new Date(Date.now() + (config.days_from_now || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const event = await base44.asServiceRole.entities.CalendarEvent.create({
        title: config.event_title || `Document: ${trigger_data.document_title}`,
        description: config.event_description || `Automated calendar entry for document`,
        event_type: 'document_expiry',
        category: 'administrative',
        due_date: dueDate,
        all_day: true,
        status: 'pending',
        priority: config.priority || 'medium',
        linked_entity_type: 'Document',
        linked_entity_id: trigger_data.document_id,
        linked_entity_name: trigger_data.document_title
    });

    return event;
}

async function sendEmail(base44, family_id, rule, trigger_data) {
    const config = rule.action_config;
    
    await base44.asServiceRole.integrations.Core.SendEmail({
        to: config.recipient_email,
        subject: config.email_subject || 'Document Workflow Notification',
        body: config.email_body || `A document has been uploaded: ${trigger_data.document_title}`
    });

    return true;
}