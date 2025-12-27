import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Sparkles, AlertCircle, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function RentPricingSuggestions({ property, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const getAnalysis = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getRentPricingSuggestions', {
                property_id: property.id
            });
            setAnalysis(result.data.analysis);
            toast.success('Rent pricing analysis complete!');
        } catch (error) {
            toast.error('Failed to analyze rent pricing');
        } finally {
            setLoading(false);
        }
    };

    const applyRecommendedRent = async () => {
        if (!analysis?.recommended_rent) return;
        
        try {
            await base44.entities.Property.update(property.id, {
                monthly_rent: analysis.recommended_rent
            });
            toast.success('Rent price updated!');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to update rent');
        }
    };

    const getConfidenceColor = (level) => {
        const colors = {
            high: 'bg-green-100 text-green-700 border-green-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-orange-100 text-orange-700 border-orange-200'
        };
        return colors[level] || colors.medium;
    };

    const getPriceDifference = () => {
        if (!analysis?.recommended_rent || !property.monthly_rent) return null;
        const diff = analysis.recommended_rent - property.monthly_rent;
        const percentDiff = ((diff / property.monthly_rent) * 100).toFixed(1);
        return { diff, percentDiff };
    };

    return (
        <div className="space-y-6">
            {!analysis ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C5A059]/10 rounded-full mb-4">
                                <DollarSign className="w-8 h-8 text-[#C5A059]" />
                            </div>
                            <h3 className="text-lg font-light text-[#0F172A] mb-2">
                                AI Rent Pricing Analysis
                            </h3>
                            <p className="text-sm text-[#64748B] mb-6">
                                Get data-driven recommendations for optimal rent pricing
                            </p>
                            <Button
                                onClick={getAnalysis}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] hover:shadow-lg"
                            >
                                <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Analyzing...' : 'Analyze Rent Pricing'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Recommended Rent */}
                    <Card className="border-[#C5A059]/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                                    <Target className="w-5 h-5 text-[#C5A059]" />
                                    Recommended Rent
                                </CardTitle>
                                <Badge className={getConfidenceColor(analysis.confidence_level)}>
                                    {analysis.confidence_level} confidence
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                                    <div className="text-sm text-[#64748B] mb-2">Recommended</div>
                                    <div className="text-3xl font-light text-[#C5A059]">
                                        ${analysis.recommended_rent.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-[#64748B] mt-1">/month</div>
                                </div>
                                <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                                    <div className="text-sm text-[#64748B] mb-2">Current Rent</div>
                                    <div className="text-3xl font-light text-[#0F172A]">
                                        ${property.monthly_rent?.toLocaleString() || 0}
                                    </div>
                                    <div className="text-xs text-[#64748B] mt-1">/month</div>
                                </div>
                                <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                                    <div className="text-sm text-[#64748B] mb-2">Difference</div>
                                    {getPriceDifference() && (
                                        <>
                                            <div className={`text-3xl font-light ${getPriceDifference().diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {getPriceDifference().diff >= 0 ? '+' : ''}${getPriceDifference().diff.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-[#64748B] mt-1">
                                                {getPriceDifference().percentDiff >= 0 ? '+' : ''}{getPriceDifference().percentDiff}%
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h5 className="text-sm font-medium text-blue-900 mb-2">Price Range</h5>
                                <div className="flex items-center justify-between text-sm text-blue-800">
                                    <span>Min: ${analysis.price_range.min.toLocaleString()}</span>
                                    <span>•</span>
                                    <span>Max: ${analysis.price_range.max.toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="text-sm text-[#64748B] mb-4">{analysis.current_vs_recommended}</p>

                            {property.monthly_rent !== analysis.recommended_rent && (
                                <Button
                                    onClick={applyRecommendedRent}
                                    className="w-full bg-[#C5A059] text-white hover:bg-[#D4AF37]"
                                >
                                    Apply Recommended Rent
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Market Trends */}
                    {analysis.market_trends?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                                    <TrendingUp className="w-5 h-5 text-[#C5A059]" />
                                    Market Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analysis.market_trends.map((trend, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-[#F8F9FA] rounded-lg">
                                            {trend.impact === 'positive' ? (
                                                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                                            ) : trend.impact === 'negative' ? (
                                                <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium text-[#0F172A] mb-1">{trend.trend}</div>
                                                <div className="text-sm text-[#64748B]">{trend.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Revenue Strategies */}
                    {analysis.revenue_strategies?.length > 0 && (
                        <Card className="border-green-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-900">
                                    <DollarSign className="w-5 h-5" />
                                    Revenue Optimization
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.revenue_strategies.map((strategy, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                                            <span className="text-green-600 mt-0.5">→</span>
                                            <span>{strategy}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Increase Schedule */}
                    {analysis.increase_schedule && (
                        <Card className="border-purple-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-900">
                                    <Calendar className="w-5 h-5" />
                                    Suggested Increase Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-sm text-[#64748B] mb-1">Next Increase</div>
                                        <div className="font-medium text-[#0F172A]">
                                            {analysis.increase_schedule.next_increase_date}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748B] mb-1">Amount</div>
                                        <div className="font-medium text-[#0F172A]">
                                            ${analysis.increase_schedule.suggested_amount}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748B] mb-1">Frequency</div>
                                        <div className="font-medium text-[#0F172A]">
                                            {analysis.increase_schedule.frequency}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Key Factors */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-[#0F172A]">Key Pricing Factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {analysis.key_factors?.map((factor, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-3 bg-[#F8F9FA] rounded-lg">
                                        <div className="w-2 h-2 bg-[#C5A059] rounded-full"></div>
                                        <span className="text-sm text-[#0F172A]">{factor}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Projections */}
                    {analysis.annual_revenue_projection && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardContent className="pt-6 text-center">
                                    <div className="text-sm text-blue-700 mb-2">Annual Revenue Projection</div>
                                    <div className="text-3xl font-light text-blue-900">
                                        ${analysis.annual_revenue_projection.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                <CardContent className="pt-6 text-center">
                                    <div className="text-sm text-green-700 mb-2">ROI Improvement</div>
                                    <div className="text-xl font-light text-green-900">
                                        {analysis.roi_improvement}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Button
                        onClick={getAnalysis}
                        variant="outline"
                        className="w-full"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Refresh Analysis
                    </Button>
                </>
            )}
        </div>
    );
}