import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plane, Hotel, MapPin, Calendar, DollarSign, Sparkles, ExternalLink, Clock, Utensils, Backpack, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TravelPlanner() {
    const [planForm, setPlanForm] = useState({
        destination: '',
        start_date: '',
        end_date: '',
        travelers: '2',
        budget: '',
        preferences: ''
    });
    const [loading, setLoading] = useState(false);
    const [travelPlan, setTravelPlan] = useState(null);

    const generatePlan = async () => {
        if (!planForm.destination || !planForm.start_date || !planForm.end_date) {
            toast.error('Please fill in destination and dates');
            return;
        }

        setLoading(true);
        try {
            const result = await base44.functions.invoke('planTravel', planForm);
            setTravelPlan(result.data);
            toast.success('Travel plan generated!');
        } catch (error) {
            toast.error('Failed to generate travel plan');
        } finally {
            setLoading(false);
        }
    };

    const saveTravelPlan = async () => {
        try {
            await base44.entities.TravelPlan.create({
                destination: travelPlan.destination,
                start_date: travelPlan.start_date,
                end_date: travelPlan.end_date,
                travelers: parseInt(planForm.travelers),
                status: 'planning',
                itinerary: travelPlan.travel_plan.itinerary,
                hotels: travelPlan.travel_plan.hotel_recommendations,
                flights: travelPlan.travel_plan.flight_recommendations,
                budget_breakdown: travelPlan.travel_plan.budget_breakdown,
                notes: planForm.preferences
            });
            toast.success('Travel plan saved!');
        } catch (error) {
            toast.error('Failed to save travel plan');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                        AI Travel Planner
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Destination</Label>
                            <Input
                                value={planForm.destination}
                                onChange={(e) => setPlanForm({...planForm, destination: e.target.value})}
                                placeholder="e.g., Paris, France"
                            />
                        </div>
                        <div>
                            <Label>Number of Travelers</Label>
                            <Input
                                type="number"
                                value={planForm.travelers}
                                onChange={(e) => setPlanForm({...planForm, travelers: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={planForm.start_date}
                                onChange={(e) => setPlanForm({...planForm, start_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={planForm.end_date}
                                onChange={(e) => setPlanForm({...planForm, end_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Budget per Person (Optional)</Label>
                            <Input
                                type="number"
                                value={planForm.budget}
                                onChange={(e) => setPlanForm({...planForm, budget: e.target.value})}
                                placeholder="2000"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Preferences (Optional)</Label>
                        <Textarea
                            value={planForm.preferences}
                            onChange={(e) => setPlanForm({...planForm, preferences: e.target.value})}
                            placeholder="e.g., Love museums, prefer boutique hotels, vegetarian dining..."
                            rows={3}
                        />
                    </div>
                    <Button onClick={generatePlan} disabled={loading} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                        <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Planning Your Trip...' : 'Generate AI Travel Plan'}
                    </Button>
                </CardContent>
            </Card>

            {travelPlan && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={saveTravelPlan}>Save Travel Plan</Button>
                    </div>

                    {/* Budget Overview */}
                    {travelPlan.travel_plan.budget_breakdown && (
                        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    Estimated Budget Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ${travelPlan.travel_plan.budget_breakdown.flights}
                                        </div>
                                        <div className="text-sm text-gray-600">Flights</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ${travelPlan.travel_plan.budget_breakdown.accommodation}
                                        </div>
                                        <div className="text-sm text-gray-600">Hotels</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ${travelPlan.travel_plan.budget_breakdown.food}
                                        </div>
                                        <div className="text-sm text-gray-600">Food</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ${travelPlan.travel_plan.budget_breakdown.activities}
                                        </div>
                                        <div className="text-sm text-gray-600">Activities</div>
                                    </div>
                                </div>
                                <div className="text-center pt-4 border-t">
                                    <div className="text-3xl font-bold text-[#1A2B44]">
                                        ${travelPlan.travel_plan.budget_breakdown.total}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Estimated Cost</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Tabs defaultValue="itinerary">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                            <TabsTrigger value="hotels">Hotels</TabsTrigger>
                            <TabsTrigger value="flights">Flights</TabsTrigger>
                            <TabsTrigger value="dining">Dining</TabsTrigger>
                            <TabsTrigger value="tips">Tips</TabsTrigger>
                        </TabsList>

                        {/* Itinerary */}
                        <TabsContent value="itinerary" className="space-y-4">
                            {travelPlan.travel_plan.itinerary?.map((day) => (
                                <Card key={day.day}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            Day {day.day} - {day.date}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {day.activities.map((activity, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div className="font-medium text-gray-900">{activity.activity}</div>
                                                            {activity.estimated_cost > 0 && (
                                                                <Badge variant="outline">${activity.estimated_cost}</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <MapPin className="w-3 h-3 inline mr-1" />
                                                            {activity.location}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {activity.time} • {activity.duration}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Hotels */}
                        <TabsContent value="hotels" className="space-y-4">
                            {travelPlan.travel_plan.hotel_recommendations?.map((hotel, idx) => (
                                <Card key={idx}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-lg text-gray-900">{hotel.name}</h3>
                                                <p className="text-sm text-gray-600">{hotel.area}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-medium text-[#D4AF37]">{hotel.price_range}</div>
                                                <div className="text-sm text-gray-600">{hotel.rating}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {hotel.highlights?.map((highlight, hIdx) => (
                                                <Badge key={hIdx} variant="outline" className="text-xs">
                                                    {highlight}
                                                </Badge>
                                            ))}
                                        </div>
                                        {hotel.booking_link && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={hotel.booking_link} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    View on Booking Site
                                                </a>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Flights */}
                        <TabsContent value="flights">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Plane className="w-5 h-5 text-blue-600" />
                                        Flight Recommendations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Estimated Cost</div>
                                            <div className="text-2xl font-bold text-[#1A2B44]">
                                                {travelPlan.travel_plan.flight_recommendations.estimated_cost}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Flight Duration</div>
                                            <div className="text-2xl font-bold text-[#1A2B44]">
                                                {travelPlan.travel_plan.flight_recommendations.duration}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">Recommended Booking Platforms:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {travelPlan.travel_plan.flight_recommendations.booking_platforms?.map((platform, idx) => (
                                                <Badge key={idx} className="bg-blue-100 text-blue-700">{platform}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <p className="text-sm text-blue-900">{travelPlan.travel_plan.flight_recommendations.tips}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Dining */}
                        <TabsContent value="dining" className="space-y-3">
                            {travelPlan.travel_plan.dining_recommendations?.map((restaurant, idx) => (
                                <Card key={idx}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <Utensils className="w-5 h-5 text-orange-600 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                                                    <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                                                    <p className="text-sm text-gray-500 mt-1">{restaurant.specialty}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">{restaurant.price_range}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Tips */}
                        <TabsContent value="tips" className="space-y-4">
                            {/* Packing List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Backpack className="w-5 h-5 text-purple-600" />
                                        Packing List
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="grid grid-cols-2 gap-2">
                                        {travelPlan.travel_plan.packing_list?.map((item, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">• {item}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Travel Tips */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        Travel Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {travelPlan.travel_plan.travel_tips?.map((tip, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">💡 {tip}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Warnings */}
                            {travelPlan.travel_plan.warnings?.length > 0 && (
                                <Card className="border-orange-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-orange-900">
                                            <AlertCircle className="w-5 h-5" />
                                            Important Warnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {travelPlan.travel_plan.warnings.map((warning, idx) => (
                                                <li key={idx} className="text-sm text-orange-800">⚠️ {warning}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}