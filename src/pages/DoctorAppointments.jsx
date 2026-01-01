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
import { Plus, Stethoscope, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DoctorAppointments() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(null);
    const [formData, setFormData] = useState({
        doctor_name: '',
        specialty: '',
        appointment_date: '',
        reason: '',
        notes: '',
        follow_up_needed: false
    });

    const queryClient = useQueryClient();

    // Using HealthRecord entity for appointments
    const { data: appointments = [] } = useQuery({
        queryKey: ['doctorAppointments'],
        queryFn: () => base44.entities.HealthRecord.filter({ 
            record_type: 'appointment' 
        }, '-date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.HealthRecord.create({
            ...data,
            record_type: 'appointment',
            date: data.appointment_date
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['doctorAppointments']);
            setDialogOpen(false);
            resetForm();
            toast.success('Appointment added');
        }
    });

    const resetForm = () => {
        setFormData({
            doctor_name: '',
            specialty: '',
            appointment_date: '',
            reason: '',
            notes: '',
            follow_up_needed: false
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const generateAISummary = async (appointment) => {
        setSummaryLoading(appointment.id);
        try {
            const summary = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a concise medical visit summary from these notes:

Doctor: ${appointment.doctor_name} (${appointment.specialty})
Date: ${format(new Date(appointment.date), 'MMMM d, yyyy')}
Reason for Visit: ${appointment.reason}
Visit Notes: ${appointment.notes}

Provide:
1. Chief complaint summary
2. Key findings and observations
3. Treatment plan and recommendations
4. Medications prescribed or changed
5. Follow-up requirements
6. Important dates (next appointment, test results, etc.)
7. Questions to ask at next visit`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        chief_complaint: { type: "string" },
                        key_findings: { type: "array", items: { type: "string" } },
                        treatment_plan: { type: "string" },
                        medications: { type: "array", items: { type: "string" } },
                        follow_up: { type: "string" },
                        important_dates: { type: "array", items: { 
                            type: "object",
                            properties: {
                                date: { type: "string" },
                                description: { type: "string" }
                            }
                        }},
                        questions_for_next_visit: { type: "array", items: { type: "string" } }
                    }
                }
            });

            await base44.entities.HealthRecord.update(appointment.id, {
                ai_summary: JSON.stringify(summary),
                findings: summary.key_findings?.join('; ')
            });

            queryClient.invalidateQueries(['doctorAppointments']);
            toast.success('Summary generated!');
        } catch (error) {
            toast.error('Failed to generate summary');
        }
        setSummaryLoading(null);
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
                                Doctor Appointments
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">AI-powered visit summaries and tracking</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Log Appointment
                    </Button>
                </div>

                <div className="space-y-6">
                    {appointments.map((appointment) => {
                        const hasSummary = appointment.ai_summary;
                        let parsedSummary = null;
                        
                        if (hasSummary) {
                            try {
                                parsedSummary = JSON.parse(appointment.ai_summary);
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }

                        return (
                            <Card key={appointment.id} className="border-[#4A90E2]/20">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Stethoscope className="w-5 h-5 text-[#4A90E2]" />
                                                {appointment.doctor_name}
                                            </CardTitle>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                                    {appointment.specialty}
                                                </Badge>
                                                <span className="text-sm text-[#0F1729]/60">
                                                    {format(new Date(appointment.date), 'MMMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                        {!hasSummary && (
                                            <Button
                                                variant="outline"
                                                onClick={() => generateAISummary(appointment)}
                                                disabled={summaryLoading === appointment.id}
                                                className="gap-2"
                                            >
                                                {summaryLoading === appointment.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        Generate Summary
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-[#0F1729]/60 mb-1">Reason for Visit</h4>
                                        <p className="text-[#0F1729]">{appointment.reason}</p>
                                    </div>

                                    {appointment.notes && (
                                        <div>
                                            <h4 className="text-sm font-medium text-[#0F1729]/60 mb-1">Visit Notes</h4>
                                            <p className="text-sm text-[#0F1729]/80">{appointment.notes}</p>
                                        </div>
                                    )}

                                    {parsedSummary && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-blue-900 font-medium">
                                                <Sparkles className="w-4 h-4" />
                                                AI Visit Summary
                                            </div>

                                            {parsedSummary.chief_complaint && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-blue-900 mb-1">Chief Complaint</h4>
                                                    <p className="text-sm text-blue-800">{parsedSummary.chief_complaint}</p>
                                                </div>
                                            )}

                                            {parsedSummary.key_findings?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-blue-900 mb-1">Key Findings</h4>
                                                    <ul className="space-y-1">
                                                        {parsedSummary.key_findings.map((finding, i) => (
                                                            <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                                                <span>•</span>
                                                                {finding}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {parsedSummary.treatment_plan && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-blue-900 mb-1">Treatment Plan</h4>
                                                    <p className="text-sm text-blue-800">{parsedSummary.treatment_plan}</p>
                                                </div>
                                            )}

                                            {parsedSummary.medications?.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-blue-900 mb-1">Medications</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {parsedSummary.medications.map((med, i) => (
                                                            <Badge key={i} className="bg-blue-100 text-blue-800">
                                                                {med}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {parsedSummary.follow_up && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-blue-900 mb-1">Follow-Up</h4>
                                                    <p className="text-sm text-blue-800">{parsedSummary.follow_up}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {appointments.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No appointments recorded yet</p>
                            <p className="text-sm text-[#0F1729]/40">Track your medical visits and get AI summaries</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Log Doctor Appointment</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Doctor Name *</Label>
                                <Input
                                    value={formData.doctor_name}
                                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Specialty</Label>
                                <Input
                                    placeholder="e.g., Cardiologist, Primary Care"
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Appointment Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.appointment_date}
                                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Reason for Visit *</Label>
                                <Input
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Visit Notes</Label>
                                <Textarea
                                    placeholder="What did the doctor say? Any tests ordered? Medications prescribed?"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={6}
                                />
                                <p className="text-xs text-[#0F1729]/50 mt-1">
                                    💡 Add detailed notes to get better AI summaries
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