import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Minus, DollarSign, AlertCircle, Sparkles, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertyValuation({ property, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [valuation, setValuation] = useState(null);
    const [manualInputOpen, setManualInputOpen] = useState(false);
    const [appraisalData, setAppraisalData] = useState({
        appraised_value: '',
        appraisal_date: '',
        appraiser_name: '',
        notes: ''
    });

    const generateValuation = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getPropertyValuation', {
                property_id: property.id
            });
            setValuation(result.data.valuation);
            toast.success('Valuation report generated!');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to generate valuation');
        } finally {
            setLoading(false);
        }
    };

    const saveManualAppraisal = async () => {
        try {
            await base44.entities.Property.update(property.id, {
                current_value: parseFloat(appraisalData.appraised_value),
                notes: `Manual Appraisal (${appraisalData.appraisal_date}): ${appraisalData.appraiser_name}\n${appraisalData.notes}\n\n${property.notes || ''}`
            });
            toast.success('Appraisal data saved!');
            setManualInputOpen(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to save appraisal');
        }
    };

    const getTrendIcon = (trend) => {
        if (trend === 'rising') return <TrendingUp className="w-5 h-5 text-green-600" />;
        if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-600" />;
        return <Minus className="w-5 h-5 text-gray-600" />;
    };

    const getOutlookColor = (rating) => {
        const colors = {
            excellent: 'bg-green-100 text-green-700',
            good: 'bg-blue-100 text-blue-700',
            fair: 'bg-yellow-100 text-yellow-700',
            poor: 'bg-red-100 text-red-700'
        };
        return colors[rating] || colors.fair;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#1A2B44] flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                    Property Valuation
                </h3>
                <div className="flex gap-2">
                    <Dialog open={manualInputOpen} onOpenChange={setManualInputOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Manual Appraisal
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Enter Appraisal Data</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Appraised Value ($)</Label>
                                    <Input
                                        type="number"
                                        value={appraisalData.appraised_value}
                                        onChange={(e) => setAppraisalData({...appraisalData, appraised_value: e.target.value})}
                                        placeholder="500000"
                                    />
                                </div>
                                <div>
                                    <Label>Appraisal Date</Label>
                                    <Input
                                        type="date"
                                        value={appraisalData.appraisal_date}
                                        onChange={(e) => setAppraisalData({...appraisalData, appraisal_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Appraiser Name</Label>
                                    <Input
                                        value={appraisalData.appraiser_name}
                                        onChange={(e) => setAppraisalData({...appraisalData, appraiser_name: e.target.value})}
                                        placeholder="John Smith, Licensed Appraiser"
                                    />
                                </div>
                                <div>
                                    <Label>Notes</Label>
                                    <Input
                                        value={appraisalData.notes}
                                        onChange={(e) => setAppraisalData({...appraisalData, notes: e.target.value})}
                                        placeholder="Additional details..."
                                    />
                                </div>
                                <Button onClick={saveManualAppraisal} className="w-full">
                                    Save Appraisal
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={generateValuation} disabled={loading} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                        <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Generating...' : 'AI Valuation'}
                    </Button>
                </div>
            </div>

            {valuation && (
                <div className="space-y-6">
                    {/* Estimated Value */}
                    <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/5 border-[#D4AF37]/30">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-sm text-gray-600 mb-2">Estimated Market Value</div>
                                <div className="text-4xl font-bold text-[#1A2B44] mb-2">
                                    ${valuation.estimated_value.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Range: ${valuation.value_range_low.toLocaleString()} - ${valuation.value_range_high.toLocaleString()}
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-4">
                                    <Badge className="bg-blue-100 text-blue-700">
                                        Confidence: {valuation.confidence_score}/10
                                    </Badge>
                                    {valuation.appreciation_rate && (
                                        <Badge className="bg-green-100 text-green-700">
                                            +{valuation.appreciation_rate}% annual
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Market Conditions */}
                    {valuation.market_conditions && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    {getTrendIcon(valuation.market_conditions.trend)}
                                    Market Conditions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Market Trend</span>
                                    <Badge className={
                                        valuation.market_conditions.trend === 'rising' ? 'bg-green-100 text-green-700' :
                                        valuation.market_conditions.trend === 'declining' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }>
                                        {valuation.market_conditions.trend}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-700">{valuation.market_conditions.description}</p>
                                {valuation.market_conditions.median_price && (
                                    <div className="text-sm text-gray-600">
                                        Median Price: ${valuation.market_conditions.median_price.toLocaleString()}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Key Value Drivers */}
                    {valuation.key_value_drivers?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Key Value Drivers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {valuation.key_value_drivers.map((driver, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="text-[#D4AF37]">•</span>
                                            {driver}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comparable Properties */}
                    {valuation.comparable_properties?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Comparable Sales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {valuation.comparable_properties.map((comp, idx) => (
                                        <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">{comp.address}</div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {comp.size} • Sold {comp.sold_date}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-[#D4AF37]">
                                                ${comp.price.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Value Improvements */}
                    {valuation.value_improvement_suggestions?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Value Enhancement Opportunities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {valuation.value_improvement_suggestions.map((suggestion, idx) => (
                                        <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-medium text-blue-900">{suggestion.improvement}</h5>
                                                <Badge className="bg-green-100 text-green-700">
                                                    {suggestion.roi_percentage}% ROI
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                                <div>Est. Cost: ${suggestion.estimated_cost.toLocaleString()}</div>
                                                <div>Value Increase: ${suggestion.potential_value_increase.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Investment Outlook */}
                    {valuation.investment_outlook && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Investment Outlook</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge className={getOutlookColor(valuation.investment_outlook.rating)}>
                                        {valuation.investment_outlook.rating.toUpperCase()}
                                    </Badge>
                                    {valuation.investment_outlook.hold_recommendation && (
                                        <Badge className="bg-blue-100 text-blue-700">Hold Recommended</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700">{valuation.investment_outlook.summary}</p>
                                {valuation.investment_outlook.timeframe && (
                                    <div className="text-sm text-gray-600">
                                        Timeframe: {valuation.investment_outlook.timeframe}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Risk Factors */}
                    {valuation.risk_factors?.length > 0 && (
                        <Card className="border-orange-200">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                                    <AlertCircle className="w-5 h-5" />
                                    Risk Factors
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {valuation.risk_factors.map((risk, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-orange-800">
                                            <span>⚠️</span>
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Seasonal Factors */}
                    {valuation.seasonal_factors && property.seasonal && (
                        <Card className="bg-purple-50 border-purple-200">
                            <CardHeader>
                                <CardTitle className="text-base text-purple-900">Seasonal Property Factors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-purple-800">{valuation.seasonal_factors}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}