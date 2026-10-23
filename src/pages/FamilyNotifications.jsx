import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Trash2, Folder, FileText, UserPlus, CheckCheck, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FamilyNotifications() {
    const [filter, setFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: userRecord } = useQuery({
        queryKey: ['userRecord'],
        queryFn: () => base44.entities.User.filter({ email: user?.email }),
        enabled: !!user
    });

    const family_id = userRecord?.[0]?.family_id;

    const { data: notifications = [] } = useQuery({
        queryKey: ['familyNotifications', family_id],
        queryFn: async () => {
            const allNotifs = await base44.entities.FamilyNotification.filter({ family_id });
            return allNotifs.filter(n => !n.recipient_email || n.recipient_email === user.email);
        },
        enabled: !!family_id && !!user,
        refetchInterval: 10000
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => base44.entities.FamilyNotification.update(id, { read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['familyNotifications'] });
        }
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: (id) => base44.entities.FamilyNotification.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['familyNotifications'] });
            toast.success('Notification deleted');
        }
    });

    const markAllAsRead = async () => {
        const unreadNotifs = notifications.filter(n => !n.read);
        await Promise.all(unreadNotifs.map(n => markAsReadMutation.mutateAsync(n.id)));
        toast.success('All notifications marked as read');
    };

    const getIcon = (type) => {
        const icons = {
            document_uploaded: FileText,
            document_shared: FileText,
            task_assigned: UserPlus,
            task_completed: CheckCircle,
            folder_created: Folder,
            member_joined: UserPlus,
            document_expiring: Bell,
            comment_added: MessageSquare,
            document_updated: FileText
        };
        const Icon = icons[type] || Bell;
        return <Icon className="w-5 h-5" />;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800 border-blue-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            urgent: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[priority] || colors.medium;
    };

    const filteredNotifications = notifications
        .filter(n => filter === 'all' || (filter === 'unread' && !n.read))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl shadow-lg">
                                <Bell className="w-8 h-8 text-[#C5A059]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Family Notifications
                            </h1>
                            <p className="text-[#64748B] font-light">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Tabs value={filter} onValueChange={setFilter} className="flex-1">
                            <TabsList className="bg-white border border-[#0F172A]/10 p-1 rounded-lg shadow-sm">
                                <TabsTrigger 
                                    value="all"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C5A059] data-[state=active]:to-[#D4AF37] data-[state=active]:text-[#0F172A] rounded-lg"
                                >
                                    All
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="unread"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#C5A059] data-[state=active]:to-[#D4AF37] data-[state=active]:text-[#0F172A] rounded-lg"
                                >
                                    Unread ({unreadCount})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {unreadCount > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                variant="outline"
                                className="border-[#0F172A]/20 rounded-lg min-h-[44px]"
                            >
                                <CheckCheck className="w-4 h-4 mr-2" />
                                Mark All Read
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <Card className="border-[#0F172A]/10 shadow-sm">
                            <CardContent className="py-16 text-center">
                                <Bell className="w-16 h-16 mx-auto mb-4 text-[#64748B]/30" />
                                <p className="text-[#64748B] font-light">
                                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <Card 
                                key={notification.id}
                                className={`border transition-all hover:shadow-md ${
                                    notification.read 
                                        ? 'border-[#0F172A]/10 bg-white' 
                                        : 'border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/5 to-white'
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 p-2 rounded-lg ${notification.read ? 'bg-[#F8F9FA]' : 'bg-[#C5A059]/20'}`}>
                                            {getIcon(notification.notification_type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-[#0F172A] mb-1">
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-sm text-[#64748B]">
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                <Badge className={`${getPriorityColor(notification.priority)} border`}>
                                                    {notification.priority}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-xs text-[#64748B]">
                                                    {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                                                </span>

                                                {notification.triggered_by_email && (
                                                    <span className="text-xs text-[#64748B]">
                                                        by {notification.triggered_by_email}
                                                    </span>
                                                )}

                                                <div className="ml-auto flex gap-2">
                                                    {!notification.read && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => markAsReadMutation.mutate(notification.id)}
                                                            className="text-xs min-h-[36px]"
                                                        >
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Mark Read
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                                        className="text-xs text-red-600 hover:text-red-700 min-h-[36px]"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}