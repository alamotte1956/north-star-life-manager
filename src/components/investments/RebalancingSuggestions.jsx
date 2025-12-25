import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function RebalancingSuggestions() {
    const [loading, setLoading] = useState(false);
    const [rebalancing, setRebalancing] = useState(null);

    const generateSuggestions = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('generateRebalancingSuggestions', {});
            setRebalancing(result.data);
            toast.success('Rebalancing analysis complete!');
        } catch (error) {
            toast.error('Failed to generate rebalancing suggestions');
        }
        setLoading(false);
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'significant': return 'bg-orange-100 text-orange-800';
            case 'moderate': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <Card className="border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-cyan-600" />
                        Portfolio Rebalancing Suggestions
                    </span>
                    <Button
                        onClick={generateSuggestions}
                        disabled={loading}
                        size="sm"
                        className="bg-gradient-to-r from-cyan-600 to-blue-600"
                    >
                        <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                </CardTitle>
            </CardHeader>

            {rebalancing?.rebalancing && (
                <CardContent className="pt-6 space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rebalancing Status:</span>
                        <Badge className={rebalancing.rebalancing.rebalancing_needed ? getSeverityColor(rebalancing.rebalancing.severity) : 'bg-green-100 text-green-800'}>
                            {rebalancing.rebalancing.rebalancing_needed ? `${rebalancing.rebalancing.severity} rebalancing needed` : 'Well balanced'}
                        </Badge>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                        <p className="text-sm">{rebalancing.rebalancing.summary}</p>
                    </div>

                    {rebalancing.rebalancing.rebalancing_needed && (
                        <>
                            {/* Recommended Actions */}
                            {rebalancing.rebalancing.recommended_actions?.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3">Recommended Actions</h4>
                                    <div className="space-y-2">
                                        {rebalancing.rebalancing.recommended_actions
                                            .sort((a, b) => a.priority - b.priority)
                                            .map((action, idx) => (
                                                <div key={idx} className={`p-3 rounded-lg border ${
                                                    action.action === 'buy' ? 'bg-green-50 border-green-200' :
                                                    action.action === 'sell' ? 'bg-red-50 border-red-200' :
                                                    'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium">{action.holding}</span>
                                                        <div className="flex items-center gap-2">
                                                            {action.action === 'buy' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                                                             action.action === 'sell' ? <TrendingDown className="w-4 h-4 text-red-600" /> : null}
                                                            <Badge variant="outline" className="capitalize">{action.action}</Badge>
                                                            <Badge variant="outline">Priority {action.priority}</Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm mb-1">
                                                        Amount: <span className="font-semibold">${action.amount.toLocaleString()}</span>
                                                        {action.percentage && <span className="text-xs text-gray-600"> ({action.percentage.toFixed(1)}%)</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-700">{action.reason}</p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Step by Step Plan */}
                            {rebalancing.rebalancing.step_by_step_plan?.length > 0 && (
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                    <h4 className="font-semibold text-indigo-900 mb-2">Execution Plan</h4>
                                    <ol className="space-y-1">
                                        {rebalancing.rebalancing.step_by_step_plan.map((step, idx) => (
                                            <li key={idx} className="text-sm text-indigo-800 flex items-start gap-2">
                                                <span className="font-bold">{idx + 1}.</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* Financial Impact */}
                            <div className="grid grid-cols-2 gap-3">
                                {rebalancing.rebalancing.total_transactions_value > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-700 mb-1">Total to Move</p>
                                        <p className="text-lg font-bold text-blue-900">
                                            ${rebalancing.rebalancing.total_transactions_value.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {rebalancing.rebalancing.estimated_costs > 0 && (
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                        <p className="text-xs text-orange-700 mb-1">Est. Costs</p>
                                        <p className="text-lg font-bold text-orange-900">
                                            ${rebalancing.rebalancing.estimated_costs.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Tax Considerations */}
                            {rebalancing.rebalancing.tax_considerations?.length > 0 && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h4 className="font-semibold text-yellow-900 mb-2">Tax Considerations</h4>
                                    <ul className="space-y-1">
                                        {rebalancing.rebalancing.tax_considerations.map((tax, idx) => (
                                            <li key={idx} className="text-sm text-yellow-800 flex items-start gap-1">
                                                <span>💰</span>
                                                <span>{tax}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Expected Outcome */}
                            {rebalancing.rebalancing.expected_outcome && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <h4 className="text-sm font-semibold text-green-900 mb-1">Expected Outcome</h4>
                                    <p className="text-sm text-green-800">{rebalancing.rebalancing.expected_outcome}</p>
                                </div>
                            )}

                            {/* Risk Impact */}
                            {rebalancing.rebalancing.risk_impact && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                    <h4 className="text-sm font-semibold text-purple-900 mb-1">Risk Impact</h4>
                                    <p className="text-sm text-purple-800">{rebalancing.rebalancing.risk_impact}</p>
                                </div>
                            )}

                            {/* Timeline */}
                            {rebalancing.rebalancing.execution_timeline && (
                                <div className="bg-gray-50 p-3 rounded-lg border">
                                    <h4 className="text-sm font-semibold mb-1">Execution Timeline</h4>
                                    <p className="text-sm text-gray-700">{rebalancing.rebalancing.execution_timeline}</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            )}
        </Card>
    );
}