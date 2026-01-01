import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function TenantRentPayment({ property, upcomingPayment }) {
    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        setProcessing(true);
        // Payment would integrate with Stripe or other payment processor
        toast.info('Payment processing would happen here (Stripe integration)');
        setTimeout(() => {
            setProcessing(false);
        }, 2000);
    };

    const daysUntilDue = upcomingPayment 
        ? differenceInDays(new Date(upcomingPayment.due_date), new Date())
        : null;

    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 5 && daysUntilDue >= 0;

    return (
        <div className="space-y-4">
            {/* Next Payment Card */}
            <Card className={`border-2 ${
                isOverdue ? 'border-red-300 bg-red-50/50' :
                isDueSoon ? 'border-orange-300 bg-orange-50/50' :
                'border-green-300 bg-green-50/50'
            }`}>
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <DollarSign className={`w-5 h-5 ${
                            isOverdue ? 'text-red-600' :
                            isDueSoon ? 'text-orange-600' :
                            'text-green-600'
                        }`} />
                        {isOverdue ? 'Payment Overdue' : isDueSoon ? 'Payment Due Soon' : 'Next Payment'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingPayment ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Amount Due</span>
                                <span className="text-3xl font-light text-[#1A2B44]">
                                    ${upcomingPayment.amount.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Due Date</span>
                                <div className="text-right">
                                    <div className="font-medium">
                                        {format(new Date(upcomingPayment.due_date), 'MMM d, yyyy')}
                                    </div>
                                    <div className={`text-xs ${
                                        isOverdue ? 'text-red-600' :
                                        isDueSoon ? 'text-orange-600' :
                                        'text-green-600'
                                    }`}>
                                        {isOverdue 
                                            ? `${Math.abs(daysUntilDue)} days overdue`
                                            : `${daysUntilDue} days remaining`
                                        }
                                    </div>
                                </div>
                            </div>

                            {isOverdue && (
                                <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-red-800">
                                            Your payment is overdue. Late fees may apply. Please submit payment immediately.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                className={`w-full h-14 text-lg touch-manipulation ${
                                    isOverdue 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37]'
                                } text-white`}
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                {processing ? 'Processing...' : `Pay $${upcomingPayment.amount.toLocaleString()} Now`}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-gray-600">No upcoming payments</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rent Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">Rent Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Monthly Rent</span>
                        <span className="font-medium text-lg">${property.monthly_rent?.toLocaleString()}</span>
                    </div>
                    {property.security_deposit && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Security Deposit</span>
                            <span className="font-medium">${property.security_deposit.toLocaleString()}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Secure Online Payment</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Pay securely with credit card, debit card, or bank account through our payment processor.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}