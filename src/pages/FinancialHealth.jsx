import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    Activity, Sparkles, Loader2, TrendingUp, TrendingDown, 
    DollarSign, Target, Shield, Zap, AlertTriangle, CheckCircle,
    PieChart as PieChartIcon, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4A90E2', '#2E5C8A', '#7BB3E0', '#1E3A5F', '#B8D4ED', '#0F1729'];

export default function FinancialHealthDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getFinancialHealthDashboard', {});
            setDashboardData(result.data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
        setLoading(false);
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

    const metrics = dashboardData?.metrics;
    const insights = dashboardData?.ai_insights;

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
                                    <Activity className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-black">Financial Health Dashboard</h1>
                                <p className="text-[#0F1729]/60 font-light">Comprehensive overview with AI-powered insights</p>
                            </div>
                        </div>
                        <Button
                            onClick={loadDashboard}
                            disabled={loading}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Load Dashboard
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {!dashboardData && !loading && (
                    <Card className="bg-white border-[#4A90E2]">
                        <CardContent className="py-12 text-center">
                            <Activity className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]" />
                            <p className="text-[#0F1729]/60 mb-4">Click "Load Dashboard" to view your financial health metrics</p>
                        </CardContent>
                    </Card>
                )}

                {dashboardData && (
                    <div className="space-y-8">
                        {/* Overall Health Score */}
                        {insights && (
                            <Card className="bg-gradient-to-br from-[#4A90E2]/10 to-[#7BB3E0]/10 border-[#4A90E2] border-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[#4A90E2]">
                                            <Sparkles className="w-6 h-6" />
                                            Overall Financial Health
                                        </span>
                                        <Badge className={getHealthColor(insights.health_rating)}>
                                            {insights.health_rating.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-[#0F1729]/60">Health Score</span>
                                            <span className="text-2xl font-bold text-[#4A90E2]">
                                                {insights.overall_health_score}/100
                                            </span>
                                        </div>
                                        <Progress value={insights.overall_health_score} className="h-3" />
                                    </div>
                                    <p className="text-[#0F1729]/70 leading-relaxed">{insights.executive_summary}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-sm font-light text-[#0F1729]/60">Net Worth</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-[#4A90E2]" />
                                        <div>
                                            <div className="text-2xl font-light text-black">
                                                ${metrics?.net_worth.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-[#B8935E]">
                                                Inv: ${metrics?.investment_value.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-sm font-light text-[#0F1729]/60">Monthly Cash Flow</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        {metrics?.monthly_cash_flow >= 0 ? (
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-500" />
                                        )}
                                        <div>
                                            <div className={`text-2xl font-light ${metrics?.monthly_cash_flow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {metrics?.monthly_cash_flow >= 0 ? '+' : ''}${metrics?.monthly_cash_flow.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-[#B8935E]">
                                                ${metrics?.total_spending.toLocaleString()} spent
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-sm font-light text-[#0F1729]/60">Budget Adherence</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-[#4A90E2]" />
                                        <div className="flex-1">
                                            <div className="text-2xl font-light text-black">
                                                {metrics?.budget_adherence_score}/100
                                            </div>
                                            <Progress value={metrics?.budget_adherence_score} className="h-1 mt-2" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-sm font-light text-[#0F1729]/60">Goal Progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-[#4A90E2]" />
                                        <div className="flex-1">
                                            <div className="text-2xl font-light text-black">
                                                {metrics?.goal_progress.toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-[#B8935E]">
                                                {metrics?.active_goals_count} active goals
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Category Performance */}
                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-black">Budget by Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {Object.keys(dashboardData.category_performance).length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={Object.entries(dashboardData.category_performance).map(([cat, data]) => ({
                                                category: cat,
                                                budget: data.budget,
                                                spent: data.spent
                                            }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="category" stroke="#64748B" />
                                                <YAxis stroke="#64748B" />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #4A90E2' }}
                                                    labelStyle={{ color: '#4A90E2' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="budget" fill="#4A90E2" name="Budget" />
                                                <Bar dataKey="spent" fill="#2E5C8A" name="Spent" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-[#0F1729]/60">
                                            No budget data
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Spending Trends */}
                            <Card className="bg-white border-[#4A90E2]">
                                <CardHeader>
                                    <CardTitle className="text-black">Spending Trend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={Object.entries(dashboardData.spending_trends).map(([month, amount]) => ({
                                            month,
                                            spending: amount
                                        })).slice(-6)}>
                                            <defs>
                                                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="month" stroke="#64748B" />
                                            <YAxis stroke="#64748B" />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'white', border: '1px solid #4A90E2' }}
                                                labelStyle={{ color: '#4A90E2' }}
                                            />
                                            <Area type="monotone" dataKey="spending" stroke="#4A90E2" fillOpacity={1} fill="url(#colorSpending)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* AI Insights Sections */}
                        {insights && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Strengths & Weaknesses */}
                                <Card className="bg-[#1a1a1a] border-[#C5A059]">
                                    <CardHeader>
                                        <CardTitle className="text-[#C5A059] flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            Strengths
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.strengths?.map((strength, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                                    <span className="text-green-500">✓</span>
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card className="bg-[#1a1a1a] border-[#C5A059]">
                                    <CardHeader>
                                        <CardTitle className="text-[#C5A059] flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                            Areas for Improvement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.weaknesses?.map((weakness, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                                    <span className="text-yellow-500">!</span>
                                                    <span>{weakness}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Immediate Actions */}
                        {insights?.immediate_actions?.length > 0 && (
                            <Card className="bg-red-950/20 border-red-500/30">
                                <CardHeader>
                                    <CardTitle className="text-red-400 flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Immediate Actions Required
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {insights.immediate_actions.map((action, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
                                                <Badge className={`mt-1 ${
                                                    action.priority === 'critical' ? 'bg-red-600' :
                                                    action.priority === 'high' ? 'bg-orange-600' :
                                                    action.priority === 'medium' ? 'bg-yellow-600' :
                                                    'bg-blue-600'
                                                } text-white`}>
                                                    {action.priority}
                                                </Badge>
                                                <div className="flex-1">
                                                    <p className="text-black font-medium mb-1">{action.action}</p>
                                                    <p className="text-sm text-[#0F1729]/70">{action.impact}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Additional Insights */}
                        {insights && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="bg-white border-[#4A90E2]">
                                    <CardHeader>
                                        <CardTitle className="text-black text-sm">Cash Flow</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[#0F1729]/70">{insights.cash_flow_assessment}</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-[#4A90E2]">
                                    <CardHeader>
                                        <CardTitle className="text-black text-sm">Net Worth Trajectory</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[#0F1729]/70">{insights.net_worth_trajectory}</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white border-[#4A90E2]">
                                    <CardHeader>
                                        <CardTitle className="text-black text-sm">Goal Achievement</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[#0F1729]/70">{insights.goal_achievement_likelihood}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Opportunities & Long-term Recommendations */}
                        {insights && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {insights.opportunities?.length > 0 && (
                                    <Card className="bg-white border-[#4A90E2]">
                                        <CardHeader>
                                            <CardTitle className="text-black flex items-center gap-2">
                                                <ArrowUpRight className="w-5 h-5 text-green-500" />
                                                Opportunities
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {insights.opportunities.map((opp, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                                        <span>•</span>
                                                        <span>{opp}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {insights.long_term_recommendations?.length > 0 && (
                                    <Card className="bg-white border-[#4A90E2]">
                                        <CardHeader>
                                            <CardTitle className="text-black flex items-center gap-2">
                                                <Target className="w-5 h-5" />
                                                Long-term Recommendations
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {insights.long_term_recommendations.map((rec, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                                        <span>•</span>
                                                        <span>{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Risk Factors */}
                        {insights?.risk_factors?.length > 0 && (
                            <Card className="bg-white border-orange-500">
                                <CardHeader>
                                    <CardTitle className="text-orange-400 flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        Risk Factors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {insights.risk_factors.map((risk, idx) => (
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
        </div>
    );
}