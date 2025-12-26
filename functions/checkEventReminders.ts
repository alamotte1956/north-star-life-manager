import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all pending events with reminders
        const events = await base44.asServiceRole.entities.CalendarEvent.filter({
            status: 'pending'
        });

        const now = new Date();
        const updatedEvents = [];
        const notificationsToSend = [];

        for (const event of events) {
            if (!event.reminders || event.reminders.length === 0) continue;

            const eventDateTime = event.due_time 
                ? new Date(`${event.due_date}T${event.due_time}`)
                : new Date(`${event.due_date}T00:00:00`);

            // Skip if event has already passed
            if (eventDateTime < now) continue;

            let remindersUpdated = false;
            const updatedReminders = event.reminders.map(reminder => {
                // Skip already triggered reminders
                if (reminder.triggered) return reminder;

                // Calculate reminder trigger time
                let reminderTime = new Date(eventDateTime);
                switch (reminder.time_unit) {
                    case 'minutes':
                        reminderTime = new Date(eventDateTime.getTime() - reminder.time_value * 60 * 1000);
                        break;
                    case 'hours':
                        reminderTime = new Date(eventDateTime.getTime() - reminder.time_value * 60 * 60 * 1000);
                        break;
                    case 'days':
                        reminderTime = new Date(eventDateTime.getTime() - reminder.time_value * 24 * 60 * 60 * 1000);
                        break;
                    case 'weeks':
                        reminderTime = new Date(eventDateTime.getTime() - reminder.time_value * 7 * 24 * 60 * 60 * 1000);
                        break;
                }

                // Check if reminder should trigger now
                if (reminderTime <= now) {
                    remindersUpdated = true;
                    notificationsToSend.push({
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: event.due_date,
                        eventTime: event.due_time,
                        reminderValue: reminder.time_value,
                        reminderUnit: reminder.time_unit,
                        userEmail: event.created_by
                    });

                    return {
                        ...reminder,
                        triggered: true,
                        triggered_at: now.toISOString()
                    };
                }

                return reminder;
            });

            // Update event if reminders were triggered
            if (remindersUpdated) {
                await base44.asServiceRole.entities.CalendarEvent.update(event.id, {
                    reminders: updatedReminders
                });
                updatedEvents.push(event.id);
            }
        }

        // Send notifications
        for (const notification of notificationsToSend) {
            try {
                // Create in-app notification
                await base44.asServiceRole.entities.FamilyNotification.create({
                    user_email: notification.userEmail,
                    title: `Reminder: ${notification.eventTitle}`,
                    message: `Your event "${notification.eventTitle}" is coming up on ${notification.eventDate}${notification.eventTime ? ` at ${notification.eventTime}` : ''}`,
                    type: 'reminder',
                    priority: 'high',
                    read: false,
                    linked_entity_type: 'CalendarEvent',
                    linked_entity_id: notification.eventId
                });

                // Try to send push notification if available
                try {
                    await base44.asServiceRole.functions.invoke('sendPushNotification', {
                        user_email: notification.userEmail,
                        title: `Event Reminder`,
                        body: `${notification.eventTitle} - ${notification.reminderValue} ${notification.reminderUnit} before`,
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png',
                        tag: `event-reminder-${notification.eventId}`,
                        data: {
                            type: 'event_reminder',
                            eventId: notification.eventId,
                            url: '/Calendar'
                        }
                    });
                } catch (pushError) {
                    // Push notifications are optional, continue if they fail
                    console.log('Push notification failed:', pushError.message);
                }
            } catch (notifError) {
                console.error('Failed to send notification:', notifError);
            }
        }

        return Response.json({
            success: true,
            eventsProcessed: events.length,
            remindersTriggered: notificationsToSend.length,
            eventsUpdated: updatedEvents.length,
            notifications: notificationsToSend.map(n => ({
                event: n.eventTitle,
                user: n.userEmail
            }))
        });

    } catch (error) {
        console.error('Error checking reminders:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});