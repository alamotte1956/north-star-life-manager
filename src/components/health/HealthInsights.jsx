import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

export default function HealthInsights({ insights, metrics }) {
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
            {/* Overall Health */}
            <Card className="border-[#D4AF37]/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-light">
                        <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                        Health Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl font-light">{insights.overall_health_score}</div>
                        <div>
                            <div className="text-sm text-white/60">Health Score</div>
                            <Badge className={`${getScoreColor(insights.overall_health_score)} bg-transparent border`}>
                                {insights.overall_health_score >= 8 ? 'Excellent' : 
                                 insights.overall_health_score >= 5 ? 'Good' : 'Needs Attention'}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-white/80 leading-relaxed">{insights.health_summary}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medication Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <Heart className="w-5 h-5 text-red-500" />
                            Medication Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-3">
                            <div className="text-2xl font-light">{metrics.avg_adherence.toFixed(0)}%</div>
                            <div className="text-sm text-white/60">7-Day Adherence</div>
                        </div>
                        <p className="text-sm text-white/70">{insights.medication_insights}</p>
                    </CardContent>
                </Card>

                {/* Lifestyle Insights */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Lifestyle Patterns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {metrics.avg_heart_rate > 0 && (
                                <div>
                                    <div className="text-xl font-light">{metrics.avg_heart_rate.toFixed(0)}</div>
                                    <div className="text-xs text-white/60">HR (bpm)</div>
                                </div>
                            )}
                            {metrics.avg_sleep_hours > 0 && (
                                <div>
                                    <div className="text-xl font-light">{metrics.avg_sleep_hours.toFixed(1)}</div>
                                    <div className="text-xs text-white/60">Sleep (hrs)</div>
                                </div>
                            )}
                            {metrics.avg_daily_steps > 0 && (
                                <div>
                                    <div className="text-xl font-light">{(metrics.avg_daily_steps / 1000).toFixed(1)}K</div>
                                    <div className="text-xs text-white/60">Steps</div>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-white/70">{insights.lifestyle_insights}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Positive Trends */}
            {insights.positive_trends?.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light text-green-900">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Positive Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {insights.positive_trends.map((trend, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-green-900">{trend}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Risk Factors */}
            {insights.risk_factors?.length > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light text-yellow-900">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Health Considerations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {insights.risk_factors.map((risk, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-yellow-900">{risk}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {insights.recommendations?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-light">
                            <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                            Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {insights.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-medium text-[#D4AF37]">{idx + 1}</span>
                                    </span>
                                    <span className="text-sm text-white/80">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}