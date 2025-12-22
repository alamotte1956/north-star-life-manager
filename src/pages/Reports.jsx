import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, Users, Zap, HardDrive, Calendar, CheckCircle, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';

export default function Reports() {
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date()
    });

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

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 500),
        enabled: !!family_id
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['documentTasks'],
        queryFn: () => base44.entities.DocumentTask.filter({ family_id }),
        enabled: !!family_id
    });

    const { data: workflowRules = [] } = useQuery({
        queryKey: ['workflowRules'],
        queryFn: () => base44.entities.WorkflowRule.filter({ family_id }),
        enabled: !!family_id
    });

    // Filter data by date range
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const docDate = parseISO(doc.created_date);
            return isWithinInterval(docDate, { start: dateRange.from, end: dateRange.to });
        });
    }, [documents, dateRange]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const taskDate = parseISO(task.created_date);
            return isWithinInterval(taskDate, { start: dateRange.from, end: dateRange.to });
        });
    }, [tasks, dateRange]);

    // Document metrics
    const documentVolumeByDay = useMemo(() => {
        const volumeMap = {};
        filteredDocuments.forEach(doc => {
            const day = format(parseISO(doc.created_date), 'MMM dd');
            volumeMap[day] = (volumeMap[day] || 0) + 1;
        });
        return Object.entries(volumeMap).map(([date, count]) => ({ date, count }));
    }, [filteredDocuments]);

    const documentsByCategory = useMemo(() => {
        const categoryMap = {};
        filteredDocuments.forEach(doc => {
            const cat = doc.category || 'other';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [filteredDocuments]);

    const mostActiveUsers = useMemo(() => {
        const userMap = {};
        filteredDocuments.forEach(doc => {
            const email = doc.created_by || 'Unknown';
            userMap[email] = (userMap[email] || 0) + 1;
        });
        return Object.entries(userMap)
            .map(([email, uploads]) => ({ email, uploads }))
            .sort((a, b) => b.uploads - a.uploads)
            .slice(0, 5);
    }, [filteredDocuments]);

    const overdueTasks = useMemo(() => {
        return tasks.filter(task => {
            if (task.status === 'completed' || !task.due_date) return false;
            return new Date(task.due_date) < new Date();
        });
    }, [tasks]);

    const tasksByStatus = useMemo(() => {
        const statusMap = {};
        filteredTasks.forEach(task => {
            const status = task.status || 'pending';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
    }, [filteredTasks]);

    const workflowMetrics = useMemo(() => {
        return workflowRules.map(rule => ({
            name: rule.rule_name,
            triggers: rule.trigger_count || 0
        })).sort((a, b) => b.triggers - a.triggers);
    }, [workflowRules]);

    const storageUsage = useMemo(() => {
        const totalDocs = documents.length;
        const assumedAvgSizeMB = 2;
        const estimatedUsageMB = totalDocs * assumedAvgSizeMB;
        const quotaGB = 5;
        return {
            used: estimatedUsageMB,
            total: quotaGB * 1024,
            percentage: Math.min((estimatedUsageMB / (quotaGB * 1024)) * 100, 100)
        };
    }, [documents]);

    const COLORS = ['#C5A059', '#0F172A', '#64748B', '#164E63', '#D4AF37', '#8B7355'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl">
                                <TrendingUp className="w-8 h-8 text-[#C5A059]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Reports & Analytics
                            </h1>
                            <p className="text-[#64748B] font-light">Family document management insights</p>
                        </div>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="border-[#0F172A]/20">
                                <Calendar className="w-4 h-4 mr-2" />
                                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="p-3 space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                                    className="w-full"
                                >
                                    Last 7 Days
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                                    className="w-full"
                                >
                                    Last 30 Days
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
                                    className="w-full"
                                >
                                    Last 90 Days
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <Tabs defaultValue="documents" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-[#0F172A]/10">
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    </TabsList>

                    <TabsContent value="documents" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Total Documents</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">{filteredDocuments.length}</div>
                                    <p className="text-xs text-[#64748B] mt-1">In selected period</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Most Active User</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-light text-[#0F172A] truncate">
                                        {mostActiveUsers[0]?.email.split('@')[0] || 'N/A'}
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">{mostActiveUsers[0]?.uploads || 0} uploads</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Storage Used</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-light text-[#0F172A]">
                                        {(storageUsage.used / 1024).toFixed(1)} GB
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">{storageUsage.percentage.toFixed(0)}% of quota</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Categories</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">{documentsByCategory.length}</div>
                                    <p className="text-xs text-[#64748B] mt-1">Document types</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader>
                                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Document Uploads Over Time</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={documentVolumeByDay}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#C5A059" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader>
                                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Documents by Category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={documentsByCategory}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {documentsByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-[#0F172A]/10 shadow-sm">
                            <CardHeader>
                                <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Most Active Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={mostActiveUsers}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="email" tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="uploads" fill="#C5A059" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Total Tasks</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">{filteredTasks.length}</div>
                                    <p className="text-xs text-[#64748B] mt-1">In selected period</p>
                                </CardContent>
                            </Card>

                            <Card className="border-red-200 bg-red-50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-red-700 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Overdue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-red-700">{overdueTasks.length}</div>
                                    <p className="text-xs text-red-600 mt-1">Needs attention</p>
                                </CardContent>
                            </Card>

                            <Card className="border-green-200 bg-green-50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-green-700">Completed</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-green-700">
                                        {filteredTasks.filter(t => t.status === 'completed').length}
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">Finished</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">In Progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">
                                        {filteredTasks.filter(t => t.status === 'in_progress').length}
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">Active</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-[#0F172A]/10 shadow-sm">
                            <CardHeader>
                                <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Tasks by Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={tasksByStatus}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#C5A059" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {overdueTasks.length > 0 && (
                            <Card className="border-red-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-red-700" style={{ fontFamily: 'Playfair Display, serif' }}>
                                        Overdue Tasks
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {overdueTasks.slice(0, 5).map(task => (
                                            <div key={task.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-[#0F172A]">{task.task_title}</p>
                                                    <p className="text-sm text-[#64748B]">Assigned to: {task.assigned_to_email}</p>
                                                </div>
                                                <span className="text-sm text-red-600">
                                                    Due: {format(new Date(task.due_date), 'MMM dd')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="workflows" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Total Rules</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">{workflowRules.length}</div>
                                    <p className="text-xs text-[#64748B] mt-1">Automation rules</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Active Rules</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-green-600">
                                        {workflowRules.filter(r => r.enabled).length}
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">Enabled</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Total Triggers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">
                                        {workflowRules.reduce((sum, r) => sum + (r.trigger_count || 0), 0)}
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">All time</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-[#0F172A]/10 shadow-sm">
                            <CardHeader>
                                <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Workflow Trigger Frequency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={workflowMetrics}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="triggers" fill="#C5A059" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}