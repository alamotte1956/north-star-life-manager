import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            client_id, 
            client_email, 
            client_name,
            subject, 
            body,
            invoice_id,
            project_id
        } = await req.json();

        let finalBody = body;
        const attachmentInfo = [];

        // Attach invoice if specified
        if (invoice_id) {
            const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id);
            if (invoice) {
                attachmentInfo.push(`Invoice #${invoice.invoice_number} - $${invoice.total_amount}`);
                finalBody += `\n\n---\nAttached: Invoice #${invoice.invoice_number}\nAmount: $${invoice.total_amount}\nDue Date: ${invoice.due_date}\nStatus: ${invoice.status}`;
            }
        }

        // Attach project update if specified
        if (project_id) {
            const project = await base44.asServiceRole.entities.Project.get(project_id);
            if (project) {
                attachmentInfo.push(`Project: ${project.project_name}`);
                finalBody += `\n\n---\nProject Update: ${project.project_name}\nStatus: ${project.status}\nProgress: ${project.actual_hours || 0}/${project.estimated_hours || 0} hours`;
            }
        }

        // Send email
        await base44.integrations.Core.SendEmail({
            to: client_email,
            subject: subject,
            body: finalBody
        });

        // Log communication
        await base44.asServiceRole.entities.Communication.create({
            communication_type: 'email',
            direction: 'outbound',
            sender_email: user.email,
            recipient_email: client_email,
            subject: subject,
            body: body,
            status: 'sent',
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client_id,
            linked_entity_name: client_name,
            sent_date: new Date().toISOString()
        });

        return Response.json({
            success: true,
            attachments: attachmentInfo
        });

    } catch (error) {
        console.error('Error sending client email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});