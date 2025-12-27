import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const categories = [
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'health', label: 'Health' },
    { value: 'travel', label: 'Travel' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'dining', label: 'Dining' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
];

export default function TransactionReview() {
    const [editingId, setEditingId] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const queryClient = useQueryClient();

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['uncategorized-transactions'],
        queryFn: () => base44.entities.Transaction.list('-date', 50)
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, category, oldCategory, merchant, description }) => {
            await base44.entities.Transaction.update(id, { 
                category,
                notes: null
            });
            
            // Save correction for learning
            await base44.entities.TransactionCorrection.create({
                merchant,
                description_pattern: description,
                corrected_category: category,
                ai_suggested_category: oldCategory,
                confidence: 1.0
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['uncategorized-transactions'] });
            toast.success('Transaction updated and learning saved');
            setEditingId(null);
        }
    });

    const needsReview = transactions.filter(t => 
        t.notes && t.notes.includes('AI Confidence')
    );

    if (isLoading) return null;
    if (needsReview.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Review AI Categorization ({needsReview.length})
                </CardTitle>
                <p className="text-sm text-black/60">
                    Low confidence transactions - review to improve future accuracy
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {needsReview.map(txn => (
                        <div 
                            key={txn.id} 
                            className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <p className="font-medium">{txn.description}</p>
                                    {editingId === txn.id ? (
                                        <Select value={newCategory} onValueChange={setNewCategory}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge className="bg-amber-100 text-amber-800">
                                            {txn.category}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-black/60">
                                    <span>{txn.merchant}</span>
                                    <span>•</span>
                                    <span className={txn.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                        ${Math.abs(txn.amount).toLocaleString()}
                                    </span>
                                </div>
                                {txn.notes && (
                                    <p className="text-xs text-amber-700 mt-1">{txn.notes}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {editingId === txn.id ? (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                updateMutation.mutate({
                                                    id: txn.id,
                                                    category: newCategory,
                                                    oldCategory: txn.category,
                                                    merchant: txn.merchant,
                                                    description: txn.description
                                                });
                                            }}
                                            disabled={!newCategory}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Save className="w-4 h-4 mr-1" />
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingId(null);
                                                setNewCategory('');
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingId(txn.id);
                                                setNewCategory(txn.category);
                                            }}
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" />
                                            Correct
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                updateMutation.mutate({
                                                    id: txn.id,
                                                    category: txn.category,
                                                    oldCategory: txn.category,
                                                    merchant: txn.merchant,
                                                    description: txn.description
                                                });
                                            }}
                                            className="text-green-600 hover:text-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Approve
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}