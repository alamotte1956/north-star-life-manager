import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Plus, TrendingUp, AlertTriangle, Target, Sparkles, Users, RefreshCw, Loader2, TrendingDown, Brain } from 'lucide-react';
import { toast } from 'sonner';
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
import GoalDetailDialog from '../components/goals/GoalDetailDialog';
import AdvancedAIInsights from '../components/budget/AdvancedAIInsights';
import CategoryReviewDialog from '../components/automation/CategoryReviewDialog';
import CategoryRulesManager from '../components/automation/CategoryRulesManager';
import RecurringItemsDetector from '../components/budget/RecurringItemsDetector';

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
    const queryClient = useQueryClient();
    const [budgetOpen, setBudgetOpen] = useState(false);
    const [goalOpen, setGoalOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState({});
    const [selectedGoalForCollab, setSelectedGoalForCollab] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [syncingTransactions, setSyncingTransactions] = useState(false);
    const [selectedGoalForDetail, setSelectedGoalForDetail] = useState(null);
    const [advancedInsights, setAdvancedInsights] = useState(null);
    const [loadingAdvanced, setLoadingAdvanced] = useState(false);
    const [showCategoryReview, setShowCategoryReview] = useState(false);
    const [showRecurringDetector, setShowRecurringDetector] = useState(false);
    const [budgetForm, setBudgetForm] = useState({
        category: 'other',
        monthly_limit: '',
        period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        alert_threshold: 80,
        auto_rollover: false,
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

    const { data: budgetTransactions = [] } = useQuery({
        queryKey: ['budgetTransactions'],
        queryFn: () => base44.entities.BudgetTransaction.list('-transaction_date')
    });

    const { data: bills = [] } = useQuery({
        queryKey: ['bills'],
        queryFn: () => base44.entities.BillPayment.list()
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => base44.entities.Subscription.list()
    });

    const handleBudgetSubmit = async (e) => {
        e.preventDefault();
        try {
            await base44.entities.Budget.create(budgetForm);
            setBudgetOpen(false);
            setBudgetForm({
                category: 'other',
                monthly_limit: '',
                period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                alert_threshold: 80,
                auto_rollover: false,
                notes: ''
            });
            refetchBudgets();
            toast.success('Budget created successfully!');
        } catch (error) {
            toast.error('Failed to create budget');
        }
    };

    const syncTransactions = async () => {
        setSyncingTransactions(true);
        try {
            await base44.functions.invoke('syncBudgetTransactions', {});
            queryClient.invalidateQueries(['budgets']);
            queryClient.invalidateQueries(['budgetTransactions']);
            toast.success('Transactions synced successfully!');
        } catch (error) {
            toast.error('Failed to sync transactions');
        }
        setSyncingTransactions(false);
    };

    const analyzePerformance = async () => {
        setLoadingInsights(true);
        try {
            const result = await base44.functions.invoke('analyzeBudgetPerformance', {});
            setAiInsights(result.data);
            toast.success('Budget analysis complete!');
        } catch (error) {
            toast.error('Failed to analyze budget');
        }
        setLoadingInsights(false);
    };

    const runAdvancedAnalysis = async () => {
        setLoadingAdvanced(true);
        try {
            const result = await base44.functions.invoke('advancedBudgetAI', {});
            setAdvancedInsights(result.data);
            toast.success('Advanced AI analysis complete!');
        } catch (error) {
            toast.error('Failed to run advanced analysis');
            console.error(error);
        }
        setLoadingAdvanced(false);
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

    const calculateSpending = (budgetId) => {
        return budgetTransactions
            .filter(t => t.budget_id === budgetId)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    };

    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const today = new Date();
        const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return Math.max(0, diff);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Budget & Goals</h1>
                            <p className="text-[#0F1729]/60 font-light">Real-time spending tracking with AI insights</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={syncTransactions}
                            disabled={syncingTransactions}
                            variant="outline"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncingTransactions ? 'animate-spin' : ''}`} />
                            Sync
                        </Button>
                        <Button
                            onClick={() => setShowCategoryReview(true)}
                            variant="outline"
                            className="border-purple-500 text-purple-600"
                        >
                            <Brain className="w-4 h-4 mr-2" />
                            Review Categories
                        </Button>
                        <Button
                            onClick={() => setShowRecurringDetector(true)}
                            variant="outline"
                            className="border-blue-500 text-blue-600"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Detect Recurring
                        </Button>
                        <Button
                            onClick={analyzePerformance}
                            disabled={loadingInsights}
                            variant="outline"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {loadingInsights ? 'Analyzing...' : 'Basic Insights'}
                        </Button>
                        <Button
                            onClick={runAdvancedAnalysis}
                            disabled={loadingAdvanced}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {loadingAdvanced ? 'Analyzing...' : 'Advanced AI Analysis'}
                        </Button>
                    </div>
                </div>

                {/* Advanced AI Insights */}
                {advancedInsights && (
                    <AdvancedAIInsights insights={advancedInsights} />
                )}

                {/* AI Insights Section */}
                {aiInsights && (
                    <Card className="mb-8 bg-gradient-to-br from-[#4A90E2]/10 to-[#7BB3E0]/10 border-[#4A90E2]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                                Budget Performance Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">Health Assessment</h3>
                                <p className="text-black/70">{aiInsights.ai_insights.health_assessment}</p>
                            </div>

                            {aiInsights.ai_insights.attention_required?.length > 0 && (
                                <div>
                                    <h3 className="font-medium mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        Requires Attention
                                    </h3>
                                    <ul className="space-y-1">
                                        {aiInsights.ai_insights.attention_required.map((item, idx) => (
                                            <li key={idx} className="text-sm text-black/70">• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.ai_insights.spending_patterns?.length > 0 && (
                                <div>
                                    <h3 className="font-medium mb-2">Spending Patterns</h3>
                                    <ul className="space-y-1">
                                        {aiInsights.ai_insights.spending_patterns.map((pattern, idx) => (
                                            <li key={idx} className="text-sm text-black/70">• {pattern}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.ai_insights.forecast && (
                                <div>
                                    <h3 className="font-medium mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Forecast
                                    </h3>
                                    <p className="text-sm text-black/70">{aiInsights.ai_insights.forecast}</p>
                                </div>
                            )}

                            {aiInsights.ai_insights.recommendations?.length > 0 && (
                                <div>
                                    <h3 className="font-medium mb-2">Recommendations</h3>
                                    <ul className="space-y-1">
                                        {aiInsights.ai_insights.recommendations.map((rec, idx) => (
                                            <li key={idx} className="text-sm text-black/70">• {rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {aiInsights.ai_insights.reallocation_opportunities?.length > 0 && (
                                <div>
                                    <h3 className="font-medium mb-2">Reallocation Opportunities</h3>
                                    <ul className="space-y-1">
                                        {aiInsights.ai_insights.reallocation_opportunities.map((opp, idx) => (
                                            <li key={idx} className="text-sm text-black/70">• {opp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Budgets Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-light text-black">Budgets</h2>
                        <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
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
                                    <div>
                                       <Label>Monthly Limit</Label>
                                       <Input
                                           type="number"
                                           step="0.01"
                                           value={budgetForm.monthly_limit}
                                           onChange={(e) => setBudgetForm({ ...budgetForm, monthly_limit: e.target.value })}
                                           placeholder="0.00"
                                           required
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div>
                                           <Label>Period Start</Label>
                                           <Input
                                               type="date"
                                               value={budgetForm.period_start}
                                               onChange={(e) => setBudgetForm({ ...budgetForm, period_start: e.target.value })}
                                               required
                                           />
                                       </div>
                                       <div>
                                           <Label>Period End</Label>
                                           <Input
                                               type="date"
                                               value={budgetForm.period_end}
                                               onChange={(e) => setBudgetForm({ ...budgetForm, period_end: e.target.value })}
                                               required
                                           />
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Alert Threshold (%)</Label>
                                            <Input
                                                type="number"
                                                value={budgetForm.alert_threshold}
                                                onChange={(e) => setBudgetForm({ ...budgetForm, alert_threshold: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="autoRollover"
                                                checked={budgetForm.auto_rollover}
                                                onChange={(e) => setBudgetForm({ ...budgetForm, auto_rollover: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="autoRollover" className="cursor-pointer">Auto rollover unused budget</Label>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={budgetForm.notes}
                                            onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                                            placeholder="Optional notes about this budget..."
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        Create Budget
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {budgets.map(budget => {
                            const spent = budget.current_spending || calculateSpending(budget.id);
                            const percentage = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
                            const remaining = budget.monthly_limit - spent;
                            const isOverBudget = percentage > 100;
                            const isNearThreshold = percentage >= budget.alert_threshold;
                            const daysRemaining = getDaysRemaining(budget.period_end);

                            return (
                                <Card key={budget.id} className="hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="text-lg font-light">{categoryLabels[budget.category]}</span>
                                            {isNearThreshold && (
                                                <AlertTriangle className={`w-5 h-5 ${isOverBudget ? 'text-red-500' : 'text-yellow-500'}`} />
                                            )}
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="w-fit text-xs">
                                                {daysRemaining} days left
                                            </Badge>
                                            {budget.auto_rollover && (
                                                <Badge variant="outline" className="w-fit text-xs bg-blue-50">
                                                    Auto-rollover
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-2xl font-light">${spent.toLocaleString()}</span>
                                                    <span className="text-sm text-black/60">of ${budget.monthly_limit.toLocaleString()}</span>
                                                </div>
                                                <Progress 
                                                    value={Math.min(percentage, 100)} 
                                                    className={isOverBudget ? 'bg-red-100' : isNearThreshold ? 'bg-yellow-100' : ''}
                                                />
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className={`text-sm ${isOverBudget ? 'text-red-600' : isNearThreshold ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {percentage.toFixed(0)}% used
                                                    </p>
                                                    <p className={`text-sm font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {remaining >= 0 ? `$${remaining.toLocaleString()} left` : `$${Math.abs(remaining).toLocaleString()} over`}
                                                    </p>
                                                </div>
                                            </div>
                                            {budget.rollover_amount > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                                    <TrendingDown className="w-3 h-3" />
                                                    ${budget.rollover_amount.toLocaleString()} rolled over
                                                </div>
                                            )}
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
                                <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
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
                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        Create Goal
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {goals.map(goal => (
                            <div key={goal.id} className="space-y-2">
                                <div className="cursor-pointer" onClick={() => setSelectedGoalForDetail(goal)}>
                                    <GoalProgressCard 
                                        goal={goal} 
                                        onUpdate={refetchGoals}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedGoalForDetail(goal)}
                                        className="flex-1"
                                    >
                                        <Target className="w-4 h-4 mr-2" />
                                        View Details & AI Analysis
                                    </Button>
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
                    
                    {/* Goal Detail Dialog */}
                    <GoalDetailDialog
                        goal={selectedGoalForDetail}
                        open={!!selectedGoalForDetail}
                        onOpenChange={(open) => !open && setSelectedGoalForDetail(null)}
                    />
                </div>

                {/* Category Review Dialog */}
                <CategoryReviewDialog 
                    open={showCategoryReview}
                    onOpenChange={setShowCategoryReview}
                />

                {/* Recurring Items Detector */}
                <RecurringItemsDetector
                    open={showRecurringDetector}
                    onOpenChange={setShowRecurringDetector}
                />

                {/* Category Rules Manager */}
                <div className="mt-12">
                    <CategoryRulesManager />
                </div>
            </div>
        </div>
    );
}