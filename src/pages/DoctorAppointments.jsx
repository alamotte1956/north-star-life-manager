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
import { Calendar, Plus, Stethoscope, FileText, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DoctorAppointments() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [summarizing, setSummarizing] = useState(null);
    const [formData, setFormData] = useState({
        doctor_name: '',
        specialty: '',
        appointment_date: '',
        appointment_time: '',
        reason: '',
        location: '',
        notes: '',
        prescription_changes: '',
        test_results: '',
        follow_up_needed: false,
        follow_up_date: ''
    });

    const queryClient = useQueryClient();

    const { data: appointments = [] } = useQuery({
        queryKey: ['doctorAppointments'],
        queryFn: () => base44.entities.HealthRecord.filter({ record_type: 'doctor_visit' })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.HealthRecord.create({
            ...data,
            record_type: 'doctor_visit',
            date: data.appointment_date,
            provider: data.doctor_name
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['doctorAppointments']);
            setDialogOpen(false);
            resetForm();
            toast.success('Appointment recorded!');
        }
    });

    const generateSummary = async (appointment) => {
        setSummarizing(appointment.id);
        try {
            const summary = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a clear medical appointment summary from these notes:

Doctor: ${appointment.doctor_name} (${appointment.specialty})
Date: ${appointment.appointment_date}
Reason: ${appointment.reason}
Notes: ${appointment.notes}
Prescriptions: ${appointment.prescription_changes || 'None'}
Tests: ${appointment.test_results || 'None'}
Follow-up: ${appointment.follow_up_needed ? 'Yes' : 'No'}

Create:
1. Visit Summary (2-3 sentences)
2. Key Findings
3. Medications Prescribed/Changed
4. Tests Ordered
5. Follow-up Actions
6. Patient Instructions`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        key_findings: { type: "array", items: { type: "string" } },
                        medications: { type: "array", items: { type: "string" } },
                        tests_ordered: { type: "array", items: { type: "string" } },
                        follow_up_actions: { type: "array", items: { type: "string" } },
                        patient_instructions: { type: "array", items: { type: "string" } }
                    }
                }
            });

            await base44.entities.HealthRecord.update(appointment.id, {
                ai_summary: summary.summary,
                extracted_data: summary
            });

            queryClient.invalidateQueries(['doctorAppointments']);
            toast.success('Summary generated!');
        } catch (error) {
            toast.error('Failed to generate summary');
        }
        setSummarizing(null);
    };

    const resetForm = () => {
        setFormData({
            doctor_name: '',
            specialty: '',
            appointment_date: '',
            appointment_time: '',
            reason: '',
            location: '',
            notes: '',
            prescription_changes: '',
            test_results: '',
            follow_up_needed: false,
            follow_up_date: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const upcoming = appointments.filter(apt => 
        new Date(apt.appointment_date) >= new Date()
    );
    const past = appointments.filter(apt => 
        new Date(apt.appointment_date) < new Date()
    );

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
                                Doctor Appointments
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Track visits and AI-powered summaries</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Appointment
                    </Button>
                </div>

                {/* Upcoming Appointments */}
                {upcoming.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-light text-black mb-4">Upcoming Appointments</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcoming.map((apt) => (
                                <Card key={apt.id} className="border-blue-200 bg-blue-50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Stethoscope className="w-6 h-6 text-blue-600" />
                                                <div>
                                                    <h3 className="font-medium text-black">{apt.doctor_name}</h3>
                                                    <p className="text-sm text-blue-700">{apt.specialty}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                <span>{format(new Date(apt.appointment_date), 'EEEE, MMMM d, yyyy')}</span>
                                            </div>
                                            <p className="text-blue-900"><strong>Reason:</strong> {apt.reason}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Appointments */}
                <div>
                    <h2 className="text-2xl font-light text-black mb-4">Past Appointments</h2>
                    <div className="space-y-4">
                        {past.map((apt) => (
                            <Card key={apt.id} className="border-[#4A90E2]/20">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-light flex items-center gap-2">
                                                <Stethoscope className="w-5 h-5 text-[#4A90E2]" />
                                                {apt.doctor_name}
                                            </CardTitle>
                                            <p className="text-sm text-[#0F1729]/60 mt-1">
                                                {apt.specialty} • {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        {!apt.ai_summary && (
                                            <Button
                                                size="sm"
                                                onClick={() => generateSummary(apt)}
                                                disabled={summarizing === apt.id}
                                                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                            >
                                                {summarizing === apt.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        AI Summary
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm"><strong>Reason:</strong> {apt.reason}</p>
                                    </div>

                                    {apt.ai_summary && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                AI Summary
                                            </h4>
                                            <p className="text-sm text-blue-800 mb-3">{apt.ai_summary}</p>
                                            
                                            {apt.extracted_data?.key_findings?.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-medium text-blue-900 mb-1">Key Findings:</p>
                                                    <ul className="text-xs text-blue-800 space-y-1">
                                                        {apt.extracted_data.key_findings.map((finding, i) => (
                                                            <li key={i}>• {finding}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {apt.notes && (
                                        <div className="text-sm">
                                            <strong>Notes:</strong>
                                            <p className="text-[#0F1729]/70 mt-1">{apt.notes}</p>
                                        </div>
                                    )}

                                    {apt.follow_up_needed && (
                                        <Badge className="bg-orange-100 text-orange-700">
                                            Follow-up Required
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {appointments.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No appointments recorded</p>
                            <p className="text-sm text-[#0F1729]/40">Track your medical visits and get AI summaries</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Record Doctor Appointment</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Doctor Name</Label>
                                    <Input
                                        value={formData.doctor_name}
                                        onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Specialty</Label>
                                    <Input
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        placeholder="Cardiologist, Primary Care..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.appointment_date}
                                        onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.appointment_time}
                                        onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Reason for Visit</Label>
                                <Input
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Annual checkup, follow-up, symptoms..."
                                    required
                                />
                            </div>

                            <div>
                                <Label>Location</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Clinic address or telehealth"
                                />
                            </div>

                            <div>
                                <Label>Visit Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="What was discussed, findings, recommendations..."
                                    rows="4"
                                />
                            </div>

                            <div>
                                <Label>Prescription Changes</Label>
                                <Textarea
                                    value={formData.prescription_changes}
                                    onChange={(e) => setFormData({ ...formData, prescription_changes: e.target.value })}
                                    placeholder="New medications, dosage changes, discontinued..."
                                    rows="2"
                                />
                            </div>

                            <div>
                                <Label>Test Results</Label>
                                <Textarea
                                    value={formData.test_results}
                                    onChange={(e) => setFormData({ ...formData, test_results: e.target.value })}
                                    placeholder="Blood work, imaging, etc."
                                    rows="2"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.follow_up_needed}
                                    onChange={(e) => setFormData({ ...formData, follow_up_needed: e.target.checked })}
                                />
                                <Label>Follow-up appointment needed</Label>
                            </div>

                            {formData.follow_up_needed && (
                                <div>
                                    <Label>Follow-up Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.follow_up_date}
                                        onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                                    />
                                </div>
                            )}

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
                                    Save Appointment
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}