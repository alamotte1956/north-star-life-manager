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
import { FileText, Plus, Send, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessContracts() {
    const [showForm, setShowForm] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        client_id: '',
        contract_title: '',
        contract_type: '',
        contract_value: '',
        start_date: '',
        end_date: '',
        template_data: {}
    });
    const queryClient = useQueryClient();

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => base44.entities.Contract.list('-created_date')
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['business-clients'],
        queryFn: () => base44.entities.BusinessClient.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const result = await base44.functions.invoke('generateContract', data);
            const client = clients.find(c => c.id === data.client_id);
            
            return base44.entities.Contract.create({
                ...data,
                client_name: client?.company_name || '',
                contract_content: result.data.contract_content,
                contract_value: data.contract_value ? parseFloat(data.contract_value) : null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            resetForm();
            toast.success('Contract generated');
        }
    });

    const signMutation = useMutation({
        mutationFn: (contractId) => base44.functions.invoke('requestESignature', { contract_id: contractId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('E-signature request sent');
        }
    });

    const resetForm = () => {
        setShowForm(false);
        setSelectedTemplate(null);
        setFormData({
            client_id: '',
            contract_title: '',
            contract_type: '',
            contract_value: '',
            start_date: '',
            end_date: '',
            template_data: {}
        });
    };

    const templates = [
        { value: 'service_agreement', label: 'Service Agreement', icon: '📄' },
        { value: 'nda', label: 'Non-Disclosure Agreement', icon: '🔒' },
        { value: 'sow', label: 'Statement of Work', icon: '📋' },
        { value: 'retainer', label: 'Retainer Agreement', icon: '💼' },
        { value: 'consulting', label: 'Consulting Agreement', icon: '🤝' }
    ];

    const statusColors = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        signed: 'bg-purple-100 text-purple-700',
        active: 'bg-green-100 text-green-700',
        expired: 'bg-red-100 text-red-700',
        terminated: 'bg-red-100 text-red-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">Contracts</h1>
                            <p className="text-[#0F1729]/60">Manage contracts with AI templates & e-signatures</p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                            <Plus className="w-5 h-5 mr-2" />
                            New Contract
                        </Button>
                    </div>
                </div>

                {/* Template Selection */}
                {showForm && !selectedTemplate && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Choose Contract Template</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {templates.map(template => (
                                    <Card 
                                        key={template.value}
                                        className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[#4A90E2]"
                                        onClick={() => {
                                            setSelectedTemplate(template.value);
                                            setFormData({ ...formData, contract_type: template.value });
                                        }}
                                    >
                                        <CardContent className="pt-6 text-center">
                                            <div className="text-4xl mb-3">{template.icon}</div>
                                            <div className="font-medium text-black">{template.label}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Contracts List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contracts.map((contract) => (
                        <Card key={contract.id} className="hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{contract.contract_title}</CardTitle>
                                        <p className="text-sm text-[#0F1729]/60">{contract.client_name}</p>
                                    </div>
                                    <Badge className={statusColors[contract.status]}>
                                        {contract.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[#0F1729]/60">Type</span>
                                        <span className="capitalize">{contract.contract_type.replace('_', ' ')}</span>
                                    </div>
                                    {contract.contract_value && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#0F1729]/60">Value</span>
                                            <span className="font-medium text-green-600">
                                                ${contract.contract_value.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {contract.start_date && contract.end_date && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#0F1729]/60">Period</span>
                                            <span>
                                                {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-3 border-t border-[#1A2B44]/10">
                                        {contract.status === 'draft' && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => signMutation.mutate(contract.id)}
                                                disabled={signMutation.isPending}
                                                className="flex-1 bg-[#4A90E2] hover:bg-[#2E5C8A] text-white"
                                                >
                                                <Send className="w-4 h-4 mr-2" />
                                                Send for Signature
                                            </Button>
                                        )}
                                        {contract.status === 'signed' && (
                                            <Badge className="bg-green-100 text-green-700 w-full justify-center py-2">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Fully Signed
                                            </Badge>
                                        )}
                                        {contract.status === 'sent' && (
                                            <Badge className="bg-blue-100 text-blue-700 w-full justify-center py-2">
                                                <Clock className="w-4 h-4 mr-2" />
                                                Awaiting Signature
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Contract Form Dialog */}
                <Dialog open={showForm && selectedTemplate} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Create Contract</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                            <div>
                                <Label>Client *</Label>
                                <Select
                                    value={formData.client_id}
                                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Contract Title *</Label>
                                <Input
                                    value={formData.contract_title}
                                    onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
                                    placeholder="e.g., Website Development Agreement"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Contract Value</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.contract_value}
                                        onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Template</Label>
                                    <Select value={formData.contract_type} disabled>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    Our AI will generate a professional contract based on the template and your details. 
                                    You can review and edit before sending for signature.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    {createMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4 mr-2" />
                                    )}
                                    Generate Contract
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}