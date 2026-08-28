import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RecurringItemsDetector({ open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});

    const { data: detectionResult, isLoading, refetch } = useQuery({
        queryKey: ['detectRecurring'],
        queryFn: async () => {
            const result = await base44.functions.invoke('detectRecurringBills', {});
            return result.data;
        },
        enabled: open
    });

    const confirmItemMutation = useMutation({
        mutationFn: async (item) => {
            if (item.type === 'bill') {
                await base44.entities.BillPayment.create({
                    bill_name: item.merchant,
                    amount: item.average_amount,
                    due_date: item.next_expected_date,
                    category: item.category,
                    is_recurring: true,
                    frequency: 'monthly',
                    auto_pay_enabled: false,
                    status: 'pending'
                });
            } else {
                await base44.entities.Subscription.create({
                    name: item.merchant,
                    monthly_cost: item.average_amount,
                    billing_cycle: item.next_expected_date,
                    category: item.category,
                    status: 'active',
                    auto_renew: true
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['detectRecurring']);
            queryClient.invalidateQueries(['bills']);
            queryClient.invalidateQueries(['subscriptions']);
            toast.success('Recurring item added');
            refetch();
        }
    });

    const dismissItemMutation = useMutation({
        mutationFn: async (item) => {
            // Store dismissal to prevent re-detection
            // In a real app, you'd want to persist this
            return Promise.resolve();
        },
        onSuccess: () => {
            toast.success('Item dismissed');
            refetch();
        }
    });

    const handleEdit = (item) => {
        setEditingItem(item);
        setEditForm({
            merchant: item.merchant,
            amount: item.average_amount,
            category: item.category,
            type: item.type
        });
    };

    const handleConfirmEdited = () => {
        confirmItemMutation.mutate({
            ...editingItem,
            merchant: editForm.merchant,
            average_amount: parseFloat(editForm.amount),
            category: editForm.category,
            type: editForm.type
        });
        setEditingItem(null);
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                            Analyzing Transactions...
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-12 text-center">
                        <p className="text-gray-500">AI is detecting recurring patterns...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const detected = detectionResult?.detected_recurring || [];
    const anomalies = detectionResult?.anomalies || [];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            AI Detected Recurring Items ({detected.length})
                        </DialogTitle>
                    </DialogHeader>

                    {anomalies.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Unusual Changes Detected
                            </h3>
                            <div className="space-y-3">
                                {anomalies.map((anomaly, idx) => (
                                    <Card key={idx} className="bg-red-50 border-red-200">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-black mb-1">{anomaly.name}</p>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Expected: ${anomaly.expected_amount.toFixed(2)} → 
                                                        Actual: ${anomaly.actual_amount.toFixed(2)}
                                                    </p>
                                                    <Badge className={
                                                        anomaly.severity === 'high' ? 'bg-red-600' : 'bg-orange-600'
                                                    }>
                                                        {anomaly.variance_percent}% {parseFloat(anomaly.variance_percent) > 0 ? 'increase' : 'decrease'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {detected.map((item, idx) => (
                            <Card key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50">
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-lg text-black">{item.merchant}</h4>
                                                <Badge className="bg-purple-100 text-purple-800">
                                                    {item.type}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {(item.confidence * 100).toFixed(0)}% confident
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">{item.reasoning}</p>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-green-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Average Amount</p>
                                                        <p className="font-semibold text-black">${item.average_amount.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Frequency</p>
                                                        <p className="font-semibold text-black">Every {item.frequency_days} days</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Variance</p>
                                                        <p className="font-semibold text-black">${item.amount_variance.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-orange-600" />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Next Expected</p>
                                                        <p className="font-semibold text-black">{format(new Date(item.next_expected_date), 'MMM d')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {!item.variance_normal && (
                                                <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-3">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Amount varies significantly - review recommended
                                                </div>
                                            )}

                                            <div className="text-xs text-gray-500">
                                                <p>Category: {item.category} • Found {item.transaction_count} transactions</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => confirmItemMutation.mutate(item)}
                                            disabled={confirmItemMutation.isPending}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Confirm
                                        </Button>
                                        <Button
                                            onClick={() => handleEdit(item)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Edit Details
                                        </Button>
                                        <Button
                                            onClick={() => dismissItemMutation.mutate(item)}
                                            variant="outline"
                                            className="border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Dismiss
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {detected.length === 0 && (
                            <div className="text-center py-12">
                                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">No recurring patterns detected yet</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Keep adding transactions and check back later
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Recurring Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Merchant/Provider Name</Label>
                            <Input
                                value={editForm.merchant || ''}
                                onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={editForm.amount || ''}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Input
                                value={editForm.category || ''}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Type</Label>
                            <Select
                                value={editForm.type}
                                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bill">Bill</SelectItem>
                                    <SelectItem value="subscription">Subscription</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleConfirmEdited}
                            disabled={confirmItemMutation.isPending}
                            className="w-full bg-[#C5A059]"
                        >
                            Save & Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}