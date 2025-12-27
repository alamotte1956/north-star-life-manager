import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, TrendingUp, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CharitableGiving() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        charity_name: '',
        amount: 0,
        frequency: 'one_time',
        cause: '',
        notes: ''
    });

    const queryClient = useQueryClient();

    // Using BillPayment entity to track charitable giving
    const { data: donations = [] } = useQuery({
        queryKey: ['charitableDonations'],
        queryFn: () => base44.entities.BillPayment.filter({ 
            category: 'charitable_giving' 
        }, '-payment_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.BillPayment.create({
            ...data,
            category: 'charitable_giving',
            status: 'completed',
            payment_date: new Date().toISOString().split('T')[0]
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['charitableDonations']);
            setDialogOpen(false);
            resetForm();
            toast.success('Donation recorded!');
        }
    });

    const resetForm = () => {
        setFormData({
            charity_name: '',
            amount: 0,
            frequency: 'one_time',
            cause: '',
            notes: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    // Calculate totals
    const thisYearTotal = donations
        .filter(d => new Date(d.payment_date).getFullYear() === new Date().getFullYear())
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    const allTimeTotal = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Group by cause
    const byCause = donations.reduce((acc, donation) => {
        const cause = donation.cause || 'Other';
        if (!acc[cause]) acc[cause] = 0;
        acc[cause] += donation.amount || 0;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Charitable Giving
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Track your philanthropic impact</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Record Donation
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">This Year</p>
                                    <h3 className="text-3xl font-light text-black">
                                        ${thisYearTotal.toLocaleString()}
                                    </h3>
                                </div>
                                <TrendingUp className="w-10 h-10 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">All Time</p>
                                    <h3 className="text-3xl font-light text-black">
                                        ${allTimeTotal.toLocaleString()}
                                    </h3>
                                </div>
                                <Heart className="w-10 h-10 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Charities Supported</p>
                                    <h3 className="text-3xl font-light text-black">
                                        {new Set(donations.map(d => d.charity_name)).size}
                                    </h3>
                                </div>
                                <FileText className="w-10 h-10 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* By Cause Breakdown */}
                <Card className="mb-8 border-[#4A90E2]/20">
                    <CardHeader>
                        <CardTitle>Giving by Cause</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(byCause).map(([cause, amount]) => (
                                <div key={cause} className="bg-gradient-to-br from-white to-[#F8F9FA] p-4 rounded-lg border border-[#4A90E2]/10">
                                    <p className="text-sm text-[#0F1729]/60 mb-1">{cause}</p>
                                    <p className="text-2xl font-light text-black">${amount.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Donation History */}
                <Card className="border-[#4A90E2]/20">
                    <CardHeader>
                        <CardTitle>Donation History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {donations.length > 0 ? (
                            <div className="space-y-3">
                                {donations.map((donation) => (
                                    <div 
                                        key={donation.id}
                                        className="flex items-center justify-between p-4 bg-white border border-[#4A90E2]/10 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-medium text-black">{donation.charity_name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                                    {donation.cause || 'General'}
                                                </Badge>
                                                <span className="text-sm text-[#0F1729]/60">
                                                    {format(new Date(donation.payment_date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            {donation.notes && (
                                                <p className="text-sm text-[#0F1729]/60 mt-2">{donation.notes}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-light text-black">
                                                ${donation.amount.toLocaleString()}
                                            </p>
                                            {donation.frequency && donation.frequency !== 'one_time' && (
                                                <Badge variant="outline" className="mt-1">
                                                    {donation.frequency}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Heart className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                                <p className="text-[#0F1729]/60">No donations recorded yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Donation</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Charity Name *</Label>
                                <Input
                                    value={formData.charity_name}
                                    onChange={(e) => setFormData({ ...formData, charity_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Amount *</Label>
                                <Input
                                    type="number"
                                    value={formData.amount || ''}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Cause/Category</Label>
                                <Input
                                    placeholder="e.g., Education, Health, Environment"
                                    value={formData.cause}
                                    onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="Purpose of donation, campaign name, etc."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Record Donation
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}