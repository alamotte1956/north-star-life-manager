import React, { useState } from 'react';
import logger from '@/utils/logger'
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ScenarioSimulator({ totalWealth }) {
    const [loading, setLoading] = useState(false);
    const [scenario, setScenario] = useState({
        years: 10,
        annual_return: 7,
        annual_contribution: 0,
        inflation_rate: 3,
        major_expense: 0,
        major_expense_year: 5,
        tax_rate: 25
    });
    const [results, setResults] = useState(null);

    const runSimulation = async () => {
        setLoading(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `As a financial planning expert, analyze this wealth accumulation scenario:

Current Wealth: $${totalWealth.toLocaleString()}
Time Horizon: ${scenario.years} years
Expected Annual Return: ${scenario.annual_return}%
Annual Contribution: $${scenario.annual_contribution.toLocaleString()}
Inflation Rate: ${scenario.inflation_rate}%
Major Expense: $${scenario.major_expense.toLocaleString()} in year ${scenario.major_expense_year}
Tax Rate: ${scenario.tax_rate}%

Provide:
1. Year-by-year wealth projection (calculate compound growth with contributions, subtract major expense in specified year, adjust for inflation and taxes)
2. Final wealth value at end of time horizon
3. Real wealth (inflation-adjusted)
4. Key insights and risks
5. Strategic recommendations

Return as JSON with structure:
{
    "yearly_projections": [{"year": 1, "nominal_value": 0, "real_value": 0, "contributions": 0}, ...],
    "final_nominal_wealth": 0,
    "final_real_wealth": 0,
    "total_contributions": 0,
    "total_growth": 0,
    "insights": ["insight1", "insight2", ...],
    "risks": ["risk1", "risk2", ...],
    "recommendations": ["rec1", "rec2", ...]
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        yearly_projections: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    year: { type: "number" },
                                    nominal_value: { type: "number" },
                                    real_value: { type: "number" },
                                    contributions: { type: "number" }
                                }
                            }
                        },
                        final_nominal_wealth: { type: "number" },
                        final_real_wealth: { type: "number" },
                        total_contributions: { type: "number" },
                        total_growth: { type: "number" },
                        insights: { type: "array", items: { type: "string" } },
                        risks: { type: "array", items: { type: "string" } },
                        recommendations: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setResults(response);
        } catch (error) {
            logger.error('Simulation error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configure Your Scenario</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Time Horizon (Years)</Label>
                            <Input
                                type="number"
                                value={scenario.years}
                                onChange={(e) => setScenario({ ...scenario, years: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Expected Annual Return (%)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={scenario.annual_return}
                                onChange={(e) => setScenario({ ...scenario, annual_return: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Annual Contribution ($)</Label>
                            <Input
                                type="number"
                                value={scenario.annual_contribution}
                                onChange={(e) => setScenario({ ...scenario, annual_contribution: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Inflation Rate (%)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={scenario.inflation_rate}
                                onChange={(e) => setScenario({ ...scenario, inflation_rate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Major Expense ($)</Label>
                            <Input
                                type="number"
                                value={scenario.major_expense}
                                onChange={(e) => setScenario({ ...scenario, major_expense: parseFloat(e.target.value) || 0 })}
                                placeholder="e.g., home purchase, education"
                            />
                        </div>
                        <div>
                            <Label>Expense Year</Label>
                            <Input
                                type="number"
                                value={scenario.major_expense_year}
                                onChange={(e) => setScenario({ ...scenario, major_expense_year: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Tax Rate (%)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={scenario.tax_rate}
                                onChange={(e) => setScenario({ ...scenario, tax_rate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <Button
                        onClick={runSimulation}
                        disabled={loading}
                        className="w-full mt-6 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Simulating...
                            </>
                        ) : (
                            'Run Simulation'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {results && (
                <>
                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Wealth Projection</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={results.yearly_projections}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                                    <YAxis label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="nominal_value" stroke="#2E5C8A" name="Nominal Value" strokeWidth={2} />
                                    <Line type="monotone" dataKey="real_value" stroke="#D4AF37" name="Real Value (Inflation-Adjusted)" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Final Wealth</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-[#0F1729]/60 mb-1">Nominal Value</p>
                                        <p className="text-2xl font-light text-[#2E5C8A]">
                                            ${results.final_nominal_wealth.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#0F1729]/60 mb-1">Real Value (Today's Dollars)</p>
                                        <p className="text-2xl font-light text-[#D4AF37]">
                                            ${results.final_real_wealth.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#0F1729]/60 mb-1">Total Growth</p>
                                        <p className="text-2xl font-light text-green-600">
                                            +${results.total_growth.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Key Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {results.insights.map((insight, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            {insight}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Risks & Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-lg text-red-900">Potential Risks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {results.risks.map((risk, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <TrendingDown className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-green-200">
                            <CardHeader>
                                <CardTitle className="text-lg text-green-900">Recommendations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {results.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                            <Minus className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}