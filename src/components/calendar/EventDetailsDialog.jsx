import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function EventDetailsDialog({ event, open, onOpenChange, onDelete }) {
    if (!event) return null;

    const getEventTypeAndId = () => {
        if (!event.id || typeof event.id !== 'string') return [null, null];
        const parts = event.id.split('-');
        return [parts[0], parts[1]];
    };

    const [eventType] = getEventTypeAndId();
    const isDeletable = eventType && ['event', 'date', 'task', 'trip'].includes(eventType);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        try {
            const [type, id] = getEventTypeAndId();
            if (!type || !id) return;
            
            if (type === 'event') {
                await base44.entities.CalendarEvent.delete(id);
            } else if (type === 'date') {
                await base44.entities.ImportantDate.delete(id);
            } else if (type === 'task') {
                await base44.entities.MaintenanceTask.delete(id);
            } else if (type === 'trip') {
                await base44.entities.TravelPlan.delete(id);
            }
            
            onOpenChange(false);
            if (onDelete) onDelete();
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{event.title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge>{event.type ? event.type.replace('_', ' ') : 'Event'}</Badge>
                        <div className="text-sm text-gray-500">
                            {event.date ? format(new Date(event.date), 'MMMM d, yyyy') : 'No date'}
                        </div>
                    </div>

                    {event.description && (
                        <div className="text-sm text-gray-700">{event.description}</div>
                    )}

                    {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                        </div>
                    )}

                    {event.amount && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            ${event.amount}
                        </div>
                    )}

                    {event.notes && (
                        <div className="pt-3 border-t">
                            <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
                            <div className="text-sm text-gray-700">{event.notes}</div>
                        </div>
                    )}

                    {/* Delete Button - Only for deletable event types */}
                    {isDeletable && (
                        <div className="pt-4 border-t">
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="w-full gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Event
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}