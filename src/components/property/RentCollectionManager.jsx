import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calendar, Clock, AlertCircle, CheckCircle, Send, CreditCard } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function PaymentForm({ paymentId, amount, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/payment-success'
                }
            });

            if (error) {
                toast.error(error.message);
            } else {
                await base44.functions.invoke('processRentPayment', {
                    action: 'confirm_payment',
                    payment_id: paymentId
                });
                toast.success('Payment successful!');
                onSuccess();
            }
        } catch (err) {
            toast.error('Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <Button type="submit" disabled={!stripe || loading} className="w-full">
                {loading ? 'Processing...' : `Pay $${amount}`}
            </Button>
        </form>
    );
}

export default function RentCollectionManager({ properties }) {
    const [selectedProperty, setSelectedProperty] = useState('');
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);

    const { data: payments = [], refetch: refetchPayments } = useQuery({
        queryKey: ['rentPayments'],
        queryFn: () => base44.entities.RentPayment.list('-due_date')
    });

    const { data: schedules = [], refetch: refetchSchedules } = useQuery({
        queryKey: ['paymentSchedules'],
        queryFn: () => base44.entities.PaymentSchedule.list()
    });

    const [scheduleForm, setScheduleForm] = useState({
        property_id: '',
        amount: '',
        due_day: '1',
        reminder_days_before: '3',
        grace_period_days: '5',
        late_fee_amount: '',
        reminder_channels: ['email']
    });

    const createSchedule = async () => {
        const property = properties.find(p => p.id === scheduleForm.property_id);
        if (!property) {
            toast.error('Please select a property');
            return;
        }

        try {
            await base44.entities.PaymentSchedule.create({
                ...scheduleForm,
                property_name: property.name,
                tenant_email: property.tenant_email,
                tenant_phone: property.tenant_phone,
                amount: parseFloat(scheduleForm.amount),
                due_day: parseInt(scheduleForm.due_day),
                reminder_days_before: parseInt(scheduleForm.reminder_days_before),
                grace_period_days: parseInt(scheduleForm.grace_period_days),
                late_fee_amount: scheduleForm.late_fee_amount ? parseFloat(scheduleForm.late_fee_amount) : null,
                frequency: 'monthly',
                active: true
            });

            toast.success('Payment schedule created!');
            setScheduleOpen(false);
            refetchSchedules();
        } catch (error) {
            toast.error('Failed to create schedule');
        }
    };

    const initiatePayment = async (payment) => {
        try {
            const result = await base44.functions.invoke('processRentPayment', {
                action: 'create_payment_intent',
                payment_id: payment.id,
                amount: payment.amount,
                property_id: payment.property_id,
                tenant_email: payment.tenant_email
            });

            setClientSecret(result.data.client_secret);
            setSelectedPayment(payment);
            setPaymentOpen(true);
        } catch (error) {
            toast.error('Failed to initiate payment');
        }
    };

    const recordManualPayment = async (paymentId) => {
        try {
            await base44.functions.invoke('processRentPayment', {
                action: 'record_manual_payment',
                payment_id: paymentId,
                payment_method: 'check'
            });
            toast.success('Payment recorded!');
            refetchPayments();
        } catch (error) {
            toast.error('Failed to record payment');
        }
    };

    const sendManualReminder = async () => {
        try {
            await base44.functions.invoke('sendRentReminders', {});
            toast.success('Reminders sent!');
            refetchPayments();
        } catch (error) {
            toast.error('Failed to send reminders');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-blue-100 text-blue-700',
            overdue: 'bg-red-100 text-red-700',
            partially_paid: 'bg-yellow-100 text-yellow-700'
        };
        return colors[status] || colors.pending;
    };

    const filteredPayments = selectedProperty
        ? payments.filter(p => p.property_id === selectedProperty)
        : payments;

    const upcomingPayments = filteredPayments.filter(p => 
        p.status === 'pending' && isFuture(new Date(p.due_date))
    );
    const overduePayments = filteredPayments.filter(p => p.status === 'overdue');
    const paidPayments = filteredPayments.filter(p => p.status === 'paid');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Label>Filter by Property:</Label>
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="All properties" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>All Properties</SelectItem>
                            {properties.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={sendManualReminder} variant="outline">
                        <Send className="w-4 h-4 mr-2" />
                        Send Reminders
                    </Button>
                    <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                <Calendar className="w-4 h-4 mr-2" />
                                New Schedule
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Payment Schedule</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Property</Label>
                                    <Select
                                        value={scheduleForm.property_id}
                                        onValueChange={(v) => setScheduleForm({...scheduleForm, property_id: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.filter(p => p.tenant_name).map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} - {p.tenant_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Monthly Amount ($)</Label>
                                        <Input
                                            type="number"
                                            value={scheduleForm.amount}
                                            onChange={(e) => setScheduleForm({...scheduleForm, amount: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Due Day of Month</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={scheduleForm.due_day}
                                            onChange={(e) => setScheduleForm({...scheduleForm, due_day: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Reminder Days Before</Label>
                                        <Input
                                            type="number"
                                            value={scheduleForm.reminder_days_before}
                                            onChange={(e) => setScheduleForm({...scheduleForm, reminder_days_before: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Grace Period (days)</Label>
                                        <Input
                                            type="number"
                                            value={scheduleForm.grace_period_days}
                                            onChange={(e) => setScheduleForm({...scheduleForm, grace_period_days: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Late Fee ($) - Optional</Label>
                                    <Input
                                        type="number"
                                        value={scheduleForm.late_fee_amount}
                                        onChange={(e) => setScheduleForm({...scheduleForm, late_fee_amount: e.target.value})}
                                        placeholder="0"
                                    />
                                </div>
                                <Button onClick={createSchedule} className="w-full">Create Schedule</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">Upcoming</div>
                                <div className="text-2xl font-bold text-blue-600">{upcomingPayments.length}</div>
                            </div>
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">Overdue</div>
                                <div className="text-2xl font-bold text-red-600">{overduePayments.length}</div>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-600">Collected</div>
                                <div className="text-2xl font-bold text-green-600">
                                    ${paidPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                </div>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments List */}
            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">Upcoming ({upcomingPayments.length})</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue ({overduePayments.length})</TabsTrigger>
                    <TabsTrigger value="paid">Paid ({paidPayments.length})</TabsTrigger>
                    <TabsTrigger value="schedules">Schedules ({schedules.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {upcomingPayments.map(payment => (
                        <Card key={payment.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-[#1A2B44]">{payment.property_name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{payment.tenant_name}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Badge className={getStatusColor(payment.status)}>
                                                {payment.status}
                                            </Badge>
                                            <span className="text-sm text-gray-600">
                                                Due: {format(new Date(payment.due_date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-[#1A2B44]">
                                            ${payment.amount.toLocaleString()}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" onClick={() => initiatePayment(payment)}>
                                                <CreditCard className="w-4 h-4 mr-1" />
                                                Pay Online
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => recordManualPayment(payment.id)}>
                                                Mark Paid
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="overdue" className="space-y-4">
                    {overduePayments.map(payment => (
                        <Card key={payment.id} className="border-red-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-red-900">{payment.property_name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{payment.tenant_name}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Badge className="bg-red-100 text-red-700">
                                                {Math.ceil((new Date() - new Date(payment.due_date)) / (1000 * 60 * 60 * 24))} days overdue
                                            </Badge>
                                            {payment.late_notice_sent && (
                                                <Badge variant="outline" className="text-xs">
                                                    Notice sent ({payment.late_notice_count}x)
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-red-600">
                                            ${payment.amount.toLocaleString()}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" variant="destructive" onClick={() => initiatePayment(payment)}>
                                                Pay Now
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => recordManualPayment(payment.id)}>
                                                Mark Paid
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="paid" className="space-y-4">
                    {paidPayments.map(payment => (
                        <Card key={payment.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-[#1A2B44]">{payment.property_name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{payment.tenant_name}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Badge className="bg-green-100 text-green-700">Paid</Badge>
                                            <span className="text-sm text-gray-600">
                                                {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-sm text-gray-500">via {payment.payment_method}</span>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-green-600">
                                        ${payment.amount.toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="schedules" className="space-y-4">
                    {schedules.map(schedule => (
                        <Card key={schedule.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-[#1A2B44]">{schedule.property_name}</h3>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            <div>Amount: ${schedule.amount}/month</div>
                                            <div>Due: Day {schedule.due_day} of month</div>
                                            <div>Grace: {schedule.grace_period_days} days</div>
                                            <div>Channels: {schedule.reminder_channels.join(', ')}</div>
                                        </div>
                                    </div>
                                    <Badge className={schedule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                        {schedule.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Payment Dialog */}
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pay Rent - {selectedPayment?.property_name}</DialogTitle>
                    </DialogHeader>
                    {clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <PaymentForm
                                paymentId={selectedPayment?.id}
                                amount={selectedPayment?.amount}
                                onSuccess={() => {
                                    setPaymentOpen(false);
                                    refetchPayments();
                                }}
                            />
                        </Elements>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}