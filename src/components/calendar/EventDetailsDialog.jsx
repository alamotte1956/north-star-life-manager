import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetailsDialog({ event, open, onOpenChange }) {
    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{event.title}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge>{event.type.replace('_', ' ')}</Badge>
                        <div className="text-sm text-gray-500">
                            {format(new Date(event.date), 'MMMM d, yyyy')}
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
                </div>
            </DialogContent>
        </Dialog>
    );
}