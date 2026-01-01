import React, { useState } from 'react';
import logger from '@/utils/logger'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar as CalendarIcon, Clock, CheckCircle, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VideoCallScheduler() {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(new Date());
    const [formData, setFormData] = useState({
        session_type: 'general',
        preferred_time: '',
        phone_number: '',
        email: '',
        topics: ''
    });

    const sessionTypes = [
        { value: 'general', label: 'General Onboarding', duration: '30 min', description: 'Complete platform walkthrough' },
        { value: 'documents', label: 'Document Organization', duration: '45 min', description: 'Learn to organize your vault' },
        { value: 'finance', label: 'Financial Setup', duration: '60 min', description: 'Connect banks and track finances' },
        { value: 'estate', label: 'Estate Planning Guidance', duration: '60 min', description: 'Plan your legacy with an expert' },
        { value: 'tech_support', label: 'Technical Support', duration: '30 min', description: 'Troubleshoot any issues' }
    ];

    const timeSlots = [
        '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
        '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
    ];

    const scheduleMutation = useMutation({
        mutationFn: async (data) => {
            const user = await base44.auth.me();
            const selectedSession = sessionTypes.find(s => s.value === data.session_type);
            
            // Combine date and time
            const appointmentDateTime = new Date(date);
            const [time, period] = data.preferred_time.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            appointmentDateTime.setHours(hours, minutes || 0, 0, 0);

            // Create booking
            const booking = await base44.entities.ProfessionalBooking.create({
                appointment_date: appointmentDateTime.toISOString(),
                professional_id: 'support_team',
                professional_name: 'North Star Support Team',
                service_type: selectedSession.label,
                meeting_type: 'video',
                duration_minutes: parseInt(selectedSession.duration),
                notes: data.topics,
                cost: 0
            });

            // Create video meeting with Google Meet and send invites
            try {
                await base44.functions.invoke('createVideoMeeting', {
                    booking_id: booking.id,
                    professional_email: 'support@northstar.com',
                    user_email: data.email || user.email,
                    service_type: selectedSession.label,
                    appointment_date: appointmentDateTime.toISOString(),
                    duration_minutes: parseInt(selectedSession.duration)
                });
            } catch (error) {
                logger.error('Error creating meeting:', error);
            }

            return booking;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-bookings']);
            setFormData({
                session_type: 'general',
                preferred_time: '',
                phone_number: '',
                email: '',
                topics: ''
            });
            toast.success('Video call confirmed! Google Meet link sent to your email with calendar invite.');
        },
        onError: () => {
            toast.error('Failed to schedule call');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        scheduleMutation.mutate(formData);
    };

    const selectedSession = sessionTypes.find(s => s.value === formData.session_type);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-8">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                        alt="North Star Logo" 
                        className="w-16 h-16 object-contain"
                    />
                    <div>
                        <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Schedule a Video Call
                        </h1>
                        <p className="text-[#0F1729]/60 font-light">Get personalized help from our team</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Session Types */}
                    <div className="lg:col-span-3">
                        <Card className="border-[#4A90E2]/20 mb-6">
                            <CardHeader>
                                <CardTitle>Choose Your Session</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sessionTypes.map((session) => (
                                        <Card
                                            key={session.value}
                                            className={`cursor-pointer transition-all ${
                                                formData.session_type === session.value
                                                    ? 'border-2 border-[#4A90E2] bg-[#4A90E2]/5'
                                                    : 'border hover:border-[#4A90E2]/50'
                                            }`}
                                            onClick={() => setFormData({ ...formData, session_type: session.value })}
                                        >
                                            <CardContent className="pt-4 pb-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="font-medium text-black">{session.label}</h3>
                                                    {formData.session_type === session.value && (
                                                        <CheckCircle className="w-5 h-5 text-[#4A90E2]" />
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="mb-2">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {session.duration}
                                                </Badge>
                                                <p className="text-sm text-[#0F1729]/60">{session.description}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar */}
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-[#4A90E2]" />
                                Select Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    {/* Booking Form */}
                    <Card className="lg:col-span-2 border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Video className="w-5 h-5 text-[#4A90E2]" />
                                Complete Your Booking
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-blue-900">
                                        <strong>✓ {selectedSession?.label}</strong><br />
                                        Duration: {selectedSession?.duration}<br />
                                        Date: {format(date, 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>

                                <div>
                                    <Label>Preferred Time *</Label>
                                    <Select
                                        value={formData.preferred_time}
                                        onValueChange={(val) => setFormData({ ...formData, preferred_time: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select time..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.map((time) => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Phone Number *</Label>
                                    <Input
                                        type="tel"
                                        placeholder="(555) 123-4567"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Topics You'd Like to Cover (Optional)</Label>
                                    <Textarea
                                        placeholder="Tell us what you'd like help with..."
                                        value={formData.topics}
                                        onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                                        rows={4}
                                    />
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-green-900 mb-1">
                                                What to Expect
                                            </p>
                                            <ul className="text-sm text-green-800 space-y-1">
                                                <li>• We'll send a video call link to your email</li>
                                                <li>• No software installation required</li>
                                                <li>• Screen sharing available if you need help</li>
                                                <li>• Recording available upon request</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!formData.preferred_time || !formData.phone_number || !formData.email || scheduleMutation.isPending}
                                    className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    size="lg"
                                >
                                    {scheduleMutation.isPending ? 'Creating Meeting...' : 'Schedule Video Call'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6 border-[#4A90E2]/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#4A90E2]/10 rounded-lg">
                                <Video className="w-6 h-6 text-[#4A90E2]" />
                            </div>
                            <div>
                                <h3 className="font-medium text-black mb-2">Premium & Family Office Members</h3>
                                <p className="text-sm text-[#0F1729]/60 mb-2">
                                    Get unlimited video call support as part of your plan. Schedule as many sessions as you need!
                                </p>
                                <Badge className="bg-[#4A90E2] text-white">Included in Your Plan</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}