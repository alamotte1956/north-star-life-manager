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
import { Users, Plus, Mail, Phone, Building2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessClients() {
    const [showForm, setShowForm] = useState(false);
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
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Clients</h1>
                            <p className="text-[#1A2B44]/60">Manage your client relationships</p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Client
                        </Button>
                    </div>
                </div>

                {/* Clients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <Card key={client.id} className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleEdit(client)}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{client.company_name}</CardTitle>
                                        <p className="text-sm text-[#1A2B44]/60">{client.contact_name}</p>
                                    </div>
                                    <Badge className={statusColors[client.status]}>
                                        {client.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
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
                                        <div className="flex items-center gap-2 text-sm text-[#D4AF37] font-medium">
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
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Client Form Dialog */}
                <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                        </DialogHeader>
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
                                <Button type="submit" className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                    {editingClient ? 'Update' : 'Create'} Client
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}