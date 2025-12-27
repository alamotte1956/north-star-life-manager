import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PaymentApprovalsQueue() {
    const queryClient = useQueryClient();

    const { data: pendingPayments = [] } = useQuery({
        queryKey: ['pendingPayments'],
        queryFn: async () => {
            const payments = await base44.entities.ScheduledPayment.filter({ 
                status: 'pending_approval' 
            });
            return payments.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
        }
    });

    const approveMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('approvePayment', data),
        onSuccess: (result) => {
            queryClient.invalidateQueries(['pendingPayments']);
            queryClient.invalidateQueries(['scheduledPayments']);
            toast.success(result.data.message);
        },
        onError: (error) => {
            toast.error('Failed to process approval');
        }
    });

    if (pendingPayments.length === 0) {
        return (
            <Card className="bg-[#1a1a1a] border-[#C5A059]">
                <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-[#B8935E]">No payments pending approval</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#C5A059] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Pending Approvals ({pendingPayments.length})
            </h3>

            {pendingPayments.map((payment) => {
                const daysUntilScheduled = Math.ceil(
                    (new Date(payment.scheduled_date) - new Date()) / (1000 * 60 * 60 * 24)
                );

                return (
                    <Card key={payment.id} className="bg-[#1a1a1a] border-yellow-500/50">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-[#C5A059]">{payment.bill_name}</h4>
                                        {payment.auto_scheduled && (
                                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                AI Scheduled
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm text-[#B8935E]">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="font-medium text-[#C5A059]">
                                                ${payment.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                Scheduled: {format(new Date(payment.scheduled_date), 'MMM d, yyyy')}
                                                <span className="text-yellow-500 ml-2">
                                                    ({daysUntilScheduled} days)
                                                </span>
                                            </span>
                                        </div>
                                        <div className="text-xs">
                                            Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}
                                        </div>
                                        {payment.ai_confidence && (
                                            <div className="text-xs">
                                                AI Confidence: {(payment.ai_confidence * 100).toFixed(0)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => approveMutation.mutate({ 
                                        scheduled_payment_id: payment.id, 
                                        action: 'approve' 
                                    })}
                                    disabled={approveMutation.isPending}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => approveMutation.mutate({ 
                                        scheduled_payment_id: payment.id, 
                                        action: 'reject' 
                                    })}
                                    disabled={approveMutation.isPending}
                                    variant="outline"
                                    className="flex-1 text-red-500 border-red-500 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}