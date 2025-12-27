import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calendar, DollarSign, Sparkles, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import ForecastChart from '../components/forecasting/ForecastChart';
import ScenarioBuilder from '../components/forecasting/ScenarioBuilder';
import RetirementProjection from '../components/forecasting/RetirementProjection';
import GoalTrajectory from '../components/forecasting/GoalTrajectory';
import { toast } from 'sonner';

export default function FinancialForecasting() {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scenario, setScenario] = useState({});
    const [showScenario, setShowScenario] = useState(false);

    const generateForecast = async (scenarioData = {}) => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('generateFinancialForecast', { 
                scenario: scenarioData 
            });
            setForecast(result.data);
            toast.success('Forecast generated!');
        } catch (error) {
            toast.error('Failed to generate forecast');
        }
        setLoading(false);
    };

    const applyScenario = (scenarioData) => {
        setScenario(scenarioData);
        generateForecast(scenarioData);
        setShowScenario(false);
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-green-600 bg-green-50';
        if (score >= 6) return 'text-blue-600 bg-blue-50';
        if (score >= 4) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-2xl">
                                <TrendingUp className="w-8 h-8 text-[#C5A059]" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#0F172A]">Financial Forecasting</h1>
                                <p className="text-[#64748B] font-light">AI-powered projections and scenario planning</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowScenario(!showScenario)}
                                className="gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                What-If Scenarios
                            </Button>
                            <Button
                                onClick={() => generateForecast(scenario)}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white gap-2"
                            >
                                {loading ? 'Generating...' : 'Generate Forecast'}
                            </Button>
                        </div>
                    </div>

                    {Object.keys(scenario).length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Scenario Active</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setScenario({});
                                        generateForecast({});
                                    }}
                                >
                                    Clear Scenario
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scenario Builder */}
                {showScenario && (
                    <div className="mb-6">
                        <ScenarioBuilder 
                            onApply={applyScenario}
                            onCancel={() => setShowScenario(false)}
                        />
                    </div>
                )}

                {!forecast && !loading && (
                    <Card className="border-[#C5A059]/30">
                        <CardContent className="pt-6 text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-light text-black mb-2">Financial Forecasting</h3>
                            <p className="text-black/60 mb-6 max-w-md mx-auto">
                                Get AI-powered projections for your net worth, retirement readiness, and financial goals over 1, 5, and 10 years.
                            </p>
                            <Button 
                                onClick={() => generateForecast()}
                                className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                            >
                                Generate Your Forecast
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {forecast && (
                    <div className="space-y-6">
                        {/* Current Snapshot */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Current Financial Snapshot</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-2xl font-light text-[#0F172A]">
                                            ${forecast.current_snapshot.net_worth.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-[#64748B]">Net Worth</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-light text-green-600">
                                            ${forecast.current_snapshot.monthly_income.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-[#64748B]">Monthly Income</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-light text-red-600">
                                            ${forecast.current_snapshot.monthly_expenses.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-[#64748B]">Monthly Expenses</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-light text-blue-600">
                                            {forecast.current_snapshot.savings_rate.toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-[#64748B]">Savings Rate</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Scenario Impact */}
                        {forecast.forecast.scenario_impact && (
                            <Card className="border-purple-200 bg-purple-50">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        Scenario Impact Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-purple-900">{forecast.forecast.scenario_impact}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Projections Chart */}
                        <ForecastChart projections={forecast.forecast.projections} />

                        {/* Retirement Readiness */}
                        <RetirementProjection retirement={forecast.forecast.retirement_readiness} />

                        {/* Goal Trajectories */}
                        {forecast.forecast.goal_projections?.length > 0 && (
                            <GoalTrajectory goals={forecast.forecast.goal_projections} />
                        )}

                        {/* Milestones */}
                        {forecast.forecast.milestones?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <Target className="w-5 h-5 text-[#C5A059]" />
                                        Projected Milestones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {forecast.forecast.milestones.map((milestone, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                                                    <span className="font-medium text-[#0F172A]">{milestone.milestone}</span>
                                                </div>
                                                <div className="text-sm text-[#64748B]">
                                                    {milestone.projected_date}
                                                    {milestone.months_away > 0 && (
                                                        <span className="ml-2">({milestone.months_away} months)</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Key Insights, Risks, Opportunities */}
                        <div className="grid grid-cols-3 gap-6">
                            <Card className="border-green-200">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-green-600" />
                                        Key Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {forecast.forecast.key_insights?.map((insight, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{insight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        Risks
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {forecast.forecast.risks?.map((risk, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{risk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-200">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        Opportunities
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {forecast.forecast.opportunities?.map((opp, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{opp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}