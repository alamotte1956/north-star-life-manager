import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Plus, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, isBefore, addDays } from 'date-fns';

const categoryLabels = {
    club_membership: 'Club Membership',
    streaming: 'Streaming',
    software: 'Software',
    gym: 'Gym',
    magazine: 'Magazine',
    wine_club: 'Wine Club',
    concierge_service: 'Concierge',
    travel: 'Travel',
    insurance: 'Insurance',
    utilities: 'Utilities',
    other: 'Other'
};

export default function Subscriptions() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'other',
        provider: '',
        billing_amount: '',
        billing_frequency: 'monthly',
        next_billing_date: '',
        renewal_date: '',
        payment_method: '',
        account_number: '',
        status: 'active',
        auto_renew: false,
        member_number: '',
        notes: ''
    });

    const { data: subscriptions = [], refetch } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => base44.entities.Subscription.list('-billing_amount')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.Subscription.create(formData);
        setOpen(false);
        setFormData({
            name: '',
            category: 'other',
            provider: '',
            billing_amount: '',
            billing_frequency: 'monthly',
            next_billing_date: '',
            renewal_date: '',
            payment_method: '',
            account_number: '',
            status: 'active',
            auto_renew: false,
            member_number: '',
            notes: ''
        });
        refetch();
    };

    const monthlyTotal = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
            const amount = s.billing_amount || 0;
            if (s.billing_frequency === 'monthly') return sum + amount;
            if (s.billing_frequency === 'annual') return sum + (amount / 12);
            if (s.billing_frequency === 'quarterly') return sum + (amount / 3);
            return sum;
        }, 0);

    const annualTotal = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
            const amount = s.billing_amount || 0;
            if (s.billing_frequency === 'monthly') return sum + (amount * 12);
            if (s.billing_frequency === 'annual') return sum + amount;
            if (s.billing_frequency === 'quarterly') return sum + (amount * 4);
            return sum;
        }, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <DollarSign className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Subscriptions</h1>
                            <p className="text-[#1A2B44]/60 font-light">Track recurring expenses</p>
                        </div>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Subscription
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Subscription</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Service Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Billing Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.billing_amount}
                                            onChange={(e) => setFormData({ ...formData, billing_amount: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div>
                                        <Label>Billing Frequency</Label>
                                        <Select
                                            value={formData.billing_frequency}
                                            onValueChange={(value) => setFormData({ ...formData, billing_frequency: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                                <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                                                <SelectItem value="annual">Annual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Next Billing Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.next_billing_date}
                                            onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Renewal Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.renewal_date}
                                            onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.auto_renew}
                                        onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label>Auto-renew enabled</Label>
                                </div>

                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37]">
                                    Add Subscription
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Monthly Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${monthlyTotal.toFixed(2)}
                            </div>
                            <p className="text-sm text-[#1A2B44]/60 font-light mt-1">
                                {subscriptions.filter(s => s.status === 'active').length} active subscriptions
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Annual Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${annualTotal.toFixed(2)}
                            </div>
                            <p className="text-sm text-[#1A2B44]/60 font-light mt-1">
                                Estimated yearly cost
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Average Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${subscriptions.length > 0 ? (monthlyTotal / subscriptions.filter(s => s.status === 'active').length).toFixed(2) : '0.00'}
                            </div>
                            <p className="text-sm text-[#1A2B44]/60 font-light mt-1">
                                Per subscription/month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {subscriptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subscriptions.map(sub => (
                            <Card key={sub.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-light text-[#1A2B44]">{sub.name}</h3>
                                            <p className="text-sm text-[#1A2B44]/60">{categoryLabels[sub.category]}</p>
                                        </div>
                                        <Badge className={`${sub.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'} border`}>
                                            {sub.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-2xl font-light text-[#C9A95C]">
                                            ${sub.billing_amount}
                                            <span className="text-sm text-[#1A2B44]/60 ml-1">
                                                /{sub.billing_frequency === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        </div>

                                        {sub.next_billing_date && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/70">
                                                <Calendar className="w-4 h-4 text-[#C9A95C]" />
                                                Next: {format(new Date(sub.next_billing_date), 'MMM d, yyyy')}
                                            </div>
                                        )}

                                        {sub.auto_renew && (
                                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                Auto-renew
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <DollarSign className="w-16 h-16 text-[#1A2B44]/20 mx-auto mb-4" />
                        <p className="text-[#1A2B44]/40 font-light">No subscriptions tracked yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}