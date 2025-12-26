import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, DollarSign, Edit2, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function EventDetailsDialog({ event, open, onOpenChange, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    
    if (!event) return null;

    const getEventInfo = () => {
        if (!event.id || typeof event.id !== 'string') return { type: null, id: null, canEdit: false, canDelete: false };
        const [type, id] = event.id.split('-');
        const editable = ['event', 'date'].includes(type);
        const deletable = ['event', 'date', 'task', 'trip'].includes(type);
        return { type, id, canEdit: editable, canDelete: deletable };
    };

    const { type: eventType, id: eventId, canEdit, canDelete } = getEventInfo();

    const handleEdit = () => {
        setEditForm({
            title: event.title || '',
            date: event.date || '',
            notes: event.notes || '',
            person_name: event.description || ''
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            if (eventType === 'event') {
                await base44.entities.CalendarEvent.update(eventId, {
                    title: editForm.title,
                    due_date: editForm.date,
                    notes: editForm.notes
                });
            } else if (eventType === 'date') {
                await base44.entities.ImportantDate.update(eventId, {
                    title: editForm.title,
                    date: editForm.date,
                    notes: editForm.notes,
                    person_name: editForm.person_name
                });
            }
            
            setIsEditing(false);
            if (onUpdate) onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update event:', error);
            alert('Failed to update event');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        try {
            if (eventType === 'event') {
                await base44.entities.CalendarEvent.delete(eventId);
            } else if (eventType === 'date') {
                await base44.entities.ImportantDate.delete(eventId);
            } else if (eventType === 'task') {
                await base44.entities.MaintenanceTask.delete(eventId);
            } else if (eventType === 'trip') {
                await base44.entities.TravelPlan.delete(eventId);
            }
            
            if (onUpdate) onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Event' : event.title}</DialogTitle>
                </DialogHeader>
                
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <Label>Title</Label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            />
                        </div>
                        {eventType === 'date' && (
                            <div>
                                <Label>Person Name</Label>
                                <Input
                                    value={editForm.person_name}
                                    onChange={(e) => setEditForm({ ...editForm, person_name: e.target.value })}
                                />
                            </div>
                        )}
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSave} className="flex-1 gap-2">
                                <Save className="w-4 h-4" />
                                Save
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 gap-2">
                                <X className="w-4 h-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
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

                        {(canEdit || canDelete) && (
                            <div className="pt-4 border-t flex gap-2">
                                {canEdit && (
                                    <Button variant="outline" onClick={handleEdit} className="flex-1 gap-2">
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button variant="destructive" onClick={handleDelete} className="flex-1 gap-2">
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}