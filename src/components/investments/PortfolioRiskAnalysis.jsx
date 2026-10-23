import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioRiskAnalysis() {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const analyzeRisk = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('analyzePortfolioRisk', {});
            setAnalysis(result.data);
            toast.success('Portfolio risk analysis complete!');
        } catch (error) {
            toast.error('Failed to analyze portfolio');
        }
        setLoading(false);
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            case 'moderate': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'very_high': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <Card className="border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Portfolio Risk & Diversification Analysis
                    </span>
                    <Button
                        onClick={analyzeRisk}
                        disabled={loading}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                        <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                </CardTitle>
            </CardHeader>

            {analysis?.analysis && (
                <CardContent className="pt-6 space-y-6">
                    {/* Risk Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg border ${getRiskColor(analysis.analysis.risk_level)}`}>
                            <p className="text-xs font-medium mb-1">Risk Level</p>
                            <p className="text-2xl font-bold capitalize">{analysis.analysis.risk_level.replace('_', ' ')}</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                            <p className="text-xs font-medium text-blue-900 mb-2">Risk Score</p>
                            <div className="flex items-end justify-between mb-1">
                                <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.risk_score)}`}>
                                    {analysis.analysis.risk_score}
                                </span>
                                <span className="text-xs text-blue-700">/100</span>
                            </div>
                            <Progress value={analysis.analysis.risk_score} />
                        </div>

                        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                            <p className="text-xs font-medium text-green-900 mb-2">Diversification</p>
                            <div className="flex items-end justify-between mb-1">
                                <span className={`text-2xl font-bold ${getScoreColor(analysis.analysis.diversification_score)}`}>
                                    {analysis.analysis.diversification_score}
                                </span>
                                <span className="text-xs text-green-700">/100</span>
                            </div>
                            <Progress value={analysis.analysis.diversification_score} />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                        <p className="text-sm">{analysis.analysis.summary}</p>
                    </div>

                    {/* Asset Allocation */}
                    {analysis.analysis.asset_allocation && (
                        <div>
                            <h4 className="font-semibold mb-3">Asset Allocation</h4>
                            <div className="space-y-2">
                                {Object.entries(analysis.analysis.asset_allocation)
                                    .filter(([_, value]) => value > 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([type, percentage]) => (
                                        <div key={type}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="capitalize">{type}</span>
                                                <span className="font-medium">{percentage.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={percentage} />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Concentration Risks */}
                    {analysis.analysis.concentration_risks?.length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Concentration Risks
                            </h4>
                            <ul className="space-y-1">
                                {analysis.analysis.concentration_risks.map((risk, idx) => (
                                    <li key={idx} className="text-sm text-orange-800 flex items-start gap-1">
                                        <span>•</span>
                                        <span>{risk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Key Risks */}
                    {analysis.analysis.key_risks?.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-900 mb-2">Key Risk Factors</h4>
                            <ul className="space-y-1">
                                {analysis.analysis.key_risks.map((risk, idx) => (
                                    <li key={idx} className="text-sm text-red-800 flex items-start gap-1">
                                        <span>⚠️</span>
                                        <span>{risk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Diversification Gaps */}
                    {analysis.analysis.diversification_gaps?.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-900 mb-2">Diversification Gaps</h4>
                            <ul className="space-y-1">
                                {analysis.analysis.diversification_gaps.map((gap, idx) => (
                                    <li key={idx} className="text-sm text-yellow-800 flex items-start gap-1">
                                        <span>→</span>
                                        <span>{gap}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {analysis.analysis.recommendations?.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                                {analysis.analysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                        <span className="font-bold">{idx + 1}.</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Volatility */}
                    {analysis.analysis.volatility_assessment && (
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <h4 className="font-semibold text-indigo-900 mb-1">Volatility Assessment</h4>
                            <p className="text-sm text-indigo-800">{analysis.analysis.volatility_assessment}</p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}