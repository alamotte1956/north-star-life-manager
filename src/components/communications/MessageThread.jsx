import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MessageCircle, X, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function MessageThread({ threadId, messages, onClose }) {
    const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
    );

    const latestMessage = messages[0];

    const getIcon = (type) => {
        switch (type) {
            case 'email': return Mail;
            case 'sms': return Phone;
            case 'in_app': return MessageCircle;
            default: return MessageCircle;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent': return 'bg-green-100 text-green-700';
            case 'delivered': return 'bg-blue-100 text-blue-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'draft': return 'bg-gray-100 text-gray-700';
            case 'read': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const Icon = getIcon(latestMessage.communication_type);

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[#C5A059]" />
                        <div>
                            <CardTitle className="text-lg font-light">
                                {latestMessage.recipient_email || latestMessage.recipient_phone}
                            </CardTitle>
                            {latestMessage.subject && (
                                <p className="text-sm text-[#64748B] mt-1">{latestMessage.subject}</p>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                {latestMessage.linked_entity_name && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-[#C5A059] bg-[#C5A059]/10 p-2 rounded">
                        <LinkIcon className="w-4 h-4" />
                        Linked to: {latestMessage.linked_entity_type} - {latestMessage.linked_entity_name}
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {sortedMessages.map((message) => {
                    const isOutbound = message.direction === 'outbound';
                    
                    return (
                        <div
                            key={message.id}
                            className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${isOutbound ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block p-4 rounded-2xl ${
                                    isOutbound 
                                        ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white' 
                                        : 'bg-[#F8F9FA] text-[#0F172A]'
                                }`}>
                                    {message.subject && (
                                        <div className={`font-medium mb-2 ${isOutbound ? 'text-white' : 'text-[#0F172A]'}`}>
                                            {message.subject}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap text-sm">
                                        {message.body}
                                    </div>
                                    {message.ai_generated && (
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            AI Generated
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
                                    <span>{format(new Date(message.created_date), 'MMM d, h:mm a')}</span>
                                    <Badge className={getStatusColor(message.status)}>
                                        {message.status}
                                    </Badge>
                                    {message.priority !== 'normal' && (
                                        <Badge variant="outline" className="capitalize">
                                            {message.priority}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}