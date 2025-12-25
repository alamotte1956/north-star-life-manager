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
import { Heart, Plus, TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function CharitableGiving() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        organization_name: '',
        cause_category: 'education',
        donation_amount: '',
        donation_date: '',
        recurring: false,
        frequency: 'monthly',
        tax_deductible: true,
        notes: ''
    });

    const queryClient = useQueryClient();

    const { data: donations = [] } = useQuery({
        queryKey: ['charitableDonations'],
        queryFn: () => base44.entities.Transaction.filter({ category: 'charitable_giving' })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Transaction.create({
            ...data,
            category: 'charitable_giving',
            type: 'expense',
            amount: -Math.abs(parseFloat(data.donation_amount)),
            date: data.donation_date,
            description: `Donation to ${data.organization_name}`
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
            organization_name: '',
            cause_category: 'education',
            donation_amount: '',
            donation_date: '',
            recurring: false,
            frequency: 'monthly',
            tax_deductible: true,
            notes: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const currentYear = new Date().getFullYear();
    const yearDonations = donations.filter(d => 
        new Date(d.date).getFullYear() === currentYear
    );
    const totalGiving = yearDonations.reduce((sum, d) => sum + Math.abs(d.amount || 0), 0);

    const byCategory = donations.reduce((acc, donation) => {
        const cat = donation.cause_category || 'other';
        acc[cat] = (acc[cat] || 0) + Math.abs(donation.amount || 0);
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
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Total {currentYear} Giving</p>
                                    <p className="text-3xl font-light text-black">${totalGiving.toLocaleString()}</p>
                                </div>
                                <Heart className="w-12 h-12 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Organizations Supported</p>
                                    <p className="text-3xl font-light text-black">
                                        {new Set(donations.map(d => d.organization_name)).size}
                                    </p>
                                </div>
                                <TrendingUp className="w-12 h-12 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Tax Deductible</p>
                                    <p className="text-3xl font-light text-black">
                                        ${yearDonations.filter(d => d.tax_deductible).reduce((sum, d) => sum + Math.abs(d.amount || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <Target className="w-12 h-12 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Category Breakdown */}
                {Object.keys(byCategory).length > 0 && (
                    <Card className="mb-8 border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle>Giving by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(byCategory).map(([category, amount]) => (
                                    <div key={category} className="p-4 bg-gradient-to-br from-white to-[#F8F9FA] rounded-lg border border-[#4A90E2]/10">
                                        <p className="text-sm text-[#0F1729]/60 capitalize mb-1">{category}</p>
                                        <p className="text-xl font-medium text-black">${amount.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                        className="flex items-center justify-between p-4 bg-white border border-[#4A90E2]/10 rounded-lg"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-3 bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] rounded-lg">
                                                <Heart className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-black">{donation.organization_name}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-[#0F1729]/60">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(donation.date).toLocaleDateString()}
                                                    </span>
                                                    {donation.cause_category && (
                                                        <Badge className="capitalize">{donation.cause_category}</Badge>
                                                    )}
                                                    {donation.tax_deductible && (
                                                        <Badge className="bg-green-100 text-green-700">Tax Deductible</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-medium text-[#4A90E2]">
                                                ${Math.abs(donation.amount || 0).toLocaleString()}
                                            </p>
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

                {/* Add Donation Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Charitable Donation</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Organization Name</Label>
                                <Input
                                    value={formData.organization_name}
                                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Cause Category</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.cause_category}
                                    onChange={(e) => setFormData({ ...formData, cause_category: e.target.value })}
                                >
                                    <option value="education">Education</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="environment">Environment</option>
                                    <option value="arts">Arts & Culture</option>
                                    <option value="poverty">Poverty Relief</option>
                                    <option value="animal_welfare">Animal Welfare</option>
                                    <option value="religious">Religious</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.donation_amount}
                                        onChange={(e) => setFormData({ ...formData, donation_amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.donation_date}
                                        onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.tax_deductible}
                                    onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
                                />
                                <Label>Tax Deductible</Label>
                            </div>

                            <div>
                                <Label>Notes (optional)</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Purpose, campaign, etc."
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