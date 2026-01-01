import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, RefreshCw, Calendar, CheckCircle, Clock, XCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PaymentMethodManager from '../components/payments/PaymentMethodManager';
import PaymentApprovalsQueue from '../components/payments/PaymentApprovalsQueue';

export default function AutomatedPayments() {
    const queryClient = useQueryClient();
    const [scheduling, setScheduling] = useState(false);
    const [executing, setExecuting] = useState(false);

    const { data: scheduledPayments = [] } = useQuery({
        queryKey: ['scheduledPayments'],
        queryFn: () => base44.entities.ScheduledPayment.list('-scheduled_date')
    });

    const schedulePayments = async () => {
        setScheduling(true);
        try {
            const result = await base44.functions.invoke('scheduleAutomatedPayments', {});
            queryClient.invalidateQueries(['scheduledPayments']);
            queryClient.invalidateQueries(['pendingPayments']);
            toast.success(
                `Scheduled ${result.data.payments_scheduled} payments (${result.data.pending_approval} need approval)`
            );
        } catch (error) {
            toast.error('Failed to schedule payments');
        }
        setScheduling(false);
    };

    const executePayments = async () => {
        setExecuting(true);
        try {
            const result = await base44.functions.invoke('executeScheduledPayments', {});
            queryClient.invalidateQueries(['scheduledPayments']);
            queryClient.invalidateQueries(['bills']);
            toast.success(
                `Processed ${result.data.processed} payments: ${result.data.successful} successful, ${result.data.failed} failed`
            );
        } catch (error) {
            toast.error('Failed to execute payments');
        }
        setExecuting(false);
    };

    const approvedPayments = scheduledPayments.filter(p => p.status === 'approved');
    const completedPayments = scheduledPayments.filter(p => p.status === 'completed');
    const failedPayments = scheduledPayments.filter(p => p.status === 'failed');

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-purple-100 text-purple-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'approved': return <CheckCircle className="w-4 h-4 text-blue-600" />;
            case 'pending_approval': return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'processing': return <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-black">Automated Payments</h1>
                                <p className="text-[#0F1729]/60 font-light">AI-powered bill payment automation</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={schedulePayments}
                                disabled={scheduling}
                                variant="outline"
                                className="border-[#4A90E2]"
                            >
                                {scheduling ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        AI Schedule
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={executePayments}
                                disabled={executing || approvedPayments.length === 0}
                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {executing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Execute Payments ({approvedPayments.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Approved</p>
                                    <p className="text-3xl font-light text-blue-500">{approvedPayments.length}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Completed</p>
                                    <p className="text-3xl font-light text-green-500">{completedPayments.length}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Failed</p>
                                    <p className="text-3xl font-light text-red-500">{failedPayments.length}</p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Total Scheduled</p>
                                    <p className="text-3xl font-light text-[#4A90E2]">{scheduledPayments.length}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="approvals" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                        <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                    </TabsList>

                    <TabsContent value="approvals">
                        <PaymentApprovalsQueue />
                    </TabsContent>

                    <TabsContent value="scheduled" className="space-y-4">
                        {[...approvedPayments, ...completedPayments, ...failedPayments].length > 0 ? (
                            <div className="space-y-4">
                                {[...approvedPayments, ...completedPayments, ...failedPayments]
                                    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
                                    .map((payment) => (
                                        <Card key={payment.id} className="bg-white border-[#4A90E2]">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold text-black">{payment.bill_name}</h4>
                                                            <Badge className={getStatusColor(payment.status)}>
                                                                <span className="flex items-center gap-1">
                                                                    {getStatusIcon(payment.status)}
                                                                    {payment.status.replace('_', ' ')}
                                                                </span>
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-1 text-sm text-[#0F1729]/70">
                                                            <p className="text-lg font-semibold text-[#4A90E2]">
                                                                ${payment.amount.toLocaleString()}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>
                                                                    Scheduled: {format(new Date(payment.scheduled_date), 'MMM d, yyyy')}
                                                                </span>
                                                            </div>
                                                            {payment.executed_date && (
                                                                <div className="text-xs text-green-500">
                                                                    Executed: {format(new Date(payment.executed_date), 'MMM d, yyyy h:mm a')}
                                                                </div>
                                                            )}
                                                            {payment.confirmation_number && (
                                                                <div className="text-xs">
                                                                    Confirmation: {payment.confirmation_number}
                                                                </div>
                                                            )}
                                                            {payment.failure_reason && (
                                                                <div className="text-xs text-red-500">
                                                                    Reason: {payment.failure_reason}
                                                                </div>
                                                            )}
                                                            {payment.approved_by && (
                                                                <div className="text-xs">
                                                                    Approved by: {payment.approved_by}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        ) : (
                            <Card className="bg-white border-[#4A90E2]">
                                <CardContent className="py-12 text-center">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-[#4A90E2]" />
                                    <p className="text-[#0F1729]/60 mb-4">No scheduled payments</p>
                                    <Button 
                                        onClick={schedulePayments}
                                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    >
                                        Schedule Payments with AI
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="methods">
                        <PaymentMethodManager />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}