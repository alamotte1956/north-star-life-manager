import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
    Mail, Sparkles, Send, Inbox, Star, Archive, Plus, 
    MessageSquare, AlertCircle, Clock, ChevronRight, Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EmailAssistant() {
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [draftAssistOpen, setDraftAssistOpen] = useState(false);
    const [threadSummaryOpen, setThreadSummaryOpen] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);
    const [filter, setFilter] = useState('inbox');
    const [draftParams, setDraftParams] = useState({ context: '', purpose: '', tone: 'professional' });
    const [replyParams, setReplyParams] = useState({ context: '', tone: 'professional' });
    const [aiResult, setAiResult] = useState(null);
    const [threadSummary, setThreadSummary] = useState(null);

    const queryClient = useQueryClient();

    const { data: emails = [] } = useQuery({
        queryKey: ['emails', filter],
        queryFn: () => {
            if (filter === 'inbox') return base44.entities.Email.filter({ archived: false, draft: false }, '-created_date');
            if (filter === 'starred') return base44.entities.Email.filter({ starred: true }, '-created_date');
            if (filter === 'drafts') return base44.entities.Email.filter({ draft: true }, '-updated_date');
            if (filter === 'archived') return base44.entities.Email.filter({ archived: true }, '-created_date');
            return base44.entities.Email.list('-created_date');
        }
    });

    const analyzeEmailMutation = useMutation({
        mutationFn: (emailId) => base44.functions.invoke('aiEmailAssistant', {
            action: 'analyze_email',
            email_id: emailId
        }),
        onSuccess: (result) => {
            queryClient.invalidateQueries(['emails']);
            toast.success('Email analyzed successfully!');
        }
    });

    const draftEmailMutation = useMutation({
        mutationFn: (params) => base44.functions.invoke('aiEmailAssistant', {
            action: 'draft_email',
            params
        }),
        onSuccess: (result) => {
            setAiResult(result.data.draft);
            toast.success('Email draft generated!');
        }
    });

    const summarizeThreadMutation = useMutation({
        mutationFn: (threadId) => base44.functions.invoke('aiEmailAssistant', {
            action: 'summarize_thread',
            params: { thread_id: threadId }
        }),
        onSuccess: (result) => {
            setThreadSummary(result.data.summary);
            toast.success('Thread summarized!');
        }
    });

    const suggestReplyMutation = useMutation({
        mutationFn: ({ emailId, params }) => base44.functions.invoke('aiEmailAssistant', {
            action: 'suggest_reply',
            email_id: emailId,
            params
        }),
        onSuccess: (result) => {
            setAiResult(result.data.reply);
            toast.success('Reply suggestion ready!');
        }
    });

    const prioritizeMutation = useMutation({
        mutationFn: () => base44.functions.invoke('aiEmailAssistant', {
            action: 'prioritize_inbox'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['emails']);
            toast.success('Inbox prioritized!');
        }
    });

    const getPriorityColor = (priority) => {
        if (priority === 'high') return 'bg-red-100 text-red-700 border-red-200';
        if (priority === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const getSentimentIcon = (sentiment) => {
        if (sentiment === 'urgent') return <AlertCircle className="w-4 h-4 text-red-600" />;
        if (sentiment === 'positive') return <MessageSquare className="w-4 h-4 text-green-600" />;
        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">AI Email Assistant</h1>
                            <p className="text-[#0F1729]/60 font-light">Intelligent email management</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => prioritizeMutation.mutate()}
                            disabled={prioritizeMutation.isLoading}
                            variant="outline"
                            className="border-[#4A90E2]/30"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Prioritize Inbox
                        </Button>
                        <Button
                            onClick={() => setDraftAssistOpen(true)}
                            variant="outline"
                            className="border-[#4A90E2]/30"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Draft Email
                        </Button>
                        <Button
                            onClick={() => setComposeOpen(true)}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Compose
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Tabs value={filter} onValueChange={setFilter} className="mb-6">
                    <TabsList>
                        <TabsTrigger value="inbox">
                            <Inbox className="w-4 h-4 mr-2" />
                            Inbox
                        </TabsTrigger>
                        <TabsTrigger value="starred">
                            <Star className="w-4 h-4 mr-2" />
                            Starred
                        </TabsTrigger>
                        <TabsTrigger value="drafts">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Drafts
                        </TabsTrigger>
                        <TabsTrigger value="archived">
                            <Archive className="w-4 h-4 mr-2" />
                            Archived
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Email List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-2">
                        {emails.map((email) => (
                            <Card
                                key={email.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    selectedEmail?.id === email.id ? 'border-[#4A90E2] border-2' : ''
                                } ${!email.read ? 'bg-blue-50/50' : ''}`}
                                onClick={() => setSelectedEmail(email)}
                            >
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {email.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                                {getSentimentIcon(email.sentiment)}
                                                <span className="font-medium text-sm truncate">{email.from}</span>
                                            </div>
                                            <h4 className={`text-sm truncate ${!email.read ? 'font-semibold' : ''}`}>
                                                {email.subject}
                                            </h4>
                                        </div>
                                        {email.priority && (
                                            <Badge className={`${getPriorityColor(email.priority)} text-xs ml-2`}>
                                                {email.priority}
                                            </Badge>
                                        )}
                                    </div>
                                    {email.ai_summary && (
                                        <p className="text-xs text-black/60 line-clamp-2 mb-2">{email.ai_summary}</p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-black/50">
                                        <span>{format(new Date(email.created_date), 'MMM d')}</span>
                                        {email.category && (
                                            <Badge variant="outline" className="text-xs">
                                                {email.category}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {emails.length === 0 && (
                            <div className="text-center py-12">
                                <Mail className="w-16 h-16 text-black/20 mx-auto mb-4" />
                                <p className="text-black/40">No emails</p>
                            </div>
                        )}
                    </div>

                    {/* Email Detail */}
                    <div className="lg:col-span-2">
                        {selectedEmail ? (
                            <Card className="h-full">
                                <CardHeader className="border-b">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-light mb-2">{selectedEmail.subject}</CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-black/60">
                                                <span>From: {selectedEmail.from}</span>
                                                {selectedEmail.to && <span>• To: {selectedEmail.to.join(', ')}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => analyzeEmailMutation.mutate(selectedEmail.id)}
                                                disabled={analyzeEmailMutation.isLoading}
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                            {selectedEmail.thread_id && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setThreadSummaryOpen(true);
                                                        summarizeThreadMutation.mutate(selectedEmail.thread_id);
                                                    }}
                                                >
                                                    Summarize Thread
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setReplyOpen(true);
                                                    suggestReplyMutation.mutate({ 
                                                        emailId: selectedEmail.id, 
                                                        params: replyParams 
                                                    });
                                                }}
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {selectedEmail.ai_summary && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-blue-600" />
                                                AI Summary
                                            </h4>
                                            <p className="text-sm text-blue-900">{selectedEmail.ai_summary}</p>
                                        </div>
                                    )}

                                    {selectedEmail.action_items?.length > 0 && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="font-medium text-sm mb-2">Action Items</h4>
                                            <ul className="space-y-1">
                                                {selectedEmail.action_items.map((item, i) => (
                                                    <li key={i} className="text-sm text-green-900 flex items-start gap-2">
                                                        <ChevronRight className="w-4 h-4 mt-0.5" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {selectedEmail.reminder_date && (
                                        <div className="flex items-center gap-2 text-sm text-orange-600">
                                            <Clock className="w-4 h-4" />
                                            Reminder set for {format(new Date(selectedEmail.reminder_date), 'MMM d, h:mm a')}
                                        </div>
                                    )}

                                    <div className="prose prose-sm max-w-none">
                                        <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                                    </div>

                                    {selectedEmail.suggested_reply && (
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <h4 className="font-medium text-sm mb-2">Suggested Reply</h4>
                                            <p className="text-sm text-purple-900 whitespace-pre-wrap">{selectedEmail.suggested_reply}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <Mail className="w-16 h-16 text-black/20 mx-auto mb-4" />
                                    <p className="text-black/40">Select an email to view</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* AI Draft Assistant Dialog */}
                <Dialog open={draftAssistOpen} onOpenChange={setDraftAssistOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>AI Email Draft Assistant</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Purpose</Label>
                                <Input
                                    placeholder="e.g., Request meeting, Follow up on proposal"
                                    value={draftParams.purpose}
                                    onChange={(e) => setDraftParams({ ...draftParams, purpose: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Context</Label>
                                <Textarea
                                    placeholder="Provide context and key points to include..."
                                    value={draftParams.context}
                                    onChange={(e) => setDraftParams({ ...draftParams, context: e.target.value })}
                                    rows={5}
                                />
                            </div>
                            <div>
                                <Label>Tone</Label>
                                <Select value={draftParams.tone} onValueChange={(value) => setDraftParams({ ...draftParams, tone: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="friendly">Friendly</SelectItem>
                                        <SelectItem value="formal">Formal</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={() => draftEmailMutation.mutate(draftParams)}
                                disabled={draftEmailMutation.isLoading}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Draft
                            </Button>

                            {aiResult && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div>
                                        <Label>Subject</Label>
                                        <Input value={aiResult.subject || aiResult.suggested_subject} readOnly />
                                    </div>
                                    <div>
                                        <Label>Body</Label>
                                        <Textarea value={aiResult.body || aiResult.reply_body} rows={10} readOnly />
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Thread Summary Dialog */}
                <Dialog open={threadSummaryOpen} onOpenChange={setThreadSummaryOpen}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Thread Summary</DialogTitle>
                        </DialogHeader>
                        {threadSummary && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Overview</h4>
                                    <p className="text-sm text-black/70">{threadSummary.overall_summary}</p>
                                </div>
                                {threadSummary.key_decisions?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Key Decisions</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {threadSummary.key_decisions.map((d, i) => (
                                                <li key={i} className="text-sm text-black/70">{d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {threadSummary.action_items?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Action Items</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {threadSummary.action_items.map((a, i) => (
                                                <li key={i} className="text-sm text-black/70">{a}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {threadSummary.next_steps?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Next Steps</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {threadSummary.next_steps.map((s, i) => (
                                                <li key={i} className="text-sm text-black/70">{s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Reply Dialog */}
                <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>AI Reply Suggestion</DialogTitle>
                        </DialogHeader>
                        {aiResult && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Subject</Label>
                                    <Input value={aiResult.suggested_subject} readOnly />
                                </div>
                                <div>
                                    <Label>Reply</Label>
                                    <Textarea value={aiResult.reply_body} rows={10} />
                                </div>
                                <Button className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Reply
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}