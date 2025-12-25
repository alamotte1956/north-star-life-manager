import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, Plus, Clock, Mail, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const reportTypes = [
    { value: 'monthly_spending', label: 'Monthly Spending Analysis' },
    { value: 'investment_performance', label: 'Investment Performance Review' },
    { value: 'succession_documents', label: 'Succession Document Status' },
    { value: 'property_analytics', label: 'Property Analytics Report' },
    { value: 'budget_summary', label: 'Budget Summary Report' },
    { value: 'tax_summary', label: 'Tax Summary Report' }
];

export default function ScheduledReports() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        report_name: '',
        report_type: 'monthly_spending',
        frequency: 'monthly',
        format: 'pdf',
        recipients: ''
    });

    const queryClient = useQueryClient();

    const { data: scheduledReports = [] } = useQuery({
        queryKey: ['scheduledReports'],
        queryFn: () => base44.entities.ScheduledReport.list('-created_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => {
            const nextRunDate = new Date();
            if (data.frequency === 'daily') nextRunDate.setDate(nextRunDate.getDate() + 1);
            if (data.frequency === 'weekly') nextRunDate.setDate(nextRunDate.getDate() + 7);
            if (data.frequency === 'monthly') nextRunDate.setMonth(nextRunDate.getMonth() + 1);
            if (data.frequency === 'quarterly') nextRunDate.setMonth(nextRunDate.getMonth() + 3);
            if (data.frequency === 'annual') nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);

            return base44.entities.ScheduledReport.create({
                ...data,
                recipients: data.recipients.split(',').map(e => e.trim()).filter(e => e),
                next_run_date: nextRunDate.toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['scheduledReports']);
            setDialogOpen(false);
            resetForm();
            toast.success('Scheduled report created!');
        }
    });

    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }) => 
            base44.entities.ScheduledReport.update(id, { is_active: isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries(['scheduledReports']);
            toast.success('Report schedule updated!');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.ScheduledReport.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['scheduledReports']);
            toast.success('Scheduled report deleted!');
        }
    });

    const resetForm = () => {
        setFormData({
            report_name: '',
            report_type: 'monthly_spending',
            frequency: 'monthly',
            format: 'pdf',
            recipients: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-black">Scheduled Reports</h2>
                <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Schedule New Report
                </Button>
            </div>

            {scheduledReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scheduledReports.map(report => (
                        <Card key={report.id} className="border-[#4A90E2]/20">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg font-light flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[#4A90E2]" />
                                            {report.report_name}
                                        </CardTitle>
                                        <p className="text-sm text-[#0F1729]/60 mt-1">
                                            {reportTypes.find(t => t.value === report.report_type)?.label}
                                        </p>
                                    </div>
                                    <Badge className={report.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                        {report.is_active ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-[#0F1729]/70">
                                        <Clock className="w-4 h-4 text-[#4A90E2]" />
                                        {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)}
                                    </div>
                                    
                                    {report.next_run_date && (
                                        <div className="flex items-center gap-2 text-sm text-[#0F1729]/70">
                                            <Calendar className="w-4 h-4 text-[#4A90E2]" />
                                            Next: {format(new Date(report.next_run_date), 'MMM d, yyyy')}
                                        </div>
                                    )}

                                    {report.recipients?.length > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-[#0F1729]/70">
                                            <Mail className="w-4 h-4 text-[#4A90E2]" />
                                            {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={report.is_active}
                                                onCheckedChange={(checked) => 
                                                    toggleActiveMutation.mutate({ id: report.id, isActive: checked })
                                                }
                                            />
                                            <Label className="text-sm">Active</Label>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Delete this scheduled report?')) {
                                                    deleteMutation.mutate(report.id);
                                                }
                                            }}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-[#4A90E2]/20">
                    <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-[#4A90E2]/40" />
                        <p className="text-[#0F1729]/60">No scheduled reports yet</p>
                        <p className="text-sm text-[#0F1729]/40 mt-2">Create automated reports to stay informed</p>
                    </CardContent>
                </Card>
            )}

            {/* Create Scheduled Report Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Schedule Recurring Report</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>Report Name</Label>
                            <Input
                                placeholder="e.g., Monthly Financial Summary"
                                value={formData.report_name}
                                onChange={(e) => setFormData({ ...formData, report_name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <Label>Report Type</Label>
                            <Select 
                                value={formData.report_type} 
                                onValueChange={(value) => setFormData({ ...formData, report_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Frequency</Label>
                                <Select 
                                    value={formData.frequency} 
                                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="annual">Annual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Format</Label>
                                <Select 
                                    value={formData.format} 
                                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="csv">CSV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Email Recipients (comma-separated)</Label>
                            <Input
                                placeholder="email1@example.com, email2@example.com"
                                value={formData.recipients}
                                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                            />
                            <p className="text-xs text-[#0F1729]/50 mt-1">
                                Reports will be automatically emailed to these addresses
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                Schedule Report
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}