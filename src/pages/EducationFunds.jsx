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
import { GraduationCap, Plus, TrendingUp, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function EducationFunds() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        beneficiary_name: '',
        account_type: '529',
        current_balance: 0,
        target_amount: 0,
        graduation_year: new Date().getFullYear() + 10,
        monthly_contribution: 0
    });

    const queryClient = useQueryClient();

    // Using Investment entity to track education funds
    const { data: funds = [] } = useQuery({
        queryKey: ['educationFunds'],
        queryFn: () => base44.entities.Investment.filter({ asset_type: 'education_fund' })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Investment.create({
            ...data,
            asset_type: 'education_fund',
            asset_name: `${data.beneficiary_name} Education Fund`,
            current_value: data.current_balance
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['educationFunds']);
            setDialogOpen(false);
            resetForm();
            toast.success('Education fund added!');
        }
    });

    const resetForm = () => {
        setFormData({
            beneficiary_name: '',
            account_type: '529',
            current_balance: 0,
            target_amount: 0,
            graduation_year: new Date().getFullYear() + 10,
            monthly_contribution: 0
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const calculateProgress = (fund) => {
        if (!fund.target_amount) return 0;
        return Math.min((fund.current_value / fund.target_amount) * 100, 100);
    };

    const totalSaved = funds.reduce((sum, f) => sum + (f.current_value || 0), 0);
    const totalTarget = funds.reduce((sum, f) => sum + (f.target_amount || 0), 0);

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
                                Education Funds
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">529 Plans & Education Savings</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Fund
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Total Saved</p>
                                    <h3 className="text-3xl font-light text-black">
                                        ${totalSaved.toLocaleString()}
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
                                    <p className="text-sm text-[#0F1729]/60">Total Target</p>
                                    <h3 className="text-3xl font-light text-black">
                                        ${totalTarget.toLocaleString()}
                                    </h3>
                                </div>
                                <Target className="w-10 h-10 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Beneficiaries</p>
                                    <h3 className="text-3xl font-light text-black">
                                        {funds.length}
                                    </h3>
                                </div>
                                <GraduationCap className="w-10 h-10 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Funds List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {funds.map((fund) => {
                        const progress = calculateProgress(fund);
                        const yearsUntilGrad = fund.graduation_year - new Date().getFullYear();
                        
                        return (
                            <Card key={fund.id} className="border-[#4A90E2]/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-[#4A90E2]" />
                                            {fund.beneficiary_name}
                                        </span>
                                        <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                            {fund.account_type || '529'}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-[#0F1729]/60">Current Balance</p>
                                            <p className="text-2xl font-light text-black">
                                                ${fund.current_value.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-[#0F1729]/60">Target</p>
                                            <p className="text-xl font-light text-black">
                                                ${fund.target_amount?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-[#0F1729]/60">Progress</span>
                                            <span className="font-medium text-[#4A90E2]">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] h-3 rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#4A90E2]/10">
                                        <div className="flex items-center gap-2 text-sm text-[#0F1729]/60">
                                            <Calendar className="w-4 h-4" />
                                            Graduation: {fund.graduation_year}
                                        </div>
                                        <Badge variant="outline">
                                            {yearsUntilGrad} years
                                        </Badge>
                                    </div>

                                    {fund.monthly_contribution && (
                                        <div className="text-sm">
                                            <span className="text-[#0F1729]/60">Monthly Contribution: </span>
                                            <span className="font-medium text-black">
                                                ${fund.monthly_contribution.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {funds.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No education funds tracked yet</p>
                            <p className="text-sm text-[#0F1729]/40">Start planning for educational expenses</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Education Fund</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Beneficiary Name *</Label>
                                <Input
                                    placeholder="Child or grandchild name"
                                    value={formData.beneficiary_name}
                                    onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Account Type</Label>
                                <Select 
                                    value={formData.account_type} 
                                    onValueChange={(val) => setFormData({ ...formData, account_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="529">529 Plan</SelectItem>
                                        <SelectItem value="coverdell">Coverdell ESA</SelectItem>
                                        <SelectItem value="custodial">Custodial Account (UGMA/UTMA)</SelectItem>
                                        <SelectItem value="savings">Savings Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Current Balance *</Label>
                                <Input
                                    type="number"
                                    value={formData.current_balance || ''}
                                    onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Target Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 200000"
                                    value={formData.target_amount || ''}
                                    onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label>Expected Graduation Year</Label>
                                <Input
                                    type="number"
                                    value={formData.graduation_year}
                                    onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) || new Date().getFullYear() })}
                                />
                            </div>

                            <div>
                                <Label>Monthly Contribution</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 500"
                                    value={formData.monthly_contribution || ''}
                                    onChange={(e) => setFormData({ ...formData, monthly_contribution: parseFloat(e.target.value) || 0 })}
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
                                    Add Fund
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}