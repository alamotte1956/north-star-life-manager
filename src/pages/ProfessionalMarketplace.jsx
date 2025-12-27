import React, { useState } from
import logger from '@/utils/logger'; 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Star, MapPin, DollarSign, Calendar, Video, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfessionalMarketplace() {
    const [filter, setFilter] = useState('all');
    const [showBooking, setShowBooking] = useState(null);
    const [bookingData, setBookingData] = useState({
        service_type: '',
        appointment_date: '',
        meeting_type: 'video',
        notes: ''
    });
    const queryClient = useQueryClient();

    const { data: professionals = [] } = useQuery({
        queryKey: ['professionals', filter],
        queryFn: () => filter === 'all' 
            ? base44.entities.Professional.list()
            : base44.entities.Professional.filter({ professional_type: filter })
    });

    const { data: myBookings = [] } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => base44.entities.ProfessionalBooking.list('-appointment_date')
    });

    const bookMutation = useMutation({
        mutationFn: async (data) => {
            const user = await base44.auth.me();
            
            // Create booking
            const booking = await base44.entities.ProfessionalBooking.create(data);

            // Automatically create video meeting and send invites
            try {
                await base44.functions.invoke('createVideoMeeting', {
                    booking_id: booking.id,
                    professional_email: showBooking.email,
                    user_email: user.email,
                    service_type: data.service_type,
                    appointment_date: data.appointment_date,
                    duration_minutes: data.duration_minutes
                });
            } catch (error) {
                logger.error('Error creating meeting:', error);
            }

            return booking;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            setShowBooking(null);
            toast.success('Appointment confirmed! Calendar invite and video link sent to both parties.');
        }
    });

    const handleBook = (professional) => {
        setShowBooking(professional);
        setBookingData({
            service_type: professional.specialties?.[0] || '',
            appointment_date: '',
            meeting_type: 'video',
            notes: ''
        });
    };

    const submitBooking = (e) => {
        e.preventDefault();
        bookMutation.mutate({
            professional_id: showBooking.id,
            professional_name: showBooking.full_name,
            ...bookingData,
            cost: showBooking.hourly_rate || 0
        });
    };

    const categories = [
        { value: 'all', label: 'All Professionals' },
        { value: 'cpa', label: 'CPAs' },
        { value: 'financial_advisor', label: 'Financial Advisors' },
        { value: 'estate_attorney', label: 'Estate Attorneys' },
        { value: 'tax_attorney', label: 'Tax Attorneys' },
        { value: 'insurance_agent', label: 'Insurance Agents' },
        { value: 'real_estate_agent', label: 'Real Estate Agents' }
    ];

    const estateAttorneys = professionals.filter(p => 
        p.professional_type === 'estate_attorney' || p.professional_type === 'tax_attorney'
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                        alt="North Star Logo" 
                        className="w-16 h-16 object-contain"
                    />
                    <div>
                        <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Professional Network
                        </h1>
                        <p className="text-[#0F1729]/60 font-light">Vetted estate attorneys, CPAs, and advisors</p>
                    </div>
                </div>

                {/* Featured: Estate Planning Professionals */}
                {estateAttorneys.length > 0 && (
                    <Card className="mb-8 border-[#4A90E2] bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-[#4A90E2]" />
                                Estate Planning Specialists
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-[#0F1729]/60 mb-4">
                                Connect with experienced estate attorneys to review your AI-generated trust and will documents
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {estateAttorneys.slice(0, 2).map(attorney => (
                                    <Card key={attorney.id} className="border-[#4A90E2]/20">
                                        <CardContent className="pt-4">
                                            <h3 className="font-medium text-black mb-1">{attorney.full_name}</h3>
                                            <p className="text-sm text-[#0F1729]/60 mb-2">{attorney.firm_name}</p>
                                            {attorney.specialties?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {attorney.specialties.map((spec, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {spec}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <Button
                                                onClick={() => handleBook(attorney)}
                                                size="sm"
                                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                            >
                                                Book Consultation
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filter */}
                <div className="mb-6">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-64">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* My Bookings */}
                {myBookings.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-4">My Appointments</h2>
                        <div className="grid gap-4">
                            {myBookings.slice(0, 3).map(booking => (
                                <Card key={booking.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-[#1A2B44]">{booking.professional_name}</div>
                                                <div className="text-sm text-[#1A2B44]/60">
                                                    {new Date(booking.appointment_date).toLocaleString()} • {booking.service_type}
                                                </div>
                                            </div>
                                            <Badge className={
                                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }>
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Professionals Grid */}
                <div className="mb-4">
                    <h2 className="text-2xl font-light text-black mb-2">All Professionals</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {professionals.map((pro) => (
                        <Card key={pro.id} className="hover:shadow-xl transition-shadow border-[#4A90E2]/20">
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[#1B4B7F] to-[#0F2847] rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-1">{pro.full_name}</CardTitle>
                                        {pro.verified && (
                                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                ✓ Verified
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-medium text-[#1A2B44] mb-1 capitalize">
                                            {pro.professional_type.replace('_', ' ')}
                                        </div>
                                        <div className="text-sm text-[#1A2B44]/60">{pro.firm_name}</div>
                                    </div>

                                    {pro.location && (
                                        <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                            <MapPin className="w-4 h-4" />
                                            {pro.location}
                                        </div>
                                    )}

                                    {pro.rating && (
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-medium">{pro.rating.toFixed(1)}</span>
                                            <span className="text-sm text-[#1A2B44]/60">
                                                ({pro.total_bookings} bookings)
                                            </span>
                                        </div>
                                    )}

                                    {pro.specialties?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {pro.specialties.slice(0, 3).map((spec, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {spec}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {pro.hourly_rate && (
                                        <div className="flex items-center gap-2 text-[#D4AF37] font-medium">
                                            <DollarSign className="w-4 h-4" />
                                            ${pro.hourly_rate}/hour
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => handleBook(pro)}
                                        className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Book Appointment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Booking Dialog */}
                <Dialog open={!!showBooking} onOpenChange={() => setShowBooking(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Book Appointment with {showBooking?.full_name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitBooking} className="space-y-4">
                            <div>
                                <Label>Service Type</Label>
                                <Select
                                    value={bookingData.service_type}
                                    onValueChange={(value) => setBookingData({ ...bookingData, service_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {showBooking?.specialties?.map(spec => (
                                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Preferred Date & Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={bookingData.appointment_date}
                                    onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Meeting Type</Label>
                                <Select
                                    value={bookingData.meeting_type}
                                    onValueChange={(value) => setBookingData({ ...bookingData, meeting_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">
                                            <div className="flex items-center gap-2">
                                                <Video className="w-4 h-4" />
                                                Video Call
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="phone">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Phone Call
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="in_person">In Person</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Notes / Questions</Label>
                                <Input
                                    value={bookingData.notes}
                                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                    placeholder="What would you like to discuss?"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowBooking(null)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={bookMutation.isPending} className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Request Booking
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}