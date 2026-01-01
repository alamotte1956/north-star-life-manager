import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    AlertTriangle, TrendingUp, TrendingDown, Target, 
    Shield, Sparkles, ChevronRight, DollarSign, Calendar, Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AdvancedAIInsights({ insights }) {
    const [selectedAdjustment, setSelectedAdjustment] = useState(null);

    if (!insights?.ai_analysis) return null;

    const { ai_analysis, summary, adjustment_tasks } = insights;

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'critical': return 'text-red-600';
            case 'high': return 'text-orange-600';
            case 'moderate': return 'text-yellow-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Executive Summary */}
            <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-[#D4AF37]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                        Advanced AI Financial Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">{ai_analysis.executive_summary}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div>
                            <p className="text-sm text-gray-500">Anomalies Detected</p>
                            <p className="text-2xl font-bold text-orange-600">{summary.anomalies_detected}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Shortfall Warnings</p>
                            <p className="text-2xl font-bold text-red-600">{summary.shortfall_warnings}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Adjustments</p>
                            <p className="text-2xl font-bold text-blue-600">{summary.proactive_adjustments}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Risk Level</p>
                            <p className={`text-2xl font-bold ${getRiskColor(summary.risk_level)}`}>
                                {summary.risk_level?.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    {ai_analysis.priority_actions?.length > 0 && (
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#D4AF37]" />
                                Priority Actions
                            </h4>
                            <ol className="space-y-2">
                                {ai_analysis.priority_actions.map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-[#D4AF37] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm pt-0.5">{action}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="anomalies" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                    <TabsTrigger value="forecast">Forecast</TabsTrigger>
                    <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                    <TabsTrigger value="opportunities">Income</TabsTrigger>
                    <TabsTrigger value="risks">Risks</TabsTrigger>
                </TabsList>

                {/* Anomaly Detection */}
                <TabsContent value="anomalies" className="space-y-4">
                    {ai_analysis.anomalies?.length > 0 ? (
                        ai_analysis.anomalies.map((anomaly, idx) => (
                            <Card key={idx} className={`border-2 ${getSeverityColor(anomaly.severity)}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-lg">
                                        <span className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            {anomaly.category}
                                        </span>
                                        <Badge className={getSeverityColor(anomaly.severity)}>
                                            {anomaly.severity}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm">{anomaly.description}</p>
                                    <div className="grid grid-cols-2 gap-4 p-3 bg-white/50 rounded-lg">
                                        <div>
                                            <p className="text-xs text-gray-500">Detected Amount</p>
                                            <p className="text-lg font-bold text-red-600">
                                                ${anomaly.detected_amount?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Expected Amount</p>
                                            <p className="text-lg font-bold text-green-600">
                                                ${anomaly.expected_amount?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-xs font-semibold text-blue-900 mb-1">Recommendation:</p>
                                        <p className="text-sm text-blue-800">{anomaly.recommendation}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-center text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                <p>No anomalies detected. Your spending patterns look normal!</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Predictive Forecast */}
                <TabsContent value="forecast" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['next_month', 'two_months', 'three_months'].map((period, idx) => {
                            const data = ai_analysis.forecast?.[period];
                            if (!data) return null;
                            
                            const isDeficit = data.surplus_deficit < 0;
                            
                            return (
                                <Card key={period} className={idx === 0 ? 'border-[#D4AF37] border-2' : ''}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {idx === 0 ? 'Next Month' : `${idx + 1} Months`}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Predicted Spending</p>
                                            <p className="text-xl font-bold">${data.predicted_spending?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Predicted Income</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ${data.predicted_income?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDeficit ? 'bg-red-50' : 'bg-green-50'}`}>
                                            <p className="text-sm text-gray-600 mb-1">
                                                {isDeficit ? 'Expected Deficit' : 'Expected Surplus'}
                                            </p>
                                            <p className={`text-2xl font-bold ${isDeficit ? 'text-red-600' : 'text-green-600'}`}>
                                                {isDeficit ? '-' : '+'}${Math.abs(data.surplus_deficit || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        {data.confidence && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Confidence</p>
                                                <Progress value={data.confidence} className="h-2" />
                                                <p className="text-xs text-gray-500 mt-1">{data.confidence}%</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {ai_analysis.forecast?.shortfall_warnings?.length > 0 && (
                        <Card className="bg-red-50 border-red-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-800">
                                    <AlertTriangle className="w-5 h-5" />
                                    Shortfall Warnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {ai_analysis.forecast.shortfall_warnings.map((warning, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-red-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-red-900">{warning.category}</p>
                                                    <p className="text-sm text-gray-600">{warning.month}</p>
                                                </div>
                                                <Badge className="bg-red-600 text-white">
                                                    ${warning.expected_shortfall?.toLocaleString()} deficit
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-700">{warning.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Proactive Adjustments */}
                <TabsContent value="adjustments" className="space-y-4">
                    {ai_analysis.proactive_adjustments?.map((adjustment, idx) => {
                        const difference = adjustment.recommended_budget - adjustment.current_budget;
                        const isIncrease = difference > 0;
                        
                        return (
                            <Card key={idx} className={adjustment.priority === 'urgent' ? 'border-red-500 border-2' : ''}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            {isIncrease ? 
                                                <TrendingUp className="w-5 h-5 text-red-500" /> : 
                                                <TrendingDown className="w-5 h-5 text-green-500" />
                                            }
                                            {adjustment.category}
                                        </span>
                                        <Badge className={getSeverityColor(adjustment.priority)}>
                                            {adjustment.priority}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Current</p>
                                            <p className="text-lg font-bold">${adjustment.current_budget?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Recommended</p>
                                            <p className="text-lg font-bold text-[#D4AF37]">
                                                ${adjustment.recommended_budget?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Change</p>
                                            <p className={`text-lg font-bold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                                                {isIncrease ? '+' : ''}{difference?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm font-semibold mb-1">Reason:</p>
                                        <p className="text-sm text-gray-700">{adjustment.reason}</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">Expected Impact:</p>
                                        <p className="text-sm text-blue-800">{adjustment.impact}</p>
                                    </div>
                                    <Button 
                                        className="w-full bg-[#D4AF37] hover:bg-[#C5A059]"
                                        onClick={() => setSelectedAdjustment(adjustment)}
                                    >
                                        Apply This Adjustment
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>

                {/* Income Opportunities */}
                <TabsContent value="opportunities" className="space-y-4">
                    {ai_analysis.income_opportunities?.map((opp, idx) => (
                        <Card key={idx}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        +${opp.potential_monthly_income}/mo
                                    </span>
                                    <Badge className={
                                        opp.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                        opp.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }>
                                        {opp.difficulty}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm">{opp.opportunity}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Timeline: {opp.timeline}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Risk Assessment */}
                <TabsContent value="risks" className="space-y-4">
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Overall Risk Assessment
                                </span>
                                <Badge className={getSeverityColor(ai_analysis.risk_assessment?.overall_risk_level)}>
                                    {ai_analysis.risk_assessment?.overall_risk_level?.toUpperCase()}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ai_analysis.risk_assessment?.emergency_fund_status && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-semibold text-blue-900 mb-1">Emergency Fund:</p>
                                    <p className="text-sm text-blue-800">{ai_analysis.risk_assessment.emergency_fund_status}</p>
                                </div>
                            )}
                            {ai_analysis.risk_assessment?.debt_risk && (
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <p className="text-sm font-semibold text-orange-900 mb-1">Debt Risk:</p>
                                    <p className="text-sm text-orange-800">{ai_analysis.risk_assessment.debt_risk}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {ai_analysis.risk_assessment?.risks?.map((risk, idx) => (
                        <Card key={idx}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <span>{risk.risk}</span>
                                    <Badge className={getSeverityColor(risk.severity)}>
                                        {risk.severity}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-sm font-semibold text-green-900 mb-1">Mitigation Strategy:</p>
                                    <p className="text-sm text-green-800">{risk.mitigation}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {ai_analysis.goal_impact_analysis && (
                        <Card className="bg-purple-50 border-purple-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    Goal Impact Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {ai_analysis.goal_impact_analysis.goals_at_risk?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-purple-900 mb-2">Goals at Risk:</p>
                                        <ul className="space-y-1">
                                            {ai_analysis.goal_impact_analysis.goals_at_risk.map((goal, idx) => (
                                                <li key={idx} className="text-sm text-purple-800">• {goal}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="bg-white p-3 rounded-lg">
                                    <p className="text-sm font-semibold mb-1">Recommended Reallocation:</p>
                                    <p className="text-sm text-gray-700">{ai_analysis.goal_impact_analysis.recommended_reallocation}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg">
                                    <p className="text-sm font-semibold mb-1">Optimization Potential:</p>
                                    <p className="text-sm text-gray-700">{ai_analysis.goal_impact_analysis.optimization_potential}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}