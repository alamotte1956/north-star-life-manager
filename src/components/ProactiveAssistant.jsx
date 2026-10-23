import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Bell, X, AlertTriangle, Info, AlertCircle, 
    TrendingUp, Zap, ChevronRight, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getProactiveAlerts');
            setAlerts(result.data);
        } catch (error) {
            logger.error('Failed to fetch alerts:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAlerts();
        // Refresh alerts every 5 minutes
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const highPriorityCount = alerts?.summary?.high_priority_alerts || 0;

    const getAlertIcon = (type) => {
        switch (type) {
            case 'critical': return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'info': return <Info className="w-5 h-5 text-blue-600" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'critical': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            case 'info': return 'bg-blue-50 border-blue-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const handleAction = (action) => {
        const pageMap = {
            'View Bills': 'BillPayments',
            'View Investments': 'Investments',
            'View Subscriptions': 'Subscriptions',
            'View Tasks': 'Maintenance',
            'Contact Pharmacy': 'Health',
            'Setup Automation': 'Automations',
            'Setup Auto-Pay': 'BillPayments'
        };
        
        const page = pageMap[action];
        if (page) {
            navigate(createPageUrl(page));
            setIsOpen(false);
        }
    };

    if (!alerts && !loading) return null;

    return (
        <>
            {/* Floating Alert Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-6 z-40 bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-110 touch-manipulation"
                aria-label="View Alerts"
            >
                <Bell className="w-6 h-6" />
                {highPriorityCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {highPriorityCount}
                    </span>
                )}
            </button>

            {/* Alerts Panel */}
            {isOpen && (
                <div className="fixed bottom-40 right-6 z-40 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#D4AF37]/20">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-black to-[#1a1a1a] text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                            <div>
                                <h3 className="font-light text-black">Proactive Assistant</h3>
                                <p className="text-xs text-black/70">
                                    {alerts?.summary?.total_alerts || 0} alerts · {alerts?.suggestions?.length || 0} suggestions
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* AI Insight */}
                        {alerts?.ai_insight && (
                            <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-[#D4AF37]/30">
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                                        <p className="text-sm font-medium text-black">Today's Insight</p>
                                    </div>
                                    <p className="text-sm text-black/80 mb-3">{alerts.ai_insight.daily_insight}</p>
                                    <div className="flex items-start gap-2">
                                        <TrendingUp className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                                        <p className="text-sm text-black/80">{alerts.ai_insight.key_recommendation}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* High Priority Alerts */}
                        {alerts?.alerts?.filter(a => a.priority === 'high').length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-black mb-2">Urgent</h4>
                                <div className="space-y-2">
                                    {alerts.alerts.filter(a => a.priority === 'high').map((alert, idx) => (
                                        <Card key={idx} className={`${getAlertColor(alert.type)} border`}>
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-start gap-2 mb-1">
                                                    {getAlertIcon(alert.type)}
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-black">{alert.title}</p>
                                                        <p className="text-xs text-black/70 mt-1">{alert.message}</p>
                                                    </div>
                                                </div>
                                                {alert.action && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleAction(alert.action)}
                                                        className="w-full mt-2 text-xs"
                                                    >
                                                        {alert.action}
                                                        <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Alerts */}
                        {alerts?.alerts?.filter(a => a.priority !== 'high').length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-black mb-2">Notifications</h4>
                                <div className="space-y-2">
                                    {alerts.alerts.filter(a => a.priority !== 'high').slice(0, 5).map((alert, idx) => (
                                        <Card key={idx} className={`${getAlertColor(alert.type)} border`}>
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-start gap-2">
                                                    {getAlertIcon(alert.type)}
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-black">{alert.title}</p>
                                                        <p className="text-xs text-black/70 mt-1">{alert.message}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestions */}
                        {alerts?.suggestions?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-black mb-2">Suggestions</h4>
                                <div className="space-y-2">
                                    {alerts.suggestions.map((suggestion, idx) => (
                                        <Card key={idx} className="bg-green-50 border-green-200">
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-start gap-2">
                                                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-black">{suggestion.title}</p>
                                                        <p className="text-xs text-black/70 mt-1">{suggestion.message}</p>
                                                    </div>
                                                </div>
                                                {suggestion.action && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleAction(suggestion.action)}
                                                        className="w-full mt-2 text-xs"
                                                    >
                                                        {suggestion.action}
                                                        <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Automation Opportunities */}
                        {alerts?.automation_opportunities?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-black mb-2">Automation</h4>
                                <div className="space-y-2">
                                    {alerts.automation_opportunities.map((opp, idx) => (
                                        <Card key={idx} className="bg-purple-50 border-purple-200">
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-start gap-2">
                                                    <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-black">{opp.title}</p>
                                                        <p className="text-xs text-black/70 mt-1">{opp.message}</p>
                                                    </div>
                                                </div>
                                                {opp.action && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleAction(opp.action)}
                                                        className="w-full mt-2 text-xs"
                                                    >
                                                        {opp.action}
                                                        <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <Button
                            onClick={fetchAlerts}
                            disabled={loading}
                            variant="ghost"
                            className="w-full text-xs"
                        >
                            {loading ? 'Refreshing...' : 'Refresh Alerts'}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}