import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    MessageSquare, Phone, Video, Mail, Users, 
    Plus, Calendar, Clock, StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientInteractionsTracker({ client }) {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        interaction_type: 'call',
        summary: '',
        notes: '',
        outcome: '',
        next_action: ''
    });

    const { data: interactions = [] } = useQuery({
        queryKey: ['client-interactions', client.id],
        queryFn: () => base44.entities.Communication.filter({
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id,
            communication_type: 'in_app'
        })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Communication.create({
            communication_type: 'in_app',
            direction: 'outbound',
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id,
            linked_entity_name: client.company_name,
            subject: `${data.interaction_type.toUpperCase()}: ${data.summary}`,
            body: `Notes: ${data.notes}\nOutcome: ${data.outcome}\nNext Action: ${data.next_action}`,
            tags: [data.interaction_type],
            status: 'delivered'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['client-interactions']);
            setShowDialog(false);
            resetForm();
            toast.success('Interaction logged');
        }
    });

    const resetForm = () => {
        setFormData({
            interaction_type: 'call',
            summary: '',
            notes: '',
            outcome: '',
            next_action: ''
        });
    };

    const interactionIcons = {
        call: Phone,
        email: Mail,
        meeting: Users,
        video: Video,
        note: StickyNote
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-light text-black flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#4A90E2]" />
                    Interaction History
                </h3>
                <Button 
                    size="sm" 
                    onClick={() => setShowDialog(true)}
                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Log Interaction
                </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
                {interactions.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No interactions logged yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    interactions.map((interaction) => {
                        const Icon = interactionIcons[interaction.tags?.[0]] || MessageSquare;
                        return (
                            <Card key={interaction.id} className="border-[#4A90E2]/20">
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Icon className="w-4 h-4 text-[#4A90E2]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="font-medium text-black text-sm">
                                                    {interaction.subject}
                                                </h4>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(interaction.created_date), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 whitespace-pre-line">
                                                {interaction.body}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Log Client Interaction</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                        <div>
                            <Label>Interaction Type</Label>
                            <Select
                                value={formData.interaction_type}
                                onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="call">Phone Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                                    <SelectItem value="video">Video Call</SelectItem>
                                    <SelectItem value="note">General Note</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Summary *</Label>
                            <Input
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                placeholder="Brief summary of interaction"
                                required
                            />
                        </div>

                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Detailed notes..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Outcome</Label>
                            <Input
                                value={formData.outcome}
                                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                                placeholder="What was decided or agreed upon?"
                            />
                        </div>

                        <div>
                            <Label>Next Action</Label>
                            <Input
                                value={formData.next_action}
                                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                                placeholder="What needs to happen next?"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                Log Interaction
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}