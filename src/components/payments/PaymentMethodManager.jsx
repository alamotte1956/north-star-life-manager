import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentMethodManager() {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        method_type: 'credit_card',
        nickname: '',
        last_four: '',
        card_brand: '',
        bank_name: '',
        expiry_date: '',
        payment_token: `tok_${Math.random().toString(36).substr(2, 16)}` // Simulated token
    });

    const { data: paymentMethods = [] } = useQuery({
        queryKey: ['paymentMethods'],
        queryFn: () => base44.entities.PaymentMethod.list()
    });

    const addMethodMutation = useMutation({
        mutationFn: (data) => base44.entities.PaymentMethod.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['paymentMethods']);
            setShowDialog(false);
            setFormData({
                method_type: 'credit_card',
                nickname: '',
                last_four: '',
                card_brand: '',
                bank_name: '',
                expiry_date: '',
                payment_token: `tok_${Math.random().toString(36).substr(2, 16)}`
            });
            toast.success('Payment method added successfully');
        }
    });

    const deleteMethodMutation = useMutation({
        mutationFn: (id) => base44.entities.PaymentMethod.update(id, { status: 'disabled' }),
        onSuccess: () => {
            queryClient.invalidateQueries(['paymentMethods']);
            toast.success('Payment method removed');
        }
    });

    const setDefaultMutation = useMutation({
        mutationFn: async (id) => {
            // Unset all defaults first
            for (const pm of paymentMethods) {
                if (pm.is_default) {
                    await base44.entities.PaymentMethod.update(pm.id, { is_default: false });
                }
            }
            // Set new default
            await base44.entities.PaymentMethod.update(id, { is_default: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['paymentMethods']);
            toast.success('Default payment method updated');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addMethodMutation.mutate(formData);
    };

    const activePaymentMethods = paymentMethods.filter(pm => pm.status === 'active');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#C5A059]">Payment Methods</h3>
                <Button
                    onClick={() => setShowDialog(true)}
                    className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37]"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePaymentMethods.map((method) => (
                    <Card key={method.id} className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {method.method_type === 'bank_account' ? (
                                        <Building className="w-8 h-8 text-[#C5A059]" />
                                    ) : (
                                        <CreditCard className="w-8 h-8 text-[#C5A059]" />
                                    )}
                                    <div>
                                        <p className="font-medium text-[#C5A059]">{method.nickname}</p>
                                        <p className="text-sm text-[#B8935E]">
                                            {method.card_brand || method.bank_name} •••• {method.last_four}
                                        </p>
                                        {method.expiry_date && (
                                            <p className="text-xs text-[#B8935E]">Expires {method.expiry_date}</p>
                                        )}
                                    </div>
                                </div>
                                {method.is_default && (
                                    <Badge className="bg-green-100 text-green-800">
                                        <Star className="w-3 h-3 mr-1" />
                                        Default
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!method.is_default && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDefaultMutation.mutate(method.id)}
                                        className="flex-1"
                                    >
                                        Set as Default
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteMethodMutation.mutate(method.id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {activePaymentMethods.length === 0 && (
                <Card className="bg-[#1a1a1a] border-[#C5A059]">
                    <CardContent className="py-12 text-center">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-[#C5A059]" />
                        <p className="text-[#B8935E] mb-4">No payment methods added yet</p>
                        <Button onClick={() => setShowDialog(true)} className="bg-[#C5A059]">
                            Add Your First Payment Method
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                        <p className="text-sm text-gray-500">
                            Note: This is a demo. In production, payment data would be securely tokenized.
                        </p>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Type</Label>
                            <Select
                                value={formData.method_type}
                                onValueChange={(value) => setFormData({ ...formData, method_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="debit_card">Debit Card</SelectItem>
                                    <SelectItem value="bank_account">Bank Account</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Nickname</Label>
                            <Input
                                value={formData.nickname}
                                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                placeholder="e.g., Personal Visa"
                                required
                            />
                        </div>

                        {formData.method_type !== 'bank_account' ? (
                            <>
                                <div>
                                    <Label>Card Brand</Label>
                                    <Select
                                        value={formData.card_brand}
                                        onValueChange={(value) => setFormData({ ...formData, card_brand: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Visa">Visa</SelectItem>
                                            <SelectItem value="Mastercard">Mastercard</SelectItem>
                                            <SelectItem value="Amex">American Express</SelectItem>
                                            <SelectItem value="Discover">Discover</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Last 4 Digits</Label>
                                    <Input
                                        value={formData.last_four}
                                        onChange={(e) => setFormData({ ...formData, last_four: e.target.value })}
                                        placeholder="1234"
                                        maxLength={4}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Expiry Date</Label>
                                    <Input
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        placeholder="MM/YY"
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <Label>Bank Name</Label>
                                    <Input
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        placeholder="e.g., Chase"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Last 4 Digits</Label>
                                    <Input
                                        value={formData.last_four}
                                        onChange={(e) => setFormData({ ...formData, last_four: e.target.value })}
                                        placeholder="1234"
                                        maxLength={4}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full bg-[#C5A059]">
                            Add Payment Method
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}