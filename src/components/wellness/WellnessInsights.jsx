import React, { useState } from 'react';
import logger from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Heart, TrendingUp, AlertCircle, Lightbulb, Activity, 
    Moon, Footprints, Zap, CheckCircle, ArrowRight, DollarSign,
    Shield, TrendingDown, Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function WellnessInsights() {
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState(null);

    const analyzeCorrelations = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('analyzeWellnessCorrelations');
            if (result.data.success) {
                setInsights(result.data);
                toast.success('Wellness correlations analyzed!');
            } else {
                toast.error('Analysis failed');
            }
        } catch (error) {
            logger.error('Analysis error:', error);
            toast.error('Failed to analyze correlations');
        }
        setLoading(false);
    };

    const getStrengthColor = (strength) => {
        if (strength === 'strong') return 'text-red-600 bg-red-100';
        if (strength === 'moderate') return 'text-orange-600 bg-orange-100';
        return 'text-blue-600 bg-blue-100';
    };

    const getHealthIcon = (factor) => {
        if (factor.includes('sleep')) return Moon;
        if (factor.includes('exercise') || factor.includes('steps')) return Footprints;
        if (factor.includes('mood') || factor.includes('stress')) return Heart;
        return Activity;
    };

    if (!insights) {
        return (
            <Card className="shadow-lg border-[#4A90E2]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="w-6 h-6 text-red-500" />
                            Wellness Insights & Healthcare Cost Predictions
                        </CardTitle>
                        <Badge className="bg-[#4A90E2] text-white">AI-Powered</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-light text-black mb-3">
                            Discover Your Health-Money Connection
                        </h3>
                        <p className="text-[#0F1729]/70 mb-6 max-w-md mx-auto">
                            Our AI analyzes your health metrics, medical conditions, and spending patterns to predict 
                            future healthcare costs and provide personalized insurance recommendations.
                        </p>
                        <Button
                            onClick={analyzeCorrelations}
                            disabled={loading}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white"
                        >
                            {loading ? (
                                <>
                                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Analyze Correlations
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const analysis = insights.analysis;

    return (
        <div className="space-y-6">
            {/* Wellness Score */}
            <Card className="shadow-lg border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-light text-black mb-1">
                                Wellness-Financial Alignment
                            </h3>
                            <p className="text-sm text-[#0F1729]/60">
                                {analysis.financial_wellness_alignment}
                            </p>
                        </div>
                        <div className="text-5xl font-light text-green-600">
                            {analysis.wellness_score}
                        </div>
                    </div>
                    <Progress value={analysis.wellness_score} className="h-3" />
                </CardContent>
            </Card>

            {/* Key Insights */}
            {analysis.key_insights?.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Key Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analysis.key_insights.map((insight, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-[#0F1729]">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Correlations */}
            {analysis.correlations?.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
                            Health-Spending Correlations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysis.correlations.map((corr, idx) => {
                                const HealthIcon = getHealthIcon(corr.health_factor);
                                return (
                                    <div key={idx} className="border border-[#B8D4ED] rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#4A90E2]/10 rounded-full flex items-center justify-center">
                                                    <HealthIcon className="w-5 h-5 text-[#4A90E2]" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-black capitalize">
                                                        {corr.health_factor.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-xs text-[#0F1729]/60">
                                                        {corr.data_points} data points
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={getStrengthColor(corr.strength)}>
                                                {corr.strength} correlation
                                            </Badge>
                                        </div>
                                        
                                        <p className="text-sm text-[#0F1729]/70 mb-3">
                                            {corr.description}
                                        </p>
                                        
                                        {corr.affected_categories?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs text-[#0F1729]/60">Affects:</span>
                                                {corr.affected_categories.map((cat, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">
                                                        {cat}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Risk Factors */}
            {analysis.risk_factors?.length > 0 && (
                <Card className="shadow-lg border-orange-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-900">
                            <AlertCircle className="w-5 h-5" />
                            Risk Factors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analysis.risk_factors.map((risk, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <span className="text-orange-600">⚠️</span>
                                    <p className="text-sm text-orange-900">{risk}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Healthcare Cost Predictions */}
            {analysis.healthcare_predictions && (
                <Card className="shadow-lg border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-900">
                            <TrendingUp className="w-5 h-5" />
                            Predicted Healthcare Costs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-purple-100 rounded-lg">
                                <div>
                                    <div className="text-sm text-purple-700 mb-1">Predicted Annual Cost</div>
                                    <div className="text-3xl font-light text-purple-900">
                                        ${analysis.healthcare_predictions.predicted_annual_cost?.toLocaleString()}
                                    </div>
                                </div>
                                <DollarSign className="w-12 h-12 text-purple-400" />
                            </div>

                            {analysis.healthcare_predictions.cost_breakdown && (
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(analysis.healthcare_predictions.cost_breakdown).map(([key, value]) => (
                                        <div key={key} className="p-3 bg-white border border-purple-200 rounded-lg">
                                            <div className="text-xs text-purple-600 mb-1 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </div>
                                            <div className="text-lg font-medium text-purple-900">
                                                ${value?.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {analysis.healthcare_predictions.cost_drivers?.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-purple-900">Cost Drivers:</div>
                                    {analysis.healthcare_predictions.cost_drivers.map((driver, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-purple-800">
                                            <AlertCircle className="w-4 h-4" />
                                            {driver}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Insurance Recommendations */}
            {analysis.insurance_recommendations?.length > 0 && (
                <Card className="shadow-lg border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Shield className="w-5 h-5" />
                            Insurance Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analysis.insurance_recommendations.map((rec, idx) => (
                                <div key={idx} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-medium text-blue-900">
                                            {rec.recommendation_type}
                                        </div>
                                        <Badge className={
                                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                            rec.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }>
                                            {rec.priority} priority
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-blue-800 mb-2">
                                        <strong>Current Gap:</strong> {rec.current_gap}
                                    </div>
                                    <div className="text-sm text-blue-800 mb-2">
                                        {rec.suggested_action}
                                    </div>
                                    {rec.potential_savings && (
                                        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded">
                                            <TrendingDown className="w-4 h-4" />
                                            <span>Potential savings: {rec.potential_savings}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Financial Planning Alerts */}
            {analysis.financial_planning_alerts?.length > 0 && (
                <Card className="shadow-lg border-amber-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                            <Clock className="w-5 h-5" />
                            Financial Planning Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analysis.financial_planning_alerts.map((alert, idx) => (
                                <div key={idx} className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="font-medium text-amber-900 capitalize">
                                            {alert.alert_type.replace(/_/g, ' ')}
                                        </div>
                                        <Badge className={
                                            alert.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                            alert.urgency === 'medium' ? 'bg-orange-100 text-orange-700' :
                                            'bg-amber-100 text-amber-700'
                                        }>
                                            {alert.urgency}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-amber-800 mb-2">
                                        <strong>Condition:</strong> {alert.condition}
                                    </div>
                                    <div className="text-sm text-amber-800 mb-2">
                                        <strong>Financial Impact:</strong> {alert.financial_impact}
                                    </div>
                                    <div className="text-sm text-amber-900 bg-amber-100 px-3 py-2 rounded mt-2">
                                        💡 {alert.recommended_budget_adjustment}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actionable Recommendations */}
            {analysis.recommendations?.length > 0 && (
                <Card className="shadow-lg border-green-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                            <Zap className="w-5 h-5" />
                            Actionable Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysis.recommendations.map((rec, idx) => (
                                <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Activity className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="font-medium text-green-900 mb-1">
                                                {rec.trigger}
                                            </div>
                                            <div className="text-sm text-green-800">
                                                {rec.action}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-2 rounded">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>{rec.expected_impact}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Refresh Button */}
            <Button
                onClick={analyzeCorrelations}
                disabled={loading}
                variant="outline"
                className="w-full"
            >
                {loading ? 'Analyzing...' : 'Refresh Analysis'}
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
}