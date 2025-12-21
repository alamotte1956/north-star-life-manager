import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus, CheckCircle, Clock, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TenantMaintenanceRequest({ property, existingTasks }) {
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'other',
        description: '',
        priority: 'medium'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await base44.entities.MaintenanceTask.create({
                title: formData.title,
                property_name: property.name,
                category: formData.category,
                notes: formData.description,
                status: 'upcoming',
                frequency: 'one_time',
                next_due_date: new Date().toISOString().split('T')[0]
            });

            toast.success('Maintenance request submitted!');
            setShowForm(false);
            setFormData({ title: '', category: 'other', description: '', priority: 'medium' });
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const categoryLabels = {
        hvac: 'HVAC',
        plumbing: 'Plumbing',
        electrical: 'Electrical',
        appliance: 'Appliance',
        pest_control: 'Pest Control',
        other: 'Other'
    };

    return (
        <div className="space-y-4">
            {/* New Request Button */}
            {!showForm && (
                <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white h-14 touch-manipulation"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Submit New Maintenance Request
                </Button>
            )}

            {/* Request Form */}
            {showForm && (
                <Card className="border-2 border-[#C5A059]/30">
                    <CardHeader>
                        <CardTitle className="text-lg font-light">New Maintenance Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Issue Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g., Leaking faucet in kitchen"
                                    required
                                />
                            </div>

                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({...formData, category: value})}
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

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Describe the issue in detail..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({...formData, priority: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low - Can wait</SelectItem>
                                        <SelectItem value="medium">Medium - Soon</SelectItem>
                                        <SelectItem value="high">High - Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 h-12 touch-manipulation"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-[#C5A059] h-12 touch-manipulation"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Existing Requests */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">Your Maintenance Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {existingTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                            <p>No pending maintenance requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {existingTasks.map(task => (
                                <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Wrench className="w-4 h-4 text-[#C5A059]" />
                                            <span className="font-medium text-sm">{task.title}</span>
                                        </div>
                                        <Badge className={
                                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }>
                                            {task.status}
                                        </Badge>
                                    </div>
                                    {task.notes && (
                                        <p className="text-xs text-gray-600 mb-2">{task.notes}</p>
                                    )}
                                    {task.next_due_date && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            Scheduled: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}