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
import { Shield, TrendingUp, CheckCircle, X, Loader2, Sparkles, Heart, DollarSign, Activity, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function InsuranceShopping() {
    const [showCompare, setShowCompare] = useState(false);
    const [compareData, setCompareData] = useState({
        insurance_type: '',
        coverage_amount: ''
    });
    const [personalizedAnalysis, setPersonalizedAnalysis] = useState(null);
    const [selectedQuote, setSelectedQuote] = useState(null);
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
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['insurance-quotes'] });
            setShowCompare(false);
            setPersonalizedAnalysis(response.data);
            toast.success('Found personalized recommendations!');
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
                            <p className="text-[#1A2B44]/60">Personalized recommendations based on your health & financial profile</p>
                        </div>
                        <Button onClick={() => setShowCompare(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Sparkles className="w-5 h-5 mr-2" />
                            Get Personalized Quotes
                        </Button>
                    </div>
                </div>

                {/* Personalized Analysis Summary */}
                {personalizedAnalysis && (
                    <div className="mb-8 space-y-4">
                        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-900">
                                    <Sparkles className="w-5 h-5" />
                                    Personalized Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-purple-900 mb-2">Summary</h4>
                                    <p className="text-sm text-purple-800">{personalizedAnalysis.personalized_summary}</p>
                                </div>
                                {personalizedAnalysis.health_coverage_assessment && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-blue-900 mb-1">Health Coverage Assessment</h4>
                                                <p className="text-sm text-blue-800">{personalizedAnalysis.health_coverage_assessment}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {personalizedAnalysis.budget_impact_analysis && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-green-900 mb-1">Budget Impact</h4>
                                                <p className="text-sm text-green-800">{personalizedAnalysis.budget_impact_analysis}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {personalizedAnalysis.user_profile?.chronic_conditions?.length > 0 && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-amber-900 mb-1">Your Health Profile</h4>
                                                <p className="text-sm text-amber-800">
                                                    Recommendations prioritized for: {personalizedAnalysis.user_profile.chronic_conditions.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

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
                                <Card 
                                    key={quote.id} 
                                    className={`cursor-pointer transition-all ${
                                        quote.ai_recommendation_score >= 8 
                                            ? 'border-2 border-[#D4AF37] shadow-lg' 
                                            : ''
                                    }`}
                                    onClick={() => setSelectedQuote(quote)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{quote.provider}</CardTitle>
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {quote.ai_recommendation_score >= 8 && (
                                                        <Badge className="bg-[#D4AF37] text-black">
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            Top Pick
                                                        </Badge>
                                                    )}
                                                    {quote.coverage_details?.hsa_compatible && (
                                                        <Badge className="bg-blue-100 text-blue-700">
                                                            HSA Compatible
                                                        </Badge>
                                                    )}
                                                    {quote.coverage_details?.affordability_score >= 8 && (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            Affordable
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm font-medium">{quote.ai_recommendation_score}/10</span>
                                                </div>
                                                {quote.coverage_details?.value_score && (
                                                    <div className="text-xs text-gray-600">
                                                        Value: {quote.coverage_details.value_score}/10
                                                    </div>
                                                )}
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

                                            {quote.coverage_details?.out_of_pocket_max && (
                                                <div>
                                                    <div className="text-sm text-[#1A2B44]/60 mb-1">Max Out-of-Pocket</div>
                                                    <div className="font-medium text-[#1A2B44]">
                                                        ${quote.coverage_details.out_of_pocket_max.toLocaleString()}
                                                    </div>
                                                </div>
                                            )}

                                            {quote.coverage_details?.personalization_notes && (
                                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-purple-800">{quote.coverage_details.personalization_notes}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {quote.coverage_details?.condition_coverage?.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium text-[#1A2B44] mb-2">Covers Your Conditions</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {quote.coverage_details.condition_coverage.map((condition, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs">
                                                                <Heart className="w-3 h-3 mr-1" />
                                                                {condition}
                                                            </Badge>
                                                        ))}
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

                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                                <div className="flex items-start gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-purple-900 mb-1">Personalized Recommendations</h4>
                                        <p className="text-sm text-purple-800">
                                            We'll analyze your health metrics, chronic conditions, medications, financial goals, 
                                            and budget to recommend the most suitable plans for you.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        Health Profile
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Budget Analysis
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Activity className="w-3 h-3" />
                                        Risk Assessment
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Financial Goals
                                    </div>
                                </div>
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

                {/* Quote Detail Dialog */}
                {selectedQuote && (
                    <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                    <span>{selectedQuote.provider}</span>
                                    <Badge className="bg-[#D4AF37] text-black">
                                        Score: {selectedQuote.ai_recommendation_score}/10
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                {/* Pricing */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                                    <div className="text-3xl font-light text-[#1A2B44] mb-1">
                                        ${selectedQuote.monthly_premium}/month
                                    </div>
                                    <div className="text-sm text-[#1A2B44]/60">
                                        ${selectedQuote.annual_premium} annually
                                    </div>
                                </div>

                                {/* Key Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Deductible</div>
                                        <div className="font-medium">${selectedQuote.deductible?.toLocaleString()}</div>
                                    </div>
                                    {selectedQuote.coverage_details?.out_of_pocket_max && (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Max Out-of-Pocket</div>
                                            <div className="font-medium">${selectedQuote.coverage_details.out_of_pocket_max.toLocaleString()}</div>
                                        </div>
                                    )}
                                    {selectedQuote.coverage_details?.specialist_copay && (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Specialist Copay</div>
                                            <div className="font-medium">${selectedQuote.coverage_details.specialist_copay}</div>
                                        </div>
                                    )}
                                    {selectedQuote.coverage_details?.prescription_tier && (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Prescription Tier</div>
                                            <div className="font-medium">{selectedQuote.coverage_details.prescription_tier}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Personalization Notes */}
                                {selectedQuote.coverage_details?.personalization_notes && (
                                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Why This Plan Works For You
                                        </h4>
                                        <p className="text-sm text-purple-800">{selectedQuote.coverage_details.personalization_notes}</p>
                                    </div>
                                )}

                                {/* Condition Coverage */}
                                {selectedQuote.coverage_details?.condition_coverage?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Covers Your Health Conditions</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedQuote.coverage_details.condition_coverage.map((condition, i) => (
                                                <Badge key={i} className="bg-green-100 text-green-700">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    {condition}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pros & Cons */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedQuote.pros?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-green-900 mb-2">Pros</h4>
                                            <ul className="space-y-1">
                                                {selectedQuote.pros.map((pro, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                                                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        {pro}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {selectedQuote.cons?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-red-900 mb-2">Cons</h4>
                                            <ul className="space-y-1">
                                                {selectedQuote.cons.map((con, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                                                        <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Scores */}
                                {(selectedQuote.coverage_details?.affordability_score || selectedQuote.coverage_details?.value_score) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedQuote.coverage_details.affordability_score && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="text-sm text-green-700 mb-1">Affordability</div>
                                                <div className="text-2xl font-light text-green-900">
                                                    {selectedQuote.coverage_details.affordability_score}/10
                                                </div>
                                            </div>
                                        )}
                                        {selectedQuote.coverage_details.value_score && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="text-sm text-blue-700 mb-1">Overall Value</div>
                                                <div className="text-2xl font-light text-blue-900">
                                                    {selectedQuote.coverage_details.value_score}/10
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                    Contact Provider
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}