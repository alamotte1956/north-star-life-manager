import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Share2, MessageSquare, CheckSquare, Home, Car, Gem, Wrench, DollarSign, FileText, Receipt, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Collaboration() {
    const entityIcons = {
        Property: Home,
        Vehicle: Car,
        ValuableItem: Gem,
        MaintenanceTask: Wrench,
        Subscription: DollarSign,
        Document: FileText,
        Transaction: Receipt,
        Automation: Zap
    };

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: sharedByMe = [] } = useQuery({
        queryKey: ['sharedByMe'],
        queryFn: () => base44.entities.SharedAccess.list('-created_date'),
        enabled: !!user
    });

    const { data: sharedWithMe = [] } = useQuery({
        queryKey: ['sharedWithMe'],
        queryFn: () => base44.entities.SharedAccess.filter({ shared_with_email: user?.email }),
        enabled: !!user
    });

    const { data: myTasks = [] } = useQuery({
        queryKey: ['assignedTasks'],
        queryFn: () => base44.entities.MaintenanceTask.filter({ assigned_to: user?.email }),
        enabled: !!user
    });

    const { data: recentComments = [] } = useQuery({
        queryKey: ['myComments'],
        queryFn: () => base44.entities.Comment.list('-created_date', 10),
        enabled: !!user
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-black">Collaboration</h1>
                        <p className="text-[#0F1729]/60 font-light">Shared items & team activity</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-[#C9A95C]" />
                                Shared by Me
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">{sharedByMe.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-[#4A90E2]" />
                                Shared with Me
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">{sharedWithMe.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-[#4A90E2]" />
                                My Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">{myTasks.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[#4A90E2]" />
                                Comments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">{recentComments.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Shared with Me */}
                    <div>
                        <h2 className="text-2xl font-light text-black mb-4">Shared with Me</h2>
                        {sharedWithMe.length > 0 ? (
                            <div className="space-y-3">
                                {sharedWithMe.map(share => {
                                    const Icon = entityIcons[share.entity_type] || Share2;
                                    return (
                                        <Card key={share.id}>
                                            <CardContent className="pt-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-[#4A90E2]/10 p-2 rounded-lg">
                                                            <Icon className="w-4 h-4 text-[#4A90E2]" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-black">{share.entity_name}</h3>
                                                            <p className="text-sm text-[#0F1729]/60">
                                                                {share.entity_type} • Shared by {share.created_by}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge>{share.permission_level}</Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[#0F1729]/40 text-center py-8">No items shared with you yet</p>
                        )}
                    </div>

                    {/* My Assigned Tasks */}
                    <div>
                        <h2 className="text-2xl font-light text-black mb-4">My Assigned Tasks</h2>
                        {myTasks.length > 0 ? (
                            <div className="space-y-3">
                                {myTasks.map(task => (
                                    <Card key={task.id}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-medium text-black">{task.title}</h3>
                                                    <p className="text-sm text-[#0F1729]/60">{task.property_name}</p>
                                                </div>
                                                <Badge>{task.status}</Badge>
                                            </div>
                                            {task.next_due_date && (
                                                <p className="text-sm text-[#0F1729]/70">
                                                    Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#0F1729]/40 text-center py-8">No tasks assigned to you</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}