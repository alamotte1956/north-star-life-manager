import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plane, Plus, Calendar, MapPin, Sparkles } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, isPast, isFuture } from 'date-fns';
import TripPlannerWizard from '@/components/travel/TripPlannerWizard';

export default function Travel() {
    const [open, setOpen] = useState(false);
    const [showPlanner, setShowPlanner] = useState(false);
    const [formData, setFormData] = useState({
        trip_name: '',
        destination: '',
        start_date: '',
        end_date: '',
        status: 'planned',
        accommodation: '',
        accommodation_confirmation: '',
        flight_details: '',
        flight_confirmation: '',
        total_cost: '',
        travel_documents: '',
        activities: '',
        notes: ''
    });

    const { data: trips = [], refetch } = useQuery({
        queryKey: ['trips'],
        queryFn: () => base44.entities.TravelPlan.list('-start_date')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.TravelPlan.create(formData);
        setOpen(false);
        setFormData({
            trip_name: '',
            destination: '',
            start_date: '',
            end_date: '',
            status: 'planned',
            accommodation: '',
            accommodation_confirmation: '',
            flight_details: '',
            flight_confirmation: '',
            total_cost: '',
            travel_documents: '',
            activities: '',
            notes: ''
        });
        refetch();
    };

    const statusColors = {
        planned: 'bg-blue-100 text-blue-700 border-blue-200',
        booked: 'bg-green-100 text-green-700 border-green-200',
        in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
        completed: 'bg-gray-100 text-gray-700 border-gray-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200'
    };

    const upcomingTrips = trips.filter(t => isFuture(new Date(t.start_date)));
    const pastTrips = trips.filter(t => isPast(new Date(t.end_date || t.start_date)));

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-3 sm:p-4 rounded-2xl">
                                <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-light text-black">Travel</h1>
                            <p className="text-sm sm:text-base text-[#0F1729]/60 font-light">Your itineraries & trips</p>
                        </div>
                    </div>

                    <div className="flex gap-2 print:hidden w-full sm:w-auto">
                        <PrintButton className="flex-1 sm:flex-none" />
                        <Button 
                            onClick={() => setShowPlanner(true)}
                            className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] hover:shadow-lg text-white flex-1 sm:flex-none h-11 sm:h-10 touch-manipulation active:scale-98 transition-transform"
                        >
                            <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                            AI Planner
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-[#4A90E2] text-[#4A90E2] flex-1 sm:flex-none h-11 sm:h-10 touch-manipulation active:scale-98 transition-transform">
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                                Quick Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                            <DialogHeader>
                                <DialogTitle>Add New Trip</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Trip Name</Label>
                                        <Input
                                            value={formData.trip_name}
                                            onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
                                            placeholder="e.g., Paris Getaway"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Destination</Label>
                                        <Input
                                            value={formData.destination}
                                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="planned">Planned</SelectItem>
                                            <SelectItem value="booked">Booked</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Accommodation</Label>
                                        <Input
                                            value={formData.accommodation}
                                            onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
                                            placeholder="Hotel name"
                                        />
                                    </div>
                                    <div>
                                        <Label>Confirmation #</Label>
                                        <Input
                                            value={formData.accommodation_confirmation}
                                            onChange={(e) => setFormData({ ...formData, accommodation_confirmation: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Flight Details</Label>
                                    <Textarea
                                        value={formData.flight_details}
                                        onChange={(e) => setFormData({ ...formData, flight_details: e.target.value })}
                                        rows={2}
                                        placeholder="Flight numbers, times, etc."
                                    />
                                </div>

                                <div>
                                    <Label>Total Cost</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.total_cost}
                                        onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                                        placeholder="$"
                                    />
                                </div>

                                <div>
                                    <Label>Activities & Plans</Label>
                                    <Textarea
                                        value={formData.activities}
                                        onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white h-12 touch-manipulation">
                                    Add Trip
                                </Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <TripPlannerWizard 
                    open={showPlanner} 
                    onOpenChange={setShowPlanner}
                    onComplete={() => refetch()}
                />

                {/* Upcoming Trips */}
                {upcomingTrips.length > 0 && (
                    <div className="mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl font-light text-black mb-4 sm:mb-6">Upcoming Trips</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {upcomingTrips.map(trip => (
                                <Card key={trip.id} className="shadow-lg hover:shadow-xl transition-all">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#4A90E2]/10 p-3 rounded-lg">
                                                    <Plane className="w-6 h-6 text-[#4A90E2]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-light text-black">
                                                        {trip.trip_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-[#0F1729]/60">
                                                        <MapPin className="w-3 h-3" />
                                                        {trip.destination}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={`${statusColors[trip.status]} border`}>
                                                {trip.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-[#0F1729]/70">
                                                <Calendar className="w-4 h-4 text-[#4A90E2]" />
                                                {format(new Date(trip.start_date), 'MMM d')}
                                                {trip.end_date && ` - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
                                            </div>

                                            {trip.accommodation && (
                                                <div className="text-sm text-[#0F1729]/70">
                                                    🏨 {trip.accommodation}
                                                </div>
                                            )}

                                            {trip.total_cost && (
                                                <div className="text-sm text-[#4A90E2] font-light">
                                                    ${parseFloat(trip.total_cost).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Trips */}
                {pastTrips.length > 0 && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-light text-black mb-4 sm:mb-6">Past Trips</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                            {pastTrips.map(trip => (
                                <Card key={trip.id} className="shadow-md hover:shadow-lg transition-all opacity-75">
                                    <CardContent className="pt-6">
                                        <h3 className="text-lg font-light text-black mb-1">
                                            {trip.trip_name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-[#0F1729]/60 mb-2">
                                            <MapPin className="w-3 h-3" />
                                            {trip.destination}
                                        </div>
                                        <div className="text-xs text-[#0F1729]/50">
                                            {format(new Date(trip.start_date), 'MMM yyyy')}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {trips.length === 0 && (
                    <div className="text-center py-16">
                        <Plane className="w-16 h-16 text-[#0F1729]/20 mx-auto mb-4" />
                        <p className="text-[#0F1729]/40 font-light">No trips planned yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}