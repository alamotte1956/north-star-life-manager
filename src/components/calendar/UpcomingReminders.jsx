import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInMinutes, differenceInHours, differenceInDays, isPast, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpcomingReminders() {
    const { data: events = [] } = useQuery({
        queryKey: ['calendarEventsForReminders'],
        queryFn: () => base44.entities.CalendarEvent.filter({ status: 'pending' })
    });

    const activeReminders = useMemo(() => {
        const now = new Date();
        const reminders = [];

        events.forEach(event => {
            if (!event.reminders || event.reminders.length === 0) return;

            const eventDateTime = event.due_time 
                ? parseISO(`${event.due_date}T${event.due_time}`)
                : parseISO(`${event.due_date}T00:00:00`);

            event.reminders.forEach((reminder, index) => {
                // Skip already triggered reminders
                if (reminder.triggered) return;

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

                // Check if reminder should be shown (due now or overdue, and event not past)
                if (reminderTime <= now && eventDateTime > now) {
                    const timeUntilEvent = eventDateTime - now;
                    reminders.push({
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: event.due_date,
                        eventTime: event.due_time,
                        reminderIndex: index,
                        reminder,
                        timeUntilEvent,
                        eventDateTime,
                        category: event.category,
                        priority: event.priority
                    });
                }
            });
        });

        // Sort by time until event (most urgent first)
        return reminders.sort((a, b) => a.timeUntilEvent - b.timeUntilEvent);
    }, [events]);

    const formatTimeUntil = (milliseconds) => {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'now';
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (activeReminders.length === 0) {
        return null;
    }

    return (
        <Card className="border-l-4 border-l-[#4A90E2] shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-[#4A90E2]/10 rounded-lg">
                        <Bell className="w-5 h-5 text-[#4A90E2] animate-pulse" />
                    </div>
                    Active Reminders ({activeReminders.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {activeReminders.map((item, index) => (
                    <Link
                        key={`${item.eventId}-${item.reminderIndex}`}
                        to={createPageUrl('Calendar')}
                        className="block"
                    >
                        <div className={`p-3 rounded-lg border hover:shadow-md transition-all ${getPriorityColor(item.priority)}`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">
                                        {item.eventTitle}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs opacity-80">
                                        <Calendar className="w-3 h-3" />
                                        {format(item.eventDateTime, 'MMM d, yyyy')}
                                        {item.eventTime && ` at ${item.eventTime}`}
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTimeUntil(item.timeUntilEvent)}
                                </Badge>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs opacity-70">
                                <AlertCircle className="w-3 h-3" />
                                Reminder: {item.reminder.time_value} {item.reminder.time_unit} before
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}