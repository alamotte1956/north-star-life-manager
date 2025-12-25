import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantSentimentAnalyzer({ property }) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        if (!message.trim()) {
            toast.error('Please enter a message to analyze');
            return;
        }

        setLoading(true);
        try {
            const result = await base44.functions.invoke('analyzeTenantSentiment', {
                message_text: message,
                tenant_name: property?.tenant_name,
                property_name: property?.name
            });

            setAnalysis(result.data.analysis);
            toast.success('Sentiment analyzed successfully!');
        } catch (error) {
            toast.error('Failed to analyze sentiment');
        }
        setLoading(false);
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'bg-green-100 text-green-800 border-green-200';
            case 'neutral': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'negative': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'very_negative': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Sentiment Analyzer
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Tenant Message</label>
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Paste tenant communication here..."
                        rows={4}
                    />
                </div>

                <Button
                    onClick={handleAnalyze}
                    disabled={loading || !message.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                    <Brain className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing...' : 'Analyze Sentiment'}
                </Button>

                {analysis && (
                    <div className="space-y-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-lg border ${getSentimentColor(analysis.sentiment)}`}>
                                <p className="text-xs font-medium mb-1">Sentiment</p>
                                <p className="text-lg font-semibold capitalize">{analysis.sentiment}</p>
                            </div>
                            <div className={`p-3 rounded-lg border ${
                                analysis.urgency === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                                analysis.urgency === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                analysis.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                                <p className="text-xs font-medium mb-1">Urgency</p>
                                <p className="text-lg font-semibold capitalize">{analysis.urgency}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Summary</p>
                            <p className="text-sm text-gray-700">{analysis.summary}</p>
                        </div>

                        {analysis.emotions?.length > 0 && (
                            <div>
                                <p className="text-xs font-medium mb-2">Detected Emotions</p>
                                <div className="flex flex-wrap gap-1">
                                    {analysis.emotions.map((emotion, idx) => (
                                        <Badge key={idx} variant="outline">{emotion}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {analysis.key_concerns?.length > 0 && (
                            <div>
                                <p className="text-xs font-medium mb-2">Key Concerns</p>
                                <ul className="space-y-1">
                                    {analysis.key_concerns.map((concern, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-1">
                                            <span>•</span>
                                            <span>{concern}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-900 mb-1">Recommended Approach</p>
                            <p className="text-sm text-blue-800">{analysis.recommended_approach}</p>
                        </div>

                        {analysis.red_flags?.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <p className="text-xs font-medium text-red-900 mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    Red Flags
                                </p>
                                <ul className="space-y-1">
                                    {analysis.red_flags.map((flag, idx) => (
                                        <li key={idx} className="text-sm text-red-800 flex items-start gap-1">
                                            <span>⚠️</span>
                                            <span>{flag}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}