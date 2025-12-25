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
import { Users, Plus, Mail, Phone, Building2, TrendingUp, DollarSign, Sparkles, MessageSquare, FileText, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ClientOnboardingWizard from '@/components/business/ClientOnboardingWizard';
import ClientCommunicationHub from '@/components/business/ClientCommunicationHub';
import ClientInteractionsTracker from '@/components/business/ClientInteractionsTracker';
import ClientImportantDates from '@/components/business/ClientImportantDates';
import ClientFollowUpTasks from '@/components/business/ClientFollowUpTasks';

export default function BusinessClients() {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        industry: '',
        status: 'lead',
        billing_rate: '',
        payment_terms: 'Net 30',
        notes: ''
    });
    const queryClient = useQueryClient();

    const { data: clients = [] } = useQuery({
        queryKey: ['business-clients'],
        queryFn: () => base44.entities.BusinessClient.list('-created_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.BusinessClient.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-clients'] });
            resetForm();
            toast.success('Client added');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.BusinessClient.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-clients'] });
            resetForm();
            toast.success('Client updated');
        }
    });

    const resetForm = () => {
        setShowForm(false);
        setEditingClient(null);
        setFormData({
            company_name: '',
            contact_name: '',
            email: '',
            phone: '',
            address: '',
            industry: '',
            status: 'lead',
            billing_rate: '',
            payment_terms: 'Net 30',
            notes: ''
        });
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData(client);
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            billing_rate: formData.billing_rate ? parseFloat(formData.billing_rate) : null
        };

        if (editingClient) {
            updateMutation.mutate({ id: editingClient.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const statusColors = {
        lead: 'bg-blue-100 text-blue-700',
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-gray-100 text-gray-700',
        archived: 'bg-red-100 text-red-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">Clients</h1>
                            <p className="text-[#0F1729]/60">Manage your client relationships</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setShowWizard(true)} className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                <Sparkles className="w-5 h-5 mr-2" />
                                AI Onboarding
                            </Button>
                            <Button onClick={() => setShowForm(true)} variant="outline" className="border-[#4A90E2] text-[#4A90E2]">
                                <Plus className="w-5 h-5 mr-2" />
                                Quick Add
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Clients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <Card key={client.id} className="hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="cursor-pointer" onClick={() => handleEdit(client)}>
                                        <CardTitle className="text-lg">{client.company_name}</CardTitle>
                                        <p className="text-sm text-[#0F1729]/60">{client.contact_name}</p>
                                    </div>
                                    <Badge className={statusColors[client.status]}>
                                        {client.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3" onClick={() => handleEdit(client)}>
                                    <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                        <Mail className="w-4 h-4" />
                                        {client.email}
                                    </div>
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                            <Phone className="w-4 h-4" />
                                            {client.phone}
                                        </div>
                                    )}
                                    {client.industry && (
                                        <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                            <Building2 className="w-4 h-4" />
                                            {client.industry}
                                        </div>
                                    )}
                                    {client.billing_rate && (
                                        <div className="flex items-center gap-2 text-sm text-[#4A90E2] font-medium">
                                            <DollarSign className="w-4 h-4" />
                                            ${client.billing_rate}/hour
                                        </div>
                                    )}
                                    {client.outstanding_balance > 0 && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                            <div className="text-xs text-orange-900">
                                                Outstanding: ${client.outstanding_balance.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                                    <Button 
                                        size="sm" 
                                        onClick={() => {
                                            navigate(createPageUrl('BusinessInvoices'), { 
                                                state: { preselectedClientId: client.id } 
                                            });
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Invoice
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(client)} className="flex-1">
                                        <Edit2 className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Client Form Dialog */}
                <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {editingClient ? (
                                    <>
                                        <Building2 className="w-5 h-5 text-[#4A90E2]" />
                                        {editingClient.company_name}
                                    </>
                                ) : (
                                    'Add New Client'
                                )}
                            </DialogTitle>
                        </DialogHeader>

                        {editingClient ? (
                            <div className="space-y-6">
                                {/* Client Details Section */}
                                <div className="border-b pb-4">
                                    <h3 className="text-lg font-medium mb-4">Client Details</h3>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Company Name *</Label>
                                    <Input
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Contact Name *</Label>
                                    <Input
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Industry</Label>
                                    <Input
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lead">Lead</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Hourly Rate</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.billing_rate}
                                        onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label>Payment Terms</Label>
                                    <Select
                                        value={formData.payment_terms}
                                        onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                                            <SelectItem value="Net 15">Net 15</SelectItem>
                                            <SelectItem value="Net 30">Net 30</SelectItem>
                                            <SelectItem value="Net 60">Net 60</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    {editingClient ? 'Update' : 'Create'} Client
                                </Button>
                            </div>
                        </form>
                                </div>

                                {/* CRM Features Section */}
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <ClientInteractionsTracker client={editingClient} />
                                        <ClientImportantDates client={editingClient} />
                                    </div>
                                    
                                    <ClientFollowUpTasks client={editingClient} />
                                    
                                    <div>
                                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-[#4A90E2]" />
                                            Communication Hub
                                        </h3>
                                        <ClientCommunicationHub client={editingClient} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Company Name *</Label>
                                        <Input
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Contact Name *</Label>
                                        <Input
                                            value={formData.contact_name}
                                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Email *</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Industry</Label>
                                    <Input
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        Create Client
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* AI Onboarding Wizard */}
                <ClientOnboardingWizard
                    open={showWizard}
                    onOpenChange={setShowWizard}
                    onComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ['business-clients'] });
                    }}
                />
            </div>
        </div>
    );
}