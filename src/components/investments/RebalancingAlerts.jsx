import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RebalancingAlerts({ investments }) {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        checkRebalancing();
    }, [investments]);

    const checkRebalancing = () => {
        if (!investments || investments.length === 0) return;

        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        
        // Calculate current allocation
        const allocation = {};
        investments.forEach(inv => {
            const type = inv.asset_type || 'other';
            allocation[type] = (allocation[type] || 0) + inv.current_value;
        });

        // Define target allocations based on common balanced portfolio
        const targetAllocations = {
            stocks: 0.60,
            bonds: 0.30,
            etf: 0.60,  // Group with stocks
            mutual_funds: 0.60,  // Group with stocks
            cash: 0.05,
            real_estate: 0.05,
            crypto: 0.00,
            commodities: 0.00,
            other: 0.00
        };

        const newAlerts = [];

        // Check each asset type
        Object.entries(allocation).forEach(([type, value]) => {
            const currentPercent = (value / totalValue) * 100;
            const targetPercent = (targetAllocations[type] || 0) * 100;
            const deviation = Math.abs(currentPercent - targetPercent);

            // Alert if deviation is > 5%
            if (deviation > 5) {
                const isOverweight = currentPercent > targetPercent;
                newAlerts.push({
                    type,
                    currentPercent,
                    targetPercent,
                    deviation,
                    isOverweight,
                    action: isOverweight ? 'reduce' : 'increase',
                    severity: deviation > 15 ? 'high' : deviation > 10 ? 'medium' : 'low',
                    recommendation: isOverweight 
                        ? `Consider reducing ${type} by ${deviation.toFixed(1)}% (sell ~$${((deviation / 100) * totalValue).toFixed(0)})`
                        : `Consider increasing ${type} by ${deviation.toFixed(1)}% (buy ~$${((deviation / 100) * totalValue).toFixed(0)})`
                });
            }
        });

        // Sort by severity and deviation
        newAlerts.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[b.severity] - severityOrder[a.severity];
            }
            return b.deviation - a.deviation;
        });

        setAlerts(newAlerts);
    };

    const handleDismiss = (index) => {
        setAlerts(alerts.filter((_, i) => i !== index));
        toast.success('Alert dismissed');
    };

    if (alerts.length === 0) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                            <p className="font-medium text-green-900">Portfolio Well-Balanced</p>
                            <p className="text-sm text-green-700">Your asset allocation is within target ranges</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Rebalancing Alerts ({alerts.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {alerts.map((alert, idx) => (
                    <div 
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${
                            alert.severity === 'high' ? 'bg-red-50 border-red-300' :
                            alert.severity === 'medium' ? 'bg-orange-50 border-orange-300' :
                            'bg-yellow-50 border-yellow-300'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge className={`${
                                    alert.severity === 'high' ? 'bg-red-600' :
                                    alert.severity === 'medium' ? 'bg-orange-600' :
                                    'bg-yellow-600'
                                } text-white`}>
                                    {alert.severity.toUpperCase()}
                                </Badge>
                                <span className="font-medium text-black capitalize">{alert.type}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(idx)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Dismiss
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                                <p className="text-xs text-black/60">Current</p>
                                <p className="text-sm font-medium text-black">{alert.currentPercent.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/60">Target</p>
                                <p className="text-sm font-medium text-black">{alert.targetPercent.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-black/60">Deviation</p>
                                <p className="text-sm font-medium text-orange-700">{alert.deviation.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-white rounded border border-orange-200">
                            <ArrowRightLeft className="w-4 h-4 text-orange-600" />
                            <p className="text-sm text-black">{alert.recommendation}</p>
                        </div>
                    </div>
                ))}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900 font-medium mb-1">💡 Rebalancing Tip</p>
                    <p className="text-xs text-blue-800">
                        Consider rebalancing during market dips to buy underweight assets at lower prices. 
                        For tax-advantaged accounts, rebalance anytime without tax consequences.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}