import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, TrendingDown, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BillNegotiation() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        bill_type: '',
        provider: '',
        current_monthly_cost: ''
    });
    const queryClient = useQueryClient();

    const { data: bills = [], isLoading } = useQuery({
        queryKey: ['bill-negotiations'],
        queryFn: () => base44.entities.BillNegotiation.list('-created_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.BillNegotiation.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill-negotiations'] });
            setShowForm(false);
            setFormData({ bill_type: '', provider: '', current_monthly_cost: '' });
            toast.success('Bill added for analysis');
        }
    });

    const analyzeMutation = useMutation({
        mutationFn: (billId) => base44.functions.invoke('analyzeBillNegotiation', { bill_id: billId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bill-negotiations'] });
            toast.success('Analysis complete!');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate({
            ...formData,
            current_monthly_cost: parseFloat(formData.current_monthly_cost)
        });
    };

    const totalSavings = bills
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.annual_savings || 0), 0);

    const potentialSavings = bills
        .filter(b => b.status === 'negotiating')
        .reduce((sum, b) => sum + (b.annual_savings || 0), 0);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Bill Negotiation Service</h1>
                            <p className="text-[#1A2B44]/60">AI-powered bill negotiation to save you money</p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Zap className="w-5 h-5 mr-2" />
                            Add Bill to Negotiate
                        </Button>
                    </div>
                </div>

                {/* Savings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-green-900">Total Saved</span>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-light text-green-900">
                                ${totalSavings.toLocaleString()}/year
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-blue-900">Potential Savings</span>
                                <TrendingDown className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-light text-blue-900">
                                ${potentialSavings.toLocaleString()}/year
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-purple-900">Bills Tracked</span>
                                <DollarSign className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-3xl font-light text-purple-900">{bills.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bills List */}
                <div className="space-y-4">
                    {bills.map((bill) => (
                        <Card key={bill.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg capitalize">{bill.bill_type} - {bill.provider}</CardTitle>
                                        <p className="text-sm text-[#1A2B44]/60">
                                            Current: ${bill.current_monthly_cost}/month
                                        </p>
                                    </div>
                                    <Badge className={
                                        bill.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        bill.status === 'negotiating' ? 'bg-blue-100 text-blue-700' :
                                        bill.status === 'analyzing' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                    }>
                                        {bill.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {bill.status === 'pending' && (
                                    <Button
                                        onClick={() => analyzeMutation.mutate(bill.id)}
                                        disabled={analyzeMutation.isPending}
                                        className="bg-[#D4AF37] hover:bg-[#C5A059] text-black"
                                    >
                                        {analyzeMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Zap className="w-4 h-4 mr-2" />
                                        )}
                                        Analyze Savings Potential
                                    </Button>
                                )}

                                {(bill.status === 'negotiating' || bill.status === 'completed') && (
                                    <div className="space-y-4">
                                        {/* Savings Summary */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-green-900">Potential Savings</span>
                                                <TrendingDown className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div className="text-2xl font-light text-green-900">
                                                ${bill.savings_amount?.toFixed(2)}/month
                                            </div>
                                            <div className="text-sm text-green-700">
                                                ${bill.annual_savings?.toFixed(2)} per year
                                            </div>
                                        </div>

                                        {/* Strategy */}
                                        {bill.negotiation_strategy && (
                                            <div>
                                                <h4 className="font-medium text-[#1A2B44] mb-2">Negotiation Strategy</h4>
                                                <p className="text-sm text-[#1A2B44]/70">{bill.negotiation_strategy}</p>
                                            </div>
                                        )}

                                        {/* Talking Points */}
                                        {bill.talking_points?.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-[#1A2B44] mb-2">Key Talking Points</h4>
                                                <ul className="space-y-1">
                                                    {bill.talking_points.map((point, i) => (
                                                        <li key={i} className="text-sm text-[#1A2B44]/70 flex items-start gap-2">
                                                            <span className="text-[#D4AF37]">•</span>
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Competitor Offers */}
                                        {bill.competitor_offers?.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-[#1A2B44] mb-3">Competitor Pricing</h4>
                                                <div className="grid gap-2">
                                                    {bill.competitor_offers.map((offer, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div>
                                                                <div className="font-medium text-sm">{offer.provider}</div>
                                                                <div className="text-xs text-[#1A2B44]/60">{offer.features}</div>
                                                            </div>
                                                            <div className="text-lg font-medium text-[#D4AF37]">
                                                                ${offer.price}/mo
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Bill Dialog */}
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Bill for Negotiation</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Bill Type</Label>
                                <Select
                                    value={formData.bill_type}
                                    onValueChange={(value) => setFormData({ ...formData, bill_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cable">Cable TV</SelectItem>
                                        <SelectItem value="internet">Internet</SelectItem>
                                        <SelectItem value="phone">Phone/Mobile</SelectItem>
                                        <SelectItem value="insurance">Insurance</SelectItem>
                                        <SelectItem value="utility">Utility</SelectItem>
                                        <SelectItem value="subscription">Subscription</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Provider Name</Label>
                                <Input
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                    placeholder="e.g., Comcast, Verizon"
                                    required
                                />
                            </div>

                            <div>
                                <Label>Current Monthly Cost</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.current_monthly_cost}
                                    onChange={(e) => setFormData({ ...formData, current_monthly_cost: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                    Add Bill
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}