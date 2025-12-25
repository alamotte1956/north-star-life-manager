import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Circle, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function ClientFollowUpTasks({ client }) {
    const queryClient = useQueryClient();
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        reminder_enabled: true
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['client-tasks', client.id],
        queryFn: () => base44.entities.CalendarEvent.filter({
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id,
            event_type: 'task'
        })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.CalendarEvent.create({
            title: data.title,
            description: data.description,
            start_date: data.due_date,
            end_date: data.due_date,
            event_type: 'task',
            linked_entity_type: 'BusinessClient',
            linked_entity_id: client.id,
            linked_entity_name: client.company_name,
            reminder_enabled: data.reminder_enabled,
            status: 'pending',
            priority: data.priority
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['client-tasks']);
            setShowDialog(false);
            resetForm();
            toast.success('Follow-up task created');
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, completed }) => 
            base44.entities.CalendarEvent.update(id, { 
                status: completed ? 'completed' : 'pending' 
            }),
        onSuccess: () => {
            queryClient.invalidateQueries(['client-tasks']);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['client-tasks']);
            toast.success('Task deleted');
        }
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            due_date: '',
            priority: 'medium',
            reminder_enabled: true
        });
    };

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const isOverdue = (task) => {
        return task.status !== 'completed' && 
               task.start_date && 
               isBefore(new Date(task.start_date), startOfDay(new Date()));
    };

    const priorityColors = {
        low: 'text-gray-600',
        medium: 'text-yellow-600',
        high: 'text-red-600'
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-light text-black flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#4A90E2]" />
                    Follow-Up Tasks ({pendingTasks.length})
                </h3>
                <Button 
                    size="sm" 
                    onClick={() => setShowDialog(true)}
                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                </Button>
            </div>

            <div className="space-y-2">
                {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No follow-up tasks yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Pending Tasks */}
                        {pendingTasks.map((task) => (
                            <Card key={task.id} className={`border-[#4A90E2]/20 ${isOverdue(task) ? 'bg-red-50' : ''}`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            checked={task.status === 'completed'}
                                            onCheckedChange={(checked) => 
                                                toggleMutation.mutate({ id: task.id, completed: checked })
                                            }
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium text-black text-sm flex items-center gap-2">
                                                        {task.title}
                                                        {isOverdue(task) && (
                                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                                        )}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                                        <span className="text-gray-500">
                                                            Due: {format(new Date(task.start_date), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className={priorityColors[task.priority]}>
                                                            {task.priority} priority
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => deleteMutation.mutate(task.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && (
                            <div className="pt-4">
                                <h4 className="text-sm text-gray-600 mb-2">Completed ({completedTasks.length})</h4>
                                {completedTasks.map((task) => (
                                    <Card key={task.id} className="border-gray-200 bg-gray-50 mb-2">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={true}
                                                    onCheckedChange={() => 
                                                        toggleMutation.mutate({ id: task.id, completed: false })
                                                    }
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-500 text-sm line-through">
                                                        {task.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-400">
                                                        Completed
                                                    </span>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => deleteMutation.mutate(task.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Follow-Up Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
                        <div>
                            <Label>Task Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Send quarterly report"
                                required
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Task details..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Due Date *</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="reminder"
                                checked={formData.reminder_enabled}
                                onCheckedChange={(checked) => 
                                    setFormData({ ...formData, reminder_enabled: checked })
                                }
                            />
                            <Label htmlFor="reminder" className="text-sm font-normal cursor-pointer">
                                Send reminder notification
                            </Label>
                        </div>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                Create Task
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}