import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Bell, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketTrendMonitor() {
    const [loading, setLoading] = useState(false);
    const [monitoring, setMonitoring] = useState(null);

    const monitorTrends = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('monitorMarketTrends', {});
            setMonitoring(result.data);
            toast.success('Market trends analyzed!');
        } catch (error) {
            toast.error('Failed to monitor market');
        }
        setLoading(false);
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'risk': return AlertTriangle;
            case 'opportunity': return TrendingUp;
            case 'warning': return AlertTriangle;
            default: return Info;
        }
    };

    const getAlertColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 border-red-500 text-red-900';
            case 'high': return 'bg-orange-50 border-orange-500 text-orange-900';
            case 'medium': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
            default: return 'bg-blue-50 border-blue-500 text-blue-900';
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'bullish': return 'bg-green-100 text-green-800';
            case 'neutral': return 'bg-blue-100 text-blue-800';
            case 'bearish': return 'bg-orange-100 text-orange-800';
            case 'very_bearish': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card className="border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-600" />
                        Market Trend Monitor & Alerts
                    </span>
                    <Button
                        onClick={monitorTrends}
                        disabled={loading}
                        size="sm"
                        className="bg-gradient-to-r from-orange-600 to-red-600"
                    >
                        <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Monitoring...' : 'Monitor Now'}
                    </Button>
                </CardTitle>
            </CardHeader>

            {monitoring?.monitoring && (
                <CardContent className="pt-6 space-y-4">
                    {/* Market Sentiment */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Market Sentiment:</span>
                        <Badge className={getSentimentColor(monitoring.monitoring.overall_market_sentiment)}>
                            {monitoring.monitoring.overall_market_sentiment}
                        </Badge>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm">{monitoring.monitoring.summary}</p>
                    </div>

                    {/* Alerts */}
                    {monitoring.monitoring.alerts?.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-semibold">Active Alerts</h4>
                            {monitoring.monitoring.alerts.map((alert, idx) => {
                                const Icon = getAlertIcon(alert.type);
                                return (
                                    <Alert key={idx} className={`${getAlertColor(alert.severity)} border-l-4`}>
                                        <div className="flex items-start gap-3">
                                            <Icon className="w-5 h-5 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h5 className="font-semibold">{alert.title}</h5>
                                                    <Badge variant="outline">{alert.severity}</Badge>
                                                </div>
                                                <AlertDescription className="text-sm mb-2">
                                                    {alert.message}
                                                </AlertDescription>
                                                {alert.affected_holdings?.length > 0 && (
                                                    <div className="text-xs mb-2">
                                                        <span className="font-medium">Affects: </span>
                                                        {alert.affected_holdings.join(', ')}
                                                    </div>
                                                )}
                                                <div className="bg-white/50 p-2 rounded text-xs">
                                                    <p className="font-medium">Recommended Action:</p>
                                                    <p>{alert.recommended_action}</p>
                                                </div>
                                                {alert.time_sensitivity && (
                                                    <p className="text-xs mt-1 italic">⏱️ {alert.time_sensitivity}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Alert>
                                );
                            })}
                        </div>
                    )}

                    {/* Market Trends by Asset Type */}
                    {monitoring.monitoring.market_trends && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">Market Trends by Asset</h4>
                            <div className="space-y-2">
                                {Object.entries(monitoring.monitoring.market_trends).map(([asset, trend]) => (
                                    <div key={asset} className="bg-white p-2 rounded">
                                        <p className="text-xs font-medium capitalize">{asset}</p>
                                        <p className="text-xs text-gray-700">{trend}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Opportunities */}
                    {monitoring.monitoring.opportunities?.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-2">Current Opportunities</h4>
                            <ul className="space-y-1">
                                {monitoring.monitoring.opportunities.map((opp, idx) => (
                                    <li key={idx} className="text-sm text-green-800 flex items-start gap-1">
                                        <span>💡</span>
                                        <span>{opp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Risk Factors */}
                    {monitoring.monitoring.risk_factors?.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-900 mb-2">Active Risk Factors</h4>
                            <ul className="space-y-1">
                                {monitoring.monitoring.risk_factors.map((risk, idx) => (
                                    <li key={idx} className="text-sm text-red-800 flex items-start gap-1">
                                        <span>⚠️</span>
                                        <span>{risk}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Timing Recommendations */}
                    {monitoring.monitoring.timing_recommendations?.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-900 mb-2">Timing Recommendations</h4>
                            <ul className="space-y-1">
                                {monitoring.monitoring.timing_recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-sm text-purple-800 flex items-start gap-1">
                                        <span>📅</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}