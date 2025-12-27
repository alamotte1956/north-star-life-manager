import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, AlertCircle, Info, DollarSign, Wrench, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TenantNotifications({ tenantEmail }) {
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['tenantNotifications', tenantEmail],
        queryFn: () => base44.entities.TenantNotification.filter({ tenant_email: tenantEmail }, '-created_date'),
        refetchInterval: 30000 // Poll every 30 seconds
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) => 
            base44.entities.TenantNotification.update(notificationId, { read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantNotifications'] });
        }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'rent_due':
            case 'rent_overdue':
            case 'payment_received':
                return DollarSign;
            case 'maintenance_update':
            case 'maintenance_completed':
                return Wrench;
            case 'lease_expiring':
                return Calendar;
            case 'document_uploaded':
                return FileText;
            default:
                return Info;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-300 bg-red-50';
            case 'high':
                return 'border-orange-300 bg-orange-50';
            case 'medium':
                return 'border-blue-300 bg-blue-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    const handleMarkAsRead = (notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-[#C5A059]" />
                            Notifications
                        </div>
                        {unreadCount > 0 && (
                            <Badge className="bg-red-600 text-white">{unreadCount} new</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {notifications.map(notification => {
                                const Icon = getIcon(notification.notification_type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg border-2 transition-all ${
                                            notification.read 
                                                ? 'border-gray-200 bg-white opacity-60' 
                                                : getPriorityColor(notification.priority)
                                        }`}
                                        onClick={() => handleMarkAsRead(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                notification.priority === 'urgent' ? 'bg-red-100' :
                                                notification.priority === 'high' ? 'bg-orange-100' :
                                                'bg-blue-100'
                                            }`}>
                                                <Icon className={`w-5 h-5 ${
                                                    notification.priority === 'urgent' ? 'text-red-600' :
                                                    notification.priority === 'high' ? 'text-orange-600' :
                                                    'text-blue-600'
                                                }`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h4 className="font-medium text-sm">{notification.title}</h4>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-1.5"></div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                                                    </span>
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsReadMutation.mutate(notification.id);
                                                            }}
                                                            className="h-7 text-xs"
                                                        >
                                                            <Check className="w-3 h-3 mr-1" />
                                                            Mark read
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}