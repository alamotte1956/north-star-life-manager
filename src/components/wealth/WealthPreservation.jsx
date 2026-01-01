import React, { useState } from 'react';
import logger from '@/utils/logger'
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WealthPreservation({ totalWealth }) {
    const [loading, setLoading] = useState(false);
    const [age, setAge] = useState('');
    const [riskTolerance, setRiskTolerance] = useState('moderate');
    const [strategies, setStrategies] = useState(null);

    const analyzePreservation = async () => {
        setLoading(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `As a wealth preservation expert, provide comprehensive strategies for:

Total Wealth: $${totalWealth.toLocaleString()}
Age: ${age}
Risk Tolerance: ${riskTolerance}

Provide personalized wealth preservation strategies covering:
1. Asset allocation recommendations
2. Diversification strategies
3. Inflation protection
4. Market risk mitigation
5. Insurance strategies (life, disability, long-term care, umbrella)
6. Asset protection structures (LLCs, trusts)
7. Tax-efficient strategies
8. Emergency fund recommendations
9. Income generation strategies
10. Succession planning integration

Return as JSON with structure:
{
    "asset_allocation": {
        "stocks": 0,
        "bonds": 0,
        "real_estate": 0,
        "cash": 0,
        "alternatives": 0,
        "rationale": "explanation"
    },
    "diversification": [{"strategy": "name", "description": "details", "priority": "high/medium/low"}, ...],
    "inflation_protection": [{"method": "name", "description": "details"}, ...],
    "risk_mitigation": [{"risk": "type", "mitigation": "approach"}, ...],
    "insurance_needs": [{"type": "insurance type", "coverage": "amount", "purpose": "why needed"}, ...],
    "asset_protection": [{"structure": "name", "benefits": ["benefit1", ...], "considerations": ["consideration1", ...]}, ...],
    "tax_strategies": [{"strategy": "name", "savings_potential": "estimated amount"}, ...],
    "emergency_fund": {"recommended_amount": 0, "current_status": "assessment", "gap": 0},
    "income_generation": [{"source": "name", "potential_income": "amount", "risk_level": "low/medium/high"}, ...],
    "action_items": [{"priority": "high/medium/low", "action": "what to do", "timeframe": "when"}, ...]
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        asset_allocation: {
                            type: "object",
                            properties: {
                                stocks: { type: "number" },
                                bonds: { type: "number" },
                                real_estate: { type: "number" },
                                cash: { type: "number" },
                                alternatives: { type: "number" },
                                rationale: { type: "string" }
                            }
                        },
                        diversification: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    strategy: { type: "string" },
                                    description: { type: "string" },
                                    priority: { type: "string" }
                                }
                            }
                        },
                        inflation_protection: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    method: { type: "string" },
                                    description: { type: "string" }
                                }
                            }
                        },
                        risk_mitigation: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    risk: { type: "string" },
                                    mitigation: { type: "string" }
                                }
                            }
                        },
                        insurance_needs: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    coverage: { type: "string" },
                                    purpose: { type: "string" }
                                }
                            }
                        },
                        asset_protection: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    structure: { type: "string" },
                                    benefits: { type: "array", items: { type: "string" } },
                                    considerations: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        tax_strategies: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    strategy: { type: "string" },
                                    savings_potential: { type: "string" }
                                }
                            }
                        },
                        emergency_fund: {
                            type: "object",
                            properties: {
                                recommended_amount: { type: "number" },
                                current_status: { type: "string" },
                                gap: { type: "number" }
                            }
                        },
                        income_generation: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    source: { type: "string" },
                                    potential_income: { type: "string" },
                                    risk_level: { type: "string" }
                                }
                            }
                        },
                        action_items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    priority: { type: "string" },
                                    action: { type: "string" },
                                    timeframe: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setStrategies(response);
        } catch (error) {
            logger.error('Analysis error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Preservation Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Your Age</Label>
                            <Input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="e.g., 45"
                            />
                        </div>
                        <div>
                            <Label>Risk Tolerance</Label>
                            <select
                                value={riskTolerance}
                                onChange={(e) => setRiskTolerance(e.target.value)}
                                className="w-full h-10 px-3 border rounded-md"
                            >
                                <option value="conservative">Conservative</option>
                                <option value="moderate">Moderate</option>
                                <option value="aggressive">Aggressive</option>
                            </select>
                        </div>
                    </div>
                    <Button
                        onClick={analyzePreservation}
                        disabled={loading || !age}
                        className="w-full mt-6 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            'Get Preservation Strategy'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {strategies && (
                <>
                    {/* Asset Allocation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recommended Asset Allocation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <span>Stocks</span>
                                    <span className="font-medium">{strategies.asset_allocation.stocks}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${strategies.asset_allocation.stocks}%` }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Bonds</span>
                                    <span className="font-medium">{strategies.asset_allocation.bonds}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${strategies.asset_allocation.bonds}%` }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Real Estate</span>
                                    <span className="font-medium">{strategies.asset_allocation.real_estate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${strategies.asset_allocation.real_estate}%` }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Cash</span>
                                    <span className="font-medium">{strategies.asset_allocation.cash}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-gray-600 h-2 rounded-full" style={{ width: `${strategies.asset_allocation.cash}%` }} />
                                </div>

                                <div className="flex justify-between items-center">
                                    <span>Alternatives</span>
                                    <span className="font-medium">{strategies.asset_allocation.alternatives}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${strategies.asset_allocation.alternatives}%` }} />
                                </div>
                            </div>
                            <p className="text-sm text-[#0F1729]/70 p-4 bg-gray-50 rounded-lg">
                                {strategies.asset_allocation.rationale}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Insurance Needs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Insurance Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {strategies.insurance_needs.map((insurance, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium">{insurance.type}</h4>
                                            <Badge>{insurance.coverage}</Badge>
                                        </div>
                                        <p className="text-sm text-[#0F1729]/70">{insurance.purpose}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tax Strategies */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tax-Efficient Strategies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {strategies.tax_strategies.map((strategy, idx) => (
                                    <div key={idx} className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                                        <span className="text-sm font-medium">{strategy.strategy}</span>
                                        <Badge className="bg-green-600">Save {strategy.savings_potential}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Priority Action Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {strategies.action_items.map((item, idx) => (
                                    <div key={idx} className="p-4 border-l-4 border-[#4A90E2] bg-blue-50">
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge className={
                                                item.priority === 'high' ? 'bg-red-600' :
                                                item.priority === 'medium' ? 'bg-yellow-600' :
                                                'bg-green-600'
                                            }>
                                                {item.priority} priority
                                            </Badge>
                                            <span className="text-xs text-[#0F1729]/60">{item.timeframe}</span>
                                        </div>
                                        <p className="text-sm">{item.action}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}