import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Plus, TrendingUp, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EducationFunds() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        beneficiary_name: '',
        relationship: 'grandchild',
        account_type: '529',
        current_balance: '',
        monthly_contribution: '',
        target_amount: '',
        target_date: '',
        institution: ''
    });

    const queryClient = useQueryClient();

    const { data: funds = [] } = useQuery({
        queryKey: ['educationFunds'],
        queryFn: () => base44.entities.Investment.filter({ investment_type: 'education_fund' })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Investment.create({
            ...data,
            investment_type: 'education_fund',
            name: `${data.account_type} - ${data.beneficiary_name}`,
            current_value: parseFloat(data.current_balance)
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
            relationship: 'grandchild',
            account_type: '529',
            current_balance: '',
            monthly_contribution: '',
            target_amount: '',
            target_date: '',
            institution: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const totalSaved = funds.reduce((sum, fund) => sum + (fund.current_value || 0), 0);
    const totalTarget = funds.reduce((sum, fund) => sum + (parseFloat(fund.target_amount) || 0), 0);

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
                            <p className="text-[#0F1729]/60 font-light">529 Plans & College Savings</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Education Fund
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Total Saved</p>
                                    <p className="text-3xl font-light text-black">${totalSaved.toLocaleString()}</p>
                                </div>
                                <GraduationCap className="w-12 h-12 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Total Target</p>
                                    <p className="text-3xl font-light text-black">${totalTarget.toLocaleString()}</p>
                                </div>
                                <Target className="w-12 h-12 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Progress</p>
                                    <p className="text-3xl font-light text-black">
                                        {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
                                    </p>
                                </div>
                                <TrendingUp className="w-12 h-12 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Individual Funds */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {funds.map((fund) => {
                        const progress = fund.target_amount ? (fund.current_value / parseFloat(fund.target_amount)) * 100 : 0;
                        
                        return (
                            <Card key={fund.id} className="border-[#4A90E2]/20">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                                <GraduationCap className="w-6 h-6 text-[#4A90E2]" />
                                                {fund.beneficiary_name}
                                            </CardTitle>
                                            <p className="text-sm text-[#0F1729]/60 mt-1 capitalize">
                                                {fund.relationship} • {fund.account_type}
                                            </p>
                                        </div>
                                        <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                            {Math.round(progress)}% Funded
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-[#0F1729]/60">Current Balance</span>
                                                <span className="font-medium text-[#4A90E2]">
                                                    ${fund.current_value?.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] h-3 rounded-full transition-all"
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-[#0F1729]/60">Target</span>
                                                <span className="font-medium">${parseFloat(fund.target_amount).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {fund.monthly_contribution && (
                                            <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-lg">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-green-800">
                                                    ${parseFloat(fund.monthly_contribution).toLocaleString()}/month
                                                </span>
                                            </div>
                                        )}

                                        {fund.target_date && (
                                            <div className="flex items-center gap-2 text-sm p-3 bg-blue-50 rounded-lg">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                <span className="text-blue-800">
                                                    Target: {new Date(fund.target_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}

                                        {fund.institution && (
                                            <p className="text-sm text-[#0F1729]/60">
                                                <strong>Institution:</strong> {fund.institution}
                                            </p>
                                        )}
                                    </div>
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
                            <p className="text-sm text-[#0F1729]/40">Start planning for your family's educational future</p>
                        </CardContent>
                    </Card>
                )}

                {/* Add Fund Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Education Fund</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Beneficiary Name</Label>
                                <Input
                                    value={formData.beneficiary_name}
                                    onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Relationship</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.relationship}
                                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                >
                                    <option value="child">Child</option>
                                    <option value="grandchild">Grandchild</option>
                                    <option value="niece_nephew">Niece/Nephew</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <Label>Account Type</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.account_type}
                                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                                >
                                    <option value="529">529 Plan</option>
                                    <option value="coverdell">Coverdell ESA</option>
                                    <option value="utma">UTMA/UGMA</option>
                                    <option value="savings">Savings Account</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Current Balance</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.current_balance}
                                        onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Monthly Contribution</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.monthly_contribution}
                                        onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Target Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.target_amount}
                                        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Target Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.target_date}
                                        onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Financial Institution</Label>
                                <Input
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    placeholder="e.g., Vanguard, Fidelity"
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