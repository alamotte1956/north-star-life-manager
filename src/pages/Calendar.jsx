import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { listMine } from '@/components/utils/safeQuery';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import CalendarEvent from '@/components/calendar/CalendarEvent';
import EventDetailsDialog from '@/components/calendar/EventDetailsDialog';
import TaskSuggestions from '@/components/calendar/TaskSuggestions';
import QuickAddButtons from '@/components/calendar/QuickAddButtons';
import ReminderManager from '@/components/calendar/ReminderManager';
import UpcomingReminders from '@/components/calendar/UpcomingReminders';

const categoryLabels = {
    birthday: 'Birthday',
    anniversary: 'Anniversary',
    tax_deadline: 'Tax Deadline',
    renewal: 'Renewal',
    appointment: 'Appointment',
    event: 'Event',
    holiday: 'Holiday',
    other: 'Other'
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [syncingGoogle, setSyncingGoogle] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        category: 'event',
        recurring: false,
        reminders: [{ time_value: 1, time_unit: 'days', triggered: false }],
        person_name: '',
        notes: ''
    });

    const { data: importantDates = [], refetch: refetchDates } = useQuery({
        queryKey: ['importantDates'],
        queryFn: () => listMine(base44.entities.ImportantDate, { order: '-date' })
    });

    const { data: maintenanceTasks = [] } = useQuery({
        queryKey: ['maintenanceForCalendar'],
        queryFn: () => listMine(base44.entities.MaintenanceTask)
    });

    const { data: travelPlans = [] } = useQuery({
        queryKey: ['travelForCalendar'],
        queryFn: () => listMine(base44.entities.TravelPlan)
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['subscriptionsForCalendar'],
        queryFn: () => listMine(base44.entities.Subscription)
    });

    const { data: calendarEvents = [], refetch: refetchEvents } = useQuery({
        queryKey: ['calendarEvents'],
        queryFn: () => listMine(base44.entities.CalendarEvent, { order: '-due_date' })
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['propertiesForCalendar'],
        queryFn: () => listMine(base44.entities.Property)
    });

    const { data: billPayments = [] } = useQuery({
        queryKey: ['billsForCalendar'],
        queryFn: () => listMine(base44.entities.BillPayment)
    });

    const allEvents = useMemo(() => {
        const events = [];

        // Calendar Events (new unified system)
        calendarEvents.forEach(event => {
            if (event.status !== 'cancelled') {
                events.push({
                    id: `event-${event.id}`,
                    title: event.title,
                    date: event.due_date,
                    type: event.event_type,
                    category: event.category,
                    description: event.description,
                    notes: event.notes,
                    priority: event.priority,
                    status: event.status,
                    linkedEntity: event.linked_entity_name
                });
            }
        });

        importantDates.forEach(date => {
            events.push({
                id: `date-${date.id}`,
                title: date.title,
                date: date.date,
                type: 'important_date',
                description: date.person_name,
                notes: date.notes
            });
        });

        maintenanceTasks.forEach(task => {
            if (task.next_due_date) {
                events.push({
                    id: `task-${task.id}`,
                    title: task.title,
                    date: task.next_due_date,
                    type: 'maintenance',
                    description: task.property_name,
                    notes: task.notes
                });
            }
        });

        travelPlans.forEach(trip => {
            events.push({
                id: `trip-${trip.id}`,
                title: trip.trip_name,
                date: trip.start_date,
                type: 'travel',
                location: trip.destination,
                notes: trip.notes
            });
        });

        subscriptions.forEach(sub => {
            if (sub.next_billing_date) {
                events.push({
                    id: `sub-${sub.id}`,
                    title: `${sub.name} Payment`,
                    date: sub.next_billing_date,
                    type: 'subscription',
                    amount: sub.billing_amount,
                    description: sub.provider
                });
            }
        });

        return events;
    }, [calendarEvents, importantDates, maintenanceTasks, travelPlans, subscriptions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.ImportantDate.create(formData);
        setOpen(false);
        setFormData({
            title: '',
            date: '',
            category: 'event',
            recurring: false,
            reminders: [{ time_value: 1, time_unit: 'days', triggered: false }],
            person_name: '',
            notes: ''
        });
        refetchDates();
    };

    const handleSyncGoogleCalendar = async () => {
        setSyncingGoogle(true);
        try {
            await base44.functions.invoke('syncGoogleCalendar', {});
            refetchDates();
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSyncingGoogle(false);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPadding = monthStart.getDay();
    const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);

    const getEventsForDay = (date) => {
        return allEvents.filter(event => isSameDay(new Date(event.date), date));
    };

    const upcomingEvents = allEvents
        .filter(event => new Date(event.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <CalendarIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Calendar</h1>
                            <p className="text-[#0F1729]/60 font-light">All your events in one place</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSyncGoogleCalendar}
                            disabled={syncingGoogle}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncingGoogle ? 'animate-spin' : ''}`} />
                            Sync Google
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] hover:shadow-lg text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Event
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Add New Event</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Event Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Person Name (optional)</Label>
                                        <Input
                                            value={formData.person_name}
                                            onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                                            placeholder="For birthdays, anniversaries"
                                        />
                                    </div>

                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.recurring}
                                            onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                            className="rounded"
                                        />
                                        <Label>Recurring annually</Label>
                                    </div>

                                    <ReminderManager
                                        reminders={formData.reminders}
                                        onChange={(reminders) => setFormData({ ...formData, reminders })}
                                    />

                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        Add Event
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Active Reminders */}
                <div className="mb-6">
                    <UpcomingReminders />
                </div>

                {/* AI Task Suggestions */}
                <div className="mb-6">
                    <TaskSuggestions onTaskAdded={() => refetchEvents()} />
                </div>

                {/* Quick Add from Existing Data */}
                <div className="mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light">Quick Add to Calendar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <QuickAddButtons
                                properties={properties}
                                maintenanceTasks={maintenanceTasks}
                                billPayments={billPayments}
                                onEventAdded={() => refetchEvents()}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar Grid */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-2xl font-light">
                                        {format(currentDate, 'MMMM yyyy')}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentDate(new Date())}
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-[#0F1729]/50 pb-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {paddedDays.map((day, idx) => {
                                        if (!day) {
                                            return <div key={`empty-${idx}`} className="aspect-square" />;
                                        }
                                        const dayEvents = getEventsForDay(day);
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        const isTodayDate = isToday(day);

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={`aspect-square border rounded-lg p-1 overflow-hidden ${
                                                    !isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'
                                                } ${isTodayDate ? 'ring-2 ring-[#4A90E2]' : ''}`}
                                            >
                                                <div className={`text-xs font-medium mb-1 ${isTodayDate ? 'text-[#4A90E2]' : 'text-[#0F1729]/70'}`}>
                                                    {format(day, 'd')}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {dayEvents.slice(0, 3).map(event => (
                                                        <CalendarEvent
                                                            key={event.id}
                                                            event={event}
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setDetailsOpen(true);
                                                            }}
                                                        />
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-xs text-gray-500 px-2">
                                                            +{dayEvents.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upcoming Events Sidebar */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-light">Upcoming</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {upcomingEvents.map(event => (
                                        <button
                                            key={event.id}
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                setDetailsOpen(true);
                                            }}
                                            className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="font-medium text-black text-sm mb-1">
                                                {event.title}
                                            </div>
                                            <div className="text-xs text-[#0F1729]/60">
                                                {format(new Date(event.date), 'MMM d, yyyy')}
                                            </div>
                                            {event.description && (
                                                <div className="text-xs text-[#0F1729]/50 mt-1">
                                                    {event.description}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <EventDetailsDialog
                event={selectedEvent}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}