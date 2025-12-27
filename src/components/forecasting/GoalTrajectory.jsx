import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function GoalTrajectory({ goals }) {
    const getLikelihoodColor = (likelihood) => {
        switch (likelihood) {
            case 'high': return 'bg-green-100 text-green-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#C5A059]" />
                    Goal Projections
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {goals.map((goal, i) => (
                    <div key={i} className="p-4 bg-[#F8F9FA] rounded-lg border border-[#0F172A]/10">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-[#0F172A]">{goal.goal_name}</h4>
                                    {goal.on_track ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    )}
                                </div>
                                <p className="text-xs text-[#64748B]">{goal.analysis}</p>
                            </div>
                            <Badge className={getLikelihoodColor(goal.likelihood)}>
                                {goal.likelihood} likelihood
                            </Badge>
                        </div>

                        <div className="grid grid-cols-4 gap-3 text-center">
                            <div>
                                <div className="text-lg font-light text-[#0F172A]">
                                    ${goal.current_amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-[#64748B]">Current</div>
                            </div>
                            <div>
                                <div className="text-lg font-light text-[#C5A059]">
                                    ${goal.target_amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-[#64748B]">Target</div>
                            </div>
                            <div>
                                <div className="text-lg font-light text-blue-600">
                                    ${goal.monthly_contribution_needed.toLocaleString()}
                                </div>
                                <div className="text-xs text-[#64748B]">Monthly Need</div>
                            </div>
                            <div>
                                <div className="text-lg font-light text-purple-600 flex items-center justify-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(goal.projected_completion_date), 'MMM yyyy')}
                                </div>
                                <div className="text-xs text-[#64748B]">Projected</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37]"
                                    style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="text-xs text-[#64748B] mt-1 text-right">
                                {((goal.current_amount / goal.target_amount) * 100).toFixed(1)}% complete
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}