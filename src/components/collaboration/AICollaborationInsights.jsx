import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageSquare, CheckCircle2, AlertCircle, HelpCircle, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AICollaborationInsights({ entityType, entityId, insightType = 'discussion_summary' }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const generateInsights = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getCollaborationInsights', {
                entity_type: entityType,
                entity_id: entityId,
                insight_type: insightType
            });
            
            if (result.data.success) {
                setInsights(result.data.insights);
                setExpanded(true);
                toast.success('AI insights generated!');
            }
        } catch (error) {
            toast.error('Failed to generate insights');
        }
        setLoading(false);
    };

    const getSentimentColor = (sentiment) => {
        if (!sentiment) return 'bg-gray-100 text-gray-700';
        if (sentiment.toLowerCase().includes('positive')) return 'bg-green-100 text-green-700';
        if (sentiment.toLowerCase().includes('concerned')) return 'bg-red-100 text-red-700';
        return 'bg-blue-100 text-blue-700';
    };

    if (!insights && !expanded) {
        return (
            <Card className="border-[#D4AF37]/30">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-light text-black">AI Collaboration Insights</div>
                                <div className="text-sm text-black/60">Analyze discussions and suggest actions</div>
                            </div>
                        </div>
                        <Button 
                            onClick={generateInsights}
                            disabled={loading}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                        >
                            {loading ? 'Analyzing...' : 'Generate Insights'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Discussion Summary Insights
    if (insightType === 'discussion_summary' && insights) {
        return (
            <Card className="border-[#D4AF37]/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                            Discussion Summary
                        </CardTitle>
                        <Badge className={getSentimentColor(insights.sentiment)}>
                            {insights.sentiment}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-black/70 leading-relaxed">{insights.summary}</p>
                    </div>

                    {insights.key_points?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                Key Points
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.key_points.map((point, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.action_items?.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-900">
                                <CheckCircle2 className="w-4 h-4" />
                                Action Items
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.action_items.map((item, i) => (
                                    <li key={i} className="text-sm text-green-800 list-disc">{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.decisions_made?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                Decisions Made
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.decisions_made.map((decision, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{decision}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.questions_raised?.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-yellow-900">
                                <HelpCircle className="w-4 h-4" />
                                Questions to Address
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.questions_raised.map((question, i) => (
                                    <li key={i} className="text-sm text-yellow-800 list-disc">{question}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.next_steps?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2">Suggested Next Steps</h4>
                            <ul className="space-y-1 ml-6">
                                {insights.next_steps.map((step, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateInsights}
                        disabled={loading}
                        className="w-full"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Refresh Insights
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Financial Goal Collaboration
    if (insightType === 'financial_goal_collaboration' && insights) {
        return (
            <Card className="border-[#D4AF37]/30">
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#D4AF37]" />
                        Group Financial Planning
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2 text-blue-900">Collaboration Status</h4>
                        <p className="text-sm text-blue-800">{insights.collaboration_status}</p>
                    </div>

                    <div>
                        <h4 className="font-medium text-sm mb-2">Contribution Analysis</h4>
                        <p className="text-sm text-black/70">{insights.contribution_analysis}</p>
                    </div>

                    {insights.suggested_contribution_split && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 text-green-900">Suggested Split</h4>
                            <p className="text-sm text-green-800">{insights.suggested_contribution_split}</p>
                        </div>
                    )}

                    {insights.decision_points?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                Key Decisions Needed
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.decision_points.map((point, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.motivation_tips?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                Stay Motivated
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.motivation_tips.map((tip, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.potential_conflicts?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 text-red-900">Potential Conflicts</h4>
                            <ul className="space-y-1 ml-6">
                                {insights.potential_conflicts.map((conflict, i) => (
                                    <li key={i} className="text-sm text-red-800 list-disc">{conflict}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.recommended_actions?.length > 0 && (
                        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2">Recommended Actions</h4>
                            <ul className="space-y-1 ml-6">
                                {insights.recommended_actions.map((action, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{action}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateInsights}
                        disabled={loading}
                        className="w-full"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Refresh Insights
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Health Trends
    if (insightType === 'health_trends' && insights) {
        return (
            <Card className="border-[#D4AF37]/30">
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#D4AF37]" />
                        Family Health Insights
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2 text-blue-900">Family Health Overview</h4>
                        <p className="text-sm text-blue-800">{insights.family_health_overview}</p>
                    </div>

                    {insights.common_concerns?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                Common Concerns
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.common_concerns.map((concern, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{concern}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.preventive_recommendations?.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 text-green-900">Preventive Care</h4>
                            <ul className="space-y-1 ml-6">
                                {insights.preventive_recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-green-800 list-disc">{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.coordination_suggestions?.length > 0 && (
                        <div>
                            <h4 className="font-medium text-sm mb-2">Care Coordination</h4>
                            <ul className="space-y-1 ml-6">
                                {insights.coordination_suggestions.map((suggestion, i) => (
                                    <li key={i} className="text-sm text-black/70 list-disc">{suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.shared_goals?.length > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 text-purple-900">Shared Health Goals</h4>
                            <ul className="space-y-1 ml-6">
                                {insights.shared_goals.map((goal, i) => (
                                    <li key={i} className="text-sm text-purple-800 list-disc">{goal}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {insights.red_flags?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-2 text-red-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Red Flags
                            </h4>
                            <ul className="space-y-1 ml-6">
                                {insights.red_flags.map((flag, i) => (
                                    <li key={i} className="text-sm text-red-800 list-disc">{flag}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateInsights}
                        disabled={loading}
                        className="w-full"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Refresh Insights
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null;
}