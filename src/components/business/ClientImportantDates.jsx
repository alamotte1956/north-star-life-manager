import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Plus, Trash2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientImportantDates({ client }) {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        event_name: '',
        event_date: '',
        notes: ''
    });

    const { data: dates = [] } = useQuery({
        queryKey: ['client-dates', client.id],
        queryFn: () => base44.entities.ImportantDate.filter({
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id
        })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ImportantDate.create({
            ...data,
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id,
            linked_entity_name: client.company_name
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['client-dates']);
            setShowDialog(false);
            resetForm();
            toast.success('Date added');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ImportantDate.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['client-dates']);
            toast.success('Date removed');
        }
    });

    const resetForm = () => {
        setFormData({
            event_name: '',
            event_date: '',
            notes: ''
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-light text-black flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#4A90E2]" />
                    Important Dates
                </h3>
                <Button 
                    size="sm" 
                    onClick={() => setShowDialog(true)}
                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Date
                </Button>
            </div>

            <div className="space-y-2">
                {dates.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No important dates yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    dates.map((date) => (
                        <Card key={date.id} className="border-[#4A90E2]/20">
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Calendar className="w-4 h-4 text-[#4A90E2]" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-black text-sm">
                                                {date.event_name}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {format(new Date(date.event_date), 'MMMM d, yyyy')}
                                            </p>
                                            {date.notes && (
                                                <p className="text-xs text-gray-500 mt-1">{date.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => deleteMutation.mutate(date.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Important Date</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                        <div>
                            <Label>Event Name *</Label>
                            <Input
                                value={formData.event_name}
                                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                placeholder="e.g., Contract Renewal, Birthday"
                                required
                            />
                        </div>

                        <div>
                            <Label>Date *</Label>
                            <Input
                                type="date"
                                value={formData.event_date}
                                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Notes</Label>
                            <Input
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional context..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                Add Date
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}