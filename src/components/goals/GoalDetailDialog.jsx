import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    TrendingUp, TrendingDown, Target, Calendar, DollarSign, 
    AlertTriangle, CheckCircle, Lightbulb, ArrowRight, Loader2 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function GoalDetailDialog({ goal, open, onOpenChange }) {
    const { data: analysis, isLoading } = useQuery({
        queryKey: ['goalAnalysis', goal?.id],
        queryFn: async () => {
            const result = await base44.functions.invoke('analyzeGoalProgress', {
                goal_id: goal.id
            });
            return result.data;
        },
        enabled: open && !!goal
    });

    if (!goal) return null;

    const progressPercentage = ((goal.current_amount / goal.target_amount) * 100).toFixed(1);

    const getStatusColor = (status) => {
        switch (status) {
            case 'ahead': return 'bg-green-100 text-green-800';
            case 'on_track': return 'bg-blue-100 text-blue-800';
            case 'behind': return 'bg-yellow-100 text-yellow-800';
            case 'at_risk': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{goal.goal_name}</DialogTitle>
                    <p className="text-sm text-gray-500">{goal.description}</p>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
                    </div>
                ) : analysis?.success ? (
                    <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            {/* Progress Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Progress</span>
                                        <Badge className={getStatusColor(analysis.analysis.progress_status)}>
                                            {analysis.analysis.progress_status.replace('_', ' ')}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-2xl font-bold text-[#C5A059]">
                                                ${goal.current_amount.toLocaleString()}
                                            </span>
                                            <span className="text-xl text-gray-600">
                                                ${goal.target_amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <Progress value={progressPercentage} className="h-3" />
                                        <p className="text-sm text-gray-500 mt-2">{progressPercentage}% complete</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                        <div>
                                            <p className="text-sm text-gray-500">Remaining</p>
                                            <p className="text-lg font-semibold">${analysis.progress.remaining.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Target Date</p>
                                            <p className="text-lg font-semibold">
                                                {goal.target_date ? format(new Date(goal.target_date), 'MMM d, yyyy') : 'Not set'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Monthly Contribution</p>
                                            <p className="text-lg font-semibold">${goal.monthly_contribution || 0}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Financial Snapshot */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Financial Situation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Monthly Savings</p>
                                            <p className="text-xl font-semibold text-green-600">
                                                ${analysis.financial_snapshot.monthly_savings.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Total Investments</p>
                                            <p className="text-xl font-semibold text-blue-600">
                                                ${analysis.financial_snapshot.total_investments.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Monthly Spending</p>
                                            <p className="text-xl font-semibold">
                                                ${analysis.financial_snapshot.monthly_spending.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Fixed Costs</p>
                                            <p className="text-xl font-semibold">
                                                ${analysis.financial_snapshot.monthly_fixed_costs.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analysis" className="space-y-4">
                            {/* AI Summary */}
                            <Card className="bg-gradient-to-br from-[#C5A059]/10 to-[#D4AF37]/10 border-[#C5A059]/30">
                                <CardContent className="pt-6">
                                    <p className="text-gray-700 leading-relaxed">{analysis.analysis.ai_summary}</p>
                                </CardContent>
                            </Card>

                            {/* Recommendations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-[#C5A059]" />
                                        Recommended Monthly Contribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-[#C5A059]">
                                            ${analysis.analysis.monthly_contribution_recommendation}
                                        </span>
                                        {goal.monthly_contribution && (
                                            <span className="text-sm text-gray-500">
                                                (currently ${goal.monthly_contribution})
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Budget Cut Suggestions */}
                            {analysis.analysis.budget_cut_suggestions?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-[#C5A059]" />
                                            Budget Optimization
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {analysis.analysis.budget_cut_suggestions.map((suggestion, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{suggestion.category}</p>
                                                        <p className="text-sm text-gray-500">
                                                            ${suggestion.current_spending} → ${suggestion.recommended_spending}
                                                        </p>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-800">
                                                        +${suggestion.monthly_savings}/mo
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Savings Opportunities */}
                            {analysis.analysis.savings_opportunities?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                                            Savings Opportunities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {analysis.analysis.savings_opportunities.map((opp, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <ArrowRight className="w-4 h-4 text-[#C5A059] mt-0.5" />
                                                    <span className="text-sm">{opp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Obstacles */}
                            {analysis.analysis.obstacles?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                            Potential Obstacles
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {analysis.analysis.obstacles.map((obstacle, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-yellow-600">⚠️</span>
                                                    <span className="text-sm">{obstacle}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Next Steps */}
                            {analysis.analysis.next_steps?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            Next Steps
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ol className="space-y-2">
                                            {analysis.analysis.next_steps.map((step, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-[#C5A059] text-white rounded-full flex items-center justify-center text-sm">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm pt-0.5">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="scenarios" className="space-y-4">
                            {/* Current Pace */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Pace</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Monthly Contribution:</span>
                                        <span className="font-semibold">${goal.monthly_contribution || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Months to Goal:</span>
                                        <span className="font-semibold">
                                            {analysis.scenarios.current_pace.months_to_goal || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Projected Completion:</span>
                                        <span className="font-semibold">
                                            {analysis.scenarios.current_pace.completion_date ? 
                                                format(new Date(analysis.scenarios.current_pace.completion_date), 'MMM d, yyyy') : 
                                                'N/A'}
                                        </span>
                                    </div>
                                    {analysis.scenarios.current_pace.achieves_target !== null && (
                                        <Badge className={analysis.scenarios.current_pace.achieves_target ? 
                                            'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                            {analysis.scenarios.current_pace.achieves_target ? 
                                                'On track for target date' : 'Will miss target date'}
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recommended Pace */}
                            <Card className="border-[#C5A059]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-[#C5A059]" />
                                        Recommended Pace
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Monthly Contribution:</span>
                                        <span className="font-semibold text-[#C5A059]">
                                            ${analysis.scenarios.recommended_pace.monthly_contribution}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Months to Goal:</span>
                                        <span className="font-semibold">
                                            {analysis.scenarios.recommended_pace.months_to_goal || 'N/A'}
                                        </span>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">
                                        Achieves target on time
                                    </Badge>
                                </CardContent>
                            </Card>

                            {/* Aggressive Scenario */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        Aggressive Scenario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Monthly Contribution:</span>
                                        <span className="font-semibold text-green-600">
                                            ${analysis.scenarios.aggressive.monthly_contribution.toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Months to Goal:</span>
                                        <span className="font-semibold">
                                            {analysis.scenarios.aggressive.months_to_goal}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Additional Savings Needed:</span>
                                        <span className="font-semibold">
                                            ${analysis.scenarios.aggressive.savings_increase_needed.toFixed(0)}/mo
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <p className="text-center text-gray-500 py-8">Unable to load analysis</p>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}