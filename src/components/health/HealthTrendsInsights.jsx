import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

export default function HealthTrendsInsights({ trends }) {
    if (!trends) return null;

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRiskColor = (level) => {
        if (level === 'high') return 'bg-red-100 text-red-700 border-red-200';
        if (level === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const getPriorityColor = (priority) => {
        if (priority === 'high') return 'bg-red-100 text-red-700';
        if (priority === 'medium') return 'bg-yellow-100 text-yellow-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="space-y-6">
            {/* Overall Health Score */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-black/60 mb-1">Overall Health Score</h3>
                            <div className={`text-5xl font-light ${getScoreColor(trends.overall_health_score)}`}>
                                {trends.overall_health_score}/100
                            </div>
                        </div>
                        <Activity className="w-16 h-16 text-blue-300" />
                    </div>
                    <p className="mt-4 text-sm text-black/70">{trends.overall_assessment}</p>
                </CardContent>
            </Card>

            {/* Identified Trends */}
            {trends.identified_trends?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Health Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {trends.identified_trends.map((trend, i) => (
                            <div key={i} className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">{trend.trend}</h4>
                                    <Badge variant="outline" className="text-xs">
                                        {trend.severity}
                                    </Badge>
                                </div>
                                <p className="text-sm text-black/70">{trend.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Risk Factors */}
            {trends.risk_factors?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            Risk Factors
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {trends.risk_factors.map((risk, i) => (
                            <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">{risk.risk}</h4>
                                    <Badge className={getRiskColor(risk.level)}>
                                        {risk.level} risk
                                    </Badge>
                                </div>
                                <p className="text-sm text-black/70">{risk.recommendation}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Positive Patterns */}
            {trends.positive_patterns?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            Positive Patterns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {trends.positive_patterns.map((pattern, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-black/70">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    {pattern}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {trends.recommendations?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {trends.recommendations.map((rec, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">{rec.category}</h4>
                                    <Badge className={getPriorityColor(rec.priority)}>
                                        {rec.priority} priority
                                    </Badge>
                                </div>
                                <p className="text-sm text-black/70">{rec.action}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Medication Insights */}
            {trends.medication_insights?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Medication Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {trends.medication_insights.map((insight, i) => (
                                <li key={i} className="text-sm text-black/70 flex items-start gap-2">
                                    <span className="text-purple-600 font-bold">•</span>
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Follow-up Priorities */}
            {trends.follow_up_priorities?.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Follow-up Priorities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {trends.follow_up_priorities.map((priority, i) => (
                                <li key={i} className="text-sm text-black/70 flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">{i + 1}.</span>
                                    {priority}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}