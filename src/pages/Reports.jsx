import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { listMine } from '@/components/utils/safeQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { FileText, Users, Zap, HardDrive, Calendar, CheckCircle, AlertCircle, TrendingUp, Clock, Download, Activity, Database, Printer } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import CustomReportBuilder from '../components/reports/CustomReportBuilder';
import ActivityLogViewer from '../components/reports/ActivityLogViewer';
import AIReportGenerator from '../components/reports/AIReportGenerator';
import ScheduledReports from '../components/reports/ScheduledReports';

export default function Reports() {
    const [dateRange, setDateRange] = useState({
        from: subDays(new Date(), 30),
        to: new Date()
    });
    const [showCustomReport, setShowCustomReport] = useState(false);

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
        queryFn: () => listMine(base44.entities.Document, { order: '-created_date', limit: 500 }),
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

    const { data: documentVersions = [] } = useQuery({
        queryKey: ['documentVersions'],
        queryFn: () => listMine(base44.entities.DocumentVersion, { order: '-created_date', limit: 500 }),
        enabled: !!family_id
    });

    const { data: activities = [] } = useQuery({
        queryKey: ['documentActivities'],
        queryFn: () => base44.entities.DocumentActivity.filter({ family_id }, '-created_date', 100),
        enabled: !!family_id
    });

    const { data: familyRecord } = useQuery({
        queryKey: ['family', family_id],
        queryFn: () => base44.entities.Family.filter({ id: family_id }),
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
        const family = familyRecord?.[0];
        const quotaGB = family?.storage_quota_gb || 5;
        const usedGB = family?.storage_used_gb || 0;
        return {
            used: usedGB * 1024, // Convert to MB
            total: quotaGB * 1024,
            percentage: Math.min((usedGB / quotaGB) * 100, 100),
            quotaGB,
            usedGB
        };
    }, [familyRecord]);

    // Document trends (uploads, edits, views)
    const documentTrends = useMemo(() => {
        const trendsMap = {};
        
        // Track uploads
        filteredDocuments.forEach(doc => {
            const day = format(parseISO(doc.created_date), 'MMM dd');
            if (!trendsMap[day]) trendsMap[day] = { date: day, uploads: 0, edits: 0, views: 0 };
            trendsMap[day].uploads++;
        });

        // Track version uploads (edits)
        documentVersions.filter(v => {
            const vDate = parseISO(v.created_date);
            return isWithinInterval(vDate, { start: dateRange.from, end: dateRange.to });
        }).forEach(version => {
            const day = format(parseISO(version.created_date), 'MMM dd');
            if (!trendsMap[day]) trendsMap[day] = { date: day, uploads: 0, edits: 0, views: 0 };
            trendsMap[day].edits++;
        });

        // Track views
        activities.filter(a => a.activity_type === 'view').forEach(activity => {
            const day = format(parseISO(activity.created_date), 'MMM dd');
            if (!trendsMap[day]) trendsMap[day] = { date: day, uploads: 0, edits: 0, views: 0 };
            trendsMap[day].views++;
        });

        return Object.values(trendsMap).sort((a, b) => 
            new Date(a.date + ' 2024') - new Date(b.date + ' 2024')
        );
    }, [filteredDocuments, documentVersions, activities, dateRange]);

    // Activity breakdown by type
    const activityByType = useMemo(() => {
        const typeMap = {};
        activities.forEach(activity => {
            const type = activity.activity_type;
            typeMap[type] = (typeMap[type] || 0) + 1;
        });
        return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    }, [activities]);

    // User activity metrics
    const userActivityMetrics = useMemo(() => {
        const userMap = {};
        activities.forEach(activity => {
            const email = activity.user_email;
            if (!userMap[email]) {
                userMap[email] = { email, uploads: 0, views: 0, edits: 0, total: 0 };
            }
            userMap[email].total++;
            if (activity.activity_type === 'upload') userMap[email].uploads++;
            if (activity.activity_type === 'view') userMap[email].views++;
            if (activity.activity_type === 'edit' || activity.activity_type === 'version_upload') userMap[email].edits++;
        });
        return Object.values(userMap).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [activities]);

    const filteredActivities = useMemo(() => {
        return activities.filter(activity => {
            const actDate = parseISO(activity.created_date);
            return isWithinInterval(actDate, { start: dateRange.from, end: dateRange.to });
        });
    }, [activities, dateRange]);

    const COLORS = ['#4A90E2', '#2E5C8A', '#7BB3E0', '#1E3A5F', '#B8D4ED', '#0F1729'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Reports & Analytics
                            </h1>
                            <p className="text-[#64748B] font-light">Comprehensive insights & AI-powered reports</p>
                        </div>
                    </div>

                    <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        <AIReportGenerator />
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
                </div>

                <Tabs defaultValue="scheduled" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6 bg-white border border-[#0F172A]/10">
                        <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="workflows">Workflows</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scheduled">
                        <ScheduledReports />
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6">
                        <div className="flex justify-end mb-4">
                            <Button
                                onClick={() => setShowCustomReport(true)}
                                variant="outline"
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Generate Custom Report
                            </Button>
                        </div>

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
                                    <CardTitle className="text-sm font-light text-[#64748B] flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Storage Used
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-light text-[#0F172A]">
                                        {storageUsage.usedGB?.toFixed(2) || 0} GB
                                    </div>
                                    <Progress value={storageUsage.percentage} className="mt-2" />
                                    <p className="text-xs text-[#64748B] mt-1">
                                        {storageUsage.percentage.toFixed(0)}% of {storageUsage.quotaGB} GB
                                    </p>
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

                        <Card className="border-[#0F172A]/10 shadow-sm mb-6">
                            <CardHeader>
                                <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Document Trends Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={documentTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="uploads" stackId="1" stroke="#4A90E2" fill="#4A90E2" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="edits" stackId="1" stroke="#2E5C8A" fill="#2E5C8A" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="views" stackId="1" stroke="#7BB3E0" fill="#7BB3E0" fillOpacity={0.6} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                                        <Bar dataKey="uploads" fill="#4A90E2" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Total Activities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-[#0F172A]">{filteredActivities.length}</div>
                                    <p className="text-xs text-[#64748B] mt-1">In selected period</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Document Views</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-blue-600">
                                        {filteredActivities.filter(a => a.activity_type === 'view').length}
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">Total views</p>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-light text-[#64748B]">Version Uploads</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-light text-green-600">
                                        {documentVersions.length}
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1">All time</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader>
                                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Activity by Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={activityByType}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {activityByType.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-[#0F172A]/10 shadow-sm">
                                <CardHeader>
                                    <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>User Activity Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={userActivityMetrics} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                                            <YAxis dataKey="email" type="category" tick={{ fill: '#64748B', fontSize: 11 }} width={100} />
                                            <Tooltip />
                                            <Bar dataKey="uploads" fill="#C5A059" name="Uploads" />
                                            <Bar dataKey="views" fill="#64748B" name="Views" />
                                            <Bar dataKey="edits" fill="#164E63" name="Edits" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        <ActivityLogViewer activities={filteredActivities} />
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
                                        <Bar dataKey="triggers" fill="#4A90E2" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Custom Report Builder */}
                <CustomReportBuilder
                    open={showCustomReport}
                    onOpenChange={setShowCustomReport}
                    documents={filteredDocuments}
                />
            </div>
        </div>
    );
}