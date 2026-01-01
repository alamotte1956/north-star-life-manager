import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
    Sparkles, TrendingUp, DollarSign, Target, AlertTriangle, 
    CheckCircle, Clock, Lightbulb, PiggyBank, Shield, MessageCircle, Send, BarChart3 
} from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialAdvisor() {
    const [advice, setAdvice] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [userQuestion, setUserQuestion] = useState('');
    const [askingQuestion, setAskingQuestion] = useState(false);

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 5 * 60 * 1000); // Refresh every 5 min
        return () => clearInterval(interval);
    }, []);

    const fetchMarketData = async () => {
        try {
            const result = await base44.functions.invoke('fetchMarketPrices', {});
            setMarketData(result.data);
        } catch (error) {
            logger.error('Failed to fetch market data:', error);
        }
    };

    const getAdvice = async (type = 'comprehensive') => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getFinancialAdvice', { 
                advice_type: type,
                include_market_data: true
            });
            setAdvice(result.data.advice);
            setSnapshot(result.data.financial_snapshot);
            toast.success('Financial advice generated with real-time market data!');
        } catch (error) {
            toast.error('Failed to generate advice');
        }
        setLoading(false);
    };

    const askQuestion = async (e) => {
        e.preventDefault();
        if (!userQuestion.trim() || askingQuestion) return;

        const question = userQuestion.trim();
        setUserQuestion('');
        
        setChatMessages(prev => [...prev, { role: 'user', content: question }]);
        setAskingQuestion(true);

        try {
            const result = await base44.functions.invoke('answerInvestmentQuestion', {
                question,
                current_advice: advice,
                financial_snapshot: snapshot,
                market_data: marketData
            });
            
            setChatMessages(prev => [...prev, { 
                role: 'assistant', 
                content: result.data.answer 
            }]);
        } catch (error) {
            toast.error('Failed to get answer');
            setChatMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error. Please try again.' 
            }]);
        }
        setAskingQuestion(false);
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    if (!advice) {
        return (
            <Card className="border-[#D4AF37]/30">
                <CardContent className="pt-6 text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-light text-black mb-2">AI Financial Advisor</h3>
                    <p className="text-black/60 mb-6 max-w-md mx-auto">
                        Get personalized investment recommendations with real-time market data analysis, portfolio diversification strategies, and actionable rebalancing advice.
                    </p>
                    {marketData && (
                        <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                <div className="text-xs text-black/60">S&P 500</div>
                                <div className="text-sm font-medium">{marketData.sp500?.toFixed(2)}</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                <div className="text-xs text-black/60">VTI</div>
                                <div className="text-sm font-medium">${marketData.vti?.toFixed(2)}</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                <div className="text-xs text-black/60">Gold</div>
                                <div className="text-sm font-medium">${marketData.gold?.toFixed(0)}</div>
                            </div>
                        </div>
                    )}
                    <Button 
                        onClick={() => getAdvice()}
                        disabled={loading}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                    >
                        {loading ? 'Analyzing Portfolio & Markets...' : 'Get Personalized Investment Strategy'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Financial Health Score */}
            <Card className={`border-2 ${getScoreColor(advice.financial_health_score)} bg-white`}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="text-6xl font-light">{advice.financial_health_score}</div>
                            <div>
                                <div className="text-sm text-black/60">Financial Health Score</div>
                                <Badge className={getScoreColor(advice.financial_health_score)}>
                                    {advice.financial_health_score >= 8 ? 'Excellent' : 
                                     advice.financial_health_score >= 6 ? 'Good' : 
                                     advice.financial_health_score >= 4 ? 'Fair' : 'Needs Work'}
                                </Badge>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => getAdvice()}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                    <p className="text-black/80">{advice.health_assessment}</p>
                </CardContent>
            </Card>

            {/* Financial Snapshot */}
            {snapshot && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <DollarSign className="w-5 h-5 text-green-600 mb-2" />
                            <div className="text-2xl font-light">${snapshot.monthly_income.toFixed(0)}</div>
                            <div className="text-xs text-black/60">Monthly Income</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
                            <div className="text-2xl font-light">{snapshot.savings_rate.toFixed(0)}%</div>
                            <div className="text-xs text-black/60">Savings Rate</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <Target className="w-5 h-5 text-purple-600 mb-2" />
                            <div className="text-2xl font-light">{snapshot.goals_on_track}/{snapshot.active_goals}</div>
                            <div className="text-xs text-black/60">Goals On Track</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <PiggyBank className="w-5 h-5 text-[#D4AF37] mb-2" />
                            <div className="text-2xl font-light">${snapshot.net_savings.toFixed(0)}</div>
                            <div className="text-xs text-black/60">Net Savings</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Proactive Alerts */}
            {advice.proactive_alerts?.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            Proactive Alerts & Market Opportunities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {advice.proactive_alerts.map((alert, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-orange-900">
                                    <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <span>{alert}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Spending to Investment Opportunities */}
            {advice.spending_to_investment_opportunities?.length > 0 && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
                    <CardHeader>
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Turn Savings Into Investments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-black/70 mb-4">
                            By optimizing your spending, you can redirect funds toward wealth-building investments:
                        </p>
                        <ul className="space-y-3">
                            {advice.spending_to_investment_opportunities.map((opp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm p-3 bg-white rounded-lg border border-green-200">
                                    <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-green-900">{opp}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Advice Tabs */}
            <Tabs defaultValue="budget" className="w-full">
                <TabsList className="grid grid-cols-3 md:grid-cols-8 w-full">
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="investment">Invest</TabsTrigger>
                    <TabsTrigger value="debt">Debt</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="savings">Savings</TabsTrigger>
                    <TabsTrigger value="forecast">Forecast</TabsTrigger>
                    <TabsTrigger value="tax">Tax</TabsTrigger>
                    <TabsTrigger value="action">Action</TabsTrigger>
                </TabsList>

                {/* Budget Advice */}
                <TabsContent value="budget" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-[#4A90E2]" />
                                Budgeting Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Current Status</h4>
                                <p className="text-sm text-black/70">{advice.budgeting_advice.current_status}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Recommendations</h4>
                                <ul className="space-y-2">
                                    {advice.budgeting_advice.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {advice.budgeting_advice.spending_red_flags?.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-2 flex items-center gap-2 text-red-900">
                                        <AlertTriangle className="w-4 h-4" />
                                        Spending Concerns
                                    </h4>
                                    <ul className="space-y-1">
                                        {advice.budgeting_advice.spending_red_flags.map((flag, i) => (
                                            <li key={i} className="text-sm text-red-800">• {flag}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {advice.budgeting_advice.optimization_opportunities?.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                                            Optimization Opportunities
                                        </h4>
                                        {advice.budgeting_advice.potential_monthly_savings && (
                                            <Badge className="bg-green-100 text-green-800">
                                                ${advice.budgeting_advice.potential_monthly_savings}/mo potential savings
                                            </Badge>
                                        )}
                                    </div>
                                    <ul className="space-y-1">
                                        {advice.budgeting_advice.optimization_opportunities.map((opp, i) => (
                                            <li key={i} className="text-sm text-black/70">• {opp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Investment Advice */}
                <TabsContent value="investment" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#4A90E2]" />
                                Investment Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-black/60">Diversification Score</span>
                                <Badge className={getScoreColor(advice.investment_advice.diversification_score)}>
                                    {advice.investment_advice.diversification_score}/10
                                </Badge>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Portfolio Assessment</h4>
                                <p className="text-sm text-black/70">{advice.investment_advice.portfolio_assessment}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Strategy Recommendations</h4>
                                <ul className="space-y-2">
                                    {advice.investment_advice.strategy_recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium mb-2 text-blue-900">Risk Analysis</h4>
                                <p className="text-sm text-blue-800">{advice.investment_advice.risk_analysis}</p>
                            </div>
                            
                            {advice.investment_advice.recommended_allocations && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-3 text-purple-900">Recommended Portfolio Allocation</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(advice.investment_advice.recommended_allocations).map(([asset, pct]) => (
                                            <div key={asset} className="flex justify-between items-center">
                                                <span className="text-sm capitalize">{asset.replace('_', ' ')}</span>
                                                <Badge className="bg-purple-600 text-white">{pct}%</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {advice.investment_advice.specific_recommendations?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-3">Specific Fund Recommendations</h4>
                                    <div className="space-y-3">
                                        {advice.investment_advice.specific_recommendations.map((rec, i) => (
                                            <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm">{rec.name}</span>
                                                    <Badge className="bg-blue-100 text-blue-700">{rec.ticker}</Badge>
                                                </div>
                                                <div className="text-xs text-black/60 mb-1">Suggested: {rec.allocation}%</div>
                                                <p className="text-xs text-black/70">{rec.rationale}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {advice.investment_advice.rebalancing_advice && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-2 text-indigo-900">Rebalancing Strategy</h4>
                                    <p className="text-sm text-indigo-800">{advice.investment_advice.rebalancing_advice}</p>
                                </div>
                            )}

                            {advice.investment_advice.savings_to_investment_plan && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4">
                                    <h4 className="font-medium mb-2 text-green-900 flex items-center gap-2">
                                        <PiggyBank className="w-4 h-4" />
                                        Savings → Investment Plan
                                    </h4>
                                    <p className="text-sm text-green-800">{advice.investment_advice.savings_to_investment_plan}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Debt Management */}
                <TabsContent value="debt" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[#4A90E2]" />
                                Debt Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Current Status</h4>
                                <p className="text-sm text-black/70">{advice.debt_management.current_status}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Recommendations</h4>
                                <ul className="space-y-2">
                                    {advice.debt_management.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {advice.debt_management.priority_payments?.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-2 text-yellow-900">Priority Payments</h4>
                                    <ul className="space-y-1">
                                        {advice.debt_management.priority_payments.map((payment, i) => (
                                            <li key={i} className="text-sm text-yellow-800">• {payment}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {advice.debt_management.consolidation_opportunities?.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-2 text-green-900">Consolidation Opportunities</h4>
                                    <ul className="space-y-1">
                                        {advice.debt_management.consolidation_opportunities.map((opp, i) => (
                                            <li key={i} className="text-sm text-green-800">• {opp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Goals Coaching */}
                <TabsContent value="goals" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#4A90E2]" />
                                Goals Coaching
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Overall Progress</h4>
                                <p className="text-sm text-black/70">{advice.goals_coaching.overall_progress}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Recommendations</h4>
                                <ul className="space-y-2">
                                    {advice.goals_coaching.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {advice.goals_coaching.timeline_adjustments?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Timeline Adjustments</h4>
                                    <ul className="space-y-1">
                                        {advice.goals_coaching.timeline_adjustments.map((adj, i) => (
                                            <li key={i} className="text-sm text-black/70">• {adj}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Savings Strategy */}
                <TabsContent value="savings" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <PiggyBank className="w-5 h-5 text-[#4A90E2]" />
                                Savings Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                                <span className="font-medium text-green-900">Recommended Savings Rate</span>
                                <Badge className="bg-green-600 text-white">
                                    {advice.savings_strategy.recommended_savings_rate}%
                                </Badge>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Emergency Fund Status</h4>
                                <p className="text-sm text-black/70">{advice.savings_strategy.emergency_fund_status}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium mb-2 text-blue-900">Automated Savings Plan</h4>
                                <p className="text-sm text-blue-800">{advice.savings_strategy.automated_savings_plan}</p>
                            </div>
                            {advice.savings_strategy.high_yield_opportunities?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        High-Yield Opportunities
                                    </h4>
                                    <ul className="space-y-2">
                                        {advice.savings_strategy.high_yield_opportunities.map((opp, i) => (
                                            <li key={i} className="text-sm text-black/70 flex items-start gap-2">
                                                <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{opp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Forecast */}
                {advice.financial_forecast && (
                    <TabsContent value="forecast" className="space-y-4 mt-4">
                        <Card className="border-purple-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-light flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                    Financial Forecast & Planning
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-medium mb-2 text-blue-900">6-Month Outlook</h4>
                                        <p className="text-sm text-blue-800">{advice.financial_forecast.six_month_projection}</p>
                                    </div>
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h4 className="font-medium mb-2 text-green-900">1-Year Outlook</h4>
                                        <p className="text-sm text-green-800">{advice.financial_forecast.one_year_projection}</p>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <h4 className="font-medium mb-2 text-purple-900">Retirement Readiness</h4>
                                    <p className="text-sm text-purple-800">{advice.financial_forecast.retirement_readiness}</p>
                                </div>

                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <h4 className="font-medium mb-2 text-indigo-900">Net Worth Trajectory</h4>
                                    <p className="text-sm text-indigo-800">{advice.financial_forecast.net_worth_trajectory}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Tax Optimization */}
                {advice.tax_optimization && (
                    <TabsContent value="tax" className="space-y-4 mt-4">
                        <Card className="border-green-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-light flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    Tax Optimization
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div>
                                        <h4 className="font-medium text-green-900">Estimated Annual Tax Savings</h4>
                                        <p className="text-sm text-green-700 mt-1">{advice.tax_optimization.current_efficiency}</p>
                                    </div>
                                    <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                                        ${advice.tax_optimization.estimated_savings?.toLocaleString() || 0}
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Tax Optimization Strategies</h4>
                                    <ul className="space-y-2">
                                        {advice.tax_optimization.strategies?.map((strategy, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{strategy}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Action Plan */}
                <TabsContent value="action" className="space-y-4 mt-4">
                    <Card className="border-[#4A90E2]/30">
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#D4AF37]" />
                                    Action Plan
                                </span>
                                <Badge className="bg-green-100 text-green-700">
                                    +${advice.estimated_impact.toFixed(0)}/mo impact
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">!</span>
                                    This Week
                                </h4>
                                <ul className="space-y-2">
                                    {advice.action_plan.immediate_actions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">30</span>
                                    This Month
                                </h4>
                                <ul className="space-y-2">
                                    {advice.action_plan.short_term_actions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">90</span>
                                    This Quarter
                                </h4>
                                <ul className="space-y-2">
                                    {advice.action_plan.long_term_actions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Interactive Q&A Section */}
            <Card className="border-[#4A90E2]/30 mt-6">
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[#4A90E2]" />
                        Ask Your Financial Advisor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {chatMessages.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-black/60 mb-4">Ask about your investments, market trends, or portfolio performance</p>
                                <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setUserQuestion("How is my portfolio performing compared to the market?")}
                                    >
                                        Portfolio vs Market
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setUserQuestion("Should I rebalance my portfolio now?")}
                                    >
                                        Rebalancing Advice
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setUserQuestion("What's the outlook for tech stocks?")}
                                    >
                                        Tech Outlook
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setUserQuestion("How should I adjust for current market conditions?")}
                                    >
                                        Market Strategy
                                    </Button>
                                </div>
                            </div>
                        )}

                        {chatMessages.length > 0 && (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {chatMessages.map((msg, idx) => (
                                    <div 
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                            msg.role === 'user' 
                                                ? 'bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white'
                                                : 'bg-gray-100 text-black'
                                        }`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {askingQuestion && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={askQuestion} className="flex gap-2">
                            <Input
                                value={userQuestion}
                                onChange={(e) => setUserQuestion(e.target.value)}
                                placeholder="Ask about your investments, performance, or strategy..."
                                disabled={askingQuestion}
                                className="flex-1"
                            />
                            <Button 
                                type="submit"
                                disabled={askingQuestion || !userQuestion.trim()}
                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            {/* Real-Time Market Data */}
            {marketData && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50 mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg font-light flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            Real-Time Market Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {marketData.sp500 && (
                                <div className="p-3 bg-white rounded-lg">
                                    <div className="text-xs text-black/60 mb-1">S&P 500</div>
                                    <div className="text-xl font-light">{marketData.sp500.toFixed(2)}</div>
                                    <Badge className={marketData.sp500_change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {marketData.sp500_change >= 0 ? '+' : ''}{marketData.sp500_change?.toFixed(2)}%
                                    </Badge>
                                </div>
                            )}
                            {marketData.vti && (
                                <div className="p-3 bg-white rounded-lg">
                                    <div className="text-xs text-black/60 mb-1">VTI (Total Market)</div>
                                    <div className="text-xl font-light">${marketData.vti.toFixed(2)}</div>
                                    <Badge className={marketData.vti_change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {marketData.vti_change >= 0 ? '+' : ''}{marketData.vti_change?.toFixed(2)}%
                                    </Badge>
                                </div>
                            )}
                            {marketData.bonds && (
                                <div className="p-3 bg-white rounded-lg">
                                    <div className="text-xs text-black/60 mb-1">Bonds (AGG)</div>
                                    <div className="text-xl font-light">${marketData.bonds.toFixed(2)}</div>
                                    <Badge className={marketData.bonds_change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {marketData.bonds_change >= 0 ? '+' : ''}{marketData.bonds_change?.toFixed(2)}%
                                    </Badge>
                                </div>
                            )}
                            {marketData.gold && (
                                <div className="p-3 bg-white rounded-lg">
                                    <div className="text-xs text-black/60 mb-1">Gold</div>
                                    <div className="text-xl font-light">${marketData.gold.toFixed(0)}</div>
                                    <Badge className={marketData.gold_change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {marketData.gold_change >= 0 ? '+' : ''}{marketData.gold_change?.toFixed(2)}%
                                    </Badge>
                                </div>
                            )}
                        </div>
                        {marketData.market_sentiment && (
                            <div className="mt-4 p-4 bg-white rounded-lg">
                                <h4 className="font-medium mb-2">Market Sentiment</h4>
                                <p className="text-sm text-black/70">{marketData.market_sentiment}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}