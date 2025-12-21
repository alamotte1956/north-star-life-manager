import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, CheckCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function LeaseAlerts({ properties }) {
    const today = new Date();
    const alerts = [];

    properties.forEach(property => {
        if (!property.lease_end_date) return;

        const endDate = new Date(property.lease_end_date);
        const daysUntilExpiry = differenceInDays(endDate, today);

        if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
            const urgency = daysUntilExpiry <= 30 ? 'critical' : daysUntilExpiry <= 60 ? 'warning' : 'info';
            
            alerts.push({
                property: property.name,
                tenant: property.tenant_name,
                end_date: property.lease_end_date,
                days_remaining: daysUntilExpiry,
                urgency,
                monthly_rent: property.monthly_rent
            });
        } else if (daysUntilExpiry < 0) {
            alerts.push({
                property: property.name,
                tenant: property.tenant_name,
                end_date: property.lease_end_date,
                days_remaining: daysUntilExpiry,
                urgency: 'expired',
                monthly_rent: property.monthly_rent
            });
        }
    });

    // Sort by urgency
    alerts.sort((a, b) => {
        const order = { expired: 0, critical: 1, warning: 2, info: 3 };
        return order[a.urgency] - order[b.urgency];
    });

    const urgencyConfig = {
        expired: {
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-700 border-red-200',
            label: 'EXPIRED'
        },
        critical: {
            icon: AlertTriangle,
            color: 'bg-orange-100 text-orange-700 border-orange-200',
            label: 'URGENT'
        },
        warning: {
            icon: Clock,
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            label: 'WARNING'
        },
        info: {
            icon: Calendar,
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            label: 'UPCOMING'
        }
    };

    if (alerts.length === 0) {
        return (
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <p className="text-green-900 font-medium">All Leases Current</p>
                    <p className="text-sm text-green-700 mt-1">No upcoming expirations in the next 90 days</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`border-2 ${alerts[0].urgency === 'expired' || alerts[0].urgency === 'critical' ? 'border-red-300 bg-red-50/50' : 'border-yellow-300 bg-yellow-50/50'}`}>
            <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Lease Renewal Alerts
                    <Badge className="ml-2">{alerts.length} properties</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {alerts.map((alert, idx) => {
                    const config = urgencyConfig[alert.urgency];
                    const Icon = config.icon;

                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-lg border ${config.color}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{alert.property}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {config.label}
                                            </Badge>
                                        </div>
                                        {alert.tenant && (
                                            <div className="text-sm opacity-80">Tenant: {alert.tenant}</div>
                                        )}
                                        <div className="text-sm mt-2">
                                            <strong>
                                                {alert.urgency === 'expired' 
                                                    ? `Expired ${Math.abs(alert.days_remaining)} days ago`
                                                    : `${alert.days_remaining} days remaining`
                                                }
                                            </strong>
                                            <div className="opacity-80 mt-1">
                                                Expires: {format(new Date(alert.end_date), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                        {alert.monthly_rent && (
                                            <div className="text-sm mt-2 opacity-80">
                                                Current rent: ${alert.monthly_rent.toLocaleString()}/mo
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}