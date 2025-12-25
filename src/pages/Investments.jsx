import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Plus, DollarSign, PieChart, Target, RefreshCw, Sparkles, AlertTriangle, Shield, ChevronRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import PortfolioChart from '../components/investments/PortfolioChart';
import AssetAllocation from '../components/investments/AssetAllocation';
import InvestmentCard from '../components/investments/InvestmentCard';
import InvestmentInsights from '../components/investments/InvestmentInsights';
import InvestmentAdvisorChat from '../components/investments/InvestmentAdvisorChat';
import PortfolioRiskAnalysis from '../components/investments/PortfolioRiskAnalysis';
import PersonalizedStrategy from '../components/investments/PersonalizedStrategy';
import MarketTrendMonitor from '../components/investments/MarketTrendMonitor';
import RebalancingSuggestions from '../components/investments/RebalancingSuggestions';
import PortfolioPerformanceChart from '../components/investments/PortfolioPerformanceChart';
import RebalancingAlerts from '../components/investments/RebalancingAlerts';
import DemoCTA from '../components/DemoCTA';
import { toast } from 'sonner';

const accountTypeLabels = {
    brokerage: 'Brokerage',
    '401k': '401(k)',
    ira: 'Traditional IRA',
    roth_ira: 'Roth IRA',
    taxable: 'Taxable Account',
    hsa: 'HSA',
    '529_plan': '529 Plan',
    pension: 'Pension',
    crypto: 'Cryptocurrency',
    other: 'Other'
};

const assetTypeLabels = {
    stocks: 'Stocks',
    bonds: 'Bonds',
    mutual_funds: 'Mutual Funds',
    etf: 'ETF',
    crypto: 'Cryptocurrency',
    real_estate: 'Real Estate',
    commodities: 'Commodities',
    cash: 'Cash',
    other: 'Other'
};

export default function Investments() {
    const [investmentOpen, setInvestmentOpen] = useState(false);
    const [updatingPrices, setUpdatingPrices] = useState(false);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insights, setInsights] = useState(null);
    const [insightsMetrics, setInsightsMetrics] = useState(null);
    const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);
    const [analyzingPortfolio, setAnalyzingPortfolio] = useState(false);
    const [investmentForm, setInvestmentForm] = useState({
        account_name: '',
        account_type: 'brokerage',
        institution: '',
        asset_type: 'stocks',
        ticker_symbol: '',
        shares: '',
        purchase_price: '',
        current_price: '',
        purchase_date: '',
        dividend_yield: '',
        notes: ''
    });

    const queryClient = useQueryClient();

    const { data: investments = [] } = useQuery({
        queryKey: ['investments'],
        queryFn: () => base44.entities.Investment.list('-created_date')
    });

    // Auto-refresh prices every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            updateAllPrices();
        }, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    const { data: goals = [] } = useQuery({
        queryKey: ['goals'],
        queryFn: () => base44.entities.FinancialGoal.list()
    });

    const createInvestmentMutation = useMutation({
        mutationFn: (data) => {
            const costBasis = parseFloat(data.shares) * parseFloat(data.purchase_price);
            const currentValue = parseFloat(data.shares) * parseFloat(data.current_price);
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = (gainLoss / costBasis) * 100;

            return base44.entities.Investment.create({
                ...data,
                cost_basis: costBasis,
                current_value: currentValue,
                unrealized_gain_loss: gainLoss,
                unrealized_gain_loss_percent: gainLossPercent,
                last_updated: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investments'] });
            setInvestmentOpen(false);
            resetForm();
            toast.success('Investment added!');
        }
    });

    const resetForm = () => {
        setInvestmentForm({
            account_name: '',
            account_type: 'brokerage',
            institution: '',
            asset_type: 'stocks',
            ticker_symbol: '',
            shares: '',
            purchase_price: '',
            current_price: '',
            purchase_date: '',
            dividend_yield: '',
            notes: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createInvestmentMutation.mutate(investmentForm);
    };

    // Calculate portfolio totals
    const totalCostBasis = investments.reduce((sum, inv) => sum + (inv.cost_basis || 0), 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    const totalGainLoss = totalCurrentValue - totalCostBasis;
    const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    const updateAllPrices = async () => {
        setUpdatingPrices(true);
        try {
            const result = await base44.functions.invoke('fetchMarketPrices', {});
            toast.success(result.data.message);
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        } catch (error) {
            toast.error('Failed to update prices');
        }
        setUpdatingPrices(false);
    };

    const getInsights = async () => {
        setLoadingInsights(true);
        try {
            const result = await base44.functions.invoke('getInvestmentInsights');
            setInsights(result.data.insights);
            setInsightsMetrics(result.data.portfolio_metrics);
            toast.success('Insights generated!');
        } catch (error) {
            toast.error('Failed to generate insights');
        }
        setLoadingInsights(false);
    };

    const analyzePortfolio = async () => {
        setAnalyzingPortfolio(true);
        try {
            const result = await base44.functions.invoke('analyzePortfolio', {});
            setPortfolioAnalysis(result.data);
            toast.success('Portfolio analysis complete!');
        } catch (error) {
            toast.error('Failed to analyze portfolio');
        }
        setAnalyzingPortfolio(false);
    };

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
                            <h1 className="text-4xl font-light text-black">Investments</h1>
                            <p className="text-[#0F1729]/60 font-light">Track your portfolio performance</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={updateAllPrices}
                            disabled={updatingPrices}
                            variant="outline"
                            className="border-[#4A90E2]/20"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${updatingPrices ? 'animate-spin' : ''}`} />
                            Update Prices
                        </Button>
                        <Button
                            onClick={analyzePortfolio}
                            disabled={analyzingPortfolio}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            {analyzingPortfolio ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    AI Portfolio Analysis
                                </>
                            )}
                        </Button>
                    </div>
                    <Dialog open={investmentOpen} onOpenChange={setInvestmentOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Investment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Investment</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Account Name</Label>
                                        <Input
                                            value={investmentForm.account_name}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, account_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Account Type</Label>
                                        <Select
                                            value={investmentForm.account_type}
                                            onValueChange={(value) => setInvestmentForm({ ...investmentForm, account_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(accountTypeLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Institution</Label>
                                        <Input
                                            value={investmentForm.institution}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, institution: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Asset Type</Label>
                                        <Select
                                            value={investmentForm.asset_type}
                                            onValueChange={(value) => setInvestmentForm({ ...investmentForm, asset_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(assetTypeLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Ticker Symbol</Label>
                                        <Input
                                            placeholder="e.g., AAPL, SPY"
                                            value={investmentForm.ticker_symbol}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, ticker_symbol: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Shares</Label>
                                        <Input
                                            type="number"
                                            step="0.0001"
                                            value={investmentForm.shares}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, shares: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Purchase Price per Share</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={investmentForm.purchase_price}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, purchase_price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Current Price per Share</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={investmentForm.current_price}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, current_price: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Purchase Date</Label>
                                        <Input
                                            type="date"
                                            value={investmentForm.purchase_date}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, purchase_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Dividend Yield (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={investmentForm.dividend_yield}
                                            onChange={(e) => setInvestmentForm({ ...investmentForm, dividend_yield: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={investmentForm.notes}
                                        onChange={(e) => setInvestmentForm({ ...investmentForm, notes: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Add Investment
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Total Value</p>
                                    <p className="text-3xl font-light">${totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Cost Basis</p>
                                    <p className="text-3xl font-light">${totalCostBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <Target className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Gain/Loss</p>
                                    <p className={`text-3xl font-light ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                                <TrendingUp className={`w-8 h-8 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Return</p>
                                    <p className={`text-3xl font-light ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
                                    </p>
                                </div>
                                <PieChart className={`w-8 h-8 ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Demo CTA */}
                <DemoCTA />

                {/* Rebalancing Alerts */}
                <div className="mb-8">
                    <RebalancingAlerts investments={investments} />
                </div>

                {/* Portfolio Performance Chart */}
                <div className="mb-8">
                    <PortfolioPerformanceChart investments={investments} />
                </div>

                {/* AI Investment Tools */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    <PortfolioRiskAnalysis />
                    <PersonalizedStrategy />
                    <MarketTrendMonitor />
                    <RebalancingSuggestions />
                </div>

                {/* AI Portfolio Analysis */}
                {portfolioAnalysis && (
                    <div className="mb-8 space-y-6">
                        {/* Overall Health */}
                        <Card className="bg-gradient-to-br from-[#4A90E2]/10 to-[#7BB3E0]/10 border-[#4A90E2] border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                                        AI Portfolio Analysis
                                    </span>
                                    <Badge className={`${
                                        portfolioAnalysis.ai_analysis.overall_health.rating === 'excellent' ? 'bg-green-100 text-green-800' :
                                        portfolioAnalysis.ai_analysis.overall_health.rating === 'very_good' ? 'bg-blue-100 text-blue-800' :
                                        portfolioAnalysis.ai_analysis.overall_health.rating === 'good' ? 'bg-cyan-100 text-cyan-800' :
                                        portfolioAnalysis.ai_analysis.overall_health.rating === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {portfolioAnalysis.ai_analysis.overall_health.rating.toUpperCase()} ({portfolioAnalysis.ai_analysis.overall_health.score}/100)
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[#0F1729]/70 leading-relaxed">{portfolioAnalysis.ai_analysis.overall_health.summary}</p>
                            </CardContent>
                        </Card>

                        {/* Underperforming Assets */}
                        {portfolioAnalysis.ai_analysis.underperforming_assets?.length > 0 && (
                            <Card className="border-orange-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-orange-600">
                                        <AlertTriangle className="w-5 h-5" />
                                        Underperforming Assets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {portfolioAnalysis.ai_analysis.underperforming_assets.map((asset, idx) => (
                                            <div key={idx} className="p-4 bg-orange-50 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-black">{asset.asset_name}</h4>
                                                    <div className="flex gap-2">
                                                        <Badge className={`${
                                                            asset.priority === 'high' ? 'bg-red-600' :
                                                            asset.priority === 'medium' ? 'bg-orange-600' :
                                                            'bg-yellow-600'
                                                        } text-white`}>
                                                            {asset.priority}
                                                        </Badge>
                                                        <Badge className={`${
                                                            asset.action === 'sell' ? 'bg-red-600' :
                                                            asset.action === 'reduce' ? 'bg-orange-600' :
                                                            'bg-yellow-600'
                                                        } text-white`}>
                                                            {asset.action.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-[#0F1729]/70 mb-2">{asset.issue}</p>
                                                <p className="text-sm text-black font-medium">{asset.recommendation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Rebalancing Strategy */}
                        {portfolioAnalysis.ai_analysis.rebalancing_strategy?.needed && (
                            <Card className="border-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-600">
                                        <Target className="w-5 h-5" />
                                        Rebalancing Strategy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-[#0F1729]/70 mb-4">{portfolioAnalysis.ai_analysis.rebalancing_strategy.reason}</p>
                                    <div className="space-y-3">
                                        {portfolioAnalysis.ai_analysis.rebalancing_strategy.actions?.map((action, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                                <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-black">{action.action}</p>
                                                    <p className="text-sm text-[#0F1729]/70">{action.asset_type}: {action.amount}</p>
                                                    <p className="text-sm text-[#0F1729]/60">{action.reason}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Market Insights */}
                            {portfolioAnalysis.ai_analysis.market_insights?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            Market Insights
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioAnalysis.ai_analysis.market_insights.map((insight, idx) => (
                                                <div key={idx} className="p-3 bg-green-50 rounded-lg">
                                                    <p className="font-medium text-black mb-1">{insight.trend}</p>
                                                    <p className="text-sm text-[#0F1729]/70 mb-1">{insight.impact}</p>
                                                    <p className="text-sm text-green-700 font-medium">{insight.opportunity}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Buy Opportunities */}
                            {portfolioAnalysis.ai_analysis.buy_opportunities?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Plus className="w-5 h-5 text-green-600" />
                                            Buy Opportunities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {portfolioAnalysis.ai_analysis.buy_opportunities.map((opp, idx) => (
                                                <div key={idx} className="p-3 bg-green-50 rounded-lg">
                                                    <p className="font-medium text-black mb-1">{opp.asset_type}</p>
                                                    <p className="text-sm text-[#0F1729]/70 mb-1">{opp.reason}</p>
                                                    <p className="text-sm text-green-700">{opp.allocation_suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Risk Assessment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Risk Assessment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Current Risk Level</p>
                                    <p className="text-lg font-semibold text-black">{portfolioAnalysis.ai_analysis.risk_assessment.current_risk_level}</p>
                                </div>
                                <p className="text-[#0F1729]/70 mb-4">{portfolioAnalysis.ai_analysis.risk_assessment.alignment_with_tolerance}</p>
                                <ul className="space-y-2">
                                    {portfolioAnalysis.ai_analysis.risk_assessment.suggestions?.map((suggestion, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-[#0F1729]/70">
                                            <span>•</span>
                                            <span>{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Immediate Actions */}
                        {portfolioAnalysis.ai_analysis.immediate_actions?.length > 0 && (
                            <Card className="bg-red-950/20 border-red-500/30">
                                <CardHeader>
                                    <CardTitle className="text-red-600 flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Immediate Actions Required
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {portfolioAnalysis.ai_analysis.immediate_actions.map((action, idx) => (
                                            <div key={idx} className="p-3 bg-red-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={`${
                                                        action.priority === 'critical' ? 'bg-red-600' :
                                                        action.priority === 'high' ? 'bg-orange-600' :
                                                        action.priority === 'medium' ? 'bg-yellow-600' :
                                                        'bg-blue-600'
                                                    } text-white`}>
                                                        {action.priority}
                                                    </Badge>
                                                    <p className="font-medium text-black">{action.action}</p>
                                                </div>
                                                <p className="text-sm text-black/70">{action.expected_impact}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Diversification */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Diversification Tips</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {portfolioAnalysis.ai_analysis.diversification_recommendations?.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-black/70">
                                                <span>•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Tax Optimization */}
                            {portfolioAnalysis.ai_analysis.tax_optimization?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Tax Optimization</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {portfolioAnalysis.ai_analysis.tax_optimization.map((tip, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-black/70">
                                                    <span>•</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <PortfolioChart investments={investments} />
                    <AssetAllocation investments={investments} />
                </div>

                {/* Holdings */}
                <div>
                    <h2 className="text-2xl font-light text-black mb-6">Holdings</h2>
                    {investments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {investments.map(investment => (
                                <InvestmentCard 
                                    key={investment.id} 
                                    investment={investment}
                                    goals={goals}
                                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['investments'] })}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-center py-12">
                                <TrendingUp className="w-12 h-12 text-[#0F1729]/20 mx-auto mb-4" />
                                <p className="text-[#0F1729]/40">No investments tracked yet</p>
                                <p className="text-sm text-[#0F1729]/30 mt-2">Add your first investment to start tracking portfolio performance</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Investment Advisor Chatbot */}
                <InvestmentAdvisorChat />
            </div>
        </div>
    );
}