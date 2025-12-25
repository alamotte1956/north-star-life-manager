import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Edit, Download, Phone, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function MedicalProfile() {
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        blood_type: 'Unknown',
        allergies: '',
        current_medications: '',
        chronic_conditions: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        primary_physician: '',
        primary_physician_phone: '',
        preferred_hospital: '',
        insurance_provider: '',
        insurance_policy_number: '',
        insurance_group_number: '',
        organ_donor: false,
        advance_directive_on_file: false,
        special_instructions: ''
    });

    const { data: profiles = [], refetch } = useQuery({
        queryKey: ['medicalEmergencyInfo'],
        queryFn: () => base44.entities.MedicalEmergencyInfo.list()
    });

    useEffect(() => {
        if (profiles.length > 0) {
            setProfile(profiles[0]);
            setFormData(profiles[0]);
        }
    }, [profiles]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (profile) {
            await base44.entities.MedicalEmergencyInfo.update(profile.id, formData);
        } else {
            await base44.entities.MedicalEmergencyInfo.create(formData);
        }
        setOpen(false);
        refetch();
    };

    const handlePrintCard = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <Heart className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Medical Emergency Profile</h1>
                            <p className="text-[#0F1729]/60 font-light">Critical information for first responders and physicians</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {profile && (
                            <Button
                                variant="outline"
                                onClick={handlePrintCard}
                                className="border-[#4A90E2]/20"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Print Card
                            </Button>
                        )}
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] hover:shadow-lg text-white">
                                    <Edit className="w-4 h-4 mr-2" />
                                    {profile ? 'Update' : 'Create'} Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Medical Emergency Information</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Blood Type</Label>
                                            <Select
                                                value={formData.blood_type}
                                                onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A+">A+</SelectItem>
                                                    <SelectItem value="A-">A-</SelectItem>
                                                    <SelectItem value="B+">B+</SelectItem>
                                                    <SelectItem value="B-">B-</SelectItem>
                                                    <SelectItem value="AB+">AB+</SelectItem>
                                                    <SelectItem value="AB-">AB-</SelectItem>
                                                    <SelectItem value="O+">O+</SelectItem>
                                                    <SelectItem value="O-">O-</SelectItem>
                                                    <SelectItem value="Unknown">Unknown</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end gap-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.organ_donor}
                                                    onChange={(e) => setFormData({ ...formData, organ_donor: e.target.checked })}
                                                    className="rounded"
                                                />
                                                <Label>Organ Donor</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.advance_directive_on_file}
                                                    onChange={(e) => setFormData({ ...formData, advance_directive_on_file: e.target.checked })}
                                                    className="rounded"
                                                />
                                                <Label>Advance Directive</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Allergies (Medications & Foods)</Label>
                                        <Textarea
                                            value={formData.allergies}
                                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                            rows={2}
                                            placeholder="e.g., Penicillin, Shellfish"
                                        />
                                    </div>

                                    <div>
                                        <Label>Current Medications</Label>
                                        <Textarea
                                            value={formData.current_medications}
                                            onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                                            rows={3}
                                            placeholder="List all current medications and dosages"
                                        />
                                    </div>

                                    <div>
                                        <Label>Chronic Conditions</Label>
                                        <Textarea
                                            value={formData.chronic_conditions}
                                            onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                                            rows={2}
                                            placeholder="e.g., Diabetes, Hypertension, Heart Disease"
                                        />
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-black mb-3">Emergency Contact</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label>Name</Label>
                                                <Input
                                                    value={formData.emergency_contact_name}
                                                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Phone</Label>
                                                <Input
                                                    type="tel"
                                                    value={formData.emergency_contact_phone}
                                                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Relationship</Label>
                                                <Input
                                                    value={formData.emergency_contact_relationship}
                                                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-black mb-3">Primary Physician</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Physician Name</Label>
                                                <Input
                                                    value={formData.primary_physician}
                                                    onChange={(e) => setFormData({ ...formData, primary_physician: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Phone</Label>
                                                <Input
                                                    type="tel"
                                                    value={formData.primary_physician_phone}
                                                    onChange={(e) => setFormData({ ...formData, primary_physician_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Preferred Hospital</Label>
                                        <Input
                                            value={formData.preferred_hospital}
                                            onChange={(e) => setFormData({ ...formData, preferred_hospital: e.target.value })}
                                        />
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-black mb-3">Insurance</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label>Provider</Label>
                                                <Input
                                                    value={formData.insurance_provider}
                                                    onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Policy Number</Label>
                                                <Input
                                                    value={formData.insurance_policy_number}
                                                    onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Group Number</Label>
                                                <Input
                                                    value={formData.insurance_group_number}
                                                    onChange={(e) => setFormData({ ...formData, insurance_group_number: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Special Instructions</Label>
                                        <Textarea
                                            value={formData.special_instructions}
                                            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                                            rows={2}
                                            placeholder="Any critical medical instructions for emergency personnel"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        {profile ? 'Update' : 'Create'} Profile
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {profile ? (
                    <div className="space-y-6">
                        {/* Critical Alert Banner */}
                        <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-orange-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-medium text-red-700 mb-2">
                                            Emergency Medical Information
                                        </h3>
                                        <p className="text-sm text-red-600">
                                            This information is critical for first responders and medical personnel. Keep it current and accessible.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Emergency Card - Printable */}
                        <Card className="shadow-xl print:shadow-none print:border-2">
                            <CardHeader className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                <CardTitle className="text-2xl font-light">Medical Emergency Card</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-sm text-[#0F1729]/50 mb-1">Blood Type</div>
                                        <div className="text-3xl font-light text-red-600">{profile.blood_type}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#0F1729]/50 mb-1">Status</div>
                                        <div className="flex gap-2">
                                            {profile.organ_donor && (
                                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                                    Organ Donor
                                                </Badge>
                                            )}
                                            {profile.advance_directive_on_file && (
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Advance Directive
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {profile.allergies && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="text-sm font-medium text-red-800 mb-2">⚠️ ALLERGIES</div>
                                        <div className="text-red-700">{profile.allergies}</div>
                                    </div>
                                )}

                                {profile.current_medications && (
                                    <div className="mt-4">
                                        <div className="text-sm text-[#0F1729]/50 mb-2">Current Medications</div>
                                        <div className="text-black whitespace-pre-line">{profile.current_medications}</div>
                                    </div>
                                )}

                                {profile.chronic_conditions && (
                                    <div className="mt-4">
                                        <div className="text-sm text-[#0F1729]/50 mb-2">Chronic Conditions</div>
                                        <div className="text-black">{profile.chronic_conditions}</div>
                                    </div>
                                )}

                                {profile.special_instructions && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="text-sm font-medium text-yellow-800 mb-2">Special Instructions</div>
                                        <div className="text-yellow-700">{profile.special_instructions}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-[#4A90E2]" />
                                        Emergency Contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.emergency_contact_name ? (
                                        <div className="space-y-2">
                                            <div className="font-medium text-black">{profile.emergency_contact_name}</div>
                                            {profile.emergency_contact_relationship && (
                                                <div className="text-sm text-[#0F1729]/60">{profile.emergency_contact_relationship}</div>
                                            )}
                                            {profile.emergency_contact_phone && (
                                                <div className="text-[#4A90E2] font-medium">
                                                    <a href={`tel:${profile.emergency_contact_phone}`}>{profile.emergency_contact_phone}</a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[#1B4B7F]/40 text-sm">Not set</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light">Primary Physician</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.primary_physician ? (
                                        <div className="space-y-2">
                                            <div className="font-medium text-black">{profile.primary_physician}</div>
                                            {profile.primary_physician_phone && (
                                                <div className="text-[#4A90E2] font-medium">
                                                    <a href={`tel:${profile.primary_physician_phone}`}>{profile.primary_physician_phone}</a>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[#1B4B7F]/40 text-sm">Not set</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg font-light">Insurance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.insurance_provider ? (
                                        <div className="space-y-2">
                                            <div className="font-medium text-black">{profile.insurance_provider}</div>
                                            {profile.insurance_policy_number && (
                                                <div className="text-sm text-[#0F1729]/70">
                                                    Policy: {profile.insurance_policy_number}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[#1B4B7F]/40 text-sm">Not set</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <Card className="text-center py-16">
                        <Heart className="w-16 h-16 text-[#0F1729]/20 mx-auto mb-4" />
                        <p className="text-[#0F1729]/40 font-light mb-6">No medical emergency profile created</p>
                        <p className="text-[#0F1729]/30 text-sm mb-6">
                            Create a profile with critical medical information for first responders
                        </p>
                    </Card>
                )}

                <style jsx>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print\\:shadow-none, .print\\:shadow-none * {
                            visibility: visible;
                        }
                        .print\\:shadow-none {
                            position: absolute;
                            left: 0;
                            top: 0;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}