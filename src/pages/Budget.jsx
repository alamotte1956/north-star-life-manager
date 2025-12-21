import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Plus, TrendingUp, AlertTriangle, Target, Sparkles, Users } from 'lucide-react';
import AICollaborationInsights from '../components/collaboration/AICollaborationInsights';
import ShareDialog from '../components/collaboration/ShareDialog';
import CommentsSection from '../components/collaboration/CommentsSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import GoalProgressCard from '../components/budget/GoalProgressCard';

const categoryLabels = {
    property: 'Property',
    vehicle: 'Vehicle',
    subscription: 'Subscriptions',
    maintenance: 'Maintenance',
    health: 'Health',
    travel: 'Travel',
    utilities: 'Utilities',
    groceries: 'Groceries',
    dining: 'Dining',
    entertainment: 'Entertainment',
    other: 'Other'
};

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

export default function BudgetPage() {
    const [budgetOpen, setBudgetOpen] = useState(false);
    const [goalOpen, setGoalOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState({});
    const [selectedGoalForCollab, setSelectedGoalForCollab] = useState(null);
    const [budgetForm, setBudgetForm] = useState({
        category: 'other',
        amount: '',
        period: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        alert_threshold: 80,
        notes: ''
    });
    const [goalForm, setGoalForm] = useState({
        title: '',
        goal_type: 'savings',
        target_amount: '',
        current_amount: 0,
        target_date: '',
        monthly_contribution: '',
        priority: 'medium',
        notes: ''
    });

    const { data: budgets = [], refetch: refetchBudgets } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => base44.entities.Budget.list()
    });

    const { data: goals = [], refetch: refetchGoals } = useQuery({
        queryKey: ['goals'],
        queryFn: () => base44.entities.FinancialGoal.list('-priority')
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => base44.entities.Transaction.list('-date')
    });

    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.Budget.create(budgetForm);
        setBudgetOpen(false);
        setBudgetForm({
            category: 'other',
            amount: '',
            period: 'monthly',
            start_date: format(new Date(), 'yyyy-MM-dd'),
            alert_threshold: 80,
            notes: ''
        });
        refetchBudgets();
    };

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.FinancialGoal.create(goalForm);
        setGoalOpen(false);
        setGoalForm({
            title: '',
            goal_type: 'savings',
            target_amount: '',
            current_amount: 0,
            target_date: '',
            monthly_contribution: '',
            priority: 'medium',
            notes: ''
        });
        refetchGoals();
    };

    const getAISuggestions = async (goal) => {
        setLoadingSuggestions(prev => ({ ...prev, [goal.id]: true }));
        try {
            const result = await base44.functions.invoke('getGoalSuggestions', { goal_id: goal.id });
            await base44.entities.FinancialGoal.update(goal.id, {
                ai_suggestions: result.data.suggestions
            });
            refetchGoals();
        } catch (error) {
            console.error('Error getting suggestions:', error);
        }
        setLoadingSuggestions(prev => ({ ...prev, [goal.id]: false }));
    };

    const calculateSpending = (category, period) => {
        const now = new Date();
        const start = period === 'monthly' ? startOfMonth(now) : startOfYear(now);
        const end = period === 'monthly' ? endOfMonth(now) : endOfYear(now);

        return transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.category === category && 
                       tDate >= start && 
                       tDate <= end &&
                       t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                                <DollarSign className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Budget & Goals</h1>
                            <p className="text-black/70 font-light">Track spending and financial goals</p>
                        </div>
                    </div>
                </div>

                {/* Budgets Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-light text-black">Budgets</h2>
                        <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-black to-[#1a1a1a]">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Budget
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Budget</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={budgetForm.category}
                                            onValueChange={(value) => setBudgetForm({ ...budgetForm, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categoryLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Amount</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={budgetForm.amount}
                                                onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Period</Label>
                                            <Select
                                                value={budgetForm.period}
                                                onValueChange={(value) => setBudgetForm({ ...budgetForm, period: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Alert Threshold (%)</Label>
                                        <Input
                                            type="number"
                                            value={budgetForm.alert_threshold}
                                            onChange={(e) => setBudgetForm({ ...budgetForm, alert_threshold: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={budgetForm.notes}
                                            onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]">
                                        Create Budget
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {budgets.map(budget => {
                            const spent = calculateSpending(budget.category, budget.period);
                            const percentage = (spent / budget.amount) * 100;
                            const isOverBudget = percentage > 100;
                            const isNearThreshold = percentage >= budget.alert_threshold;

                            return (
                                <Card key={budget.id} className="hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="text-lg font-light">{categoryLabels[budget.category]}</span>
                                            {isNearThreshold && (
                                                <AlertTriangle className={`w-5 h-5 ${isOverBudget ? 'text-red-500' : 'text-yellow-500'}`} />
                                            )}
                                        </CardTitle>
                                        <Badge variant="outline" className="w-fit">
                                            {budget.period === 'monthly' ? 'Monthly' : 'Yearly'}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-2xl font-light">${spent.toLocaleString()}</span>
                                                    <span className="text-sm text-black/60">of ${budget.amount.toLocaleString()}</span>
                                                </div>
                                                <Progress 
                                                    value={Math.min(percentage, 100)} 
                                                    className={isOverBudget ? 'bg-red-100' : isNearThreshold ? 'bg-yellow-100' : ''}
                                                />
                                                <p className={`text-sm mt-2 ${isOverBudget ? 'text-red-600' : isNearThreshold ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {percentage.toFixed(0)}% used
                                                </p>
                                            </div>
                                            {budget.notes && (
                                                <p className="text-sm text-black/60">{budget.notes}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Financial Goals Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-light text-black">Financial Goals</h2>
                        <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-black to-[#1a1a1a]">
                                    <Target className="w-4 h-4 mr-2" />
                                    Add Goal
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Financial Goal</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleGoalSubmit} className="space-y-4">
                                    <div>
                                        <Label>Goal Name</Label>
                                        <Input
                                            value={goalForm.title}
                                            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Goal Type</Label>
                                            <Select
                                                value={goalForm.goal_type}
                                                onValueChange={(value) => setGoalForm({ ...goalForm, goal_type: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(goalTypeLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Priority</Label>
                                            <Select
                                                value={goalForm.priority}
                                                onValueChange={(value) => setGoalForm({ ...goalForm, priority: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Target Amount</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={goalForm.target_amount}
                                                onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Current Amount</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={goalForm.current_amount}
                                                onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Target Date</Label>
                                            <Input
                                                type="date"
                                                value={goalForm.target_date}
                                                onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Monthly Contribution</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={goalForm.monthly_contribution}
                                                onChange={(e) => setGoalForm({ ...goalForm, monthly_contribution: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={goalForm.notes}
                                            onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]">
                                        Create Goal
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {goals.map(goal => (
                            <div key={goal.id} className="space-y-2">
                                <GoalProgressCard 
                                    goal={goal} 
                                    onUpdate={refetchGoals}
                                />
                                <div className="flex gap-2">
                                    <ShareDialog
                                        entityType="FinancialGoal"
                                        entityId={goal.id}
                                        entityName={goal.title}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedGoalForCollab(selectedGoalForCollab === goal.id ? null : goal.id)}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        {selectedGoalForCollab === goal.id ? 'Hide' : 'Collaborate'}
                                    </Button>
                                </div>
                                {selectedGoalForCollab === goal.id && (
                                    <div className="space-y-4 mt-4">
                                        <AICollaborationInsights
                                            entityType="FinancialGoal"
                                            entityId={goal.id}
                                            insightType="financial_goal_collaboration"
                                        />
                                        <CommentsSection
                                            entityType="FinancialGoal"
                                            entityId={goal.id}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}