import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, Calendar, Wrench, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function HomeServices() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        service_type: 'cleaning',
        property_id: '',
        frequency: 'weekly',
        provider: '',
        cost: 0,
        next_scheduled: '',
        notes: ''
    });

    const queryClient = useQueryClient();

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list()
    });

    // Using MaintenanceTask entity for home services
    const { data: services = [] } = useQuery({
        queryKey: ['homeServices'],
        queryFn: () => base44.entities.MaintenanceTask.filter({
            category: { $in: ['cleaning', 'landscaping', 'pool_service', 'pest_control'] }
        }, '-next_due_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const property = properties.find(p => p.id === data.property_id);
            return base44.entities.MaintenanceTask.create({
                ...data,
                title: `${data.service_type} - ${property?.name || 'Home'}`,
                property_name: property?.name,
                status: 'scheduled',
                next_due_date: data.next_scheduled
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['homeServices']);
            setDialogOpen(false);
            resetForm();
            toast.success('Service scheduled!');
        }
    });

    const resetForm = () => {
        setFormData({
            service_type: 'cleaning',
            property_id: '',
            frequency: 'weekly',
            provider: '',
            cost: 0,
            next_scheduled: '',
            notes: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const serviceTypes = [
        { value: 'cleaning', label: 'House Cleaning', icon: '🧹' },
        { value: 'landscaping', label: 'Landscaping', icon: '🌳' },
        { value: 'pool_service', label: 'Pool Service', icon: '🏊' },
        { value: 'pest_control', label: 'Pest Control', icon: '🐛' },
        { value: 'other', label: 'Other Service', icon: '🔧' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Home Services
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Coordinate cleaning, landscaping, and maintenance</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Schedule Service
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <Card key={service.id} className="border-[#4A90E2]/20">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Wrench className="w-5 h-5 text-[#4A90E2]" />
                                        {service.title}
                                    </span>
                                    <Badge className={
                                        service.status === 'completed' 
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }>
                                        {service.status}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {service.provider && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#0F1729]/60">Provider:</span>
                                        <span className="font-medium">{service.provider}</span>
                                    </div>
                                )}

                                {service.frequency && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#0F1729]/60">Frequency:</span>
                                        <Badge variant="outline">{service.frequency}</Badge>
                                    </div>
                                )}

                                {service.next_due_date && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-[#4A90E2]" />
                                        <span>Next: {format(new Date(service.next_due_date), 'MMM d, yyyy')}</span>
                                    </div>
                                )}

                                {service.estimated_cost && (
                                    <div className="flex justify-between text-sm pt-3 border-t border-[#4A90E2]/10">
                                        <span className="text-[#0F1729]/60">Cost:</span>
                                        <span className="font-medium text-[#4A90E2]">
                                            ${service.estimated_cost.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {services.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Home className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No services scheduled yet</p>
                            <p className="text-sm text-[#0F1729]/40">Coordinate all your home services in one place</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Schedule Home Service</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Service Type *</Label>
                                <Select 
                                    value={formData.service_type} 
                                    onValueChange={(val) => setFormData({ ...formData, service_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Property *</Label>
                                <Select 
                                    value={formData.property_id} 
                                    onValueChange={(val) => setFormData({ ...formData, property_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select property..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map(prop => (
                                            <SelectItem key={prop.id} value={prop.id}>
                                                {prop.name || prop.address}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Frequency</Label>
                                <Select 
                                    value={formData.frequency} 
                                    onValueChange={(val) => setFormData({ ...formData, frequency: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="one_time">One Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Provider/Company</Label>
                                <Input
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Cost</Label>
                                <Input
                                    type="number"
                                    value={formData.cost || ''}
                                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label>Next Scheduled Date</Label>
                                <Input
                                    type="date"
                                    value={formData.next_scheduled}
                                    onChange={(e) => setFormData({ ...formData, next_scheduled: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="Special instructions, access codes, etc."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Schedule Service
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}