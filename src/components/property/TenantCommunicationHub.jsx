import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, Send, Mail, Bell, Bot, Sparkles, 
    CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TenantCommunicationHub({ property }) {
    const [activeTab, setActiveTab] = useState('send');
    const [sending, setSending] = useState(false);
    const [messageType, setMessageType] = useState('rent_reminder');
    const [customMessage, setCustomMessage] = useState('');
    const [preview, setPreview] = useState(null);
    
    // Chatbot state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const handleSendCommunication = async () => {
        if (!property.tenant_email) {
            toast.error('No tenant email on file');
            return;
        }

        setSending(true);
        try {
            const result = await base44.functions.invoke('sendTenantCommunication', {
                property_id: property.id,
                tenant_email: property.tenant_email,
                message_type: messageType,
                custom_message: messageType === 'custom' ? customMessage : null
            });

            setPreview(result.data.preview);
            toast.success('Communication sent successfully!');
            setCustomMessage('');
        } catch (error) {
            toast.error('Failed to send communication');
        } finally {
            setSending(false);
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage = { role: 'user', content: chatInput, timestamp: new Date() };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setChatLoading(true);

        try {
            const result = await base44.functions.invoke('tenantChatbot', {
                property_id: property.id,
                question: chatInput,
                conversation_history: chatMessages.slice(-5)
            });

            const botMessage = { 
                role: 'assistant', 
                content: result.data.response, 
                timestamp: new Date() 
            };
            setChatMessages(prev => [...prev, botMessage]);
        } catch (error) {
            toast.error('Failed to get response');
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <Card className="border-2 border-[#C5A059]/30">
            <CardHeader>
                <CardTitle className="text-xl font-light flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#C5A059]" />
                    Tenant Communication Hub
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!property.tenant_email && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-yellow-600 inline mr-2" />
                        <span className="text-sm text-yellow-800">
                            No tenant email on file. Add tenant contact info in property details.
                        </span>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="send" className="gap-2">
                            <Mail className="w-4 h-4" />
                            Send Message
                        </TabsTrigger>
                        <TabsTrigger value="chatbot" className="gap-2">
                            <Bot className="w-4 h-4" />
                            Tenant Chatbot
                        </TabsTrigger>
                    </TabsList>

                    {/* Send Communication Tab */}
                    <TabsContent value="send" className="space-y-4 mt-4">
                        <div>
                            <Label>Message Type</Label>
                            <Select value={messageType} onValueChange={setMessageType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rent_reminder">Rent Reminder</SelectItem>
                                    <SelectItem value="maintenance_update">Maintenance Update</SelectItem>
                                    <SelectItem value="document_expiry">Document Expiry Notice</SelectItem>
                                    <SelectItem value="general_announcement">General Announcement</SelectItem>
                                    <SelectItem value="custom">Custom Message</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {messageType === 'custom' && (
                            <div>
                                <Label>Custom Message</Label>
                                <Textarea
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Describe what you want to communicate to the tenant..."
                                    rows={4}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                            <Bell className="w-4 h-4" />
                            <span>
                                Will send to: {property.tenant_email || 'No email on file'}
                            </span>
                        </div>

                        <Button
                            onClick={handleSendCommunication}
                            disabled={sending || !property.tenant_email}
                            className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                        >
                            {sending ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Generating & Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Generate & Send AI Message
                                </>
                            )}
                        </Button>

                        {/* Preview */}
                        {preview && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-medium text-green-900">Message Sent Successfully</span>
                                    {preview.urgency && (
                                        <Badge className={`ml-auto ${
                                            preview.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                            preview.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {preview.urgency} priority
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium text-gray-900 mb-1">To: {preview.to}</div>
                                    <div className="font-medium text-gray-900 mb-2">Subject: {preview.subject}</div>
                                    <div className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                                        {preview.body}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tenant Chatbot Tab */}
                    <TabsContent value="chatbot" className="mt-4">
                        <div className="border rounded-lg bg-white">
                            {/* Chat Messages */}
                            <div className="h-96 overflow-y-auto p-4 space-y-3">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center py-12 text-[#64748B]">
                                        <Bot className="w-12 h-12 mx-auto mb-3 text-[#C5A059]" />
                                        <p className="font-light">Ask me anything about this property!</p>
                                        <p className="text-sm mt-2">
                                            I can help with maintenance status, rent payments, documents, and more.
                                        </p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-lg p-3 ${
                                                    msg.role === 'user'
                                                        ? 'bg-[#C5A059] text-white'
                                                        : 'bg-gray-100 text-[#0F172A]'
                                                }`}
                                            >
                                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                                <div className="text-xs opacity-70 mt-1">
                                                    {format(msg.timestamp, 'h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleChatSubmit} className="border-t p-3 flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about maintenance, rent, documents..."
                                    className="flex-1"
                                    disabled={chatLoading}
                                />
                                <Button
                                    type="submit"
                                    disabled={chatLoading || !chatInput.trim()}
                                    className="bg-[#C5A059]"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}