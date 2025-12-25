import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Brain, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
    'Housing', 'Transportation', 'Food & Dining', 'Healthcare', 
    'Entertainment', 'Shopping', 'Travel', 'Education', 'Personal Care',
    'Bills & Utilities', 'Subscriptions', 'Insurance', 'Investments',
    'Debt Payments', 'Gifts & Donations', 'Other'
];

export default function CategoryRulesManager() {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);
    const [ruleForm, setRuleForm] = useState({
        merchant_pattern: '',
        category: 'Other',
        applies_to: 'all'
    });

    const { data: rules = [] } = useQuery({
        queryKey: ['categorizationRules'],
        queryFn: () => base44.entities.CategorizationRule.list('-match_count')
    });

    const createRuleMutation = useMutation({
        mutationFn: (data) => base44.entities.CategorizationRule.create({
            ...data,
            rule_type: 'user_created',
            confidence: 1.0
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['categorizationRules']);
            setShowDialog(false);
            setRuleForm({ merchant_pattern: '', category: 'Other', applies_to: 'all' });
            toast.success('Rule created');
        }
    });

    const toggleRuleMutation = useMutation({
        mutationFn: ({ id, is_active }) => 
            base44.entities.CategorizationRule.update(id, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries(['categorizationRules']);
            toast.success('Rule updated');
        }
    });

    const deleteRuleMutation = useMutation({
        mutationFn: (id) => base44.entities.CategorizationRule.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['categorizationRules']);
            toast.success('Rule deleted');
        }
    });

    const getRuleTypeColor = (type) => {
        switch (type) {
            case 'user_created': return 'bg-blue-100 text-blue-800';
            case 'ai_learned': return 'bg-purple-100 text-purple-800';
            case 'manual_correction': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#C5A059]">Categorization Rules</h3>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rule
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Categorization Rule</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            createRuleMutation.mutate(ruleForm);
                        }} className="space-y-4">
                            <div>
                                <Label>Merchant Pattern</Label>
                                <Input
                                    value={ruleForm.merchant_pattern}
                                    onChange={(e) => setRuleForm({ ...ruleForm, merchant_pattern: e.target.value })}
                                    placeholder="e.g., Netflix, Amazon, Starbucks"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Transactions containing this text will be auto-categorized
                                </p>
                            </div>
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={ruleForm.category}
                                    onValueChange={(value) => setRuleForm({ ...ruleForm, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Applies To</Label>
                                <Select
                                    value={ruleForm.applies_to}
                                    onValueChange={(value) => setRuleForm({ ...ruleForm, applies_to: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Transactions</SelectItem>
                                        <SelectItem value="budget">Budget Only</SelectItem>
                                        <SelectItem value="investment">Investments Only</SelectItem>
                                        <SelectItem value="bill">Bills Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-[#C5A059]">
                                Create Rule
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {rules.map((rule) => (
                    <Card key={rule.id} className="bg-[#1a1a1a] border-[#C5A059]">
                        <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="font-medium text-[#C5A059]">{rule.merchant_pattern}</p>
                                        <Badge className={getRuleTypeColor(rule.rule_type)}>
                                            {rule.rule_type === 'ai_learned' && <Brain className="w-3 h-3 mr-1" />}
                                            {rule.rule_type.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {rule.category}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-[#B8935E]">
                                        <span>Matched {rule.match_count || 0} times</span>
                                        {rule.correction_count > 0 && (
                                            <span className="text-yellow-600">
                                                Corrected {rule.correction_count} times
                                            </span>
                                        )}
                                        <span>Confidence: {((rule.confidence || 0) * 100).toFixed(0)}%</span>
                                        <span>Applies to: {rule.applies_to}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={rule.is_active}
                                        onCheckedChange={(checked) => 
                                            toggleRuleMutation.mutate({ id: rule.id, is_active: checked })
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {rules.length === 0 && (
                <Card className="bg-[#1a1a1a] border-[#C5A059]">
                    <CardContent className="py-12 text-center">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-[#C5A059]" />
                        <p className="text-[#B8935E] mb-4">No categorization rules yet</p>
                        <p className="text-sm text-[#B8935E]">
                            AI will create rules automatically as it learns from your transactions
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}