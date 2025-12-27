import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRentPredictor({ property, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);

    const handlePredict = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('predictOptimalRent', {
                property_id: property.id
            });

            setPrediction(result.data);
            toast.success('Rent prediction complete!');
        } catch (error) {
            toast.error('Failed to predict rent');
        }
        setLoading(false);
    };

    const handleApplyRent = async (amount) => {
        try {
            await base44.entities.Property.update(property.id, {
                monthly_rent: amount
            });
            toast.success('Rent updated successfully!');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to update rent');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    AI Rent Price Predictor
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {property.monthly_rent && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <p className="text-xs text-gray-600 mb-1">Current Rent</p>
                        <p className="text-2xl font-light">${property.monthly_rent.toLocaleString()}/month</p>
                    </div>
                )}

                <Button
                    onClick={handlePredict}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600"
                >
                    <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing Market...' : 'Predict Optimal Rent'}
                </Button>

                {prediction?.prediction && (
                    <div className="space-y-4 mt-4">
                        {/* Confidence Badge */}
                        <div className="flex justify-center">
                            <Badge className={
                                prediction.prediction.confidence_level === 'high' ? 'bg-green-100 text-green-800' :
                                prediction.prediction.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-orange-100 text-orange-800'
                            }>
                                {prediction.prediction.confidence_level} confidence
                            </Badge>
                        </div>

                        {/* Recommended Rent Range */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                                <p className="text-xs text-blue-700 mb-1">Low</p>
                                <p className="text-lg font-semibold text-blue-900">
                                    ${prediction.prediction.recommended_rent.low.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border-2 border-green-500 text-center">
                                <p className="text-xs text-green-700 mb-1">Optimal</p>
                                <p className="text-xl font-bold text-green-900">
                                    ${prediction.prediction.recommended_rent.optimal.toLocaleString()}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => handleApplyRent(prediction.prediction.recommended_rent.optimal)}
                                    className="mt-2 w-full bg-green-600"
                                >
                                    Apply
                                </Button>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                                <p className="text-xs text-orange-700 mb-1">High</p>
                                <p className="text-lg font-semibold text-orange-900">
                                    ${prediction.prediction.recommended_rent.high.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Change Analysis */}
                        {prediction.change_analysis && (
                            <div className={`p-4 rounded-lg border ${
                                prediction.change_analysis.percent_change > 5 ? 'bg-green-50 border-green-200' :
                                prediction.change_analysis.percent_change < -5 ? 'bg-red-50 border-red-200' :
                                'bg-blue-50 border-blue-200'
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    <p className="text-sm font-medium">Impact Analysis</p>
                                </div>
                                <p className="text-sm mb-2">{prediction.change_analysis.recommendation}</p>
                                {Math.abs(prediction.change_analysis.percent_change) > 5 && (
                                    <p className="text-xs">
                                        Annual impact: <span className="font-semibold">
                                            ${Math.abs(prediction.change_analysis.annual_impact).toLocaleString()}
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Market Analysis */}
                        <div className="bg-white p-4 rounded-lg border">
                            <p className="text-xs font-medium mb-2">Market Analysis</p>
                            <p className="text-sm text-gray-700">{prediction.prediction.market_analysis}</p>
                        </div>

                        {/* Pricing Factors */}
                        {prediction.prediction.pricing_factors && (
                            <div className="grid grid-cols-2 gap-3">
                                {prediction.prediction.pricing_factors.positive?.length > 0 && (
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                        <p className="text-xs font-medium text-green-900 mb-2">Positive Factors</p>
                                        <ul className="space-y-1">
                                            {prediction.prediction.pricing_factors.positive.map((factor, idx) => (
                                                <li key={idx} className="text-xs text-green-800 flex items-start gap-1">
                                                    <span>+</span>
                                                    <span>{factor}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {prediction.prediction.pricing_factors.negative?.length > 0 && (
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                        <p className="text-xs font-medium text-red-900 mb-2">Negative Factors</p>
                                        <ul className="space-y-1">
                                            {prediction.prediction.pricing_factors.negative.map((factor, idx) => (
                                                <li key={idx} className="text-xs text-red-800 flex items-start gap-1">
                                                    <span>-</span>
                                                    <span>{factor}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Additional Insights */}
                        {prediction.prediction.seasonal_considerations && (
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <p className="text-xs font-medium text-purple-900 mb-1">Seasonal Considerations</p>
                                <p className="text-sm text-purple-800">{prediction.prediction.seasonal_considerations}</p>
                            </div>
                        )}

                        {prediction.prediction.optimization_strategy && (
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                <p className="text-xs font-medium text-indigo-900 mb-1">Optimization Strategy</p>
                                <p className="text-sm text-indigo-800">{prediction.prediction.optimization_strategy}</p>
                            </div>
                        )}

                        {prediction.prediction.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg border flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                                <p className="text-xs text-gray-700">{prediction.prediction.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}