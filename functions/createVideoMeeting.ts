import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, professional_email, user_email, service_type, appointment_date, duration_minutes = 60 } = await req.json();

        // Input validation
        if (!booking_id || typeof booking_id !== 'string') {
            return Response.json({ error: 'Booking ID is required' }, { status: 400 });
        }

        if (!professional_email || typeof professional_email !== 'string' || !professional_email.includes('@')) {
            return Response.json({ error: 'Valid professional email is required' }, { status: 400 });
        }

        if (!user_email || typeof user_email !== 'string' || !user_email.includes('@')) {
            return Response.json({ error: 'Valid user email is required' }, { status: 400 });
        }

        if (!service_type || typeof service_type !== 'string') {
            return Response.json({ error: 'Service type is required' }, { status: 400 });
        }

        if (service_type.length > 200) {
            return Response.json({ error: 'Service type too long (max 200 characters)' }, { status: 400 });
        }

        if (!appointment_date || isNaN(Date.parse(appointment_date))) {
            return Response.json({ error: 'Valid appointment date is required' }, { status: 400 });
        }

        // Validate appointment is in the future
        if (new Date(appointment_date) < new Date()) {
            return Response.json({ error: 'Appointment date must be in the future' }, { status: 400 });
        }

        if (typeof duration_minutes !== 'number' || duration_minutes < 15 || duration_minutes > 480) {
            return Response.json({ error: 'Duration must be between 15 and 480 minutes' }, { status: 400 });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

        // Create calendar event with Google Meet
        const event = {
            summary: `${service_type} - Professional Consultation`,
            description: `Scheduled appointment via North Star Platform`,
            start: {
                dateTime: appointment_date,
                timeZone: 'America/New_York'
            },
            end: {
                dateTime: new Date(new Date(appointment_date).getTime() + duration_minutes * 60000).toISOString(),
                timeZone: 'America/New_York'
            },
            attendees: [
                { email: user_email, displayName: user.full_name },
                { email: professional_email }
            ],
            conferenceData: {
                createRequest: {
                    requestId: `booking-${booking_id}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 30 } // 30 min before
                ]
            },
            guestsCanModify: false,
            guestsCanInviteOthers: false,
            sendUpdates: 'all'
        };

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google Calendar API error: ${error}`);
        }

        const createdEvent = await response.json();
        const meetingLink = createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.[0]?.uri;

        // Update booking with meeting link
        await base44.asServiceRole.entities.ProfessionalBooking.update(booking_id, {
            meeting_link: meetingLink,
            status: 'confirmed'
        });

        // Send email to professional
        await base44.integrations.Core.SendEmail({
            to: professional_email,
            subject: 'New Appointment Booked',
            body: `
New appointment scheduled:

Service: ${service_type}
Date: ${new Date(appointment_date).toLocaleString()}
Client: ${user.full_name} (${user_email})
Meeting Link: ${meetingLink}

Calendar invite has been sent to your email.
            `
        });

        // Send confirmation to user
        await base44.integrations.Core.SendEmail({
            to: user_email,
            subject: 'Appointment Confirmed',
            body: `
Your appointment has been confirmed:

Service: ${service_type}
Date: ${new Date(appointment_date).toLocaleString()}
Professional: ${professional_email}
Meeting Link: ${meetingLink}

A calendar invite has been added to your Google Calendar with reminders.
            `
        });

        return Response.json({
            success: true,
            meeting_link: meetingLink,
            event_id: createdEvent.id
        });

    } catch (error) {
        console.error('Error creating video meeting:', error);
        return Response.json({ error: 'Failed to create video meeting' }, { status: 500 });
    }
});