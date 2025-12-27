import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Mail, Send, Clock, CheckCircle, FileText, DollarSign, 
    Briefcase, Paperclip, Sparkles, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientCommunicationHub({ client }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('compose');
    const [emailData, setEmailData] = useState({
        subject: '',
        body: '',
        template_type: 'custom'
    });
    const [attachmentType, setAttachmentType] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    // Fetch communication history
    const { data: communications = [] } = useQuery({
        queryKey: ['client-communications', client.id],
        queryFn: () => base44.entities.Communication.filter({
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id
        })
    });

    // Fetch invoices and projects for attachments
    const { data: invoices = [] } = useQuery({
        queryKey: ['client-invoices', client.id],
        queryFn: () => base44.entities.Invoice.filter({ client_id: client.id })
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['client-projects', client.id],
        queryFn: () => base44.entities.Project.filter({ client_id: client.id })
    });

    const sendEmailMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('sendClientEmail', {
                client_id: client.id,
                client_email: client.email,
                client_name: client.company_name,
                subject: data.subject,
                body: data.body,
                invoice_id: data.invoice_id,
                project_id: data.project_id
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['client-communications']);
            setEmailData({ subject: '', body: '', template_type: 'custom' });
            setAttachmentType(null);
            setSelectedInvoice('');
            setSelectedProject('');
            toast.success('Email sent successfully!');
        },
        onError: () => {
            toast.error('Failed to send email');
        }
    });

    const generateAIEmailMutation = useMutation({
        mutationFn: async (type) => {
            const response = await base44.functions.invoke('generateClientEmail', {
                client_name: client.company_name,
                contact_name: client.contact_name,
                email_type: type,
                client_info: {
                    industry: client.industry,
                    status: client.status,
                    outstanding_balance: client.outstanding_balance
                }
            });
            return response.data;
        },
        onSuccess: (data) => {
            setEmailData({
                subject: data.subject,
                body: data.body,
                template_type: data.type
            });
            toast.success('AI email generated!');
        }
    });

    const handleSendEmail = () => {
        sendEmailMutation.mutate({
            subject: emailData.subject,
            body: emailData.body,
            invoice_id: attachmentType === 'invoice' ? selectedInvoice : null,
            project_id: attachmentType === 'project' ? selectedProject : null
        });
    };

    const emailTemplates = [
        { value: 'followup', label: 'Follow-up', icon: Clock },
        { value: 'invoice_reminder', label: 'Invoice Reminder', icon: DollarSign },
        { value: 'project_update', label: 'Project Update', icon: Briefcase },
        { value: 'thank_you', label: 'Thank You', icon: CheckCircle },
        { value: 'custom', label: 'Custom', icon: MessageSquare }
    ];

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compose">
                        <Send className="w-4 h-4 mr-2" />
                        Compose
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <Clock className="w-4 h-4 mr-2" />
                        History ({communications.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="space-y-4">
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail className="w-5 h-5 text-[#4A90E2]" />
                                New Message to {client.company_name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* AI Templates */}
                            <div>
                                <Label>Quick Templates (AI-Powered)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                    {emailTemplates.map((template) => {
                                        const Icon = template.icon;
                                        return (
                                            <Button
                                                key={template.value}
                                                variant={emailData.template_type === template.value ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => {
                                                    if (template.value !== 'custom') {
                                                        generateAIEmailMutation.mutate(template.value);
                                                    } else {
                                                        setEmailData({ subject: '', body: '', template_type: 'custom' });
                                                    }
                                                }}
                                                disabled={generateAIEmailMutation.isPending}
                                                className="justify-start"
                                            >
                                                <Icon className="w-4 h-4 mr-2" />
                                                {template.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <Label>Subject *</Label>
                                <Input
                                    value={emailData.subject}
                                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                                    placeholder="Enter email subject..."
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <Label>Message *</Label>
                                <Textarea
                                    value={emailData.body}
                                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                                    placeholder="Type your message..."
                                    rows={8}
                                />
                            </div>

                            {/* Attachments */}
                            <div>
                                <Label>Attach Document</Label>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        variant={attachmentType === 'invoice' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setAttachmentType(attachmentType === 'invoice' ? null : 'invoice')}
                                    >
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Invoice
                                    </Button>
                                    <Button
                                        variant={attachmentType === 'project' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setAttachmentType(attachmentType === 'project' ? null : 'project')}
                                    >
                                        <Briefcase className="w-4 h-4 mr-2" />
                                        Project Update
                                    </Button>
                                </div>

                                {attachmentType === 'invoice' && invoices.length > 0 && (
                                    <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select invoice..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {invoices.map((inv) => (
                                                <SelectItem key={inv.id} value={inv.id}>
                                                    Invoice #{inv.invoice_number} - ${inv.total_amount} ({inv.status})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {attachmentType === 'project' && projects.length > 0 && (
                                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select project..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((proj) => (
                                                <SelectItem key={proj.id} value={proj.id}>
                                                    {proj.project_name} ({proj.status})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <Button
                                onClick={handleSendEmail}
                                disabled={!emailData.subject || !emailData.body || sendEmailMutation.isPending}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {sendEmailMutation.isPending ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {communications.length === 0 ? (
                        <Card className="border-[#4A90E2]/20">
                            <CardContent className="py-12 text-center">
                                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">No communication history yet</p>
                                <p className="text-sm text-gray-500 mt-1">Sent emails will appear here</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {communications.map((comm) => (
                                <Card key={comm.id} className="border-[#4A90E2]/20">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-[#4A90E2]" />
                                                <h4 className="font-medium text-black">{comm.subject}</h4>
                                            </div>
                                            <Badge variant={comm.status === 'sent' ? 'default' : 'secondary'}>
                                                {comm.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{comm.body}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                {comm.direction === 'outbound' ? 'To' : 'From'}: {comm.recipient_email || comm.sender_email}
                                            </span>
                                            <span>{format(new Date(comm.created_date), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}