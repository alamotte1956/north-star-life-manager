import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Plus, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, isBefore, addDays } from 'date-fns';
import CabinModeToggle from '../components/CabinModeToggle';
import PrintButton from '../components/PrintButton';

const categoryLabels = {
    hvac: 'HVAC',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    landscaping: 'Landscaping',
    cleaning: 'Cleaning',
    security: 'Security',
    pool: 'Pool',
    seasonal: 'Seasonal',
    inspection: 'Inspection',
    other: 'Other'
};

export default function Maintenance() {
    const [open, setOpen] = useState(false);
    const [cabinMode, setCabinMode] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        property_name: '',
        category: 'other',
        frequency: 'one_time',
        next_due_date: '',
        provider_name: '',
        provider_contact: '',
        estimated_cost: '',
        notes: ''
    });

    const { data: tasks = [], refetch } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-next_due_date')
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list()
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.MaintenanceTask.create({
            ...formData,
            status: 'upcoming'
        });
        setOpen(false);
        setFormData({
            title: '',
            property_name: '',
            category: 'other',
            frequency: 'one_time',
            next_due_date: '',
            provider_name: '',
            provider_contact: '',
            estimated_cost: '',
            notes: ''
        });
        refetch();
    };

    const filteredTasks = cabinMode
        ? tasks.filter(task => {
            const prop = properties.find(p => p.name === task.property_name);
            return prop?.seasonal || task.property_name?.toLowerCase().includes('cabin');
        })
        : tasks;

    const getStatusColor = (task) => {
        if (!task.next_due_date) return 'bg-gray-100 text-gray-700';
        const dueDate = new Date(task.next_due_date);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) return 'bg-red-100 text-red-700 border-red-200';
        if (daysDiff <= 7) return 'bg-orange-100 text-orange-700 border-orange-200';
        if (daysDiff <= 30) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <Wrench className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Maintenance</h1>
                            <p className="text-[#1A2B44]/60 font-light">Property upkeep schedule</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 print:hidden">
                        <CabinModeToggle enabled={cabinMode} onChange={setCabinMode} />
                        <PrintButton />
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add Maintenance Task</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Task Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Property</Label>
                                            <Select
                                                value={formData.property_name}
                                                onValueChange={(value) => setFormData({ ...formData, property_name: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select property" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {properties.map(prop => (
                                                        <SelectItem key={prop.id} value={prop.name}>
                                                            {prop.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Next Due Date</Label>
                                            <Input
                                                type="date"
                                                value={formData.next_due_date}
                                                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Frequency</Label>
                                            <Select
                                                value={formData.frequency}
                                                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="one_time">One Time</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                                    <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                                                    <SelectItem value="annual">Annual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Provider Name</Label>
                                            <Input
                                                value={formData.provider_name}
                                                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Provider Contact</Label>
                                            <Input
                                                value={formData.provider_contact}
                                                onChange={(e) => setFormData({ ...formData, provider_contact: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Estimated Cost</Label>
                                        <Input
                                            type="number"
                                            value={formData.estimated_cost}
                                            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>

                                    <div>
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37]">
                                        Add Task
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map(task => (
                            <Card key={task.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#C9A95C]/10 p-2 rounded-lg">
                                                <Wrench className="w-5 h-5 text-[#C9A95C]" />
                                            </div>
                                            <div>
                                                <h3 className="font-light text-[#1A2B44]">{task.title}</h3>
                                                <p className="text-xs text-[#1A2B44]/50">{task.property_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <Badge className={`${getStatusColor(task)} border font-light`}>
                                            {categoryLabels[task.category]}
                                        </Badge>
                                        {task.next_due_date && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/70">
                                                <Calendar className="w-4 h-4 text-[#C9A95C]" />
                                                Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                                            </div>
                                        )}
                                        {task.estimated_cost && (
                                            <div className="text-sm text-[#1A2B44]/70">
                                                Est. ${task.estimated_cost}
                                            </div>
                                        )}
                                    </div>

                                    {task.provider_name && (
                                        <div className="text-sm text-[#1A2B44]/60 font-light">
                                            Provider: {task.provider_name}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-[#1A2B44]/40 font-light">
                            {cabinMode ? 'No cabin maintenance tasks' : 'No maintenance tasks scheduled'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}