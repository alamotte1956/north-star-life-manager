import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

        // Fetch events from Google Calendar
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${thirtyDaysFromNow.toISOString()}&` +
            `singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!calendarResponse.ok) {
            throw new Error('Failed to fetch calendar events');
        }

        const { items: events } = await calendarResponse.json();

        // Sync with app's calendar
        let synced = 0;
        let created = 0;

        for (const event of events || []) {
            if (!event.start?.dateTime && !event.start?.date) continue;

            const eventDate = event.start.dateTime || event.start.date;
            
            // Check if it looks like a maintenance-related event
            const maintenanceKeywords = ['maintenance', 'service', 'inspection', 'repair', 'check', 'clean'];
            const isMaintenanceRelated = maintenanceKeywords.some(keyword => 
                event.summary?.toLowerCase().includes(keyword)
            );

            if (isMaintenanceRelated) {
                // Create maintenance task
                await base44.asServiceRole.entities.MaintenanceTask.create({
                    title: event.summary,
                    notes: event.description || '',
                    next_due_date: eventDate.split('T')[0],
                    status: 'upcoming',
                    created_by: user.email
                });
                created++;
            }

            // Also create as important date
            await base44.asServiceRole.entities.ImportantDate.create({
                title: event.summary,
                date: eventDate.split('T')[0],
                category: 'event',
                notes: event.description || 'Synced from Google Calendar',
                created_by: user.email
            });

            synced++;
        }

        return Response.json({
            success: true,
            synced,
            maintenance_created: created,
            message: `Synced ${synced} calendar events`
        });

    } catch (error) {
        console.error('Calendar sync error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});