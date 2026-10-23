import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Briefcase, FileText, DollarSign, MessageSquare, 
    Clock, CheckCircle, AlertCircle, Download, Target, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function ClientDashboard() {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        base44.auth.me().then(setUser);
    }, []);

    // Fetch client data
    const { data: clientData } = useQuery({
        queryKey: ['client-profile', user?.email],
        queryFn: async () => {
            const clients = await base44.entities.BusinessClient.filter({ 
                email: user?.email 
            });
            return clients[0];
        },
        enabled: !!user
    });

    // Fetch projects
    const { data: projects = [] } = useQuery({
        queryKey: ['client-projects', clientData?.id],
        queryFn: () => base44.entities.Project.filter({ client_id: clientData.id }),
        enabled: !!clientData
    });

    // Fetch invoices
    const { data: invoices = [] } = useQuery({
        queryKey: ['client-invoices', clientData?.id],
        queryFn: () => base44.entities.Invoice.filter({ client_id: clientData.id }, '-invoice_date'),
        enabled: !!clientData
    });

    // Fetch communications
    const { data: communications = [] } = useQuery({
        queryKey: ['client-communications', user?.email],
        queryFn: () => base44.entities.Communication.filter({ 
            recipient_email: user?.email 
        }, '-created_date', 20),
        enabled: !!user
    });

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
                    <p className="text-[#0F1729]/60">Loading...</p>
                </div>
            </div>
        );
    }

    if (!clientData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-light text-black mb-2">Client Access Only</h2>
                        <p className="text-[#0F1729]/60">
                            This dashboard is for registered clients. Please contact your account manager.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusColors = {
        planning: 'bg-blue-100 text-blue-700',
        active: 'bg-green-100 text-green-700',
        on_hold: 'bg-yellow-100 text-yellow-700',
        completed: 'bg-gray-100 text-gray-700',
        cancelled: 'bg-red-100 text-red-700',
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        viewed: 'bg-purple-100 text-purple-700',
        partial: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700'
    };

    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

    const handleSendMessage = async (projectId) => {
        if (!messageText.trim()) return;
        
        setSendingMessage(true);
        try {
            await base44.entities.Communication.create({
                communication_type: 'in_app',
                direction: 'inbound',
                sender_email: user.email,
                recipient_email: clientData.user_email,
                subject: `Message regarding ${projects.find(p => p.id === projectId)?.project_name}`,
                body: messageText,
                linked_entity_type: 'Project',
                linked_entity_id: projectId,
                status: 'sent'
            });
            
            setMessageText('');
            toast.success('Message sent to project manager');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-black mb-2">
                        Welcome, {clientData.contact_name}
                    </h1>
                    <p className="text-[#0F1729]/60">{clientData.company_name}</p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-light flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-[#4A90E2]" />
                                Active Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                {projects.filter(p => p.status === 'active').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-light flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                Total Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                ${totalPaid.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-light flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                Outstanding
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                ${totalOutstanding.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-light flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#4A90E2]" />
                                Total Invoices
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                {invoices.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="projects" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="milestones">Milestones</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="communications">Messages</TabsTrigger>
                    </TabsList>

                    {/* Projects Tab */}
                    <TabsContent value="projects">
                        <div className="grid gap-4">
                            {projects.length > 0 ? (
                                projects.map(project => (
                                    <Card key={project.id}>
                                        <CardHeader>
                                           <div className="flex items-start justify-between">
                                               <div className="flex-1">
                                                   <CardTitle className="text-lg font-light mb-2">
                                                       {project.project_name}
                                                   </CardTitle>
                                                   <p className="text-sm text-[#0F1729]/60">
                                                       {project.description}
                                                   </p>
                                               </div>
                                               <div className="flex items-center gap-2">
                                                   <Button 
                                                       size="sm" 
                                                       variant="outline"
                                                       onClick={() => setSelectedProject(project)}
                                                       className="flex items-center gap-2"
                                                   >
                                                       <MessageSquare className="w-4 h-4" />
                                                       Message PM
                                                   </Button>
                                                   <Badge className={statusColors[project.status]}>
                                                       {project.status}
                                                   </Badge>
                                               </div>
                                           </div>
                                        </CardHeader>
                                        <CardContent>
                                           <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                                               <div>
                                                   <p className="text-[#0F1729]/60 mb-1">Progress</p>
                                                   <div className="flex items-center gap-2">
                                                       <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                           <div 
                                                               className="h-full bg-[#4A90E2]"
                                                               style={{ 
                                                                   width: `${project.estimated_hours ? (project.actual_hours / project.estimated_hours * 100) : 0}%` 
                                                               }}
                                                           />
                                                       </div>
                                                       <span className="text-xs text-[#0F1729]/60">
                                                           {project.actual_hours || 0}/{project.estimated_hours || 0}h
                                                       </span>
                                                   </div>
                                               </div>
                                               {project.start_date && (
                                                   <div>
                                                       <p className="text-[#0F1729]/60 mb-1">Started</p>
                                                       <p className="font-light">
                                                           {format(new Date(project.start_date), 'MMM d, yyyy')}
                                                       </p>
                                                   </div>
                                               )}
                                               {project.end_date && (
                                                   <div>
                                                       <p className="text-[#0F1729]/60 mb-1">Target Date</p>
                                                       <p className="font-light">
                                                           {format(new Date(project.end_date), 'MMM d, yyyy')}
                                                       </p>
                                                   </div>
                                               )}
                                           </div>

                                           {project.milestones && project.milestones.length > 0 && (
                                               <div className="border-t pt-4">
                                                   <p className="text-sm font-medium text-[#0F1729] mb-3 flex items-center gap-2">
                                                       <Target className="w-4 h-4" />
                                                       Quick Milestones
                                                   </p>
                                                   <div className="space-y-2">
                                                       {project.milestones.slice(0, 3).map((milestone, idx) => (
                                                           <div key={idx} className="flex items-center gap-3 text-sm">
                                                               {milestone.completed ? (
                                                                   <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                               ) : (
                                                                   <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                               )}
                                                               <span className={milestone.completed ? 'line-through text-[#0F1729]/60' : 'text-[#0F1729]'}>
                                                                   {milestone.name}
                                                               </span>
                                                               <span className="text-xs text-[#0F1729]/60 ml-auto">
                                                                   {milestone.due_date && format(new Date(milestone.due_date), 'MMM d')}
                                                               </span>
                                                           </div>
                                                       ))}
                                                   </div>
                                               </div>
                                           )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-[#0F1729]/60">
                                        No projects yet
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Milestones Tab */}
                    <TabsContent value="milestones">
                        <div className="space-y-6">
                            {projects.filter(p => p.milestones && p.milestones.length > 0).length > 0 ? (
                                projects.filter(p => p.milestones && p.milestones.length > 0).map(project => {
                                    const completedMilestones = project.milestones.filter(m => m.completed).length;
                                    const totalMilestones = project.milestones.length;
                                    const progressPercent = (completedMilestones / totalMilestones) * 100;
                                    
                                    return (
                                        <Card key={project.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <CardTitle className="text-lg font-light flex items-center gap-2">
                                                            <Target className="w-5 h-5 text-[#4A90E2]" />
                                                            {project.project_name}
                                                        </CardTitle>
                                                        <p className="text-sm text-[#0F1729]/60 mt-1">
                                                            {completedMilestones} of {totalMilestones} milestones completed
                                                        </p>
                                                    </div>
                                                    <Badge className={statusColors[project.status]}>
                                                        {project.status}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#0F1729]/60">Overall Progress</span>
                                                        <span className="font-medium text-[#4A90E2]">{Math.round(progressPercent)}%</span>
                                                    </div>
                                                    <Progress value={progressPercent} className="h-2" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {project.milestones
                                                        .sort((a, b) => (a.due_date && b.due_date) ? new Date(a.due_date) - new Date(b.due_date) : 0)
                                                        .map((milestone, idx) => {
                                                            const isOverdue = milestone.due_date && !milestone.completed && new Date(milestone.due_date) < new Date();
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx} 
                                                                    className={`p-4 rounded-lg border-l-4 ${
                                                                        milestone.completed 
                                                                            ? 'bg-green-50 border-green-500' 
                                                                            : isOverdue 
                                                                                ? 'bg-red-50 border-red-500'
                                                                                : 'bg-blue-50 border-blue-500'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        {milestone.completed ? (
                                                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                                        ) : isOverdue ? (
                                                                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                                        ) : (
                                                                            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                        )}
                                                                        <div className="flex-1">
                                                                            <p className={`font-medium ${milestone.completed ? 'text-green-900 line-through' : 'text-[#0F1729]'}`}>
                                                                                {milestone.name}
                                                                            </p>
                                                                            {milestone.due_date && (
                                                                                <p className={`text-sm mt-1 ${
                                                                                    milestone.completed 
                                                                                        ? 'text-green-700'
                                                                                        : isOverdue 
                                                                                            ? 'text-red-700 font-medium'
                                                                                            : 'text-blue-700'
                                                                                }`}>
                                                                                    {milestone.completed ? 'Completed' : isOverdue ? 'Overdue' : 'Due'}: {format(new Date(milestone.due_date), 'MMMM d, yyyy')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Target className="w-12 h-12 text-[#0F1729]/20 mx-auto mb-4" />
                                        <p className="text-[#0F1729]/60">No project milestones yet</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices">
                        <div className="grid gap-4">
                            {invoices.length > 0 ? (
                                invoices.map(invoice => (
                                    <Card key={invoice.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                                          onClick={() => setSelectedInvoice(invoice)}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="font-light text-lg text-black">
                                                        Invoice #{invoice.invoice_number}
                                                    </p>
                                                    <p className="text-sm text-[#0F1729]/60">
                                                        {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <Badge className={statusColors[invoice.status]}>
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            <div className="grid md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-[#0F1729]/60 mb-1">Amount</p>
                                                    <p className="font-light text-lg">${invoice.total_amount?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[#0F1729]/60 mb-1">Paid</p>
                                                    <p className="font-light text-lg text-green-600">
                                                        ${invoice.amount_paid?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[#0F1729]/60 mb-1">Balance Due</p>
                                                    <p className="font-light text-lg text-orange-600">
                                                        ${invoice.balance_due?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[#0F1729]/60 mb-1">Due Date</p>
                                                    <p className="font-light">
                                                        {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-[#0F1729]/60">
                                        No invoices yet
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Payments Tab */}
                    <TabsContent value="payments">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-light">Payment History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {invoices
                                        .filter(inv => inv.amount_paid > 0)
                                        .map(invoice => (
                                            <div key={invoice.id} className="flex items-center justify-between p-4 bg-[#E8EEF5] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="font-light text-black">
                                                            Invoice #{invoice.invoice_number}
                                                        </p>
                                                        <p className="text-sm text-[#0F1729]/60">
                                                            {invoice.paid_date ? format(new Date(invoice.paid_date), 'MMM d, yyyy') : 'Partial payment'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-light text-lg text-green-600">
                                                        ${invoice.amount_paid.toLocaleString()}
                                                    </p>
                                                    {invoice.payment_method && (
                                                        <p className="text-sm text-[#0F1729]/60">
                                                            {invoice.payment_method}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    {invoices.filter(inv => inv.amount_paid > 0).length === 0 && (
                                        <p className="text-center py-8 text-[#0F1729]/60">
                                            No payment history yet
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Communications Tab */}
                    <TabsContent value="communications">
                        <div className="space-y-4">
                            {communications.length > 0 ? (
                                communications.map(comm => (
                                    <Card key={comm.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-3">
                                                <MessageSquare className="w-5 h-5 text-[#4A90E2] mt-1" />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-light text-black">
                                                                {comm.subject || 'Message'}
                                                            </p>
                                                            <p className="text-sm text-[#0F1729]/60">
                                                                From: {comm.sender_email}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-[#0F1729]/60">
                                                            {format(new Date(comm.created_date), 'MMM d, yyyy h:mm a')}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-[#0F1729]/80 whitespace-pre-wrap">
                                                        {comm.body}
                                                    </p>
                                                    {comm.attachments && comm.attachments.length > 0 && (
                                                        <div className="mt-3 flex gap-2">
                                                            {comm.attachments.map((url, idx) => (
                                                                <a 
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-[#4A90E2] hover:underline flex items-center gap-1"
                                                                >
                                                                    <Download className="w-3 h-3" />
                                                                    Attachment {idx + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center text-[#0F1729]/60">
                                        No messages yet
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Invoice Detail Modal */}
                {selectedInvoice && (
                    <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                    <span>Invoice #{selectedInvoice.invoice_number}</span>
                                    <Badge className={statusColors[selectedInvoice.status]}>
                                        {selectedInvoice.status}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-[#0F1729]/60 mb-1">Invoice Date</p>
                                        <p className="font-light">
                                            {format(new Date(selectedInvoice.invoice_date), 'MMMM d, yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#0F1729]/60 mb-1">Due Date</p>
                                        <p className="font-light">
                                            {format(new Date(selectedInvoice.due_date), 'MMMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>

                                {selectedInvoice.line_items && selectedInvoice.line_items.length > 0 && (
                                    <div>
                                        <h3 className="font-light text-lg mb-3">Line Items</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-[#E8EEF5]">
                                                    <tr>
                                                        <th className="text-left p-3 text-sm font-light">Description</th>
                                                        <th className="text-right p-3 text-sm font-light">Qty</th>
                                                        <th className="text-right p-3 text-sm font-light">Rate</th>
                                                        <th className="text-right p-3 text-sm font-light">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedInvoice.line_items.map((item, idx) => (
                                                        <tr key={idx} className="border-t">
                                                            <td className="p-3 text-sm">{item.description}</td>
                                                            <td className="p-3 text-sm text-right">{item.quantity}</td>
                                                            <td className="p-3 text-sm text-right">${item.rate}</td>
                                                            <td className="p-3 text-sm text-right">${item.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[#0F1729]/60">Subtotal</span>
                                            <span className="font-light">${selectedInvoice.subtotal?.toLocaleString()}</span>
                                        </div>
                                        {selectedInvoice.tax_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-[#0F1729]/60">Tax</span>
                                                <span className="font-light">${selectedInvoice.tax_amount?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-light border-t pt-2">
                                            <span>Total</span>
                                            <span>${selectedInvoice.total_amount?.toLocaleString()}</span>
                                        </div>
                                        {selectedInvoice.amount_paid > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Paid</span>
                                                <span>-${selectedInvoice.amount_paid?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedInvoice.balance_due > 0 && (
                                            <div className="flex justify-between text-lg font-light text-orange-600 border-t pt-2">
                                                <span>Balance Due</span>
                                                <span>${selectedInvoice.balance_due?.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedInvoice.notes && (
                                    <div>
                                        <p className="text-[#0F1729]/60 mb-2 text-sm">Notes</p>
                                        <p className="text-sm text-[#0F1729]/80">{selectedInvoice.notes}</p>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Message Project Manager Modal */}
                {selectedProject && (
                    <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[#4A90E2]" />
                                    Message Project Manager
                                </DialogTitle>
                                <p className="text-sm text-[#0F1729]/60 mt-2">
                                    Project: {selectedProject.project_name}
                                </p>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-[#0F1729] mb-2 block">
                                        Your Message
                                    </label>
                                    <Textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type your message here..."
                                        rows={6}
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedProject(null);
                                            setMessageText('');
                                        }}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleSendMessage(selectedProject.id)}
                                        disabled={!messageText.trim() || sendingMessage}
                                        className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    >
                                        {sendingMessage ? (
                                            <>
                                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-900">
                                        💡 Your project manager will receive this message and respond via email or through the communications tab.
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}