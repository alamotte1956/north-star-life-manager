import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function HomeServices() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        service_type: 'cleaning',
        provider_name: '',
        schedule_type: 'recurring',
        frequency: 'weekly',
        next_date: '',
        time: '',
        property_id: '',
        cost: '',
        special_instructions: ''
    });

    const queryClient = useQueryClient();

    const { data: services = [] } = useQuery({
        queryKey: ['homeServices'],
        queryFn: () => base44.entities.MaintenanceTask.filter({ category: { $in: ['cleaning', 'landscaping', 'pool', 'other_service'] } })
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const property = properties.find(p => p.id === data.property_id);
            return base44.entities.MaintenanceTask.create({
                ...data,
                category: data.service_type,
                title: `${data.service_type} - ${data.provider_name}`,
                property_name: property?.name,
                next_due_date: data.next_date,
                frequency: data.schedule_type === 'one_time' ? 'one_time' : data.frequency,
                estimated_cost: parseFloat(data.cost)
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
            provider_name: '',
            schedule_type: 'recurring',
            frequency: 'weekly',
            next_date: '',
            time: '',
            property_id: '',
            cost: '',
            special_instructions: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const serviceIcons = {
        cleaning: '🧹',
        landscaping: '🌳',
        pool: '🏊',
        other_service: '🏠'
    };

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
                            <p className="text-[#0F1729]/60 font-light">Coordinate cleaning, landscaping, and property care</p>
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
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <span className="text-2xl">{serviceIcons[service.category]}</span>
                                        {service.title}
                                    </CardTitle>
                                    <Badge className={service.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                        {service.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {service.property_name && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Home className="w-4 h-4 text-[#4A90E2]" />
                                        <span>{service.property_name}</span>
                                    </div>
                                )}

                                {service.next_due_date && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-[#4A90E2]" />
                                        <span>Next: {format(new Date(service.next_due_date), 'MMM d, yyyy')}</span>
                                    </div>
                                )}

                                {service.frequency && service.frequency !== 'one_time' && (
                                    <Badge className="bg-purple-100 text-purple-700 capitalize">
                                        {service.frequency}
                                    </Badge>
                                )}

                                {service.estimated_cost && (
                                    <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                        <DollarSign className="w-4 h-4" />
                                        ${service.estimated_cost.toLocaleString()}
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
                            <p className="text-[#0F1729]/60 mb-2">No services scheduled</p>
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
                                <Label>Service Type</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.service_type}
                                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                >
                                    <option value="cleaning">Cleaning</option>
                                    <option value="landscaping">Landscaping</option>
                                    <option value="pool">Pool Maintenance</option>
                                    <option value="other_service">Other Service</option>
                                </select>
                            </div>

                            <div>
                                <Label>Provider Name</Label>
                                <Input
                                    value={formData.provider_name}
                                    onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Property</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.property_id}
                                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select property...</option>
                                    {properties.map(prop => (
                                        <option key={prop.id} value={prop.id}>{prop.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label>Schedule Type</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.schedule_type}
                                    onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                                >
                                    <option value="recurring">Recurring</option>
                                    <option value="one_time">One-Time</option>
                                </select>
                            </div>

                            {formData.schedule_type === 'recurring' && (
                                <div>
                                    <Label>Frequency</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Next Service Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.next_date}
                                        onChange={(e) => setFormData({ ...formData, next_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Cost</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Special Instructions</Label>
                                <Textarea
                                    value={formData.special_instructions}
                                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                                    placeholder="Gate code, special requests..."
                                    rows="2"
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