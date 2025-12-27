import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, DollarSign } from 'lucide-react';

export default function PropertyAnalyticsReport({ analytics }) {
    const { portfolio_metrics, property_data, ai_insights } = analytics;

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityBadge = (severity) => {
        const colors = {
            low: 'bg-blue-100 text-blue-700',
            medium: 'bg-yellow-100 text-yellow-700',
            high: 'bg-orange-100 text-orange-700',
            critical: 'bg-red-100 text-red-700'
        };
        return colors[severity] || colors.medium;
    };

    return (
        <div className="space-y-6">
            {/* Portfolio Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Portfolio Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Overall Health Score</span>
                        <span className={`text-2xl font-bold ${getHealthColor(ai_insights.portfolio_performance.overall_health_score)}`}>
                            {ai_insights.portfolio_performance.overall_health_score}/100
                        </span>
                    </div>
                    <p className="text-sm text-gray-700">{ai_insights.portfolio_performance.summary}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <h4 className="font-medium text-sm mb-2 text-green-700">Strengths</h4>
                            <ul className="space-y-1">
                                {ai_insights.portfolio_performance.key_strengths.map((strength, idx) => (
                                    <li key={idx} className="text-xs flex items-start gap-2">
                                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                        {strength}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm mb-2 text-orange-700">Concerns</h4>
                            <ul className="space-y-1">
                                {ai_insights.portfolio_performance.key_concerns.map((concern, idx) => (
                                    <li key={idx} className="text-xs flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                        {concern}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vacancy Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Vacancy & Occupancy
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#1A2B44]">
                                {ai_insights.vacancy_analysis.current_rate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600">Vacancy Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {portfolio_metrics.occupied_properties}
                            </div>
                            <div className="text-xs text-gray-600">Occupied</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {portfolio_metrics.vacant_properties}
                            </div>
                            <div className="text-xs text-gray-600">Vacant</div>
                        </div>
                    </div>
                    
                    <Badge className={ai_insights.vacancy_analysis.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                        {ai_insights.vacancy_analysis.status}
                    </Badge>

                    {ai_insights.vacancy_analysis.problem_properties.length > 0 && (
                        <div className="mt-3">
                            <h4 className="font-medium text-sm mb-2">Problem Properties</h4>
                            <ul className="space-y-1">
                                {ai_insights.vacancy_analysis.problem_properties.map((prop, idx) => (
                                    <li key={idx} className="text-sm text-red-700">• {prop}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-3">
                        <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                            {ai_insights.vacancy_analysis.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-xs text-gray-700">• {rec}</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* ROI Rankings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        ROI Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {ai_insights.roi_rankings.map((prop, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium text-[#1A2B44]">{prop.property_name}</div>
                                    <div className="text-xs text-gray-600 mt-1">{prop.insights}</div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className={`text-lg font-bold ${prop.roi >= 5 ? 'text-green-600' : prop.roi >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {prop.roi.toFixed(2)}%
                                    </div>
                                    <Badge className="mt-1 text-xs">{prop.performance_rating}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tenant Predictions */}
            {ai_insights.tenant_predictions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Tenant Behavior Predictions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {ai_insights.tenant_predictions.map((prediction, idx) => (
                                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="font-medium text-[#1A2B44]">{prediction.property_name}</div>
                                    <div className="text-sm text-gray-600 mb-2">Tenant: {prediction.tenant_name}</div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div>
                                            <div className="text-xs text-gray-500">Renewal Likelihood</div>
                                            <div className={`text-lg font-bold ${prediction.renewal_likelihood >= 70 ? 'text-green-600' : prediction.renewal_likelihood >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {prediction.renewal_likelihood}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Late Payment Risk</div>
                                            <div className={`text-lg font-bold ${prediction.late_payment_risk <= 30 ? 'text-green-600' : prediction.late_payment_risk <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {prediction.late_payment_risk}%
                                            </div>
                                        </div>
                                    </div>

                                    {prediction.risk_factors.length > 0 && (
                                        <div className="mb-2">
                                            <div className="text-xs font-medium text-gray-700 mb-1">Risk Factors:</div>
                                            <ul className="space-y-0.5">
                                                {prediction.risk_factors.map((factor, fIdx) => (
                                                    <li key={fIdx} className="text-xs text-gray-600">• {factor}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-700 italic">{prediction.recommendations}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Risk Assessment */}
            {ai_insights.risk_assessment.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Risk Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {ai_insights.risk_assessment.map((risk, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-[#1A2B44]">{risk.property_name}</span>
                                        <Badge className={getSeverityBadge(risk.risk_level)}>
                                            {risk.risk_level}
                                        </Badge>
                                    </div>
                                    
                                    <div className="mb-2">
                                        <div className="text-xs font-medium text-gray-700 mb-1">Concerns:</div>
                                        <ul className="space-y-0.5">
                                            {risk.concerns.map((concern, cIdx) => (
                                                <li key={cIdx} className="text-xs text-gray-600">• {concern}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-gray-700 mb-1">Action Items:</div>
                                        <ul className="space-y-0.5">
                                            {risk.action_items.map((item, aIdx) => (
                                                <li key={aIdx} className="text-xs text-blue-700">→ {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Optimization Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {ai_insights.optimization_recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <div className="bg-[#D4AF37] text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs">
                                    {idx + 1}
                                </div>
                                <span className="text-gray-700">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}