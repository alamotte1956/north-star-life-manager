import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Clock, CheckCircle, User, FileText, Calendar, Plane, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ConciergeService() {
    const [showRequest, setShowRequest] = useState(false);
    const [formData, setFormData] = useState({
        request_type: '',
        priority: 'normal',
        title: '',
        description: ''
    });
    const queryClient = useQueryClient();

    const { data: requests = [] } = useQuery({
        queryKey: ['concierge-requests'],
        queryFn: () => base44.entities.ConciergeRequest.list('-created_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ConciergeRequest.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concierge-requests'] });
            setShowRequest(false);
            setFormData({ request_type: '', priority: 'normal', title: '', description: '' });
            toast.success('Concierge request submitted');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const requestTypes = [
        { value: 'document_filing', label: 'Document Filing', icon: FileText },
        { value: 'appointment_booking', label: 'Appointment Booking', icon: Calendar },
        { value: 'research', label: 'Research & Analysis', icon: FileText },
        { value: 'travel_planning', label: 'Travel Planning', icon: Plane },
        { value: 'bill_payment', label: 'Bill Payment Assistance', icon: DollarSign },
        { value: 'vendor_coordination', label: 'Vendor Coordination', icon: User },
        { value: 'other', label: 'Other', icon: FileText }
    ];

    const pendingRequests = requests.filter(r => ['submitted', 'assigned', 'in_progress'].includes(r.status));
    const completedRequests = requests.filter(r => r.status === 'completed');

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Crown className="w-8 h-8 text-[#D4AF37]" />
                                <h1 className="text-4xl font-light text-[#1A2B44]">Concierge Service</h1>
                            </div>
                            <p className="text-[#1A2B44]/60">White-glove assistance with your life management tasks</p>
                        </div>
                        <Button onClick={() => setShowRequest(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Crown className="w-5 h-5 mr-2" />
                            New Request
                        </Button>
                    </div>
                </div>

                {/* Premium Service Banner */}
                <Card className="mb-8 border-[#D4AF37] bg-gradient-to-br from-amber-50 to-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <Crown className="w-12 h-12 text-[#D4AF37] flex-shrink-0" />
                            <div>
                                <h3 className="text-xl font-medium text-[#1A2B44] mb-2">Premium Concierge Service</h3>
                                <p className="text-[#1A2B44]/70 mb-4">
                                    Let our expert team handle time-consuming tasks so you can focus on what matters most.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <FileText className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                                        <div className="text-sm font-medium">Document Filing</div>
                                    </div>
                                    <div className="text-center">
                                        <Calendar className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                                        <div className="text-sm font-medium">Scheduling</div>
                                    </div>
                                    <div className="text-center">
                                        <Plane className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                                        <div className="text-sm font-medium">Travel Planning</div>
                                    </div>
                                    <div className="text-center">
                                        <User className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                                        <div className="text-sm font-medium">Vendor Management</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Requests */}
                {pendingRequests.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-4">Active Requests</h2>
                        <div className="space-y-4">
                            {pendingRequests.map((request) => (
                                <Card key={request.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{request.title}</CardTitle>
                                                <p className="text-sm text-[#1A2B44]/60 capitalize">
                                                    {request.request_type.replace('_', ' ')}
                                                </p>
                                            </div>
                                            <Badge className={
                                                request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                request.status === 'assigned' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }>
                                                {request.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[#1A2B44]/70 mb-4">{request.description}</p>
                                        
                                        {request.assigned_to && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60 mb-3">
                                                <User className="w-4 h-4" />
                                                Assigned to: {request.assigned_to}
                                            </div>
                                        )}

                                        {request.estimated_completion && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                                <Clock className="w-4 h-4" />
                                                Est. completion: {new Date(request.estimated_completion).toLocaleDateString()}
                                            </div>
                                        )}

                                        {request.updates?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[#1A2B44]/10">
                                                <div className="text-sm font-medium text-[#1A2B44] mb-2">Latest Updates</div>
                                                {request.updates.slice(-2).map((update, i) => (
                                                    <div key={i} className="text-sm text-[#1A2B44]/70 mb-1">
                                                        • {update.message}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Requests */}
                {completedRequests.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-4">Completed</h2>
                        <div className="space-y-4">
                            {completedRequests.slice(0, 5).map((request) => (
                                <Card key={request.id} className="border-green-200 bg-green-50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-[#1A2B44] mb-1">{request.title}</div>
                                                <p className="text-sm text-[#1A2B44]/60">
                                                    Completed {new Date(request.actual_completion).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Request Dialog */}
                <Dialog open={showRequest} onOpenChange={setShowRequest}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Concierge Request</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Request Type</Label>
                                <Select
                                    value={formData.request_type}
                                    onValueChange={(value) => setFormData({ ...formData, request_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {requestTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Brief description of request"
                                    required
                                />
                            </div>

                            <div>
                                <Label>Detailed Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Provide as much detail as possible..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    Your dedicated concierge will review and respond within 24 hours.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowRequest(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}