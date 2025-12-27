import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Target, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function PersonalizedStrategy() {
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState(null);
    const [preferences, setPreferences] = useState({
        risk_tolerance: 'moderate',
        time_horizon: 'medium-term (5-10 years)',
        investment_goals: 'wealth accumulation'
    });

    const generateStrategy = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('generateInvestmentStrategy', preferences);
            setStrategy(result.data.strategy);
            toast.success('Personalized strategy generated!');
        } catch (error) {
            toast.error('Failed to generate strategy');
        }
        setLoading(false);
    };

    return (
        <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Personalized Investment Strategy
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Risk Tolerance</Label>
                        <Select value={preferences.risk_tolerance} onValueChange={(value) => setPreferences({...preferences, risk_tolerance: value})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="conservative">Conservative</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="aggressive">Aggressive</SelectItem>
                                <SelectItem value="very_aggressive">Very Aggressive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Time Horizon</Label>
                        <Select value={preferences.time_horizon} onValueChange={(value) => setPreferences({...preferences, time_horizon: value})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="short-term (1-3 years)">Short-term (1-3 years)</SelectItem>
                                <SelectItem value="medium-term (5-10 years)">Medium-term (5-10 years)</SelectItem>
                                <SelectItem value="long-term (10+ years)">Long-term (10+ years)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Primary Goal</Label>
                        <Input 
                            value={preferences.investment_goals}
                            onChange={(e) => setPreferences({...preferences, investment_goals: e.target.value})}
                            placeholder="e.g., retirement, house down payment"
                        />
                    </div>
                </div>

                <Button
                    onClick={generateStrategy}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                >
                    <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Generating Strategy...' : 'Generate Personalized Strategy'}
                </Button>

                {strategy && (
                    <div className="space-y-4 mt-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                            <h3 className="font-bold text-lg text-green-900 mb-2">{strategy.strategy_name}</h3>
                            <p className="text-sm text-green-800">{strategy.summary}</p>
                        </div>

                        {/* Recommended Allocation */}
                        {strategy.recommended_allocation && (
                            <div className="bg-white p-4 rounded-lg border">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Recommended Allocation
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(strategy.recommended_allocation)
                                        .filter(([_, value]) => value > 0)
                                        .map(([type, percentage]) => (
                                            <div key={type} className="bg-gray-50 p-3 rounded border">
                                                <p className="text-xs text-gray-600 capitalize">{type}</p>
                                                <p className="text-xl font-bold text-green-600">{percentage}%</p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Expected Returns */}
                        {strategy.expected_returns && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">Expected Returns</h4>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <p className="text-xs text-blue-700">Conservative</p>
                                        <p className="font-semibold text-blue-900">{strategy.expected_returns.conservative}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-700">Moderate</p>
                                        <p className="font-semibold text-blue-900">{strategy.expected_returns.moderate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-700">Aggressive</p>
                                        <p className="font-semibold text-blue-900">{strategy.expected_returns.aggressive}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Steps */}
                        {strategy.action_steps?.length > 0 && (
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                <h4 className="font-semibold text-indigo-900 mb-2">Action Steps</h4>
                                <ol className="space-y-1">
                                    {strategy.action_steps.map((step, idx) => (
                                        <li key={idx} className="text-sm text-indigo-800 flex items-start gap-2">
                                            <span className="font-bold">{idx + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Other Sections */}
                        {strategy.risk_management && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <h4 className="text-sm font-semibold text-orange-900 mb-1">Risk Management</h4>
                                <p className="text-sm text-orange-800">{strategy.risk_management}</p>
                            </div>
                        )}

                        {strategy.things_to_avoid?.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <h4 className="text-sm font-semibold text-red-900 mb-2">Things to Avoid</h4>
                                <ul className="space-y-1">
                                    {strategy.things_to_avoid.map((item, idx) => (
                                        <li key={idx} className="text-xs text-red-800 flex items-start gap-1">
                                            <span>✗</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}