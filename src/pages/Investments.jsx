import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Plus, DollarSign, PieChart, Target, RefreshCw, Sparkles } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                                <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Investments</h1>
                            <p className="text-black/70 font-light">Track your portfolio performance</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={updateAllPrices}
                            disabled={updatingPrices}
                            variant="outline"
                            className="border-[#D4AF37]/20"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${updatingPrices ? 'animate-spin' : ''}`} />
                            Update Prices
                        </Button>
                        <Button
                            onClick={getInsights}
                            disabled={loadingInsights}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                        >
                            {loadingInsights ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Get AI Insights
                                </>
                            )}
                        </Button>
                    </div>
                    <Dialog open={investmentOpen} onOpenChange={setInvestmentOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-black to-[#1a1a1a]">
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

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]">
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
                                    <p className="text-sm text-white/60 mb-1">Total Value</p>
                                    <p className="text-3xl font-light">${totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/60 mb-1">Cost Basis</p>
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
                                    <p className="text-sm text-white/60 mb-1">Gain/Loss</p>
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
                                    <p className="text-sm text-white/60 mb-1">Return</p>
                                    <p className={`text-3xl font-light ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
                                    </p>
                                </div>
                                <PieChart className={`w-8 h-8 ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Insights */}
                {insights && (
                    <div className="mb-8">
                        <InvestmentInsights insights={insights} metrics={insightsMetrics} />
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
                                <TrendingUp className="w-12 h-12 text-black/20 mx-auto mb-4" />
                                <p className="text-black/40">No investments tracked yet</p>
                                <p className="text-sm text-black/30 mt-2">Add your first investment to start tracking portfolio performance</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}