import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
    Sparkles, Calendar, CreditCard, Gem, PiggyBank, Loader2,
    ArrowUpRight, ArrowDownRight, Activity, Target, Shield, BarChart3
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function FinancialHealth() {
    const [aiInsights, setAiInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const { data: bills = [] } = useQuery({
        queryKey: ['bills'],
        queryFn: () => base44.entities.BillPayment.list('-due_date', 100)
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => base44.entities.Subscription.list()
    });

    const { data: valuables = [] } = useQuery({
        queryKey: ['valuables'],
        queryFn: () => base44.entities.ValuableItem.list()
    });

    const { data: investments = [] } = useQuery({
        queryKey: ['investments'],
        queryFn: () => base44.entities.Investment.list()
    });

    // Calculate metrics
    const today = new Date();
    const upcomingBills = bills.filter(b => b.status === 'pending' && new Date(b.due_date) >= today);
    const totalUpcomingBills = upcomingBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const monthlySubscriptionCost = activeSubscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);
    const annualSubscriptionCost = monthlySubscriptionCost * 12;
    
    const totalValuablesValue = valuables.reduce((sum, v) => sum + (v.estimated_value || 0), 0);

    // Investment metrics
    const totalInvestmentValue = investments.reduce((sum, i) => sum + (i.current_value || 0), 0);
    const totalInvestmentCost = investments.reduce((sum, i) => sum + (i.purchase_price || 0), 0);
    const totalGainLoss = totalInvestmentValue - totalInvestmentCost;
    const portfolioReturn = totalInvestmentCost > 0 ? ((totalGainLoss / totalInvestmentCost) * 100) : 0;

    // Portfolio diversification
    const assetAllocation = {};
    investments.forEach(inv => {
        const type = inv.asset_type || 'Other';
        assetAllocation[type] = (assetAllocation[type] || 0) + (inv.current_value || 0);
    });

    const allocationData = Object.entries(assetAllocation).map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: totalInvestmentValue > 0 ? ((value / totalInvestmentValue) * 100).toFixed(1) : 0
    }));

    // Risk assessment
    const highRiskInvestments = investments.filter(i => i.risk_level === 'high');
    const mediumRiskInvestments = investments.filter(i => i.risk_level === 'medium');
    const lowRiskInvestments = investments.filter(i => i.risk_level === 'low');

    const riskDistribution = [
        { name: 'High Risk', value: highRiskInvestments.length, color: '#ef4444' },
        { name: 'Medium Risk', value: mediumRiskInvestments.length, color: '#f59e0b' },
        { name: 'Low Risk', value: lowRiskInvestments.length, color: '#10b981' }
    ].filter(r => r.value > 0);

    // Overdue bills
    const overdueBills = bills.filter(b => b.status === 'pending' && new Date(b.due_date) < today);
    const totalOverdue = overdueBills.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Monthly spending trend (last 6 months)
    const spendingTrend = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthBills = bills.filter(b => {
            const billDate = new Date(b.due_date);
            return billDate >= monthStart && billDate <= monthEnd && b.status === 'paid';
        });
        
        const monthTotal = monthBills.reduce((sum, b) => sum + (b.amount || 0), 0) + monthlySubscriptionCost;
        
        spendingTrend.push({
            month: format(monthDate, 'MMM'),
            spending: monthTotal
        });
    }

    // Category breakdown
    const categoryBreakdown = {};
    bills.forEach(bill => {
        const category = bill.category || 'Other';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (bill.amount || 0);
    });
    
    subscriptions.forEach(sub => {
        const category = sub.category || 'Subscriptions';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (sub.monthly_cost || 0);
    });

    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
        name,
        value: Math.round(value)
    }));

    const COLORS = ['#C5A059', '#D4AF37', '#B8935E', '#8B7355', '#F4E4C1', '#A67C52'];

    // Financial health score
    const calculateHealthScore = () => {
        let score = 100;
        
        // Deduct for overdue bills
        if (overdueBills.length > 0) score -= 20;
        
        // Deduct for high subscription costs
        if (monthlySubscriptionCost > 500) score -= 10;
        
        // Deduct for many active subscriptions
        if (activeSubscriptions.length > 10) score -= 10;
        
        // Add for valuables
        if (totalValuablesValue > 10000) score += 10;
        
        return Math.max(0, Math.min(100, score));
    };

    const healthScore = calculateHealthScore();

    const getHealthStatus = (score) => {
        if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
        if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        return { label: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50' };
    };

    const healthStatus = getHealthStatus(healthScore);

    // Generate AI insights
    const generateInsights = async () => {
        setLoadingInsights(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this comprehensive financial data and provide actionable insights:
                
                SPENDING & OBLIGATIONS:
                - Total upcoming bills: $${totalUpcomingBills}
                - Overdue bills: $${totalOverdue} (${overdueBills.length} bills)
                - Monthly subscription cost: $${monthlySubscriptionCost}
                - Active subscriptions: ${activeSubscriptions.length}
                
                ASSETS:
                - Total valuables: $${totalValuablesValue}
                - Investment portfolio value: $${totalInvestmentValue}
                - Investment cost basis: $${totalInvestmentCost}
                - Portfolio return: ${portfolioReturn.toFixed(2)}%
                - Total investments: ${investments.length}
                
                PORTFOLIO COMPOSITION:
                ${allocationData.map(a => `- ${a.name}: $${a.value} (${a.percentage}%)`).join('\n                ')}
                
                RISK PROFILE:
                - High risk investments: ${highRiskInvestments.length}
                - Medium risk investments: ${mediumRiskInvestments.length}
                - Low risk investments: ${lowRiskInvestments.length}
                
                - Financial health score: ${healthScore}/100
                
                Provide:
                1. Overall financial health assessment (including investment performance)
                2. Top 3 savings opportunities
                3. Portfolio diversification recommendations
                4. Risk management suggestions based on current allocation
                5. Recommended actions to improve financial health
                6. Any red flags or concerns`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        assessment: { type: 'string' },
                        savings_opportunities: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        diversification_recommendations: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        risk_management_suggestions: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        recommended_actions: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        red_flags: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            });
            
            setAiInsights(response);
        } catch (error) {
            console.error('Failed to generate insights:', error);
        }
        setLoadingInsights(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C5A059]/50 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#C5A059] to-[#D4AF37] p-4 rounded-2xl">
                                <Activity className="w-8 h-8 text-black" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#C5A059] mb-1">
                                Financial Health
                            </h1>
                            <p className="text-[#B8935E] font-light">
                                AI-powered financial insights and opportunities
                            </p>
                        </div>
                    </div>
                </div>

                {/* Health Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-[#1a1a1a] border-[#C5A059] md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-light text-[#C5A059]">Financial Health Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-5xl font-light text-[#C5A059] mb-2">{healthScore}</div>
                                    <Badge className={`${healthStatus.bg} ${healthStatus.color} border-0`}>
                                        {healthStatus.label}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-[#B8935E] mb-1">Total Assets</div>
                                    <div className="text-2xl font-light text-[#C5A059]">
                                        ${totalValuablesValue.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Upcoming Bills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#C5A059]" />
                                <div>
                                    <div className="text-2xl font-light text-[#C5A059]">
                                        ${totalUpcomingBills.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-[#B8935E]">{upcomingBills.length} pending</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Monthly Subscriptions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-[#C5A059]" />
                                <div>
                                    <div className="text-2xl font-light text-[#C5A059]">
                                        ${monthlySubscriptionCost.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-[#B8935E]">{activeSubscriptions.length} active</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts */}
                {(overdueBills.length > 0 || activeSubscriptions.length > 10) && (
                    <Card className="bg-red-950/20 border-red-500/30 mb-8">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-[#C5A059] font-medium mb-2">Action Required</h3>
                                    <div className="space-y-1 text-sm text-[#B8935E]">
                                        {overdueBills.length > 0 && (
                                            <p>• You have {overdueBills.length} overdue bill(s) totaling ${totalOverdue.toLocaleString()}</p>
                                        )}
                                        {activeSubscriptions.length > 10 && (
                                            <p>• You have {activeSubscriptions.length} active subscriptions costing ${annualSubscriptionCost.toLocaleString()}/year</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Investment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Portfolio Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-[#C5A059]" />
                                <div>
                                    <div className="text-2xl font-light text-[#C5A059]">
                                        ${totalInvestmentValue.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-[#B8935E]">{investments.length} investments</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Portfolio Return</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                {portfolioReturn >= 0 ? (
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                )}
                                <div>
                                    <div className={`text-2xl font-light ${portfolioReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
                                    </div>
                                    <div className="text-xs text-[#B8935E]">
                                        {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Risk Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#B8935E]">High Risk</span>
                                    <span className="text-red-500">{highRiskInvestments.length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#B8935E]">Medium Risk</span>
                                    <span className="text-yellow-500">{mediumRiskInvestments.length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#B8935E]">Low Risk</span>
                                    <span className="text-green-500">{lowRiskInvestments.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-lg font-light text-[#C5A059]">Spending Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={spendingTrend}>
                                    <defs>
                                        <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="month" stroke="#B8935E" />
                                    <YAxis stroke="#B8935E" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #C5A059' }}
                                        labelStyle={{ color: '#C5A059' }}
                                    />
                                    <Area type="monotone" dataKey="spending" stroke="#C5A059" fillOpacity={1} fill="url(#colorSpending)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-lg font-light text-[#C5A059]">Spending by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #C5A059' }}
                                        formatter={(value) => `$${value}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-lg font-light text-[#C5A059]">Asset Allocation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allocationData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percentage }) => `${name} ${percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #C5A059' }}
                                            formatter={(value) => `$${value}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-[#B8935E]">
                                    No investment data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-lg font-light text-[#C5A059]">Top Investments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {investments
                                    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
                                    .slice(0, 5)
                                    .map((inv, idx) => {
                                        const gain = (inv.current_value || 0) - (inv.purchase_price || 0);
                                        const gainPercent = inv.purchase_price > 0 ? ((gain / inv.purchase_price) * 100) : 0;
                                        return (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm text-[#C5A059] truncate">{inv.name || inv.symbol}</div>
                                                    <div className="text-xs text-[#B8935E]">{inv.asset_type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-[#C5A059]">
                                                        ${(inv.current_value || 0).toLocaleString()}
                                                    </div>
                                                    <div className={`text-xs ${gainPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {investments.length === 0 && (
                                    <div className="text-center text-[#B8935E] py-8">
                                        No investments yet
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Insights */}
                <Card className="bg-gradient-to-br from-[#C5A059]/10 to-[#D4AF37]/10 border-[#C5A059] mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-light text-[#C5A059] flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                AI Financial Insights
                            </CardTitle>
                            <Button
                                onClick={generateInsights}
                                disabled={loadingInsights}
                                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37]"
                            >
                                {loadingInsights ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Insights
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    {aiInsights && (
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-[#C5A059] font-medium mb-2">Assessment</h3>
                                <p className="text-[#B8935E]">{aiInsights.assessment}</p>
                            </div>

                            {aiInsights.savings_opportunities?.length > 0 && (
                                <div>
                                    <h3 className="text-[#C5A059] font-medium mb-2 flex items-center gap-2">
                                        <PiggyBank className="w-4 h-4" />
                                        Savings Opportunities
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiInsights.savings_opportunities.map((opp, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[#B8935E]">
                                                <ArrowDownRight className="w-4 h-4 text-green-500 mt-0.5" />
                                                <span>{opp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.diversification_recommendations?.length > 0 && (
                                <div>
                                    <h3 className="text-[#C5A059] font-medium mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Portfolio Diversification
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiInsights.diversification_recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[#B8935E]">
                                                <span>•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.risk_management_suggestions?.length > 0 && (
                                <div>
                                    <h3 className="text-[#C5A059] font-medium mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Risk Management
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiInsights.risk_management_suggestions.map((sug, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[#B8935E]">
                                                <span>•</span>
                                                <span>{sug}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.recommended_actions?.length > 0 && (
                                <div>
                                    <h3 className="text-[#C5A059] font-medium mb-2">Recommended Actions</h3>
                                    <ul className="space-y-2">
                                        {aiInsights.recommended_actions.map((action, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[#B8935E]">
                                                <ArrowUpRight className="w-4 h-4 text-blue-500 mt-0.5" />
                                                <span>{action}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.red_flags?.length > 0 && (
                                <div>
                                    <h3 className="text-red-500 font-medium mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Red Flags
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiInsights.red_flags.map((flag, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[#B8935E]">
                                                <span>•</span>
                                                <span>{flag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Annual Subscription Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-light text-[#C5A059]">
                                ${annualSubscriptionCost.toLocaleString()}
                            </div>
                            <p className="text-xs text-[#B8935E] mt-1">
                                ${monthlySubscriptionCost.toLocaleString()}/month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Total Valuables</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Gem className="w-5 h-5 text-[#C5A059]" />
                                <div>
                                    <div className="text-2xl font-light text-[#C5A059]">
                                        ${totalValuablesValue.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-[#B8935E]">{valuables.length} items</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#B8935E]">Payment Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#B8935E]">Paid</span>
                                    <span className="text-green-500">{bills.filter(b => b.status === 'paid').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#B8935E]">Pending</span>
                                    <span className="text-yellow-500">{upcomingBills.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#B8935E]">Overdue</span>
                                    <span className="text-red-500">{overdueBills.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}