import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FamilyToDo() {
    const [filter, setFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: userRecord } = useQuery({
        queryKey: ['userRecord'],
        queryFn: () => base44.entities.User.filter({ email: user?.email }),
        enabled: !!user
    });

    const family_id = userRecord?.[0]?.family_id;

    const { data: tasks = [] } = useQuery({
        queryKey: ['documentTasks', family_id],
        queryFn: () => base44.entities.DocumentTask.filter({ family_id }),
        enabled: !!family_id
    });

    const completeTaskMutation = useMutation({
        mutationFn: (taskId) => base44.entities.DocumentTask.update(taskId, {
            status: 'completed',
            completed_date: new Date().toISOString()
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentTasks'] });
            toast.success('Task completed');
        }
    });

    const myTasks = tasks.filter(t => t.assigned_to_email === user?.email);
    const filteredTasks = filter === 'all' 
        ? myTasks 
        : myTasks.filter(t => t.status === filter);

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800 border-blue-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            urgent: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[priority] || colors.medium;
    };

    const isOverdue = (task) => {
        if (!task.due_date || task.status === 'completed') return false;
        return new Date(task.due_date) < new Date();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl shadow-lg">
                                <CheckCircle2 className="w-8 h-8 text-[#C5A059]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                My To-Do List
                            </h1>
                            <p className="text-[#64748B] font-light">
                                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                            <Button
                                key={status}
                                variant={filter === status ? "default" : "outline"}
                                onClick={() => setFilter(status)}
                                className={`rounded-lg font-medium whitespace-nowrap min-h-[44px] ${
                                    filter === status 
                                        ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A]' 
                                        : 'border-[#0F172A]/20'
                                }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ')}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                        <Card className="border-[#0F172A]/10 shadow-sm">
                            <CardContent className="py-16 text-center">
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#64748B]/30" />
                                <p className="text-[#64748B] font-light">No tasks to show</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredTasks.map((task) => (
                            <Card 
                                key={task.id}
                                className={`border transition-all hover:shadow-md ${
                                    task.status === 'completed'
                                        ? 'border-[#0F172A]/10 bg-[#F8F9FA]/50'
                                        : 'border-[#0F172A]/10 bg-white'
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => task.status !== 'completed' && completeTaskMutation.mutate(task.id)}
                                            className="mt-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                        >
                                            {task.status === 'completed' ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-[#64748B] hover:text-[#C5A059]" />
                                            )}
                                        </button>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <h3 className={`font-medium text-[#0F172A] mb-1 ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                                        {task.task_title}
                                                    </h3>
                                                    <p className="text-sm text-[#64748B] mb-2">
                                                        Document: {task.document_title}
                                                    </p>
                                                    {task.task_description && (
                                                        <p className="text-sm text-[#64748B]">
                                                            {task.task_description}
                                                        </p>
                                                    )}
                                                </div>

                                                <Badge className={`${getPriorityColor(task.priority)} border`}>
                                                    {task.priority}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-[#64748B]">
                                                {task.due_date && (
                                                    <div className="flex items-center gap-1">
                                                        {isOverdue(task) ? (
                                                            <>
                                                                <AlertCircle className="w-3 h-3 text-red-600" />
                                                                <span className="text-red-600 font-medium">
                                                                    Overdue: {format(new Date(task.due_date), 'MMM d')}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock className="w-3 h-3" />
                                                                <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <span>Assigned by: {task.assigned_by_email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}