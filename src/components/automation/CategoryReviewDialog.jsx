import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
    'Housing', 'Transportation', 'Food & Dining', 'Healthcare', 
    'Entertainment', 'Shopping', 'Travel', 'Education', 'Personal Care',
    'Bills & Utilities', 'Subscriptions', 'Insurance', 'Investments',
    'Debt Payments', 'Gifts & Donations', 'Other'
];

export default function CategoryReviewDialog({ open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [corrections, setCorrections] = useState({});

    const { data: pendingTransactions = [] } = useQuery({
        queryKey: ['pendingCategorization'],
        queryFn: async () => {
            const transactions = await base44.entities.BudgetTransaction.filter({});
            // Filter transactions that might need review (low confidence or no category)
            return transactions.filter(t => !t.category || t.ai_confidence < 0.7).slice(0, 20);
        },
        enabled: open
    });

    const correctCategoryMutation = useMutation({
        mutationFn: async ({ transactionId, merchant, originalCategory, correctedCategory, transactionType }) => {
            // Learn from correction
            await base44.functions.invoke('learnFromCorrection', {
                merchant,
                original_category: originalCategory,
                corrected_category: correctedCategory,
                transaction_type: transactionType
            });
            
            // Update transaction
            await base44.entities.BudgetTransaction.update(transactionId, {
                category: correctedCategory,
                ai_confidence: 1.0
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pendingCategorization']);
            queryClient.invalidateQueries(['budgetTransactions']);
            toast.success('Category updated and learned');
        }
    });

    const handleCorrection = (transaction) => {
        const correctedCategory = corrections[transaction.id];
        if (!correctedCategory) return;

        correctCategoryMutation.mutate({
            transactionId: transaction.id,
            merchant: transaction.description,
            originalCategory: transaction.category,
            correctedCategory: correctedCategory,
            transactionType: 'budget'
        });
    };

    const handleAccept = async (transaction) => {
        await base44.entities.BudgetTransaction.update(transaction.id, {
            ai_confidence: 1.0
        });
        queryClient.invalidateQueries(['pendingCategorization']);
        toast.success('Category confirmed');
    };

    if (pendingTransactions.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Category Review</DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p className="text-gray-600">All transactions categorized!</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Review AI Categorization ({pendingTransactions.length} pending)
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {pendingTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium">{transaction.description}</p>
                                    <p className="text-sm text-gray-500">${transaction.amount}</p>
                                </div>
                                {transaction.ai_confidence && (
                                    <Badge variant="outline" className={
                                        transaction.ai_confidence >= 0.8 ? 'border-green-500 text-green-700' :
                                        transaction.ai_confidence >= 0.6 ? 'border-yellow-500 text-yellow-700' :
                                        'border-red-500 text-red-700'
                                    }>
                                        {(transaction.ai_confidence * 100).toFixed(0)}% confident
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">AI Suggestion:</span>
                                <Badge>{transaction.category || 'Uncategorized'}</Badge>
                                {transaction.ai_confidence < 0.7 && (
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Select
                                    value={corrections[transaction.id] || ''}
                                    onValueChange={(value) => 
                                        setCorrections({ ...corrections, [transaction.id]: value })
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Change category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                {corrections[transaction.id] ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handleCorrection(transaction)}
                                        disabled={correctCategoryMutation.isPending}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Save
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAccept(transaction)}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Accept
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}