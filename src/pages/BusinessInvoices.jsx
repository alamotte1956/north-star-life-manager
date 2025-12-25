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
import { FileText, Plus, Send, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessInvoices() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        client_id: '',
        project_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        tax_rate: 0,
        notes: ''
    });
    const queryClient = useQueryClient();

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list('-invoice_date')
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['business-clients'],
        queryFn: () => base44.entities.BusinessClient.list()
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => base44.entities.Project.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const client = clients.find(c => c.id === data.client_id);
            const project = projects.find(p => p.id === data.project_id);
            
            const subtotal = data.line_items.reduce((sum, item) => sum + item.amount, 0);
            const taxAmount = subtotal * (data.tax_rate / 100);
            const total = subtotal + taxAmount;

            const invoiceNumber = `INV-${Date.now()}`;

            return base44.entities.Invoice.create({
                ...data,
                invoice_number: invoiceNumber,
                client_name: client?.company_name || '',
                project_name: project?.project_name || '',
                subtotal,
                tax_amount: taxAmount,
                total_amount: total,
                balance_due: total
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            resetForm();
            toast.success('Invoice created');
        }
    });

    const resetForm = () => {
        setShowForm(false);
        setFormData({
            client_id: '',
            project_id: '',
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: '',
            line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
            tax_rate: 0,
            notes: ''
        });
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            line_items: [...formData.line_items, { description: '', quantity: 1, rate: 0, amount: 0 }]
        });
    };

    const updateLineItem = (index, field, value) => {
        const items = [...formData.line_items];
        items[index][field] = value;
        
        if (field === 'quantity' || field === 'rate') {
            items[index].amount = items[index].quantity * items[index].rate;
        }
        
        setFormData({ ...formData, line_items: items });
    };

    const removeLineItem = (index) => {
        if (formData.line_items.length > 1) {
            setFormData({
                ...formData,
                line_items: formData.line_items.filter((_, i) => i !== index)
            });
        }
    };

    const subtotal = formData.line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const total = subtotal + taxAmount;

    const statusColors = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        viewed: 'bg-purple-100 text-purple-700',
        partial: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">Invoices</h1>
                            <p className="text-[#0F1729]/60">Create, send, and track invoices</p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                            <Plus className="w-5 h-5 mr-2" />
                            New Invoice
                        </Button>
                    </div>
                </div>

                {/* Invoices List */}
                <div className="space-y-4">
                    {invoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FileText className="w-5 h-5 text-[#4A90E2]" />
                                            <div>
                                                <div className="font-medium text-black">
                                                    {invoice.invoice_number}
                                                </div>
                                                <div className="text-sm text-[#0F1729]/60">
                                                    {invoice.client_name} {invoice.project_name && `• ${invoice.project_name}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-light text-black mb-1">
                                            ${invoice.total_amount?.toLocaleString()}
                                        </div>
                                        <Badge className={statusColors[invoice.status]}>
                                            {invoice.status}
                                        </Badge>
                                        <div className="text-xs text-[#0F1729]/60 mt-1">
                                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {invoice.balance_due > 0 && invoice.status !== 'paid' && (
                                    <div className="mt-4 pt-4 border-t border-[#1A2B44]/10">
                                        <div className="text-sm text-orange-600">
                                            Balance due: ${invoice.balance_due.toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Invoice Form Dialog */}
                <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Invoice</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Client *</Label>
                                    <Select
                                        value={formData.client_id}
                                        onValueChange={(value) => {
                                            const client = clients.find(c => c.id === value);
                                            const dueDate = new Date();
                                            if (client?.payment_terms === 'Net 15') dueDate.setDate(dueDate.getDate() + 15);
                                            else if (client?.payment_terms === 'Net 60') dueDate.setDate(dueDate.getDate() + 60);
                                            else dueDate.setDate(dueDate.getDate() + 30);
                                            
                                            setFormData({ 
                                                ...formData, 
                                                client_id: value,
                                                due_date: dueDate.toISOString().split('T')[0]
                                            });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select client..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.length === 0 ? (
                                                <div className="p-2 text-sm text-gray-500">
                                                    No clients yet. Go to Business Clients to add one.
                                                </div>
                                            ) : (
                                                clients.map(client => (
                                                    <SelectItem key={client.id} value={client.id}>
                                                        {client.company_name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {clients.length === 0 && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            Add a client first in Business Clients page
                                        </p>
                                    )}
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
                                            {projects
                                                .filter(p => !formData.client_id || p.client_id === formData.client_id)
                                                .map(project => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.project_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Invoice Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.invoice_date}
                                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label>Line Items</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Item
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {formData.line_items.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <Input
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Rate"
                                                value={item.rate}
                                                onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                className="w-24"
                                            />
                                            <div className="w-28 flex items-center font-medium text-[#1A2B44]">
                                                ${item.amount.toFixed(2)}
                                            </div>
                                            {formData.line_items.length > 1 && (
                                                <Button 
                                                    type="button" 
                                                    size="icon" 
                                                    variant="ghost"
                                                    onClick={() => removeLineItem(index)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#1A2B44]/60">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <Label className="text-[#1A2B44]/60">Tax Rate (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.tax_rate}
                                        onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-20 h-8"
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#1A2B44]/60">Tax</span>
                                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-medium pt-2 border-t border-[#1A2B44]/10">
                                    <span>Total</span>
                                    <span className="text-green-600">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Create Invoice
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}