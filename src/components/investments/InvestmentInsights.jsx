import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertTriangle, Target, Lightbulb, CheckCircle } from 'lucide-react';

export default function InvestmentInsights({ insights, metrics }) {
    if (!insights) {
        return null;
    }

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-green-600';
        if (score >= 5) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6">
            {/* Overall Assessment */}
            <Card className="border-[#D4AF37]/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-light">
                        <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                        Portfolio Assessment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-white/80 leading-relaxed">{insights.overall_assessment}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diversification */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Diversification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-light">
                                    {insights.diversification_score}
                                </span>
                                <span className="text-sm text-white/60">/ 10</span>
                                <Badge className={`${getScoreColor(insights.diversification_score)} bg-transparent border`}>
                                    {insights.diversification_score >= 8 ? 'Excellent' : 
                                     insights.diversification_score >= 5 ? 'Good' : 'Needs Work'}
                                </Badge>
                            </div>
                        </div>
                        <p className="text-sm text-white/70">{insights.diversification_analysis}</p>
                    </CardContent>
                </Card>

                {/* Risk Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Risk Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-white/70">{insights.risk_analysis}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Rebalancing Suggestions */}
            {insights.rebalancing_suggestions?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <Target className="w-5 h-5 text-[#D4AF37]" />
                            Rebalancing Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {insights.rebalancing_suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-medium text-[#D4AF37]">{idx + 1}</span>
                                    </span>
                                    <span className="text-sm text-white/80">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Opportunities */}
            {insights.opportunities?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Investment Opportunities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {insights.opportunities.map((opportunity, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-white/80">{opportunity}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Action Items */}
            {insights.action_items?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Next Steps
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {insights.action_items.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-white/80">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}