import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, message, message_type } = await req.json();

        // Input validation
        if (!to || typeof to !== 'string') {
            return Response.json({ error: 'Phone number is required' }, { status: 400 });
        }

        if (!message || typeof message !== 'string') {
            return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        if (message.length > 1600) {
            return Response.json({ error: 'Message too long (max 1600 characters for SMS)' }, { status: 400 });
        }

        // Sanitize phone number and validate format
        const cleanedPhone = to.replace(/\D/g, '');
        if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
            return Response.json({ error: 'Invalid phone number format' }, { status: 400 });
        }

        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
        
        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            return Response.json({ 
                error: 'Twilio not configured. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets.' 
            }, { status: 400 });
        }

        // Format phone number
        const formattedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

        // Send SMS via Twilio
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    To: formattedTo,
                    From: twilioPhoneNumber,
                    Body: message
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send SMS');
        }

        const result = await response.json();

        return Response.json({
            success: true,
            message_sid: result.sid,
            status: result.status,
            message: 'SMS sent successfully via Twilio'
        });

    } catch (error) {
        console.error('Twilio SMS error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});