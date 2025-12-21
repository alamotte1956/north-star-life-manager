import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Google Calendar access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

        if (!accessToken) {
            return Response.json({ 
                error: 'Google Calendar not connected',
                message: 'Please authorize Google Calendar access first'
            }, { status: 401 });
        }

        // Fetch events from Google Calendar (next 30 days)
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${futureDate.toISOString()}&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!calendarResponse.ok) {
            const error = await calendarResponse.text();
            return Response.json({ 
                error: 'Failed to fetch calendar events',
                details: error 
            }, { status: calendarResponse.status });
        }

        const calendarData = await calendarResponse.json();
        const events = calendarData.items || [];

        // Get existing important dates to avoid duplicates
        const existingDates = await base44.asServiceRole.entities.ImportantDate.list();
        const existingTitles = new Set(existingDates.map(d => d.title));

        // Import events as ImportantDate entities
        let importedCount = 0;
        for (const event of events) {
            const title = event.summary || 'Untitled Event';
            
            // Skip if already imported
            if (existingTitles.has(title)) continue;

            const eventDate = event.start.date || event.start.dateTime?.split('T')[0];
            if (!eventDate) continue;

            await base44.asServiceRole.entities.ImportantDate.create({
                title: title,
                date: eventDate,
                category: 'event',
                recurring: false,
                reminder_days_before: 7,
                notes: `Imported from Google Calendar: ${event.description || ''}`
            });

            importedCount++;
        }

        return Response.json({
            success: true,
            imported: importedCount,
            total: events.length,
            message: `Imported ${importedCount} new events from Google Calendar`
        });

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ 
            error: error.message,
            details: error.stack 
        }, { status: 500 });
    }
});