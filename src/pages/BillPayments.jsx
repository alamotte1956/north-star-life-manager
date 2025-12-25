import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CreditCard, Plus, Calendar, DollarSign, Zap, CheckCircle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

const categoryLabels = {
    utilities: 'Utilities',
    subscription: 'Subscription',
    insurance: 'Insurance',
    rent_mortgage: 'Rent/Mortgage',
    credit_card: 'Credit Card',
    loan: 'Loan',
    phone_internet: 'Phone/Internet',
    other: 'Other'
};

export default function BillPayments() {
    const [billOpen, setBillOpen] = useState(false);
    const [detectingBills, setDetectingBills] = useState(false);
    const [suggestedBills, setSuggestedBills] = useState([]);
    const [billForm, setBillForm] = useState({
        bill_name: '',
        merchant: '',
        category: 'utilities',
        amount: '',
        frequency: 'monthly',
        due_day: '',
        next_payment_date: '',
        auto_pay_enabled: false,
        payment_method: '',
        notification_days_before: 3,
        notes: ''
    });

    const queryClient = useQueryClient();

    const { data: bills = [] } = useQuery({
        queryKey: ['bills'],
        queryFn: () => base44.entities.BillPayment.list('-next_payment_date')
    });

    const createBillMutation = useMutation({
        mutationFn: (data) => base44.entities.BillPayment.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            setBillOpen(false);
            resetForm();
            toast.success('Bill added successfully!');
        }
    });

    const toggleAutoPayMutation = useMutation({
        mutationFn: ({ id, enabled }) => 
            base44.entities.BillPayment.update(id, { auto_pay_enabled: enabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success('Auto-pay updated');
        }
    });

    const resetForm = () => {
        setBillForm({
            bill_name: '',
            merchant: '',
            category: 'utilities',
            amount: '',
            frequency: 'monthly',
            due_day: '',
            next_payment_date: '',
            auto_pay_enabled: false,
            payment_method: '',
            notification_days_before: 3,
            notes: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createBillMutation.mutate(billForm);
    };

    const detectBills = async () => {
        setDetectingBills(true);
        try {
            const result = await base44.functions.invoke('detectRecurringBills');
            setSuggestedBills(result.data.new_suggestions || []);
            toast.success(`Found ${result.data.new_suggestions?.length || 0} new recurring bills!`);
        } catch (error) {
            toast.error('Failed to detect bills');
        }
        setDetectingBills(false);
    };

    const addSuggestedBill = async (bill) => {
        try {
            await base44.entities.BillPayment.create({
                bill_name: bill.merchant,
                merchant: bill.merchant,
                category: bill.category,
                amount: bill.amount,
                frequency: bill.frequency,
                due_day: bill.due_day,
                next_payment_date: bill.next_estimated_date,
                auto_pay_enabled: false,
                ai_detected: true,
                confidence_score: bill.confidence_score,
                last_paid_date: bill.last_payment_date,
                last_paid_amount: bill.last_amount,
                notification_days_before: 3
            });
            setSuggestedBills(prev => prev.filter(b => b.merchant !== bill.merchant));
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            toast.success('Bill added!');
        } catch (error) {
            toast.error('Failed to add bill');
        }
    };

    const upcomingBills = bills.filter(b => {
        if (!b.next_payment_date) return false;
        const daysUntil = Math.ceil(
            (new Date(b.next_payment_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil >= 0 && daysUntil <= 7;
    });

    const totalMonthly = bills
        .filter(b => b.status === 'active' && b.frequency === 'monthly')
        .reduce((sum, b) => sum + (b.amount || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <CreditCard className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Bill Payments</h1>
                            <p className="text-[#0F1729]/60 font-light">Automate recurring payments</p>
                        </div>
                    </div>
                    <Button
                        onClick={detectBills}
                        disabled={detectingBills}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                    >
                        {detectingBills ? (
                            <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Detect Bills
                            </>
                        )}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Total Monthly Bills</p>
                                    <p className="text-3xl font-light">${totalMonthly.toLocaleString()}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Active Bills</p>
                                    <p className="text-3xl font-light">{bills.filter(b => b.status === 'active').length}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Auto-Pay Enabled</p>
                                    <p className="text-3xl font-light">
                                        {bills.filter(b => b.auto_pay_enabled).length}
                                    </p>
                                </div>
                                <Zap className="w-8 h-8 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Suggested Bills */}
                {suggestedBills.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-light text-black mb-4">AI Detected Bills</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestedBills.map((bill, idx) => (
                                <Card key={idx} className="border-[#4A90E2]/30">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-4 h-4 text-[#4A90E2]" />
                                                    <h3 className="font-medium">{bill.merchant}</h3>
                                                    <Badge className="bg-[#4A90E2]/20 text-[#4A90E2]">
                                                        {bill.confidence_score}% confidence
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <p>Amount: ${bill.amount} ({bill.frequency})</p>
                                                    <p>Next due: {format(new Date(bill.next_estimated_date), 'MMM d, yyyy')}</p>
                                                    <p className="text-[#0F1729]/60">{bill.transaction_count} payments detected</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => addSuggestedBill(bill)}
                                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                            >
                                                Add Bill
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Bills */}
                {upcomingBills.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-light text-black mb-4">Due This Week</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingBills.map(bill => {
                                const daysUntil = Math.ceil(
                                    (new Date(bill.next_payment_date) - new Date()) / (1000 * 60 * 60 * 24)
                                );
                                return (
                                    <Card key={bill.id} className="border-l-4 border-l-yellow-500">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium">{bill.bill_name}</h3>
                                                <Badge variant="outline">{daysUntil} days</Badge>
                                            </div>
                                            <p className="text-2xl font-light mb-2">${bill.amount}</p>
                                            <p className="text-sm text-white/60">
                                                Due: {format(new Date(bill.next_payment_date), 'MMM d')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Bills */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-light text-black">All Bills</h2>
                        <Dialog open={billOpen} onOpenChange={setBillOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Bill
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add Bill Payment</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Bill Name</Label>
                                            <Input
                                                value={billForm.bill_name}
                                                onChange={(e) => setBillForm({ ...billForm, bill_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Merchant/Company</Label>
                                            <Input
                                                value={billForm.merchant}
                                                onChange={(e) => setBillForm({ ...billForm, merchant: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Category</Label>
                                            <Select
                                                value={billForm.category}
                                                onValueChange={(value) => setBillForm({ ...billForm, category: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Amount</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={billForm.amount}
                                                onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Frequency</Label>
                                            <Select
                                                value={billForm.frequency}
                                                onValueChange={(value) => setBillForm({ ...billForm, frequency: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                    <SelectItem value="annual">Annual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Due Day of Month</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={billForm.due_day}
                                                onChange={(e) => setBillForm({ ...billForm, due_day: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Next Payment Date</Label>
                                        <Input
                                            type="date"
                                            value={billForm.next_payment_date}
                                            onChange={(e) => setBillForm({ ...billForm, next_payment_date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label>Payment Method</Label>
                                        <Input
                                            placeholder="e.g., Visa ****1234"
                                            value={billForm.payment_method}
                                            onChange={(e) => setBillForm({ ...billForm, payment_method: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                        <div>
                                            <Label>Enable Auto-Pay</Label>
                                            <p className="text-sm text-[#0F1729]/60">Automatically pay on due date</p>
                                        </div>
                                        <Switch
                                            checked={billForm.auto_pay_enabled}
                                            onCheckedChange={(checked) => 
                                                setBillForm({ ...billForm, auto_pay_enabled: checked })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={billForm.notes}
                                            onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        Add Bill
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bills.map(bill => (
                            <Card key={bill.id} className="hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-lg font-light">{bill.bill_name}</span>
                                        {bill.auto_pay_enabled && (
                                            <Zap className="w-5 h-5 text-[#4A90E2]" />
                                        )}
                                    </CardTitle>
                                    <Badge variant="outline" className="w-fit">
                                        {categoryLabels[bill.category]}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-2xl font-light">${bill.amount}</p>
                                            <p className="text-sm text-[#0F1729]/60">{bill.frequency}</p>
                                        </div>
                                        
                                        {bill.next_payment_date && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-[#0F1729]/40" />
                                                <span>Next: {format(new Date(bill.next_payment_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        )}

                                        {bill.payment_method && (
                                            <p className="text-sm text-[#0F1729]/60">{bill.payment_method}</p>
                                        )}

                                        {bill.ai_detected && (
                                            <Badge className="bg-[#4A90E2]/20 text-[#4A90E2] w-fit">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                AI Detected
                                            </Badge>
                                        )}

                                        <div className="pt-3 border-t border-[#0F1729]/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Auto-Pay</span>
                                                <Switch
                                                    checked={bill.auto_pay_enabled}
                                                    onCheckedChange={(checked) => 
                                                        toggleAutoPayMutation.mutate({ id: bill.id, enabled: checked })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}