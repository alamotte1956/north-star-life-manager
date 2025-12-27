import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
    Target, Sparkles, TrendingUp, Plus, Calendar, 
    DollarSign, RefreshCw, CheckCircle 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const goalTypeLabels = {
    savings: 'Savings',
    down_payment: 'Down Payment',
    retirement: 'Retirement',
    education: 'Education',
    vacation: 'Vacation',
    emergency_fund: 'Emergency Fund',
    debt_payoff: 'Debt Payoff',
    investment: 'Investment',
    other: 'Other'
};

export default function GoalProgressCard({ goal, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [addingAmount, setAddingAmount] = useState(false);
    const [amount, setAmount] = useState('');

    const progress = (goal.current_amount / goal.target_amount) * 100;
    const remaining = goal.target_amount - goal.current_amount;
    const daysRemaining = differenceInDays(new Date(goal.target_date), new Date());
    const isOverdue = daysRemaining < 0;
    const isComplete = progress >= 100;

    const priorityColors = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-blue-100 text-blue-700'
    };

    const getMotivationalMessage = () => {
        if (isComplete) return '🎉 Goal achieved! Celebrate your success!';
        if (progress >= 75) return '🔥 Almost there! Final push!';
        if (progress >= 50) return '💪 Halfway milestone reached!';
        if (progress >= 25) return '🌟 Strong start! Keep it up!';
        return '🚀 Begin your journey to success!';
    };

    const updateProgress = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('updateGoalProgress', { goal_id: goal.id });
            toast.success(result.data.message);
            onUpdate();
        } catch (error) {
            toast.error('Failed to update progress');
        }
        setLoading(false);
    };

    const addContribution = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        try {
            await base44.entities.FinancialGoal.update(goal.id, {
                current_amount: parseFloat(goal.current_amount) + parseFloat(amount)
            });
            toast.success(`Added $${amount} to your goal!`);
            setAmount('');
            setAddingAmount(false);
            onUpdate();
        } catch (error) {
            toast.error('Failed to add contribution');
        }
    };

    return (
        <Card className={`hover:shadow-xl transition-shadow ${isComplete ? 'border-green-500 border-2' : ''}`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
                        <span className="text-xl font-light">{goal.title}</span>
                    </div>
                    <Badge className={priorityColors[goal.priority]}>
                        {goal.priority}
                    </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{goalTypeLabels[goal.goal_type]}</Badge>
                    {goal.status && (
                        <Badge className={goal.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                            {goal.status}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            
            <CardContent>
                <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-light">
                                ${goal.current_amount.toLocaleString()}
                            </span>
                            <span className="text-sm text-white/60">
                                of ${goal.target_amount.toLocaleString()}
                            </span>
                        </div>
                        <Progress 
                            value={Math.min(progress, 100)} 
                            className={isComplete ? 'bg-green-100' : ''}
                        />
                        <p className={`text-sm mt-2 ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                            {progress.toFixed(0)}% complete
                        </p>
                    </div>

                    {/* Motivational Message */}
                    <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#F4D03F]/10 rounded-lg p-3 border border-[#D4AF37]/20">
                        <p className="text-sm font-medium text-center">{getMotivationalMessage()}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                                <span className="text-xs text-white/60">Remaining</span>
                            </div>
                            <p className="text-lg font-medium">${remaining.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                                <span className="text-xs text-white/60">Days Left</span>
                            </div>
                            <p className={`text-lg font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                                {Math.abs(daysRemaining)}
                            </p>
                        </div>
                    </div>

                    {/* Target Date */}
                    {goal.target_date && (
                        <p className="text-sm text-white/60">
                            Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                        </p>
                    )}

                    {/* Monthly Contribution */}
                    {goal.monthly_contribution && (
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>Monthly: ${goal.monthly_contribution.toLocaleString()}</span>
                        </div>
                    )}

                    {/* AI Suggestions */}
                    {goal.ai_suggestions && (
                        <div className="bg-[#D4AF37]/10 rounded-lg p-3 border border-[#D4AF37]/20">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{goal.ai_suggestions}</p>
                            </div>
                        </div>
                    )}

                    {/* Add Contribution */}
                    {!isComplete && (
                        <div className="space-y-2">
                            {addingAmount ? (
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={addContribution} size="sm">
                                        Add
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setAddingAmount(false);
                                            setAmount('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setAddingAmount(true)}
                                    className="w-full border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Contribution
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={updateProgress}
                            disabled={loading}
                            className="flex-1 border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Update Progress
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}