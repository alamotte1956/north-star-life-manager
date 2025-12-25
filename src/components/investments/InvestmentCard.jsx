import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, RefreshCw, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import HistoricalChart from './HistoricalChart';

const assetTypeLabels = {
    stocks: 'Stocks',
    bonds: 'Bonds',
    mutual_funds: 'Mutual Funds',
    etf: 'ETF',
    crypto: 'Crypto',
    real_estate: 'Real Estate',
    commodities: 'Commodities',
    cash: 'Cash',
    other: 'Other'
};

export default function InvestmentCard({ investment, goals, onUpdate }) {
    const [updating, setUpdating] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [linking, setLinking] = useState(false);
    const [chartOpen, setChartOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(investment.linked_goal_id || '');

    const isPositive = investment.unrealized_gain_loss >= 0;

    const updatePrice = async () => {
        if (!newPrice) return;
        
        setUpdating(true);
        try {
            const currentValue = parseFloat(investment.shares) * parseFloat(newPrice);
            const gainLoss = currentValue - investment.cost_basis;
            const gainLossPercent = (gainLoss / investment.cost_basis) * 100;

            await base44.entities.Investment.update(investment.id, {
                current_price: parseFloat(newPrice),
                current_value: currentValue,
                unrealized_gain_loss: gainLoss,
                unrealized_gain_loss_percent: gainLossPercent,
                last_updated: new Date().toISOString()
            });

            setNewPrice('');
            onUpdate();
            toast.success('Price updated!');
        } catch (error) {
            toast.error('Failed to update price');
        }
        setUpdating(false);
    };

    const linkToGoal = async () => {
        if (!selectedGoal) return;
        
        try {
            const goal = goals.find(g => g.id === selectedGoal);
            await base44.entities.Investment.update(investment.id, {
                linked_goal_id: selectedGoal,
                linked_goal_name: goal?.title || ''
            });
            setLinking(false);
            onUpdate();
            toast.success('Linked to goal!');
        } catch (error) {
            toast.error('Failed to link goal');
        }
    };

    return (
        <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-light">
                                {investment.ticker_symbol || investment.account_name}
                            </span>
                            {isPositive ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                        </div>
                        <p className="text-sm text-white/60 font-normal mt-1">{investment.account_name}</p>
                    </div>
                </CardTitle>
                <Badge variant="outline" className="w-fit">
                    {assetTypeLabels[investment.asset_type]}
                </Badge>
            </CardHeader>
            
            <CardContent>
                <div className="space-y-4">
                    {/* Current Value */}
                    <div>
                        <p className="text-sm text-white/60 mb-1">Current Value</p>
                        <p className="text-2xl font-light">${investment.current_value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>

                    {/* Gain/Loss */}
                    <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Unrealized Gain/Loss</span>
                            <div className="text-right">
                                <p className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : ''}${investment.unrealized_gain_loss?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </p>
                                <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : ''}{investment.unrealized_gain_loss_percent?.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                        {investment.shares && (
                            <div className="flex justify-between">
                                <span className="text-white/60">Shares</span>
                                <span>{investment.shares}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-white/60">Cost Basis</span>
                            <span>${investment.cost_basis?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        {investment.current_price && (
                            <div className="flex justify-between">
                                <span className="text-white/60">Current Price</span>
                                <span>${investment.current_price.toFixed(2)}</span>
                            </div>
                        )}
                        {investment.dividend_yield && (
                            <div className="flex justify-between">
                                <span className="text-white/60">Dividend Yield</span>
                                <span>{investment.dividend_yield}%</span>
                            </div>
                        )}
                        {investment.last_updated && (
                            <div className="flex justify-between">
                                <span className="text-white/60">Last Updated</span>
                                <span>{format(new Date(investment.last_updated), 'MMM d, h:mm a')}</span>
                            </div>
                        )}
                    </div>

                    {/* Linked Goal */}
                    {investment.linked_goal_name && (
                        <div className="flex items-center gap-2 p-2 bg-[#D4AF37]/10 rounded-lg">
                            <Target className="w-4 h-4 text-[#D4AF37]" />
                            <span className="text-sm">Linked to: {investment.linked_goal_name}</span>
                        </div>
                    )}

                    {/* Update Price */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="New price"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                size="sm"
                                onClick={updatePrice}
                                disabled={updating || !newPrice}
                                className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]"
                            >
                                <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {/* View Performance Chart */}
                        {investment.ticker_symbol && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setChartOpen(true)}
                                className="w-full border-[#4A90E2]/20"
                            >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Performance
                            </Button>
                        )}

                        {/* Link to Goal */}
                        {goals.length > 0 && (
                            <div>
                                {linking ? (
                                    <div className="flex gap-2">
                                        <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Select goal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {goals.map(goal => (
                                                    <SelectItem key={goal.id} value={goal.id}>
                                                        {goal.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm" onClick={linkToGoal}>Link</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setLinking(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setLinking(true)}
                                        className="w-full border-[#D4AF37]/20"
                                    >
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        Link to Goal
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Historical Chart Dialog */}
            <Dialog open={chartOpen} onOpenChange={setChartOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Performance History</DialogTitle>
                    </DialogHeader>
                    <HistoricalChart 
                        ticker={investment.ticker_symbol} 
                        assetName={investment.account_name}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
}