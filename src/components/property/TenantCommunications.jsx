import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, FileText, BarChart3, Copy, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantCommunications({ properties }) {
    const [activeTab, setActiveTab] = useState('respond');
    const [tenantMessage, setTenantMessage] = useState('');
    const [selectedProperty, setSelectedProperty] = useState('');
    const [generatedResponse, setGeneratedResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [templateType, setTemplateType] = useState('rent_reminder');
    const [template, setTemplate] = useState(null);
    const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
    const [bulkInsights, setBulkInsights] = useState(null);

    const generateResponse = async () => {
        if (!tenantMessage.trim()) {
            toast.error('Please enter a tenant message');
            return;
        }

        setLoading(true);
        try {
            const result = await base44.functions.invoke('manageTenantCommunications', {
                action: 'generate_response',
                tenant_message: tenantMessage,
                property_id: selectedProperty || null
            });
            setGeneratedResponse(result.data);
            toast.success('Response generated!');
        } catch (error) {
            toast.error('Failed to generate response');
        } finally {
            setLoading(false);
        }
    };

    const generateTemplate = async () => {
        setLoading(true);
        try {
            const property = properties.find(p => p.id === selectedProperty);
            const result = await base44.functions.invoke('manageTenantCommunications', {
                action: 'generate_template',
                communication_type: templateType,
                property_id: selectedProperty || null,
                tenant_name: property?.tenant_name
            });
            setTemplate(result.data.template);
            toast.success('Template generated!');
        } catch (error) {
            toast.error('Failed to generate template');
        } finally {
            setLoading(false);
        }
    };

    const analyzeSentiment = async () => {
        if (!tenantMessage.trim()) {
            toast.error('Please enter a tenant message to analyze');
            return;
        }

        setLoading(true);
        try {
            const result = await base44.functions.invoke('manageTenantCommunications', {
                action: 'analyze_sentiment',
                tenant_message: tenantMessage,
                property_id: selectedProperty || null
            });
            setSentimentAnalysis(result.data.analysis);
            toast.success('Sentiment analyzed!');
        } catch (error) {
            toast.error('Failed to analyze sentiment');
        } finally {
            setLoading(false);
        }
    };

    const analyzeBulkCommunications = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('manageTenantCommunications', {
                action: 'bulk_analyze_communications'
            });
            setBulkInsights(result.data.insights);
            toast.success('Portfolio insights generated!');
        } catch (error) {
            toast.error('Failed to analyze communications');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const getSentimentColor = (sentiment) => {
        const colors = {
            positive: 'bg-green-100 text-green-700',
            neutral: 'bg-blue-100 text-blue-700',
            negative: 'bg-red-100 text-red-700',
            urgent: 'bg-orange-100 text-orange-700'
        };
        return colors[sentiment] || colors.neutral;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border border-[#1A2B44]/10">
                    <TabsTrigger value="respond">Quick Response</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
                    <TabsTrigger value="insights">Portfolio Insights</TabsTrigger>
                </TabsList>

                {/* Quick Response Tab */}
                <TabsContent value="respond" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                AI-Powered Response Generator
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Property (Optional)</Label>
                                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select property for context" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>No specific property</SelectItem>
                                        {properties.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} {p.tenant_name && `- ${p.tenant_name}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Tenant Message/Inquiry</Label>
                                <Textarea
                                    value={tenantMessage}
                                    onChange={(e) => setTenantMessage(e.target.value)}
                                    placeholder="Enter the tenant's message or inquiry..."
                                    rows={4}
                                />
                            </div>

                            <Button
                                onClick={generateResponse}
                                disabled={loading || !tenantMessage.trim()}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                            >
                                <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Generating...' : 'Generate Response'}
                            </Button>

                            {generatedResponse && (
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-[#1A2B44]">Suggested Response</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(generatedResponse.response_text)}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Subject: {generatedResponse.suggested_subject}
                                        </div>
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                            {generatedResponse.response_text}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge className={getPriorityColor(generatedResponse.urgency_level)}>
                                            {generatedResponse.urgency_level} urgency
                                        </Badge>
                                        {generatedResponse.follow_up_needed && (
                                            <Badge className="bg-blue-100 text-blue-700">
                                                Follow-up recommended
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Communication Templates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Template Type</Label>
                                <Select value={templateType} onValueChange={setTemplateType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rent_reminder">Rent Payment Reminder</SelectItem>
                                        <SelectItem value="maintenance_acknowledgment">Maintenance Request Acknowledgment</SelectItem>
                                        <SelectItem value="lease_renewal">Lease Renewal Discussion</SelectItem>
                                        <SelectItem value="late_payment_notice">Late Payment Notice</SelectItem>
                                        <SelectItem value="maintenance_update">Maintenance Update</SelectItem>
                                        <SelectItem value="move_in_welcome">Move-In Welcome</SelectItem>
                                        <SelectItem value="move_out_instructions">Move-Out Instructions</SelectItem>
                                        <SelectItem value="policy_update">Policy Update</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Property (Optional)</Label>
                                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select property for personalization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={null}>Generic template</SelectItem>
                                        {properties.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={generateTemplate}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                            >
                                <FileText className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Generating...' : 'Generate Template'}
                            </Button>

                            {template && (
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-[#1A2B44]">Generated Template</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(`${template.subject}\n\n${template.body}`)}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </Button>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Subject: {template.subject}
                                        </div>
                                        <div className="text-sm text-gray-800 whitespace-pre-wrap mb-4">
                                            {template.body}
                                        </div>
                                        <Badge className="bg-purple-100 text-purple-700">
                                            Tone: {template.tone}
                                        </Badge>
                                    </div>

                                    {template.placeholders?.length > 0 && (
                                        <div className="text-xs text-gray-600">
                                            <span className="font-medium">Placeholders:</span> {template.placeholders.join(', ')}
                                        </div>
                                    )}

                                    {template.tips?.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="text-xs font-medium text-blue-900 mb-2">Usage Tips:</div>
                                            <ul className="space-y-1">
                                                {template.tips.map((tip, idx) => (
                                                    <li key={idx} className="text-xs text-blue-800">• {tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sentiment Analysis Tab */}
                <TabsContent value="sentiment" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Sentiment & Tone Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Tenant Message to Analyze</Label>
                                <Textarea
                                    value={tenantMessage}
                                    onChange={(e) => setTenantMessage(e.target.value)}
                                    placeholder="Paste tenant message, email, or feedback..."
                                    rows={5}
                                />
                            </div>

                            <Button
                                onClick={analyzeSentiment}
                                disabled={loading || !tenantMessage.trim()}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                            >
                                <BarChart3 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Analyzing...' : 'Analyze Sentiment'}
                            </Button>

                            {sentimentAnalysis && (
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Sentiment</div>
                                            <Badge className={`${getSentimentColor(sentimentAnalysis.sentiment)} text-sm`}>
                                                {sentimentAnalysis.sentiment}
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Priority</div>
                                            <Badge className={`${getPriorityColor(sentimentAnalysis.priority)} text-sm`}>
                                                {sentimentAnalysis.priority}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Emotional Tone</div>
                                        <div className="text-sm font-medium text-[#1A2B44]">
                                            {sentimentAnalysis.emotional_tone}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-600 mb-1">Urgency Score</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        sentimentAnalysis.urgency_score >= 7 ? 'bg-red-600' :
                                                        sentimentAnalysis.urgency_score >= 4 ? 'bg-yellow-600' :
                                                        'bg-green-600'
                                                    }`}
                                                    style={{ width: `${sentimentAnalysis.urgency_score * 10}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium">{sentimentAnalysis.urgency_score}/10</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-gray-600 mb-2">Key Concerns</div>
                                        <div className="flex flex-wrap gap-2">
                                            {sentimentAnalysis.key_concerns.map((concern, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {concern}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {sentimentAnalysis.red_flags?.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-red-900 font-medium mb-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Red Flags Detected
                                            </div>
                                            <ul className="space-y-1">
                                                {sentimentAnalysis.red_flags.map((flag, idx) => (
                                                    <li key={idx} className="text-xs text-red-800">• {flag}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="text-xs font-medium text-blue-900 mb-2">Recommended Response Approach</div>
                                        <p className="text-sm text-blue-800">{sentimentAnalysis.response_approach}</p>
                                        <div className="text-xs text-blue-700 mt-2">
                                            Est. Resolution Time: {sentimentAnalysis.estimated_resolution_time}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Portfolio Insights Tab */}
                <TabsContent value="insights" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Portfolio Communication Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Analyze tenant communication patterns across all properties to identify trends, risks, and opportunities for proactive outreach.
                            </p>

                            <Button
                                onClick={analyzeBulkCommunications}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                            >
                                <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Analyzing...' : 'Analyze Portfolio Communications'}
                            </Button>

                            {bulkInsights && (
                                <div className="mt-6 space-y-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-[#1A2B44]">
                                            {bulkInsights.satisfaction_score}/100
                                        </div>
                                        <div className="text-sm text-gray-600">Overall Satisfaction Score</div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-[#1A2B44] mb-3">Common Concerns</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {bulkInsights.common_concerns.map((concern, idx) => (
                                                <Badge key={idx} variant="outline">
                                                    {concern}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {bulkInsights.at_risk_properties?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-[#1A2B44] mb-3 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                                At-Risk Properties
                                            </h4>
                                            <div className="space-y-3">
                                                {bulkInsights.at_risk_properties.map((prop, idx) => (
                                                    <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                        <div className="font-medium text-orange-900 mb-2">
                                                            {prop.property_name}
                                                        </div>
                                                        <div className="text-xs text-orange-800 mb-2">
                                                            <span className="font-medium">Risk Factors:</span>
                                                            <ul className="mt-1 space-y-0.5">
                                                                {prop.risk_factors.map((risk, rIdx) => (
                                                                    <li key={rIdx}>• {risk}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="text-xs text-blue-800 bg-blue-50 rounded p-2">
                                                            <span className="font-medium">Action:</span> {prop.recommended_action}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {bulkInsights.proactive_outreach?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-[#1A2B44] mb-3 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                Proactive Outreach Opportunities
                                            </h4>
                                            <div className="space-y-3">
                                                {bulkInsights.proactive_outreach.map((outreach, idx) => (
                                                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                        <div className="font-medium text-green-900 mb-1">
                                                            {outreach.property_name}
                                                        </div>
                                                        <div className="text-xs text-green-800 mb-2">
                                                            {outreach.reason}
                                                        </div>
                                                        <div className="text-xs text-gray-700 bg-white rounded p-2">
                                                            <span className="font-medium">Suggested:</span> {outreach.suggested_message}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="font-medium text-[#1A2B44] mb-3">Communication Tips</h4>
                                        <ul className="space-y-2">
                                            {bulkInsights.communication_tips.map((tip, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="text-[#D4AF37]">•</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}