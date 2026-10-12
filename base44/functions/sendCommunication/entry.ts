import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            communication_type, 
            recipient_email, 
            recipient_phone, 
            subject, 
            body,
            linked_entity_type,
            linked_entity_id,
            linked_entity_name,
            priority,
            tags,
            thread_id
        } = await req.json();

        let sendStatus = 'sent';
        let sentDate = new Date().toISOString();
        let errorMessage = null;

        // Send based on type
        if (communication_type === 'email') {
            try {
                await base44.integrations.Core.SendEmail({
                    to: recipient_email,
                    subject: subject,
                    body: body,
                    from_name: user.full_name || 'North Star'
                });
            } catch (e) {
                sendStatus = 'failed';
                errorMessage = e.message;
            }
        } else if (communication_type === 'sms') {
            try {
                // Call Twilio SMS function
                await base44.functions.invoke('sendTwilioSMS', {
                    to: recipient_phone,
                    message: body
                });
            } catch (e) {
                sendStatus = 'failed';
                errorMessage = e.message;
            }
        } else if (communication_type === 'in_app') {
            // In-app messages are just stored, not sent externally
            sendStatus = 'delivered';
        }

        // Store communication in database
        const communication = await base44.entities.Communication.create({
            communication_type,
            direction: 'outbound',
            sender_email: user.email,
            recipient_email,
            recipient_phone,
            subject,
            body,
            status: sendStatus,
            linked_entity_type,
            linked_entity_id,
            linked_entity_name,
            priority: priority || 'normal',
            tags: tags || [],
            thread_id: thread_id || null,
            sent_date: sendStatus === 'sent' || sendStatus === 'delivered' ? sentDate : null,
            metadata: errorMessage ? { error: errorMessage } : {}
        });

        return Response.json({
            status: 'success',
            communication,
            send_status: sendStatus
        });

    } catch (error) {
        console.error('Send communication error:', error);
        return Response.json({ 
            error: error.message,
            status: 'failed'
        }, { status: 500 });
    }
});