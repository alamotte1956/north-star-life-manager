import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Home, FileText, Wrench, DollarSign, MessageSquare, 
    Calendar, AlertCircle, CheckCircle, Bell, Settings 
} from 'lucide-react';
import { format } from 'date-fns';
import TenantLeaseView from '@/components/tenant/TenantLeaseView';
import TenantMaintenanceRequest from '@/components/tenant/TenantMaintenanceRequest';
import TenantRentPayment from '@/components/tenant/TenantRentPayment';
import TenantChatbot from '@/components/tenant/TenantChatbot';
import TenantNotifications from '@/components/tenant/TenantNotifications';
import TenantSettings from '@/components/tenant/TenantSettings';

export default function TenantPortal() {
    const [user, setUser] = useState(null);
    const [tenantProperty, setTenantProperty] = useState(null);

    useEffect(() => {
        base44.auth.me().then(userData => {
            setUser(userData);
        });
    }, []);

    const { data: properties = [] } = useQuery({
        queryKey: ['tenantProperties'],
        queryFn: async () => {
            const props = await base44.entities.Property.list();
            return props.filter(p => p.tenant_email === user?.email);
        },
        enabled: !!user
    });

    const { data: maintenanceTasks = [] } = useQuery({
        queryKey: ['tenantMaintenance'],
        queryFn: () => base44.entities.MaintenanceTask.list(),
        enabled: !!tenantProperty
    });

    const { data: rentPayments = [] } = useQuery({
        queryKey: ['tenantPayments'],
        queryFn: async () => {
            if (!tenantProperty) return [];
            return await base44.entities.RentPayment.filter({ 
                property_id: tenantProperty.id 
            });
        },
        enabled: !!tenantProperty
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['tenantNotifications', user?.email],
        queryFn: () => base44.entities.TenantNotification.filter({ tenant_email: user.email }),
        enabled: !!user,
        refetchInterval: 30000
    });

    useEffect(() => {
        if (properties.length > 0) {
            setTenantProperty(properties[0]);
        }
    }, [properties]);

    const pendingTasks = maintenanceTasks.filter(t => 
        t.property_name === tenantProperty?.name && t.status !== 'completed'
    );

    const upcomingPayment = rentPayments
        .filter(p => p.status === 'pending')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

    const unreadNotifications = notifications.filter(n => !n.read).length;

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059] mx-auto mb-4"></div>
                    <p className="text-[#1A2B44]/60">Loading...</p>
                </div>
            </div>
        );
    }

    if (!tenantProperty) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <Card className="text-center p-8">
                        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-2">No Property Found</h2>
                        <p className="text-[#1A2B44]/60">
                            You don't have any properties associated with your account. 
                            Please contact your property manager.
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] pb-safe">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-[#C5A059] to-[#D4AF37] p-3 rounded-2xl">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-light text-[#1A2B44]">Tenant Portal</h1>
                            <p className="text-sm text-[#1A2B44]/60">Welcome back, {user.full_name?.split(' ')[0]}</p>
                        </div>
                    </div>

                    {/* Property Info Card */}
                    <Card className="border-2 border-[#C5A059]/30">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-[#1A2B44]">{tenantProperty.name}</h3>
                                    {tenantProperty.address && (
                                        <p className="text-sm text-[#1A2B44]/60 mt-1">{tenantProperty.address}</p>
                                    )}
                                    {tenantProperty.lease_end_date && (
                                        <div className="flex items-center gap-2 mt-3 text-sm">
                                            <Calendar className="w-4 h-4 text-[#C5A059]" />
                                            <span className="text-[#1A2B44]/70">
                                                Lease ends: {format(new Date(tenantProperty.lease_end_date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Badge className="bg-green-100 text-green-700">Active Lease</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <Wrench className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-light text-[#1A2B44]">{pendingTasks.length}</div>
                                    <div className="text-xs text-[#1A2B44]/60">Pending Tasks</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-light text-[#1A2B44]">
                                        {upcomingPayment ? `$${upcomingPayment.amount}` : '$0'}
                                    </div>
                                    <div className="text-xs text-[#1A2B44]/60">Next Payment</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="lease" className="space-y-4">
                    <TabsList className="grid grid-cols-3 w-full h-auto p-1">
                        <TabsTrigger value="lease" className="flex-col gap-1 h-16">
                            <FileText className="w-5 h-5" />
                            <span className="text-xs">Lease</span>
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="flex-col gap-1 h-16">
                            <Wrench className="w-5 h-5" />
                            <span className="text-xs">Requests</span>
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex-col gap-1 h-16">
                            <DollarSign className="w-5 h-5" />
                            <span className="text-xs">Pay Rent</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-3 gap-2">
                        <TabsTrigger value="notifications" className="flex-col gap-1 h-16 relative" asChild>
                            <Button variant="outline" className="w-full">
                                <Bell className="w-5 h-5" />
                                <span className="text-xs">Alerts</span>
                                {unreadNotifications > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadNotifications}
                                    </span>
                                )}
                            </Button>
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex-col gap-1 h-16" asChild>
                            <Button variant="outline" className="w-full">
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-xs">Chat</span>
                            </Button>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex-col gap-1 h-16" asChild>
                            <Button variant="outline" className="w-full">
                                <Settings className="w-5 h-5" />
                                <span className="text-xs">Settings</span>
                            </Button>
                        </TabsTrigger>
                    </div>

                    <TabsContent value="lease">
                        <TenantLeaseView property={tenantProperty} />
                    </TabsContent>

                    <TabsContent value="maintenance">
                        <TenantMaintenanceRequest 
                            property={tenantProperty} 
                            existingTasks={pendingTasks}
                        />
                    </TabsContent>

                    <TabsContent value="payment">
                        <TenantRentPayment 
                            property={tenantProperty}
                            upcomingPayment={upcomingPayment}
                        />
                    </TabsContent>

                    <TabsContent value="notifications">
                        <TenantNotifications tenantEmail={user.email} />
                    </TabsContent>

                    <TabsContent value="chat">
                        <TenantChatbot property={tenantProperty} />
                    </TabsContent>

                    <TabsContent value="settings">
                        <TenantSettings tenantEmail={user.email} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}