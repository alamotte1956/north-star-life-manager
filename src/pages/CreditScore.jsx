import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    TrendingUp, TrendingDown, Shield, AlertTriangle, 
    CheckCircle, Sparkles, Loader2, RefreshCw, Link,
    ChevronRight, Target, Calendar, DollarSign
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CreditScore() {
    const queryClient = useQueryClient();
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const { data: creditScores = [], isLoading } = useQuery({
        queryKey: ['creditScores'],
        queryFn: () => base44.entities.CreditScore.list('-report_date')
    });

    const fetchScoreMutation = useMutation({
        mutationFn: () => base44.functions.invoke('fetchCreditScore', {}),
        onSuccess: () => {
            queryClient.invalidateQueries(['creditScores']);
            toast.success('Credit score updated successfully');
        }
    });

    const latestScore = creditScores[0];

    const analyzeScore = async () => {
        if (!latestScore) return;
        
        setAnalyzing(true);
        try {
            const result = await base44.functions.invoke('analyzeCreditScore', {
                credit_score_id: latestScore.id
            });
            setAnalysis(result.data.analysis);
            toast.success('Credit analysis complete');
        } catch (error) {
            toast.error('Failed to analyze credit score');
        }
        setAnalyzing(false);
    };

    const getScoreColor = (range) => {
        switch (range) {
            case 'excellent': return 'text-green-600 bg-green-50';
            case 'very_good': return 'text-blue-600 bg-blue-50';
            case 'good': return 'text-cyan-600 bg-cyan-50';
            case 'fair': return 'text-yellow-600 bg-yellow-50';
            case 'poor': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getHealthColor = (rating) => {
        switch (rating) {
            case 'excellent': return 'text-green-600 bg-green-50';
            case 'good': return 'text-blue-600 bg-blue-50';
            case 'fair': return 'text-yellow-600 bg-yellow-50';
            case 'needs_improvement': return 'text-orange-600 bg-orange-50';
            case 'critical': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const scoreHistory = creditScores.slice(0, 6).reverse().map(s => ({
        date: format(new Date(s.report_date), 'MMM d'),
        score: s.score
    }));

    const factorBreakdown = latestScore ? [
        { name: 'Payment History', value: latestScore.payment_history, color: '#10b981' },
        { name: 'Credit Utilization', value: 100 - latestScore.credit_utilization, color: '#3b82f6' },
        { name: 'Credit Age', value: Math.min(100, (latestScore.credit_age / 120) * 100), color: '#8b5cf6' },
        { name: 'Account Mix', value: Math.min(100, (latestScore.total_accounts / 15) * 100), color: '#f59e0b' }
    ] : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-black">Credit Score Monitoring</h1>
                                <p className="text-[#0F1729]/60 font-light">AI-powered insights and improvement tips</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {latestScore && (
                                <Button
                                    onClick={analyzeScore}
                                    disabled={analyzing}
                                    variant="outline"
                                    className="border-[#4A90E2]"
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            AI Analyze
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                onClick={() => fetchScoreMutation.mutate()}
                                disabled={fetchScoreMutation.isPending}
                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {fetchScoreMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : latestScore ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh Score
                                    </>
                                ) : (
                                    <>
                                        <Link className="w-4 h-4 mr-2" />
                                        Link Credit Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {!latestScore && !isLoading && (
                    <Card className="bg-white border-[#4A90E2]">
                        <CardContent className="py-12 text-center">
                            <Shield className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]" />
                            <h3 className="text-xl font-semibold text-black mb-2">Link Your Credit Report</h3>
                            <p className="text-[#0F1729]/60 mb-4">
                                Securely connect your credit report to get AI-powered insights and improvement tips
                            </p>
                            <Button
                                onClick={() => fetchScoreMutation.mutate()}
                                disabled={fetchScoreMutation.isPending}
                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                <Link className="w-4 h-4 mr-2" />
                                Link Credit Report
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {latestScore && (
                    <div className="space-y-8">
                        {/* Credit Score Card */}
                        <Card className="bg-gradient-to-br from-[#4A90E2]/10 to-[#7BB3E0]/10 border-[#4A90E2] border-2">
                            <CardContent className="pt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="text-center md:text-left">
                                        <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                                            <Badge className={getScoreColor(latestScore.score_range)}>
                                                {latestScore.score_range.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            {latestScore.score_change !== 0 && (
                                                <span className={`flex items-center gap-1 text-sm ${
                                                    latestScore.score_change > 0 ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                    {latestScore.score_change > 0 ? (
                                                        <TrendingUp className="w-4 h-4" />
                                                    ) : (
                                                        <TrendingDown className="w-4 h-4" />
                                                    )}
                                                    {Math.abs(latestScore.score_change)} points
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-7xl font-light text-[#4A90E2] mb-2">
                                            {latestScore.score}
                                        </div>
                                        <p className="text-[#0F1729]/60 mb-4">
                                            Updated {format(new Date(latestScore.report_date), 'MMM d, yyyy')}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-[#0F1729]/60 justify-center md:justify-start">
                                            <Shield className="w-4 h-4" />
                                            <span>Powered by {latestScore.provider}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-[#0F1729]/60">Credit Score Range</span>
                                                <span className="text-[#4A90E2]">{latestScore.score}/850</span>
                                            </div>
                                            <Progress value={(latestScore.score / 850) * 100} className="h-3" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-[#0F1729]/60 mb-1">Utilization</p>
                                                <p className="text-lg font-semibold text-[#4A90E2]">
                                                    {latestScore.credit_utilization}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[#0F1729]/60 mb-1">On-Time Payments</p>
                                                <p className="text-lg font-semibold text-[#4A90E2]">
                                                    {latestScore.on_time_payments}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[#0F1729]/60 mb-1">Hard Inquiries</p>
                                                <p className="text-lg font-semibold text-[#4A90E2]">
                                                    {latestScore.hard_inquiries}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[#0F1729]/60 mb-1">Total Accounts</p>
                                                <p className="text-lg font-semibold text-[#4A90E2]">
                                                    {latestScore.total_accounts}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-black">Score History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {scoreHistory.length > 1 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <LineChart data={scoreHistory}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="date" stroke="#64748B" />
                                                <YAxis stroke="#64748B" domain={[300, 850]} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #4A90E2' }}
                                                    labelStyle={{ color: '#4A90E2' }}
                                                />
                                                <Line type="monotone" dataKey="score" stroke="#4A90E2" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-[#0F1729]/60">
                                            More data needed for history
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-black">Factor Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={factorBreakdown}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" stroke="#64748B" />
                                            <YAxis stroke="#64748B" />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'white', border: '1px solid #4A90E2' }}
                                                labelStyle={{ color: '#4A90E2' }}
                                            />
                                            <Bar dataKey="value" fill="#4A90E2" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* AI Analysis */}
                        {analysis && (
                            <div className="space-y-6">
                                {/* Overall Assessment */}
                                <Card className="bg-gradient-to-br from-[#4A90E2]/10 to-[#7BB3E0]/10 border-[#4A90E2]">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-[#4A90E2]">
                                                <Sparkles className="w-5 h-5" />
                                                AI Analysis
                                            </span>
                                            <Badge className={getHealthColor(analysis.health_rating)}>
                                                {analysis.health_rating.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-[#0F1729]/70 leading-relaxed">{analysis.overall_assessment}</p>
                                    </CardContent>
                                </Card>

                                {/* Factors */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="bg-white border-green-500">
                                        <CardHeader>
                                            <CardTitle className="text-green-400 flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5" />
                                                Positive Factors
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {analysis.positive_factors?.map((factor, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-black font-medium">{factor.factor}</p>
                                                            <p className="text-sm text-[#0F1729]/70">{factor.impact}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-[#1a1a1a] border-orange-500">
                                        <CardHeader>
                                            <CardTitle className="text-orange-400 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5" />
                                                Negative Factors
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {analysis.negative_factors?.map((factor, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-black font-medium">{factor.factor}</p>
                                                                <Badge className={`text-xs ${
                                                                    factor.priority === 'high' ? 'bg-red-600' :
                                                                    factor.priority === 'medium' ? 'bg-orange-600' :
                                                                    'bg-yellow-600'
                                                                } text-white`}>
                                                                    {factor.priority}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-[#0F1729]/70">{factor.impact}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Immediate Actions */}
                                <Card className="bg-red-950/20 border-red-500/30">
                                    <CardHeader>
                                        <CardTitle className="text-red-400 flex items-center gap-2">
                                            <Target className="w-5 h-5" />
                                            Immediate Action Items
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {analysis.immediate_actions?.map((action, idx) => (
                                                <div key={idx} className="p-4 bg-black/30 rounded-lg">
                                                    <div className="flex items-start gap-3">
                                                        <ChevronRight className="w-5 h-5 text-[#4A90E2] mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-black font-medium mb-1">{action.action}</p>
                                                            <div className="flex items-center gap-4 text-sm text-[#0F1729]/70">
                                                                <span>Impact: {action.expected_impact}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {action.timeframe}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Additional Insights */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="bg-white border-[#4A90E2]">
                                        <CardHeader>
                                            <CardTitle className="text-black text-sm">Next Tier Estimate</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-[#0F1729]/70">{analysis.next_tier_estimate}</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white border-[#4A90E2]">
                                        <CardHeader>
                                            <CardTitle className="text-black text-sm">Credit Utilization</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-[#0F1729]/70">
                                                {analysis.credit_utilization_recommendation}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white border-[#4A90E2]">
                                        <CardHeader>
                                            <CardTitle className="text-black text-sm">Improvement Potential</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-1 text-sm text-[#0F1729]/70">
                                                <p>30 days: +{analysis.score_improvement_potential?.in_30_days} pts</p>
                                                <p>90 days: +{analysis.score_improvement_potential?.in_90_days} pts</p>
                                                <p>12 months: +{analysis.score_improvement_potential?.in_12_months} pts</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Long-term Strategies */}
                                <Card className="bg-white border-[#4A90E2]">
                                    <CardHeader>
                                        <CardTitle className="text-black">Long-term Strategies</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {analysis.long_term_strategies?.map((strategy, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                                    <span>•</span>
                                                    <span>{strategy}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Risk Factors */}
                                {analysis.risk_factors?.length > 0 && (
                                    <Card className="bg-white border-orange-500">
                                        <CardHeader>
                                            <CardTitle className="text-orange-400 flex items-center gap-2">
                                                <Shield className="w-5 h-5" />
                                                Risk Factors to Monitor
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {analysis.risk_factors.map((risk, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                                        <span className="text-orange-500">⚠</span>
                                                        <span>{risk}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}