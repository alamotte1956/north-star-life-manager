import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
    Briefcase, Users, FileText, DollarSign, TrendingUp, 
    AlertCircle, CheckCircle, Clock, BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BusinessHub() {
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
        queryFn: () => base44.entities.Invoice.list('-invoice_date', 50)
    });

    const { data: expenses = [] } = useQuery({
        queryKey: ['business-expenses'],
        queryFn: () => base44.entities.BusinessExpense.list('-expense_date', 100)
    });

    const activeClients = clients.filter(c => c.status === 'active').length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    const totalRevenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);
    
    const outstandingInvoices = invoices
        .filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + (i.balance_due || 0), 0);

    const thisMonthExpenses = expenses
        .filter(e => {
            const expenseDate = new Date(e.expense_date);
            const now = new Date();
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const overdueInvoices = invoices.filter(i => {
        if (i.status === 'paid' || !i.due_date) return false;
        return new Date(i.due_date) < new Date();
    });

    const quickStats = [
        { 
            icon: Users, 
            label: 'Active Clients', 
            value: activeClients, 
            color: 'text-blue-600',
            link: 'BusinessClients'
        },
        { 
            icon: Briefcase, 
            label: 'Active Projects', 
            value: activeProjects, 
            color: 'text-purple-600',
            link: 'BusinessProjects'
        },
        { 
            icon: DollarSign, 
            label: 'Revenue (All Time)', 
            value: `$${totalRevenue.toLocaleString()}`, 
            color: 'text-green-600',
            link: 'BusinessInvoices'
        },
        { 
            icon: TrendingUp, 
            label: 'Outstanding', 
            value: `$${outstandingInvoices.toLocaleString()}`, 
            color: 'text-orange-600',
            link: 'BusinessInvoices'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-black mb-2">Business Management</h1>
                    <p className="text-[#0F1729]/60">Complete small business operations hub</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {quickStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Link key={i} to={createPageUrl(stat.link)}>
                                <Card className="hover:shadow-xl transition-shadow cursor-pointer">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-[#0F1729]/60">{stat.label}</span>
                                            <Icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div className="text-3xl font-light text-black">{stat.value}</div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                {/* Alerts */}
                {overdueInvoices.length > 0 && (
                    <Card className="mb-8 border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                                <div>
                                    <h3 className="font-medium text-red-900 mb-2">
                                        {overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? 's' : ''}
                                    </h3>
                                    <div className="space-y-1">
                                        {overdueInvoices.slice(0, 3).map(inv => (
                                            <div key={inv.id} className="text-sm text-red-800">
                                                • {inv.client_name} - ${inv.balance_due} (Due {new Date(inv.due_date).toLocaleDateString()})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <Link to={createPageUrl('BusinessClients')}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="pt-6 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                                <h3 className="font-medium text-black mb-2">Clients</h3>
                                <p className="text-sm text-[#0F1729]/60">Manage your client relationships</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl('BusinessProjects')}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="pt-6 text-center">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                                <h3 className="font-medium text-[#1A2B44] mb-2">Projects</h3>
                                <p className="text-sm text-[#1A2B44]/60">Track project progress & hours</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl('BusinessInvoices')}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="pt-6 text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-green-600" />
                                <h3 className="font-medium text-[#1A2B44] mb-2">Invoices</h3>
                                <p className="text-sm text-[#1A2B44]/60">Create & send invoices</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl('BusinessExpenses')}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="pt-6 text-center">
                                <DollarSign className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                                <h3 className="font-medium text-[#1A2B44] mb-2">Expenses</h3>
                                <p className="text-sm text-[#1A2B44]/60">Track business expenses</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl('BusinessContracts')}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="pt-6 text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                                <h3 className="font-medium text-[#1A2B44] mb-2">Contracts</h3>
                                <p className="text-sm text-[#1A2B44]/60">Templates & e-signatures</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Analytics & Accounting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Link to={createPageUrl('BusinessReports')}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <BarChart3 className="w-12 h-12 text-[#D4AF37]" />
                                    <div>
                                        <h3 className="font-medium text-[#1A2B44] mb-1">Analytics & Reports</h3>
                                        <p className="text-sm text-[#1A2B44]/60">
                                            Revenue trends, client performance, expense analysis
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <DollarSign className="w-12 h-12 text-green-600" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-[#1A2B44] mb-1">Accounting Sync</h3>
                                    <p className="text-sm text-[#1A2B44]/60">
                                        QuickBooks & Xero integration available
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Invoices */}
                    <Card>
                        <CardHeader className="border-b border-[#1A2B44]/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    Recent Invoices
                                </CardTitle>
                                <Link to={createPageUrl('BusinessInvoices')} className="text-sm text-[#D4AF37] hover:text-[#C5A059]">
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {invoices.slice(0, 5).map(invoice => (
                                <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-[#1A2B44]/5 last:border-0">
                                    <div>
                                        <div className="font-medium text-black text-sm">
                                            {invoice.invoice_number} - {invoice.client_name}
                                        </div>
                                        <div className="text-xs text-[#0F1729]/60">
                                            {new Date(invoice.invoice_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-black">
                                            ${invoice.total_amount?.toLocaleString()}
                                        </div>
                                        <Badge className={
                                            invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }>
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Active Projects */}
                    <Card>
                        <CardHeader className="border-b border-[#1A2B44]/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-purple-600" />
                                    Active Projects
                                </CardTitle>
                                <Link to={createPageUrl('BusinessProjects')} className="text-sm text-[#D4AF37] hover:text-[#C5A059]">
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {projects.filter(p => p.status === 'active').slice(0, 5).map(project => (
                                <div key={project.id} className="flex items-center justify-between py-3 border-b border-[#1A2B44]/5 last:border-0">
                                    <div className="flex-1">
                                        <div className="font-medium text-black text-sm">
                                            {project.project_name}
                                        </div>
                                        <div className="text-xs text-[#0F1729]/60">
                                            {project.client_name}
                                        </div>
                                    </div>
                                    <div className="text-sm text-[#0F1729]/60">
                                        {project.actual_hours || 0}h / {project.estimated_hours || 0}h
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Professional Services Integration */}
                <Card className="mt-6 border-[#4A90E2]/30 bg-gradient-to-br from-blue-50 to-sky-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <Users className="w-10 h-10 text-[#4A90E2] flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-black mb-2">
                                    Need Professional Help?
                                </h3>
                                <p className="text-sm text-[#0F1729]/70 mb-4">
                                    Connect with verified CPAs, tax attorneys, and business advisors from our professional network.
                                </p>
                                <Link to={createPageUrl('ProfessionalMarketplace')}>
                                    <button className="px-6 py-3 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white rounded-lg hover:shadow-lg transition-all">
                                        Browse Professionals
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}