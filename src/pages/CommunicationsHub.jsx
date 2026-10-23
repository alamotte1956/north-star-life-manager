import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, Mail, MessageCircle, Plus, Link as LinkIcon, Phone
} from 'lucide-react';
import MessageComposer from '../components/communications/MessageComposer';
import MessageThread from '../components/communications/MessageThread';
import CommunicationFilters from '../components/communications/CommunicationFilters';
import { format } from 'date-fns';

export default function CommunicationsHub() {
    const [activeTab, setActiveTab] = useState('all');
    const [composerOpen, setComposerOpen] = useState(false);
    const [selectedThread, setSelectedThread] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        priority: 'all',
        linked_entity: null,
        search: ''
    });

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: communications = [], isLoading } = useQuery({
        queryKey: ['communications'],
        queryFn: () => base44.entities.Communication.list('-created_date', 200)
    });

    // Filter communications
    const filteredCommunications = communications.filter(comm => {
        if (filters.type !== 'all' && comm.communication_type !== filters.type) return false;
        if (filters.status !== 'all' && comm.status !== filters.status) return false;
        if (filters.priority !== 'all' && comm.priority !== filters.priority) return false;
        if (filters.linked_entity && comm.linked_entity_id !== filters.linked_entity) return false;
        if (filters.search && !(
            comm.body?.toLowerCase().includes(filters.search.toLowerCase()) ||
            comm.subject?.toLowerCase().includes(filters.search.toLowerCase()) ||
            comm.recipient_email?.toLowerCase().includes(filters.search.toLowerCase())
        )) return false;
        
        return true;
    });

    // Group by thread
    const threads = {};
    filteredCommunications.forEach(comm => {
        const threadId = comm.thread_id || comm.id;
        if (!threads[threadId]) {
            threads[threadId] = [];
        }
        threads[threadId].push(comm);
    });

    const getIcon = (type) => {
        switch (type) {
            case 'email': return Mail;
            case 'sms': return Phone;
            case 'in_app': return MessageCircle;
            default: return MessageSquare;
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

    const stats = {
        total: communications.length,
        sent: communications.filter(c => c.status === 'sent').length,
        emails: communications.filter(c => c.communication_type === 'email').length,
        sms: communications.filter(c => c.communication_type === 'sms').length,
        drafts: communications.filter(c => c.status === 'draft').length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-2xl">
                                <MessageSquare className="w-8 h-8 text-[#C5A059]" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#0F172A]">Communications Hub</h1>
                                <p className="text-[#64748B] font-light">Unified messaging center</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setComposerOpen(true)}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Message
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-light text-[#0F172A]">{stats.total}</div>
                                <div className="text-xs text-[#64748B]">Total</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-light text-green-600">{stats.sent}</div>
                                <div className="text-xs text-[#64748B]">Sent</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-light text-blue-600">{stats.emails}</div>
                                <div className="text-xs text-[#64748B]">Emails</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-light text-purple-600">{stats.sms}</div>
                                <div className="text-xs text-[#64748B]">SMS</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-light text-gray-600">{stats.drafts}</div>
                                <div className="text-xs text-[#64748B]">Drafts</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <CommunicationFilters filters={filters} onFilterChange={setFilters} />
                </div>

                {/* Communications List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Thread List */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Messages</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                                {Object.entries(threads).map(([threadId, messages]) => {
                                    const latestMessage = messages[0];
                                    const Icon = getIcon(latestMessage.communication_type);
                                    
                                    return (
                                        <div
                                            key={threadId}
                                            onClick={() => setSelectedThread(threadId)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                                selectedThread === threadId 
                                                    ? 'bg-[#C5A059]/10 border-[#C5A059]' 
                                                    : 'bg-white border-[#0F172A]/10'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-[#C5A059]" />
                                                    <span className="text-sm font-medium text-[#0F172A]">
                                                        {latestMessage.recipient_email || latestMessage.recipient_phone}
                                                    </span>
                                                </div>
                                                <Badge className={getStatusColor(latestMessage.status)}>
                                                    {latestMessage.status}
                                                </Badge>
                                            </div>
                                            {latestMessage.subject && (
                                                <div className="text-sm font-medium text-[#0F172A] mb-1">
                                                    {latestMessage.subject}
                                                </div>
                                            )}
                                            <div className="text-xs text-[#64748B] line-clamp-2 mb-2">
                                                {latestMessage.body}
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-[#64748B]">
                                                <span>{format(new Date(latestMessage.created_date), 'MMM d, h:mm a')}</span>
                                                {messages.length > 1 && (
                                                    <Badge variant="outline">{messages.length} messages</Badge>
                                                )}
                                            </div>
                                            {latestMessage.linked_entity_name && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-[#C5A059]">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {latestMessage.linked_entity_name}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {Object.keys(threads).length === 0 && (
                                    <div className="text-center py-8 text-[#64748B]">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>No messages yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Thread View */}
                    <div className="lg:col-span-2">
                        {selectedThread ? (
                            <MessageThread 
                                threadId={selectedThread} 
                                messages={threads[selectedThread]}
                                onClose={() => setSelectedThread(null)}
                            />
                        ) : (
                            <Card className="h-[600px] flex items-center justify-center">
                                <div className="text-center text-[#64748B]">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Select a message to view</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Message Composer Dialog */}
                {composerOpen && (
                    <MessageComposer 
                        open={composerOpen}
                        onClose={() => setComposerOpen(false)}
                        onSent={() => {
                            setComposerOpen(false);
                            queryClient.invalidateQueries(['communications']);
                        }}
                    />
                )}
            </div>
        </div>
    );
}