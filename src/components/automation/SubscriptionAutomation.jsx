import React, { useState } from 'react';
import { Mail, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function SubscriptionAutomation({ onUpdate }) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email_sender: '',
        email_subject_contains: '',
        action_type: 'create_subscription',
        notify_days_before: 5
    });

    const { data: automations = [], refetch } = useQuery({
        queryKey: ['subscriptionAutomations'],
        queryFn: async () => {
            const all = await base44.entities.Automation.list();
            return all.filter(a => a.trigger_type === 'email' && 
                (a.action_type === 'create_subscription' || a.action_type === 'send_notification'));
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        await base44.entities.Automation.create({
            name: formData.name,
            trigger_type: 'email',
            trigger_config: {
                sender_contains: formData.email_sender,
                subject_contains: formData.email_subject_contains
            },
            action_type: formData.action_type,
            action_config: {
                notify_days_before: formData.notify_days_before
            },
            enabled: true
        });

        setOpen(false);
        setFormData({
            name: '',
            email_sender: '',
            email_subject_contains: '',
            action_type: 'create_subscription',
            notify_days_before: 5
        });
        refetch();
        if (onUpdate) onUpdate();
    };

    const handleDelete = async (id) => {
        await base44.entities.Automation.delete(id);
        refetch();
        if (onUpdate) onUpdate();
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-light">Subscription Email Rules</h3>
                        <p className="text-sm text-black/60">Auto-create subscriptions from invoice emails</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-gradient-to-r from-black to-[#1a1a1a]">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Rule
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Subscription Rule</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Rule Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Netflix Invoice Rule"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Email Sender Contains</Label>
                                    <Input
                                        value={formData.email_sender}
                                        onChange={(e) => setFormData({ ...formData, email_sender: e.target.value })}
                                        placeholder="@netflix.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Subject Contains</Label>
                                    <Input
                                        value={formData.email_subject_contains}
                                        onChange={(e) => setFormData({ ...formData, email_subject_contains: e.target.value })}
                                        placeholder="invoice, payment, receipt"
                                    />
                                </div>

                                <div>
                                    <Label>Action</Label>
                                    <Select
                                        value={formData.action_type}
                                        onValueChange={(value) => setFormData({ ...formData, action_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="create_subscription">Create Subscription</SelectItem>
                                            <SelectItem value="send_notification">Send Renewal Reminder</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.action_type === 'send_notification' && (
                                    <div>
                                        <Label>Notify Days Before Renewal</Label>
                                        <Input
                                            type="number"
                                            value={formData.notify_days_before}
                                            onChange={(e) => setFormData({ ...formData, notify_days_before: parseInt(e.target.value) })}
                                            min="1"
                                        />
                                    </div>
                                )}

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] h-12">
                                    Create Rule
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {automations.length > 0 ? (
                    <div className="space-y-3">
                        {automations.map(automation => (
                            <div key={automation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                                    <div>
                                        <p className="font-medium text-sm">{automation.name}</p>
                                        <p className="text-xs text-black/50">
                                            {automation.trigger_config?.sender_contains} → {automation.action_type}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(automation.id)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-black/40 text-sm">
                        No subscription rules yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}