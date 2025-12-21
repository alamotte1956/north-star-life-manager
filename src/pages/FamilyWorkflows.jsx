import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function FamilyWorkflows() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newRule, setNewRule] = useState({
        rule_name: '',
        trigger_type: 'document_uploaded',
        trigger_conditions: {},
        action_type: 'assign_task',
        action_config: {}
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

    const { data: rules = [] } = useQuery({
        queryKey: ['workflowRules', family_id],
        queryFn: () => base44.entities.WorkflowRule.filter({ family_id }),
        enabled: !!family_id
    });

    const { data: familyMembers = [] } = useQuery({
        queryKey: ['familyMembers', family_id],
        queryFn: () => base44.entities.User.filter({ family_id }),
        enabled: !!family_id
    });

    const createRuleMutation = useMutation({
        mutationFn: () => base44.entities.WorkflowRule.create({
            ...newRule,
            family_id,
            created_by_email: user.email
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
            setShowCreateDialog(false);
            setNewRule({
                rule_name: '',
                trigger_type: 'document_uploaded',
                trigger_conditions: {},
                action_type: 'assign_task',
                action_config: {}
            });
            toast.success('Workflow rule created');
        }
    });

    const toggleRuleMutation = useMutation({
        mutationFn: ({ id, enabled }) => base44.entities.WorkflowRule.update(id, { enabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
            toast.success('Rule updated');
        }
    });

    const deleteRuleMutation = useMutation({
        mutationFn: (id) => base44.entities.WorkflowRule.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
            toast.success('Rule deleted');
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl shadow-lg">
                                    <Zap className="w-8 h-8 text-[#C5A059]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Family Workflows
                                </h1>
                                <p className="text-[#64748B] font-light">
                                    Automate tasks and notifications
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg min-h-[50px]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Rule
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {rules.length === 0 ? (
                        <Card className="border-[#0F172A]/10 shadow-sm">
                            <CardContent className="py-16 text-center">
                                <Zap className="w-16 h-16 mx-auto mb-4 text-[#64748B]/30" />
                                <p className="text-[#64748B] font-light">No workflow rules yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        rules.map((rule) => (
                            <Card key={rule.id} className="border-[#0F172A]/10 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-medium text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                                    {rule.rule_name}
                                                </h3>
                                                <Badge className={rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                    {rule.enabled ? 'Active' : 'Disabled'}
                                                </Badge>
                                            </div>

                                            <div className="text-sm text-[#64748B] space-y-1">
                                                <p>
                                                    <strong>When:</strong> {rule.trigger_type.replace(/_/g, ' ')}
                                                    {rule.trigger_conditions?.category && ` (${rule.trigger_conditions.category})`}
                                                </p>
                                                <p>
                                                    <strong>Then:</strong> {rule.action_type.replace(/_/g, ' ')}
                                                    {rule.action_config?.task_title && ` - ${rule.action_config.task_title}`}
                                                </p>
                                                <p className="text-xs">
                                                    Triggered {rule.trigger_count || 0} times
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => toggleRuleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                                                className="min-h-[44px] min-w-[44px]"
                                            >
                                                {rule.enabled ? (
                                                    <ToggleRight className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => deleteRuleMutation.mutate(rule.id)}
                                                className="text-red-600 min-h-[44px] min-w-[44px]"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
                                Create Workflow Rule
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label>Rule Name</Label>
                                <Input
                                    value={newRule.rule_name}
                                    onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                                    placeholder="e.g., Auto-assign tax documents"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Trigger</Label>
                                    <Select
                                        value={newRule.trigger_type}
                                        onValueChange={(value) => setNewRule({ ...newRule, trigger_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="document_uploaded">Document Uploaded</SelectItem>
                                            <SelectItem value="document_expiring">Document Expiring</SelectItem>
                                            <SelectItem value="document_category_match">Category Match</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Category Filter (optional)</Label>
                                    <Select
                                        value={newRule.trigger_conditions?.category || 'any'}
                                        onValueChange={(value) => setNewRule({
                                            ...newRule,
                                            trigger_conditions: value === 'any' ? {} : { category: value }
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any Category</SelectItem>
                                            <SelectItem value="legal">Legal</SelectItem>
                                            <SelectItem value="financial">Financial</SelectItem>
                                            <SelectItem value="tax">Tax</SelectItem>
                                            <SelectItem value="insurance">Insurance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Action</Label>
                                <Select
                                    value={newRule.action_type}
                                    onValueChange={(value) => setNewRule({ ...newRule, action_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="assign_task">Assign Task</SelectItem>
                                        <SelectItem value="send_notification">Send Notification</SelectItem>
                                        <SelectItem value="add_to_calendar">Add to Calendar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {newRule.action_type === 'assign_task' && (
                                <>
                                    <div>
                                        <Label>Task Title</Label>
                                        <Input
                                            value={newRule.action_config?.task_title || ''}
                                            onChange={(e) => setNewRule({
                                                ...newRule,
                                                action_config: { ...newRule.action_config, task_title: e.target.value }
                                            })}
                                            placeholder="Review Document"
                                        />
                                    </div>
                                    <div>
                                        <Label>Assign To</Label>
                                        <Select
                                            value={newRule.action_config?.assigned_to_email || ''}
                                            onValueChange={(value) => setNewRule({
                                                ...newRule,
                                                action_config: { ...newRule.action_config, assigned_to_email: value }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select member..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {familyMembers.map(member => (
                                                    <SelectItem key={member.id} value={member.email}>
                                                        {member.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <Button
                                onClick={() => createRuleMutation.mutate()}
                                disabled={!newRule.rule_name || createRuleMutation.isPending}
                                className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg min-h-[50px]"
                            >
                                Create Rule
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}