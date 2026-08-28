import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, AlertTriangle, Info, AlertCircle, X, TrendingDown, DollarSign, Target, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FinancialHealthAlerts() {
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState([]);

    const { data: healthData, isLoading } = useQuery({
        queryKey: ['financialHealthAlerts'],
        queryFn: async () => {
            const result = await base44.functions.invoke('monitorFinancialHealth', {});
            return result.data;
        },
        refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
    });

    const getAlertIcon = (type) => {
        switch (type) {
            case 'budget_exceeded':
            case 'overdue_bills': return AlertCircle;
            case 'budget_warning': return AlertTriangle;
            case 'investment_decline': return TrendingDown;
            case 'subscription_change': return DollarSign;
            case 'goal_behind_schedule': return Target;
            case 'concentration_risk': return Shield;
            default: return Info;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-50 border-red-500 text-red-900';
            case 'medium': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
            case 'low': return 'bg-blue-50 border-blue-500 text-blue-900';
            default: return 'bg-gray-50 border-gray-500 text-gray-900';
        }
    };

    const getActionPage = (alertType) => {
        const pageMap = {
            'budget_exceeded': 'Budget',
            'budget_warning': 'Budget',
            'investment_decline': 'Investments',
            'concentration_risk': 'Investments',
            'subscription_change': 'Subscriptions',
            'high_subscription_cost': 'Subscriptions',
            'goal_behind_schedule': 'Budget',
            'overdue_bills': 'BillPayments'
        };
        return pageMap[alertType] || 'Dashboard';
    };

    const handleDismiss = (index) => {
        setDismissed([...dismissed, index]);
    };

    if (isLoading) return null;

    const alerts = healthData?.alerts?.filter((_, idx) => !dismissed.includes(idx)) || [];
    
    if (alerts.length === 0) return null;

    const priorityIndices = healthData?.ai_summary?.priority_alert_indices || [];
    const topAlerts = priorityIndices.map(idx => alerts[idx]).filter(Boolean);

    return (
        <div className="space-y-4">
            {/* AI Summary Card */}
            {healthData?.ai_summary && (
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-purple-600" />
                                Financial Health Check
                            </span>
                            <Badge className={
                                healthData.ai_summary.health_score >= 80 ? 'bg-green-100 text-green-800' :
                                healthData.ai_summary.health_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }>
                                Score: {healthData.ai_summary.health_score}/100
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-black/80">{healthData.ai_summary.health_message}</p>
                        <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <p className="text-sm font-semibold text-purple-900 mb-1">Key Action Today:</p>
                            <p className="text-sm text-purple-800">{healthData.ai_summary.key_action}</p>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <Badge variant="outline" className="border-red-500 text-red-700">
                                {healthData.high_severity} High Priority
                            </Badge>
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                {healthData.medium_severity} Medium Priority
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Priority Alerts */}
            {topAlerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-black/70">Priority Alerts</h3>
                    {topAlerts.map((alert, idx) => {
                        const Icon = getAlertIcon(alert.type);
                        return (
                            <Alert key={idx} className={`${getSeverityColor(alert.severity)} border-l-4`}>
                                <div className="flex items-start gap-3">
                                    <Icon className="w-5 h-5 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-semibold">{alert.title}</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleDismiss(alerts.indexOf(alert))}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <AlertDescription className="text-sm mb-2">
                                            {alert.message}
                                        </AlertDescription>
                                        <div className="bg-white/50 p-2 rounded text-xs mb-2">
                                            <p className="font-medium">💡 {alert.actionable_advice}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(createPageUrl(getActionPage(alert.type)))}
                                            className="text-xs"
                                        >
                                            Take Action
                                        </Button>
                                    </div>
                                </div>
                            </Alert>
                        );
                    })}
                </div>
            )}

            {/* Other Alerts */}
            {alerts.length > topAlerts.length && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-black/70">Other Alerts</h3>
                    {alerts.filter(a => !topAlerts.includes(a)).map((alert, idx) => {
                        const Icon = getAlertIcon(alert.type);
                        return (
                            <Alert key={idx} className={`${getSeverityColor(alert.severity)} border-l-4`}>
                                <div className="flex items-start gap-3">
                                    <Icon className="w-4 h-4 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-medium text-sm">{alert.title}</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5"
                                                onClick={() => handleDismiss(alerts.indexOf(alert))}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <AlertDescription className="text-xs mb-1">
                                            {alert.message}
                                        </AlertDescription>
                                        <p className="text-xs opacity-80">{alert.actionable_advice}</p>
                                    </div>
                                </div>
                            </Alert>
                        );
                    })}
                </div>
            )}
        </div>
    );
}