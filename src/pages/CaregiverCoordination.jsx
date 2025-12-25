import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Heart, FileText, Share2, Calendar, Phone } from 'lucide-react';
import { toast } from 'sonner';
import ShareDialog from '../components/collaboration/ShareDialog';

export default function CaregiverCoordination() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [shareDialog, setShareDialog] = useState(null);
    const [formData, setFormData] = useState({
        caregiver_name: '',
        agency: '',
        phone: '',
        email: '',
        schedule: '',
        specialized_care: '',
        emergency_contact: false,
        notes: ''
    });

    const queryClient = useQueryClient();

    const { data: caregivers = [] } = useQuery({
        queryKey: ['caregivers'],
        queryFn: () => base44.entities.Contact.filter({ category: 'caregiver' })
    });

    const { data: healthRecords = [] } = useQuery({
        queryKey: ['healthRecords'],
        queryFn: () => base44.entities.HealthRecord.list('-created_date', 20)
    });

    const { data: medications = [] } = useQuery({
        queryKey: ['medications'],
        queryFn: () => base44.entities.Medication.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Contact.create({
            ...data,
            category: 'caregiver',
            name: data.caregiver_name,
            relationship: 'caregiver'
        }),
        onSuccess: async (newCaregiver) => {
            queryClient.invalidateQueries(['caregivers']);
            
            // Auto-share medical info with new caregiver
            if (newCaregiver.email) {
                try {
                    // Share recent health records
                    for (const record of healthRecords.slice(0, 5)) {
                        await base44.entities.SharedAccess.create({
                            entity_type: 'HealthRecord',
                            entity_id: record.id,
                            entity_name: record.record_type,
                            shared_with_email: newCaregiver.email,
                            permission_level: 'view',
                            notes: 'Auto-shared with caregiver'
                        });
                    }
                    
                    // Share medications
                    for (const med of medications) {
                        await base44.entities.SharedAccess.create({
                            entity_type: 'Medication',
                            entity_id: med.id,
                            entity_name: med.name,
                            shared_with_email: newCaregiver.email,
                            permission_level: 'view',
                            notes: 'Medication schedule for caregiving'
                        });
                    }
                } catch (error) {
                    console.error('Auto-share error:', error);
                }
            }
            
            setDialogOpen(false);
            resetForm();
            toast.success('Caregiver added and medical info shared!');
        }
    });

    const resetForm = () => {
        setFormData({
            caregiver_name: '',
            agency: '',
            phone: '',
            email: '',
            schedule: '',
            specialized_care: '',
            emergency_contact: false,
            notes: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Caregiver Coordination
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Share medical information with home health aides</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Caregiver
                    </Button>
                </div>

                {/* Info Card */}
                <Card className="mb-8 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Heart className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-medium text-blue-900 mb-2">Secure Medical Information Sharing</h3>
                                <p className="text-sm text-blue-800">
                                    When you add a caregiver, we automatically share your recent health records, 
                                    medication schedules, and important medical information with them. 
                                    All sharing is secure and can be revoked anytime.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Caregivers List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caregivers.map((caregiver) => (
                        <Card key={caregiver.id} className="border-[#4A90E2]/20">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-light flex items-center gap-2">
                                            <Users className="w-5 h-5 text-[#4A90E2]" />
                                            {caregiver.caregiver_name || caregiver.name}
                                        </CardTitle>
                                        {caregiver.agency && (
                                            <p className="text-sm text-[#0F1729]/60 mt-1">{caregiver.agency}</p>
                                        )}
                                    </div>
                                    {caregiver.emergency_contact && (
                                        <Badge className="bg-red-100 text-red-700">Emergency Contact</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {caregiver.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-[#4A90E2]" />
                                        <a href={`tel:${caregiver.phone}`} className="text-[#4A90E2] hover:underline">
                                            {caregiver.phone}
                                        </a>
                                    </div>
                                )}

                                {caregiver.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-[#4A90E2]" />
                                        <a href={`mailto:${caregiver.email}`} className="text-[#4A90E2] hover:underline">
                                            {caregiver.email}
                                        </a>
                                    </div>
                                )}

                                {caregiver.schedule && (
                                    <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="text-blue-900">{caregiver.schedule}</span>
                                    </div>
                                )}

                                {caregiver.specialized_care && (
                                    <div className="text-sm">
                                        <strong>Specialized Care:</strong>
                                        <p className="text-[#0F1729]/70 mt-1">{caregiver.specialized_care}</p>
                                    </div>
                                )}

                                <div className="pt-3 border-t flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShareDialog(caregiver)}
                                        className="flex-1"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Manage Access
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {caregivers.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No caregivers added yet</p>
                            <p className="text-sm text-[#0F1729]/40">Add caregivers to share medical information securely</p>
                        </CardContent>
                    </Card>
                )}

                {/* Add Caregiver Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Caregiver</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Caregiver Name</Label>
                                <Input
                                    value={formData.caregiver_name}
                                    onChange={(e) => setFormData({ ...formData, caregiver_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Agency (if applicable)</Label>
                                <Input
                                    value={formData.agency}
                                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Schedule</Label>
                                <Input
                                    value={formData.schedule}
                                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                    placeholder="e.g., Mon-Fri 9AM-5PM"
                                />
                            </div>

                            <div>
                                <Label>Specialized Care</Label>
                                <Textarea
                                    value={formData.specialized_care}
                                    onChange={(e) => setFormData({ ...formData, specialized_care: e.target.value })}
                                    placeholder="Dementia care, physical therapy, etc."
                                    rows="2"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.emergency_contact}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.checked })}
                                />
                                <Label>Add as emergency contact</Label>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800">
                                    ✓ Medical records and medication schedules will be automatically shared
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
                                    Add Caregiver
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Share Dialog */}
                {shareDialog && (
                    <ShareDialog
                        open={!!shareDialog}
                        onOpenChange={() => setShareDialog(null)}
                        entityType="Contact"
                        entityId={shareDialog.id}
                        entityName={shareDialog.caregiver_name || shareDialog.name}
                    />
                )}
            </div>
        </div>
    );
}