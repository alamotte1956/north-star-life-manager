import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

export default function BusinessReports() {
    const { data: clients = [] } = useQuery({
        queryKey: ['business-clients'],
        queryFn: () => base44.entities.BusinessClient.list()
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: () => base44.entities.Project.list()
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list('-invoice_date', 100)
    });

    const { data: expenses = [] } = useQuery({
        queryKey: ['business-expenses'],
        queryFn: () => base44.entities.BusinessExpense.list('-expense_date', 100)
    });

    // Revenue Analytics
    const monthlyRevenue = invoices.reduce((acc, inv) => {
        if (inv.status === 'paid') {
            const month = new Date(inv.paid_date || inv.invoice_date).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + inv.total_amount;
        }
        return acc;
    }, {});

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue
    }));

    // Client Revenue Distribution
    const clientRevenue = clients.map(client => ({
        name: client.company_name,
        value: invoices
            .filter(i => i.client_id === client.id && i.status === 'paid')
            .reduce((sum, i) => sum + i.total_amount, 0)
    })).filter(c => c.value > 0);

    // Project Status Distribution
    const projectStatus = projects.reduce((acc, proj) => {
        acc[proj.status] = (acc[proj.status] || 0) + 1;
        return acc;
    }, {});

    const projectStatusData = Object.entries(projectStatus).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count
    }));

    // Expense Categories
    const expenseByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    const expenseCategoryData = Object.entries(expenseByCategory).map(([category, amount]) => ({
        category: category.replace('_', ' '),
        amount
    }));

    const COLORS = ['#4A90E2', '#2E5C8A', '#7BB3E0', '#1E3A5F', '#4ADE80', '#F59E0B', '#8B5CF6'];

    const downloadReport = () => {
        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(20);
        doc.text('Business Analytics Report', 20, y);
        y += 15;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
        y += 15;

        // Revenue Summary
        doc.setFontSize(14);
        doc.text('Revenue Summary', 20, y);
        y += 10;
        doc.setFontSize(10);
        const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0);
        doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 20, y);
        y += 6;
        const outstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.balance_due, 0);
        doc.text(`Outstanding Invoices: $${outstanding.toLocaleString()}`, 20, y);
        y += 15;

        // Clients
        doc.setFontSize(14);
        doc.text('Active Clients', 20, y);
        y += 10;
        doc.setFontSize(10);
        clients.filter(c => c.status === 'active').slice(0, 10).forEach(client => {
            doc.text(`• ${client.company_name}`, 20, y);
            y += 6;
        });

        doc.save('business-report.pdf');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">Business Analytics</h1>
                            <p className="text-[#0F1729]/60">Comprehensive insights & reports</p>
                        </div>
                        <Button onClick={downloadReport} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="revenue" className="w-full">
                    <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                        <TabsTrigger value="revenue">Revenue</TabsTrigger>
                        <TabsTrigger value="clients">Clients</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    </TabsList>

                    {/* Revenue Tab */}
                    <TabsContent value="revenue" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Revenue Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#4A90E2" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#0F1729]/60">Total Revenue</span>
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-3xl font-light text-black">
                                        ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#0F1729]/60">Outstanding</span>
                                        <TrendingUp className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="text-3xl font-light text-black">
                                        ${invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.balance_due, 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#0F1729]/60">Avg Invoice</span>
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-3xl font-light text-black">
                                        ${invoices.length > 0 ? (invoices.reduce((sum, i) => sum + i.total_amount, 0) / invoices.length).toFixed(0) : 0}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Clients Tab */}
                    <TabsContent value="clients" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Client</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={clientRevenue}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {clientRevenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Clients by Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {clientRevenue.slice(0, 5).map((client, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-sm">{client.name}</span>
                                                <span className="font-medium text-green-600">
                                                    ${client.value.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm text-[#0F1729]/60 mb-1">Active Clients</div>
                                            <div className="text-3xl font-light text-black">
                                                {clients.filter(c => c.status === 'active').length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#0F1729]/60 mb-1">Total Clients</div>
                                            <div className="text-3xl font-light text-black">{clients.length}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Projects Tab */}
                    <TabsContent value="projects" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={projectStatusData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label
                                        >
                                            {projectStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {projects.filter(p => p.status === 'active').slice(0, 5).map((project) => {
                                            const progress = project.estimated_hours ? (project.actual_hours / project.estimated_hours) * 100 : 0;
                                            return (
                                                <div key={project.id}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">{project.project_name}</span>
                                                        <span className="text-xs text-[#0F1729]/60">{progress.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] h-2 rounded-full transition-all"
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm text-[#0F1729]/60 mb-1">Active Projects</div>
                                            <div className="text-3xl font-light text-black">
                                                {projects.filter(p => p.status === 'active').length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#0F1729]/60 mb-1">Completed Projects</div>
                                            <div className="text-3xl font-light text-black">
                                                {projects.filter(p => p.status === 'completed').length}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Expenses by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={expenseCategoryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="amount" fill="#4A90E2" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-[#0F1729]/60 mb-1">Total Expenses</div>
                                    <div className="text-3xl font-light text-black">
                                        ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-[#0F1729]/60 mb-1">Billable Expenses</div>
                                    <div className="text-3xl font-light text-black">
                                        ${expenses.filter(e => e.billable).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-sm text-[#0F1729]/60 mb-1">Tax Deductible</div>
                                    <div className="text-3xl font-light text-black">
                                        ${expenses.filter(e => e.tax_deductible).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}