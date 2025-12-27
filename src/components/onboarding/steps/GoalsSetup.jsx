import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalsSetup({ onComplete }) {
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentGoal, setCurrentGoal] = useState({
        title: '',
        goal_type: 'savings',
        target_amount: '',
        target_date: '',
        monthly_contribution: ''
    });

    const goalTypes = [
        { value: 'savings', label: 'Emergency Savings' },
        { value: 'down_payment', label: 'Home Down Payment' },
        { value: 'retirement', label: 'Retirement Fund' },
        { value: 'education', label: 'Education Fund' },
        { value: 'vacation', label: 'Vacation Fund' },
        { value: 'investment', label: 'Investment Goal' },
        { value: 'debt_payoff', label: 'Debt Payoff' }
    ];

    const handleAddGoal = () => {
        if (!currentGoal.title || !currentGoal.target_amount || !currentGoal.target_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        setGoals([...goals, { ...currentGoal, id: Date.now() }]);
        setCurrentGoal({
            title: '',
            goal_type: 'savings',
            target_amount: '',
            target_date: '',
            monthly_contribution: ''
        });
        setShowForm(false);
        toast.success('Goal added!');
    };

    const handleRemoveGoal = (id) => {
        setGoals(goals.filter(g => g.id !== id));
    };

    const handleFinish = async () => {
        try {
            // Save all goals to database
            for (const goal of goals) {
                const { id, ...goalData } = goal;
                await base44.entities.FinancialGoal.create({
                    ...goalData,
                    target_amount: parseFloat(goalData.target_amount),
                    monthly_contribution: goalData.monthly_contribution ? parseFloat(goalData.monthly_contribution) : 0,
                    current_amount: 0,
                    status: 'active',
                    priority: 'medium'
                });
            }
            
            if (goals.length > 0) {
                toast.success(`${goals.length} goal${goals.length > 1 ? 's' : ''} created!`);
            }
            onComplete?.();
        } catch (error) {
            toast.error('Failed to save goals');
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-light text-[#0F172A] mb-2">Set Your Financial Goals</h3>
                <p className="text-[#64748B] max-w-xl mx-auto">
                    Define what you're working towards. Our AI will help you track progress and suggest ways to reach your goals faster.
                </p>
            </div>

            {/* Goals List */}
            {goals.length > 0 && (
                <div className="space-y-3 max-w-2xl mx-auto">
                    {goals.map(goal => (
                        <div key={goal.id} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-xl border border-[#0F172A]/10">
                            <div className="flex-1">
                                <h4 className="font-medium text-[#0F172A]">{goal.title}</h4>
                                <p className="text-sm text-[#64748B]">
                                    ${parseFloat(goal.target_amount).toLocaleString()} by {new Date(goal.target_date).toLocaleDateString()}
                                    {goal.monthly_contribution && ` • $${parseFloat(goal.monthly_contribution)}/month`}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveGoal(goal.id)}
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Goal Form */}
            {showForm ? (
                <div className="max-w-2xl mx-auto space-y-4 p-6 bg-white border border-[#0F172A]/10 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label>Goal Name *</Label>
                            <Input
                                placeholder="e.g., Emergency Fund"
                                value={currentGoal.title}
                                onChange={(e) => setCurrentGoal({...currentGoal, title: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Goal Type *</Label>
                            <Select
                                value={currentGoal.goal_type}
                                onValueChange={(value) => setCurrentGoal({...currentGoal, goal_type: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {goalTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Target Amount * ($)</Label>
                            <Input
                                type="number"
                                placeholder="10000"
                                value={currentGoal.target_amount}
                                onChange={(e) => setCurrentGoal({...currentGoal, target_amount: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Target Date *</Label>
                            <Input
                                type="date"
                                value={currentGoal.target_date}
                                onChange={(e) => setCurrentGoal({...currentGoal, target_date: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Monthly Contribution ($)</Label>
                            <Input
                                type="number"
                                placeholder="500"
                                value={currentGoal.monthly_contribution}
                                onChange={(e) => setCurrentGoal({...currentGoal, monthly_contribution: e.target.value})}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowForm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddGoal}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Add Goal
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center">
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="outline"
                        className="border-dashed border-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Financial Goal
                    </Button>
                </div>
            )}

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 max-w-2xl mx-auto">
                <p className="text-sm text-purple-900">
                    <strong>💡 Tip:</strong> Set realistic goals with specific amounts and dates. 
                    Our AI will analyze your spending patterns and suggest ways to reach them faster.
                </p>
            </div>

            <div className="flex justify-center pt-4">
                <Button
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white px-8"
                >
                    {goals.length > 0 ? 'Continue' : 'Skip for Now'}
                </Button>
            </div>
        </div>
    );
}