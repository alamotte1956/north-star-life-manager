import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Heart, TrendingUp, AlertCircle, Lightbulb, Activity, 
    Moon, Footprints, Zap, CheckCircle, ArrowRight 
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
            console.error('Analysis error:', error);
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
                            Wellness Insights
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
                            Our AI analyzes your health metrics and spending patterns to reveal 
                            how your wellness impacts your financial decisions.
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