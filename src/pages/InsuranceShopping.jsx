import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, TrendingUp, CheckCircle, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function InsuranceShopping() {
    const [showCompare, setShowCompare] = useState(false);
    const [compareData, setCompareData] = useState({
        insurance_type: '',
        coverage_amount: ''
    });
    const queryClient = useQueryClient();

    const { data: quotes = [], isLoading } = useQuery({
        queryKey: ['insurance-quotes'],
        queryFn: () => base44.entities.InsuranceQuote.filter({ status: 'active' })
    });

    const compareMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('compareInsurance', {
            insurance_type: data.insurance_type,
            coverage_details: { coverage_amount: parseFloat(data.coverage_amount) }
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['insurance-quotes'] });
            setShowCompare(false);
            toast.success('Found competitive quotes!');
        }
    });

    const handleCompare = (e) => {
        e.preventDefault();
        compareMutation.mutate(compareData);
    };

    const groupedQuotes = quotes.reduce((acc, quote) => {
        if (!acc[quote.insurance_type]) acc[quote.insurance_type] = [];
        acc[quote.insurance_type].push(quote);
        return acc;
    }, {});

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Insurance Shopping</h1>
                            <p className="text-[#1A2B44]/60">AI-powered insurance comparison and recommendations</p>
                        </div>
                        <Button onClick={() => setShowCompare(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Sparkles className="w-5 h-5 mr-2" />
                            Compare Quotes
                        </Button>
                    </div>
                </div>

                {/* No Quotes State */}
                {quotes.length === 0 && (
                    <Card className="border-[#D4AF37]/30">
                        <CardContent className="pt-6 text-center py-12">
                            <Shield className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
                            <h3 className="text-xl font-light text-[#1A2B44] mb-2">Find Better Insurance Rates</h3>
                            <p className="text-[#1A2B44]/60 mb-6">
                                Compare quotes from top providers and save on your insurance premiums
                            </p>
                            <Button onClick={() => setShowCompare(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                Get Started
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Quotes by Category */}
                {Object.entries(groupedQuotes).map(([type, typeQuotes]) => (
                    <div key={type} className="mb-8">
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-4 capitalize">
                            {type.replace('_', ' ')} Insurance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {typeQuotes
                                .sort((a, b) => b.ai_recommendation_score - a.ai_recommendation_score)
                                .map((quote) => (
                                <Card key={quote.id} className={
                                    quote.ai_recommendation_score >= 8 
                                        ? 'border-2 border-[#D4AF37] shadow-lg' 
                                        : ''
                                }>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{quote.provider}</CardTitle>
                                                {quote.ai_recommendation_score >= 8 && (
                                                    <Badge className="bg-[#D4AF37] text-black mt-2">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Top Pick
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium">{quote.ai_recommendation_score}/10</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Pricing */}
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                                                <div className="text-3xl font-light text-[#1A2B44] mb-1">
                                                    ${quote.monthly_premium}/mo
                                                </div>
                                                <div className="text-sm text-[#1A2B44]/60">
                                                    ${quote.annual_premium}/year
                                                </div>
                                            </div>

                                            {/* Coverage */}
                                            <div>
                                                <div className="text-sm text-[#1A2B44]/60 mb-1">Coverage</div>
                                                <div className="font-medium text-[#1A2B44]">
                                                    ${quote.coverage_amount?.toLocaleString()}
                                                </div>
                                            </div>

                                            {quote.deductible && (
                                                <div>
                                                    <div className="text-sm text-[#1A2B44]/60 mb-1">Deductible</div>
                                                    <div className="font-medium text-[#1A2B44]">
                                                        ${quote.deductible.toLocaleString()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pros */}
                                            {quote.pros?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium text-[#1A2B44] mb-2">Pros</div>
                                                    <ul className="space-y-1">
                                                        {quote.pros.slice(0, 3).map((pro, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                                                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                {pro}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Cons */}
                                            {quote.cons?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium text-[#1A2B44] mb-2">Cons</div>
                                                    <ul className="space-y-1">
                                                        {quote.cons.slice(0, 2).map((con, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                                                                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                {con}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <Button className="w-full bg-[#D4AF37] hover:bg-[#C5A059] text-black">
                                                View Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Compare Dialog */}
                <Dialog open={showCompare} onOpenChange={setShowCompare}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Compare Insurance Quotes</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCompare} className="space-y-4">
                            <div>
                                <Label>Insurance Type</Label>
                                <Select
                                    value={compareData.insurance_type}
                                    onValueChange={(value) => setCompareData({ ...compareData, insurance_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto Insurance</SelectItem>
                                        <SelectItem value="home">Home Insurance</SelectItem>
                                        <SelectItem value="life">Life Insurance</SelectItem>
                                        <SelectItem value="health">Health Insurance</SelectItem>
                                        <SelectItem value="umbrella">Umbrella Insurance</SelectItem>
                                        <SelectItem value="renters">Renters Insurance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Coverage Amount</Label>
                                <Input
                                    type="number"
                                    value={compareData.coverage_amount}
                                    onChange={(e) => setCompareData({ ...compareData, coverage_amount: e.target.value })}
                                    placeholder="100000"
                                    required
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    Our AI will research and compare quotes from major providers based on your needs
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowCompare(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={compareMutation.isPending} 
                                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                                >
                                    {compareMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    Compare Quotes
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}