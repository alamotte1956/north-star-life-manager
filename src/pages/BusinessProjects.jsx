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
import { Progress } from '@/components/ui/progress';
import { Briefcase, Plus, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessProjects() {
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        client_id: '',
        project_name: '',
        description: '',
        status: 'planning',
        start_date: '',
        end_date: '',
        estimated_hours: '',
        hourly_rate: '',
        budget: ''
    });
    const queryClient = useQueryClient();

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => base44.entities.Project.list('-created_date')
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['business-clients'],
        queryFn: () => base44.entities.BusinessClient.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const client = clients.find(c => c.id === data.client_id);
            return base44.entities.Project.create({
                ...data,
                client_name: client?.company_name || '',
                estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
                hourly_rate: data.hourly_rate ? parseFloat(data.hourly_rate) : null,
                budget: data.budget ? parseFloat(data.budget) : null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            resetForm();
            toast.success('Project created');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            resetForm();
            toast.success('Project updated');
        }
    });

    const resetForm = () => {
        setShowForm(false);
        setEditingProject(null);
        setFormData({
            client_id: '',
            project_name: '',
            description: '',
            status: 'planning',
            start_date: '',
            end_date: '',
            estimated_hours: '',
            hourly_rate: '',
            budget: ''
        });
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData(project);
        setShowForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingProject) {
            updateMutation.mutate({ id: editingProject.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const statusColors = {
        planning: 'bg-blue-100 text-blue-700',
        active: 'bg-green-100 text-green-700',
        on_hold: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-purple-100 text-purple-700',
        cancelled: 'bg-red-100 text-red-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">Projects</h1>
                            <p className="text-[#0F1729]/60">Track time, budget, and deliverables</p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                            <Plus className="w-5 h-5 mr-2" />
                            New Project
                        </Button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => {
                        const progress = project.estimated_hours ? (project.actual_hours / project.estimated_hours) * 100 : 0;
                        const budgetUsed = project.budget ? (project.total_expenses / project.budget) * 100 : 0;

                        return (
                            <Card key={project.id} className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleEdit(project)}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{project.project_name}</CardTitle>
                                            <p className="text-sm text-[#0F1729]/60">{project.client_name}</p>
                                        </div>
                                        <Badge className={statusColors[project.status]}>
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {project.description && (
                                            <p className="text-sm text-[#0F1729]/70">{project.description}</p>
                                        )}

                                        {/* Hours Progress */}
                                        {project.estimated_hours > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-[#1A2B44]/60 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Hours
                                                    </span>
                                                    <span className="text-xs font-medium">
                                                        {project.actual_hours || 0} / {project.estimated_hours}
                                                    </span>
                                                </div>
                                                <Progress value={Math.min(progress, 100)} className="h-2" />
                                            </div>
                                        )}

                                        {/* Budget Progress */}
                                        {project.budget > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-[#1A2B44]/60 flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        Budget
                                                    </span>
                                                    <span className="text-xs font-medium">
                                                        ${project.total_expenses || 0} / ${project.budget}
                                                    </span>
                                                </div>
                                                <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
                                            </div>
                                        )}

                                        {/* Financial Summary */}
                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#0F1729]/10">
                                            <div>
                                                <div className="text-xs text-[#0F1729]/60">Invoiced</div>
                                                <div className="text-sm font-medium text-green-600">
                                                    ${project.total_invoiced?.toLocaleString() || 0}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[#0F1729]/60">Paid</div>
                                                <div className="text-sm font-medium text-blue-600">
                                                    ${project.total_paid?.toLocaleString() || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Project Form Dialog */}
                <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Client *</Label>
                                <Select
                                    value={formData.client_id}
                                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
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
                                <Label>Project Name *</Label>
                                <Input
                                    value={formData.project_name}
                                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
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

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Estimated Hours</Label>
                                    <Input
                                        type="number"
                                        value={formData.estimated_hours}
                                        onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Hourly Rate</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.hourly_rate}
                                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Fixed Budget</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>
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
                                        <SelectItem value="planning">Planning</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    {editingProject ? 'Update' : 'Create'} Project
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}