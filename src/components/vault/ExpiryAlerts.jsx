import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { base44 } from '@/api/base44Client';
import logger from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import logger from '@/utils/logger';
import { Button } from '@/components/ui/button';
import logger from '@/utils/logger';
import { AlertTriangle, AlertCircle, Info, XCircle, Calendar, FileText, RefreshCw } from 'lucide-react';
import logger from '@/utils/logger';
import { format } from 'date-fns';
import logger from '@/utils/logger';

export default function ExpiryAlerts() {
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = async () => {
        try {
            setRefreshing(true);
            const result = await base44.functions.invoke('checkDocumentExpiry', {});
            setAlerts(result.data);
        } catch (error) {
            logger.error('Failed to fetch expiry alerts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Refresh every 30 minutes
        const interval = setInterval(fetchAlerts, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const urgencyConfig = {
        expired: {
            icon: XCircle,
            color: 'bg-red-100 text-red-700 border-red-200',
            badgeColor: 'bg-red-600 text-white',
            label: 'Expired'
        },
        critical: {
            icon: AlertTriangle,
            color: 'bg-orange-100 text-orange-700 border-orange-200',
            badgeColor: 'bg-orange-600 text-white',
            label: 'Critical'
        },
        warning: {
            icon: AlertCircle,
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            badgeColor: 'bg-yellow-600 text-white',
            label: 'Warning'
        },
        info: {
            icon: Info,
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            badgeColor: 'bg-blue-600 text-white',
            label: 'Info'
        }
    };

    if (loading) return null;
    if (!alerts?.expiring_documents?.length) return null;

    const { summary, expiring_documents } = alerts;
    const hasUrgent = summary.expired + summary.critical > 0;

    return (
        <Card className={`border-2 ${hasUrgent ? 'border-red-300 bg-red-50/50' : 'border-yellow-300 bg-yellow-50/50'}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${hasUrgent ? 'text-red-600' : 'text-yellow-600'}`} />
                        Document Expiry Alerts
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchAlerts}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    {summary.expired > 0 && (
                        <Badge className={urgencyConfig.expired.badgeColor}>
                            {summary.expired} Expired
                        </Badge>
                    )}
                    {summary.critical > 0 && (
                        <Badge className={urgencyConfig.critical.badgeColor}>
                            {summary.critical} Critical (≤7 days)
                        </Badge>
                    )}
                    {summary.warning > 0 && (
                        <Badge className={urgencyConfig.warning.badgeColor}>
                            {summary.warning} Warning (≤30 days)
                        </Badge>
                    )}
                    {summary.info > 0 && (
                        <Badge className={urgencyConfig.info.badgeColor}>
                            {summary.info} Upcoming (≤60 days)
                        </Badge>
                    )}
                </div>

                {/* Expiring Documents List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {expiring_documents.slice(0, 10).map(doc => {
                        const config = urgencyConfig[doc.urgency];
                        const Icon = config.icon;
                        
                        return (
                            <div
                                key={doc.id}
                                className={`p-3 rounded-lg border ${config.color}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{doc.title}</div>
                                                <div className="text-sm opacity-80 flex items-center gap-2 mt-1">
                                                    <FileText className="w-3 h-3" />
                                                    {doc.document_type}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="whitespace-nowrap text-xs">
                                                {config.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-sm">
                                            <Calendar className="w-3 h-3" />
                                            <span className="font-medium">{doc.message}</span>
                                            <span className="opacity-70">
                                                (Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')})
                                            </span>
                                        </div>
                                        {doc.linked_entity_name && (
                                            <div className="text-xs opacity-70 mt-1">
                                                Related to: {doc.linked_entity_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {expiring_documents.length > 10 && (
                    <div className="text-sm text-center mt-3 text-gray-600">
                        + {expiring_documents.length - 10} more documents expiring soon
                    </div>
                )}
            </CardContent>
        </Card>
    );
}