import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function AITenantResponseDrafter({ property, onSend }) {
    const [inquiry, setInquiry] = useState('');
    const [loading, setLoading] = useState(false);
    const [draftedResponse, setDraftedResponse] = useState(null);

    const handleDraft = async () => {
        if (!inquiry.trim()) {
            toast.error('Please enter an inquiry');
            return;
        }

        setLoading(true);
        try {
            const result = await base44.functions.invoke('draftTenantResponse', {
                inquiry_text: inquiry,
                property_name: property?.name,
                tenant_name: property?.tenant_name
            });

            setDraftedResponse(result.data.response);
            toast.success('Response drafted successfully!');
        } catch (error) {
            toast.error('Failed to draft response');
        }
        setLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(draftedResponse.drafted_response);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Response Drafter
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Tenant Inquiry</label>
                        <Textarea
                            value={inquiry}
                            onChange={(e) => setInquiry(e.target.value)}
                            placeholder="Paste tenant's message here..."
                            rows={4}
                        />
                    </div>

                    <Button
                        onClick={handleDraft}
                        disabled={loading || !inquiry.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                        <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Drafting...' : 'Draft AI Response'}
                    </Button>

                    {draftedResponse && (
                        <div className="space-y-3 mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-2">
                                    <Badge className={
                                        draftedResponse.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        draftedResponse.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                        'bg-blue-100 text-blue-800'
                                    }>
                                        {draftedResponse.priority} priority
                                    </Badge>
                                    <Badge variant="outline">{draftedResponse.category}</Badge>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopy}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            <div className="bg-white p-3 rounded border">
                                <p className="text-sm whitespace-pre-wrap">{draftedResponse.drafted_response}</p>
                            </div>

                            {draftedResponse.suggested_actions?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-purple-900 mb-1">Suggested Actions:</p>
                                    <ul className="space-y-1">
                                        {draftedResponse.suggested_actions.map((action, idx) => (
                                            <li key={idx} className="text-xs text-purple-800 flex items-start gap-1">
                                                <span>•</span>
                                                <span>{action}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {onSend && (
                                <Button
                                    size="sm"
                                    onClick={() => onSend(draftedResponse.drafted_response)}
                                    className="w-full"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Use This Response
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}