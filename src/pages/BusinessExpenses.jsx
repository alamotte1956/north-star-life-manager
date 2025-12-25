import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Plus, Upload, CheckCircle, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessExpenses() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        project_id: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: '',
        vendor: '',
        billable: false,
        tax_deductible: true
    });
    const queryClient = useQueryClient();

    const { data: expenses = [] } = useQuery({
        queryKey: ['business-expenses'],
        queryFn: () => base44.entities.BusinessExpense.list('-expense_date')
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => base44.entities.Project.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const project = projects.find(p => p.id === data.project_id);
            
            const expense = await base44.entities.BusinessExpense.create({
                ...data,
                amount: parseFloat(data.amount),
                project_name: project?.project_name || '',
                client_id: project?.client_id || '',
                client_name: project?.client_name || ''
            });

            // Sync to Transaction entity for financial tracking
            await base44.entities.Transaction.create({
                date: data.expense_date,
                description: `Business: ${data.description}`,
                amount: -parseFloat(data.amount),
                category: 'Business Expense',
                merchant: data.vendor,
                tags: ['business', data.category]
            });

            return expense;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            resetForm();
            toast.success('Expense added and synced to financial records');
        }
    });

    const resetForm = () => {
        setShowForm(false);
        setFormData({
            project_id: '',
            expense_date: new Date().toISOString().split('T')[0],
            category: '',
            description: '',
            amount: '',
            vendor: '',
            billable: false,
            tax_deductible: true
        });
    };

    const thisMonthExpenses = expenses
        .filter(e => {
            const expenseDate = new Date(e.expense_date);
            const now = new Date();
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const billableExpenses = expenses.filter(e => e.billable && !e.invoiced);
    const totalBillable = billableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Business Expenses</h1>
                            <p className="text-[#1A2B44]/60">Track and categorize business expenses</p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Expense
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">This Month</span>
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${thisMonthExpenses.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Billable (Uninvoiced)</span>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${totalBillable.toLocaleString()}
                            </div>
                            <div className="text-xs text-[#1A2B44]/60 mt-1">
                                {billableExpenses.length} expenses
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Total Expenses</span>
                                <DollarSign className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">{expenses.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expenses List */}
                <div className="space-y-3">
                    {expenses.map((expense) => (
                        <Card key={expense.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium text-[#1A2B44] mb-1">
                                            {expense.description}
                                        </div>
                                        <div className="text-sm text-[#1A2B44]/60">
                                            {new Date(expense.expense_date).toLocaleDateString()} • {expense.vendor}
                                            {expense.project_name && ` • ${expense.project_name}`}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                {expense.category}
                                            </Badge>
                                            {expense.billable && (
                                                <Badge className="bg-green-100 text-green-700 text-xs">
                                                    Billable
                                                </Badge>
                                            )}
                                            {expense.tax_deductible && (
                                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                    Tax Deductible
                                                </Badge>
                                            )}
                                            {expense.invoiced && (
                                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Invoiced
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-light text-[#1A2B44]">
                                        ${expense.amount?.toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Expense Form Dialog */}
                <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Business Expense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Expense Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.expense_date}
                                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="materials">Materials</SelectItem>
                                            <SelectItem value="software">Software</SelectItem>
                                            <SelectItem value="travel">Travel</SelectItem>
                                            <SelectItem value="meals">Meals & Entertainment</SelectItem>
                                            <SelectItem value="professional_services">Professional Services</SelectItem>
                                            <SelectItem value="office">Office Supplies</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Description *</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Amount *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Vendor</Label>
                                    <Input
                                        value={formData.vendor}
                                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Project (Optional)</Label>
                                <Select
                                    value={formData.project_id}
                                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(project => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.project_name} - {project.client_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <Label htmlFor="billable">Billable to Client</Label>
                                <Switch
                                    id="billable"
                                    checked={formData.billable}
                                    onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <Label htmlFor="tax_deductible">Tax Deductible</Label>
                                <Switch
                                    id="tax_deductible"
                                    checked={formData.tax_deductible}
                                    onCheckedChange={(checked) => setFormData({ ...formData, tax_deductible: checked })}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                    Add Expense
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}