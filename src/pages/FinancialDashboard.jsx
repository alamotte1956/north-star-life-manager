import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
    TrendingUp, DollarSign, AlertTriangle, Sparkles, ArrowUpRight, 
    ArrowDownRight, PieChart, Calendar, Target, Zap 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PrintButton from '@/components/PrintButton';
import ExpenseTracker from '@/components/financial/ExpenseTracker';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4A90E2', '#2E5C8A', '#7BB3E0', '#1E3A5F', '#50C878', '#FF6B6B', '#9B59B6', '#F39C12'];

export default function FinancialDashboard() {
    const [insights, setInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [categorizingTransactions, setCategorizingTransactions] = useState(false);

    const { data: transactions = [] } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => base44.entities.Transaction.list('-date')
    });

    const getInsights = async () => {
        setLoadingInsights(true);
        try {
            const result = await base44.functions.invoke('getFinancialInsights');
            setInsights(result.data.insights);
            toast.success('Financial insights generated!');
        } catch (error) {
            toast.error('Failed to generate insights');
        }
        setLoadingInsights(false);
    };

    const categorizeTransactions = async () => {
        setCategorizingTransactions(true);
        try {
            const result = await base44.functions.invoke('categorizeTransactions');
            toast.success(result.data.message);
            window.location.reload();
        } catch (error) {
            toast.error('Categorization failed');
        }
        setCategorizingTransactions(false);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-100 border-green-200';
        if (score >= 60) return 'bg-yellow-100 border-yellow-200';
        return 'bg-red-100 border-red-200';
    };

    // Prepare chart data
    const categoryData = insights?.category_breakdown 
        ? Object.entries(insights.category_breakdown).map(([name, value]) => ({ 
            name: name.replace(/_/g, ' ').toUpperCase(), 
            value: Math.round(value) 
        }))
        : [];

    const forecastData = insights ? [
        { period: 'Current', income: insights.current_metrics.income_this_month, expenses: insights.current_metrics.expenses_this_month },
        { period: '3 Months', income: insights.forecast_3_months?.income || 0, expenses: insights.forecast_3_months?.expenses || 0 },
        { period: '6 Months', income: insights.forecast_6_months?.income || 0, expenses: insights.forecast_6_months?.expenses || 0 },
        { period: '12 Months', income: insights.forecast_12_months?.income || 0, expenses: insights.forecast_12_months?.expenses || 0 }
    ] : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Financial Dashboard</h1>
                            <p className="text-[#0F1729]/60 font-light">AI-powered insights & forecasting</p>
                        </div>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        <Button
                            onClick={categorizeTransactions}
                            disabled={categorizingTransactions}
                            variant="outline"
                            className="border-[#4A90E2]/20"
                        >
                            <Zap className={`w-4 h-4 mr-2 ${categorizingTransactions ? 'animate-spin' : ''}`} />
                            Categorize
                        </Button>
                        <Button
                            onClick={getInsights}
                            disabled={loadingInsights}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] hover:shadow-lg text-white"
                        >
                            <Sparkles className={`w-4 h-4 mr-2 ${loadingInsights ? 'animate-spin' : ''}`} />
                            Generate Insights
                        </Button>
                    </div>
                </div>

                {/* Expense Tracker */}
                <div className="mb-8">
                    <ExpenseTracker />
                </div>

                {insights ? (
                    <>
                        {/* Financial Health Score */}
                        <div className={`mb-8 p-6 rounded-2xl border shadow-lg ${getScoreBg(insights.financial_health_score)}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-light text-black">Financial Health Score</h2>
                                <span className={`text-5xl font-light ${getScoreColor(insights.financial_health_score)}`}>
                                    {insights.financial_health_score}
                                </span>
                            </div>
                            <Progress value={insights.financial_health_score} className="h-3" />
                        </div>

                        {/* Current Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ArrowUpRight className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-gray-600">Income (YTD)</span>
                                    </div>
                                    <div className="text-3xl font-light text-black">
                                        ${insights.current_metrics.income_ytd.toLocaleString()}
                                    </div>
                                    {insights.trends.income_change && (
                                        <Badge className={`mt-2 ${
                                            parseFloat(insights.trends.income_change) > 0 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {insights.trends.income_change}% MoM
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ArrowDownRight className="w-5 h-5 text-red-600" />
                                        <span className="text-sm text-gray-600">Expenses (YTD)</span>
                                    </div>
                                    <div className="text-3xl font-light text-black">
                                        ${insights.current_metrics.expenses_ytd.toLocaleString()}
                                    </div>
                                    {insights.trends.expense_change && (
                                        <Badge className={`mt-2 ${
                                            parseFloat(insights.trends.expense_change) > 0 
                                                ? 'bg-red-100 text-red-700' 
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                            {insights.trends.expense_change}% MoM
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <DollarSign className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-gray-600">Net (YTD)</span>
                                    </div>
                                    <div className={`text-3xl font-light ${
                                        insights.current_metrics.net_ytd >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        ${insights.current_metrics.net_ytd.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Target className="w-5 h-5 text-purple-600" />
                                        <span className="text-sm text-gray-600">Savings Rate</span>
                                    </div>
                                    <div className="text-3xl font-light text-black">
                                        {insights.savings_rate}%
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts */}
                        <Tabs defaultValue="forecast" className="mb-8">
                            <TabsList>
                                <TabsTrigger value="forecast">Cash Flow Forecast</TabsTrigger>
                                <TabsTrigger value="breakdown">Spending Breakdown</TabsTrigger>
                            </TabsList>

                            <TabsContent value="forecast">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Predicted Cash Flow</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={forecastData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="period" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="income" fill="#50C878" name="Income" />
                                                <Bar dataKey="expenses" fill="#FF6B6B" name="Expenses" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="breakdown">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Spending by Category (YTD)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RechartsPie>
                                                <Pie
                                                    data={categoryData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label
                                                >
                                                    {categoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Insights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Cash Flow Analysis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-blue-600" />
                                        Cash Flow Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700">{insights.cash_flow_analysis}</p>
                                </CardContent>
                            </Card>

                            {/* Spending Insights */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-purple-600" />
                                        Spending Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700">{insights.spending_insights}</p>
                                </CardContent>
                            </Card>

                            {/* Income Analysis */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        Income Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700">{insights.income_analysis}</p>
                                </CardContent>
                            </Card>

                            {/* Goal Progress */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-indigo-600" />
                                        Goal Progress
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700">{insights.goal_progress_analysis}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recommendations & Risks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Recommendations */}
                            {insights.recommendations?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                                            Recommendations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.recommendations.map((rec, i) => (
                                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="font-bold text-[#4A90E2]">{i + 1}.</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Risk Factors */}
                            {insights.risk_factors?.length > 0 && (
                                <Card className="border-red-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-red-900">
                                            <AlertTriangle className="w-5 h-5" />
                                            Risk Factors
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.risk_factors.map((risk, i) => (
                                                <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                                    <span>⚠️</span>
                                                    {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Opportunities */}
                            {insights.opportunities?.length > 0 && (
                                <Card className="border-green-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-green-900">
                                            <Zap className="w-5 h-5" />
                                            Opportunities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.opportunities.map((opp, i) => (
                                                <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                                    <span>💡</span>
                                                    {opp}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Budget Recommendations */}
                            {insights.budget_recommendations?.length > 0 && (
                                <Card className="border-blue-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-blue-900">
                                            <Calendar className="w-5 h-5" />
                                            Budget Recommendations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.budget_recommendations.map((rec, i) => (
                                                <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                                    <span>📊</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <TrendingUp className="w-16 h-16 text-[#0F1729]/20 mx-auto mb-4" />
                        <p className="text-[#0F1729]/40 font-light mb-4">
                            Generate AI insights to see your financial dashboard
                        </p>
                        <Button
                            onClick={getInsights}
                            disabled={loadingInsights}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            <Sparkles className={`w-4 h-4 mr-2 ${loadingInsights ? 'animate-spin' : ''}`} />
                            Generate Insights
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}