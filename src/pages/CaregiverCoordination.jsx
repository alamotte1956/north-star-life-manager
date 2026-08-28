import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Heart, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CaregiverCoordination() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        caregiver_name: '',
        caregiver_email: '',
        relationship: 'professional',
        phone: '',
        auto_share_medical: true,
        auto_share_medications: true,
        auto_share_emergency: true
    });

    const queryClient = useQueryClient();

    const { data: caregivers = [] } = useQuery({
        queryKey: ['caregivers'],
        queryFn: async () => {
            const contacts = await base44.entities.Contact.list();
            return contacts.filter(c => c.category === 'caregiver');
        }
    });

    const { data: medications = [] } = useQuery({
        queryKey: ['medications'],
        queryFn: () => base44.entities.Medication.list()
    });

    const { data: healthRecords = [] } = useQuery({
        queryKey: ['healthRecords'],
        queryFn: () => base44.entities.HealthRecord.list('-date', 10)
    });

    const { data: emergencyInfo = [] } = useQuery({
        queryKey: ['emergencyInfo'],
        queryFn: () => base44.entities.EmergencyInfo.list()
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            // Create caregiver contact
            const caregiver = await base44.entities.Contact.create({
                name: data.caregiver_name,
                email: data.caregiver_email,
                phone: data.phone,
                category: 'caregiver',
                relationship: data.relationship,
                notes: `Auto-share settings: Medical=${data.auto_share_medical}, Meds=${data.auto_share_medications}, Emergency=${data.auto_share_emergency}`
            });

            // Auto-share medical info if enabled
            if (data.auto_share_medical) {
                // Share all health records
                for (const record of healthRecords) {
                    await base44.entities.SharedAccess.create({
                        entity_type: 'HealthRecord',
                        entity_id: record.id,
                        entity_name: record.title || 'Health Record',
                        shared_with_email: data.caregiver_email,
                        permission_level: 'view',
                        notes: 'Auto-shared with caregiver'
                    });
                }
            }

            if (data.auto_share_medications) {
                // Share all medications
                for (const med of medications) {
                    await base44.entities.SharedAccess.create({
                        entity_type: 'Medication',
                        entity_id: med.id,
                        entity_name: med.name,
                        shared_with_email: data.caregiver_email,
                        permission_level: 'view',
                        notes: 'Auto-shared medication list'
                    });
                }
            }

            if (data.auto_share_emergency && emergencyInfo.length > 0) {
                // Share emergency info
                for (const info of emergencyInfo) {
                    await base44.entities.SharedAccess.create({
                        entity_type: 'EmergencyInfo',
                        entity_id: info.id,
                        entity_name: 'Emergency Contact Info',
                        shared_with_email: data.caregiver_email,
                        permission_level: 'view',
                        notes: 'Auto-shared emergency information'
                    });
                }
            }

            return caregiver;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['caregivers']);
            setDialogOpen(false);
            resetForm();
            toast.success('Caregiver added and medical info shared!');
        }
    });

    const resetForm = () => {
        setFormData({
            caregiver_name: '',
            caregiver_email: '',
            relationship: 'professional',
            phone: '',
            auto_share_medical: true,
            auto_share_medications: true,
            auto_share_emergency: true
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
                            <p className="text-[#0F1729]/60 font-light">Share medical info with home health aides</p>
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

                <Card className="mb-6 border-[#4A90E2]/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-[#4A90E2] mt-0.5" />
                            <div>
                                <h3 className="font-medium text-black mb-1">Automatic Medical Info Sharing</h3>
                                <p className="text-sm text-[#0F1729]/60">
                                    When you add a caregiver, you can automatically share your health records, medication list, and emergency contacts with them for better care coordination.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {caregivers.map((caregiver) => (
                        <Card key={caregiver.id} className="border-[#4A90E2]/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-black mb-1">{caregiver.name}</h3>
                                        <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                            {caregiver.relationship}
                                        </Badge>
                                    </div>
                                    <Users className="w-8 h-8 text-[#4A90E2]/40" />
                                </div>

                                <div className="space-y-2 text-sm">
                                    {caregiver.email && (
                                        <p className="text-[#0F1729]/60">{caregiver.email}</p>
                                    )}
                                    {caregiver.phone && (
                                        <p className="text-[#0F1729]/60">{caregiver.phone}</p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#4A90E2]/10">
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Medical info shared</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {caregivers.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No caregivers added yet</p>
                            <p className="text-sm text-[#0F1729]/40">Add home health aides and automatically share medical info</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Caregiver</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Caregiver Name *</Label>
                                <Input
                                    value={formData.caregiver_name}
                                    onChange={(e) => setFormData({ ...formData, caregiver_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.caregiver_email}
                                    onChange={(e) => setFormData({ ...formData, caregiver_email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Phone</Label>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Type</Label>
                                <Select 
                                    value={formData.relationship} 
                                    onValueChange={(val) => setFormData({ ...formData, relationship: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional Caregiver</SelectItem>
                                        <SelectItem value="home_health">Home Health Aide</SelectItem>
                                        <SelectItem value="nurse">Nurse</SelectItem>
                                        <SelectItem value="family">Family Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-medium text-blue-900">Auto-Share Settings</h4>
                                
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Share Health Records</Label>
                                    <Switch
                                        checked={formData.auto_share_medical}
                                        onCheckedChange={(checked) => setFormData({ ...formData, auto_share_medical: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Share Medications</Label>
                                    <Switch
                                        checked={formData.auto_share_medications}
                                        onCheckedChange={(checked) => setFormData({ ...formData, auto_share_medications: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Share Emergency Contacts</Label>
                                    <Switch
                                        checked={formData.auto_share_emergency}
                                        onCheckedChange={(checked) => setFormData({ ...formData, auto_share_emergency: checked })}
                                    />
                                </div>
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
                                    Add & Share
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}