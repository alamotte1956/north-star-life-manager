import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, MessageCircle, Sparkles, Link as LinkIcon, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function MessageComposer({ open, onClose, onSent, defaultRecipient = null, defaultEntityLink = null }) {
    const [type, setType] = useState('email');
    const [formData, setFormData] = useState({
        recipient_email: defaultRecipient?.email || '',
        recipient_phone: defaultRecipient?.phone || '',
        subject: '',
        body: '',
        priority: 'normal',
        linked_entity_type: defaultEntityLink?.type || '',
        linked_entity_id: defaultEntityLink?.id || '',
        linked_entity_name: defaultEntityLink?.name || ''
    });
    const [aiDrafting, setAiDrafting] = useState(false);
    const [sending, setSending] = useState(false);

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list()
    });

    const { data: contacts = [] } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => base44.entities.Contact.list()
    });

    const templates = [
        { id: 'rent_reminder', label: 'Rent Reminder', types: ['email', 'sms'] },
        { id: 'maintenance_update', label: 'Maintenance Update', types: ['email', 'sms'] },
        { id: 'lease_renewal', label: 'Lease Renewal', types: ['email'] },
        { id: 'payment_confirmation', label: 'Payment Confirmation', types: ['email', 'sms'] },
        { id: 'welcome_new_tenant', label: 'Welcome New Tenant', types: ['email'] },
        { id: 'property_inquiry', label: 'Property Inquiry Response', types: ['email'] },
        { id: 'bill_reminder', label: 'Bill Reminder', types: ['email', 'sms'] },
        { id: 'appointment_confirmation', label: 'Appointment Confirmation', types: ['email', 'sms'] },
        { id: 'follow_up', label: 'Follow Up', types: ['email', 'sms'] }
    ];

    const handleAIDraft = async (templateType = null) => {
        setAiDrafting(true);
        try {
            const result = await base44.functions.invoke('draftCommunication', {
                communication_type: type,
                recipient_info: formData.recipient_email || formData.recipient_phone,
                context: formData.body || 'Please draft a professional message',
                tone: 'professional and friendly',
                linked_entity_type: formData.linked_entity_type,
                linked_entity_id: formData.linked_entity_id,
                template_type: templateType
            });

            if (result.data.status === 'success') {
                const message = result.data.message;
                if (type === 'email') {
                    setFormData(prev => ({
                        ...prev,
                        subject: message.subject,
                        body: message.body
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        body: message.body
                    }));
                }
                toast.success('AI draft generated!');
            }
        } catch (error) {
            toast.error('Failed to generate draft');
        }
        setAiDrafting(false);
    };

    const handleSend = async () => {
        if (!formData.body || (type === 'email' && !formData.subject)) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (type === 'email' && !formData.recipient_email) {
            toast.error('Please enter recipient email');
            return;
        }

        if (type === 'sms' && !formData.recipient_phone) {
            toast.error('Please enter recipient phone');
            return;
        }

        setSending(true);
        try {
            const result = await base44.functions.invoke('sendCommunication', {
                communication_type: type,
                ...formData
            });

            if (result.data.status === 'success') {
                toast.success(`${type.toUpperCase()} sent successfully!`);
                onSent();
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send');
        }
        setSending(false);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Type Selection */}
                    <Tabs value={type} onValueChange={setType}>
                        <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="email" className="gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </TabsTrigger>
                            <TabsTrigger value="sms" className="gap-2">
                                <Phone className="w-4 h-4" />
                                SMS
                            </TabsTrigger>
                            <TabsTrigger value="in_app" className="gap-2">
                                <MessageCircle className="w-4 h-4" />
                                In-App
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Quick Templates */}
                    <div>
                        <Label className="mb-2 block">AI Templates</Label>
                        <div className="flex flex-wrap gap-2">
                            {templates.filter(t => t.types.includes(type)).map(template => (
                                <Button
                                    key={template.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAIDraft(template.id)}
                                    disabled={aiDrafting}
                                    className="gap-2"
                                >
                                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                                    {template.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Recipient */}
                    <div className="grid grid-cols-2 gap-4">
                        {type === 'email' && (
                            <div>
                                <Label>To (Email)</Label>
                                <Input
                                    type="email"
                                    value={formData.recipient_email}
                                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                                    placeholder="recipient@example.com"
                                />
                            </div>
                        )}
                        {type === 'sms' && (
                            <div>
                                <Label>To (Phone)</Label>
                                <Input
                                    type="tel"
                                    value={formData.recipient_phone}
                                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                                    placeholder="+1234567890"
                                />
                            </div>
                        )}
                        {type === 'in_app' && (
                            <div>
                                <Label>To (Email)</Label>
                                <Input
                                    type="email"
                                    value={formData.recipient_email}
                                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                                    placeholder="recipient@example.com"
                                />
                            </div>
                        )}
                        <div>
                            <Label>Priority</Label>
                            <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Link to Entity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Link to Entity (Optional)</Label>
                            <Select 
                                value={formData.linked_entity_type} 
                                onValueChange={(val) => setFormData({ ...formData, linked_entity_type: val, linked_entity_id: '', linked_entity_name: '' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>None</SelectItem>
                                    <SelectItem value="Property">Property</SelectItem>
                                    <SelectItem value="Contact">Contact</SelectItem>
                                    <SelectItem value="BillPayment">Bill Payment</SelectItem>
                                    <SelectItem value="MaintenanceTask">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.linked_entity_type === 'Property' && (
                            <div>
                                <Label>Select Property</Label>
                                <Select 
                                    value={formData.linked_entity_id}
                                    onValueChange={(val) => {
                                        const prop = properties.find(p => p.id === val);
                                        setFormData({ ...formData, linked_entity_id: val, linked_entity_name: prop?.address });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map(prop => (
                                            <SelectItem key={prop.id} value={prop.id}>{prop.address}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {formData.linked_entity_type === 'Contact' && (
                            <div>
                                <Label>Select Contact</Label>
                                <Select 
                                    value={formData.linked_entity_id}
                                    onValueChange={(val) => {
                                        const contact = contacts.find(c => c.id === val);
                                        setFormData({ ...formData, linked_entity_id: val, linked_entity_name: contact?.full_name });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contacts.map(contact => (
                                            <SelectItem key={contact.id} value={contact.id}>{contact.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {formData.linked_entity_name && (
                        <div className="flex items-center gap-2 text-sm text-[#C5A059] bg-[#C5A059]/10 p-2 rounded">
                            <LinkIcon className="w-4 h-4" />
                            Linked to: {formData.linked_entity_name}
                        </div>
                    )}

                    {/* Subject (Email only) */}
                    {type === 'email' && (
                        <div>
                            <Label>Subject</Label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Email subject..."
                            />
                        </div>
                    )}

                    {/* Body */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Message</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAIDraft()}
                                disabled={aiDrafting}
                                className="gap-2"
                            >
                                {aiDrafting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                                )}
                                AI Draft
                            </Button>
                        </div>
                        <Textarea
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            placeholder={type === 'sms' ? 'Text message (keep concise)...' : 'Type your message...'}
                            rows={type === 'sms' ? 4 : 8}
                        />
                        {type === 'sms' && (
                            <div className="text-xs text-[#64748B] mt-1">
                                {formData.body.length}/160 characters
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSend}
                            disabled={sending}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white gap-2"
                        >
                            {sending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Send
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}