import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserPlus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DocumentTaskAssigner({ document, open, onOpenChange }) {
    const [task, setTask] = useState({
        task_title: '',
        task_description: '',
        assigned_to_email: '',
        due_date: null,
        priority: 'medium'
    });

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

    const { data: familyMembers = [] } = useQuery({
        queryKey: ['familyMembers', family_id],
        queryFn: () => base44.entities.User.filter({ family_id }),
        enabled: !!family_id
    });

    const createTaskMutation = useMutation({
        mutationFn: async () => {
            const newTask = await base44.entities.DocumentTask.create({
                family_id,
                document_id: document.id,
                document_title: document.title,
                ...task,
                assigned_by_email: user.email
            });

            // Send notification
            await base44.functions.invoke('sendFamilyNotification', {
                family_id,
                recipient_email: task.assigned_to_email,
                notification_type: 'task_assigned',
                title: 'New Task Assigned',
                message: `${user.email} assigned you: ${task.task_title}`,
                priority: task.priority,
                triggered_by_email: user.email,
                action_url: '/Vault',
                metadata: { task_id: newTask.id, document_id: document.id }
            });

            return newTask;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentTasks'] });
            onOpenChange(false);
            setTask({
                task_title: '',
                task_description: '',
                assigned_to_email: '',
                due_date: null,
                priority: 'medium'
            });
            toast.success('Task assigned');
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Assign Task
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 bg-[#C5A059]/10 rounded-lg border border-[#C5A059]/30">
                        <p className="text-sm text-[#64748B]">Document</p>
                        <p className="font-medium text-[#0F172A]">{document?.title}</p>
                    </div>

                    <div>
                        <Label>Task Title</Label>
                        <Input
                            value={task.task_title}
                            onChange={(e) => setTask({ ...task, task_title: e.target.value })}
                            placeholder="e.g., Review and sign document"
                        />
                    </div>

                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={task.task_description}
                            onChange={(e) => setTask({ ...task, task_description: e.target.value })}
                            placeholder="Additional details..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Assign To</Label>
                        <Select
                            value={task.assigned_to_email}
                            onValueChange={(value) => setTask({ ...task, assigned_to_email: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select family member..." />
                            </SelectTrigger>
                            <SelectContent>
                                {familyMembers
                                    .filter(member => member.email !== user?.email)
                                    .map(member => (
                                        <SelectItem key={member.id} value={member.email}>
                                            {member.email}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Priority</Label>
                            <Select
                                value={task.priority}
                                onValueChange={(value) => setTask({ ...task, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {task.due_date ? format(new Date(task.due_date), 'PPP') : 'Select date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={task.due_date ? new Date(task.due_date) : undefined}
                                        onSelect={(date) => setTask({ ...task, due_date: date ? date.toISOString().split('T')[0] : null })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-lg min-h-[50px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createTaskMutation.mutate()}
                            disabled={!task.task_title || !task.assigned_to_email || createTaskMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg min-h-[50px]"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Task
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}