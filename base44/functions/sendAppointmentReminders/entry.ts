import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all confirmed appointments in next 24 hours
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const bookings = await base44.asServiceRole.entities.ProfessionalBooking.list();
        
        const upcomingBookings = bookings.filter(b => {
            if (b.status !== 'confirmed') return false;
            const apptDate = new Date(b.appointment_date);
            return apptDate > now && apptDate < tomorrow;
        });

        const reminders = [];

        for (const booking of upcomingBookings) {
            // Send reminder to user
            await base44.integrations.Core.SendEmail({
                to: booking.user_email || booking.created_by,
                subject: 'Reminder: Appointment Tomorrow',
                body: `
Reminder: You have an appointment tomorrow

Service: ${booking.service_type}
Professional: ${booking.professional_name}
Date: ${new Date(booking.appointment_date).toLocaleString()}
${booking.meeting_link ? `Meeting Link: ${booking.meeting_link}` : ''}

See you there!
                `
            });

            // Get professional email from Professional entity
            const professional = await base44.asServiceRole.entities.Professional.get(booking.professional_id);
            
            if (professional?.email) {
                await base44.integrations.Core.SendEmail({
                    to: professional.email,
                    subject: 'Reminder: Appointment Tomorrow',
                    body: `
Reminder: You have an appointment tomorrow

Service: ${booking.service_type}
Client: ${booking.created_by}
Date: ${new Date(booking.appointment_date).toLocaleString()}
${booking.meeting_link ? `Meeting Link: ${booking.meeting_link}` : ''}

Prepare accordingly!
                    `
                });
            }

            reminders.push({
                booking_id: booking.id,
                sent_at: new Date().toISOString()
            });
        }

        return Response.json({
            success: true,
            reminders_sent: reminders.length,
            reminders
        });

    } catch (error) {
        console.error('Error sending reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});