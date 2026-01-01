import React, { useState } from 'react';
import logger from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MapPin, Calendar, DollarSign, CheckCircle, Plane } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TripPlannerWizard({ open, onOpenChange, onComplete }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [aiPlan, setAiPlan] = useState(null);
    const [formData, setFormData] = useState({
        destination: '',
        start_date: '',
        end_date: '',
        travelers: 1,
        budget: '',
        interests: '',
        accommodation: '',
        notes: ''
    });

    const handleGeneratePlan = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('generateTripPlan', {
                destination: formData.destination,
                start_date: formData.start_date,
                end_date: formData.end_date,
                travelers: formData.travelers,
                budget: formData.budget,
                interests: formData.interests
            });
            setAiPlan(response.data);
            setStep(2);
        } catch (error) {
            toast.error('Failed to generate trip plan');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        setLoading(true);
        try {
            const trip = await base44.entities.TravelPlan.create({
                destination: formData.destination,
                start_date: formData.start_date,
                end_date: formData.end_date,
                travelers: formData.travelers,
                accommodation: formData.accommodation,
                estimated_cost: parseFloat(formData.budget) || 0,
                notes: formData.notes,
                itinerary: aiPlan?.itinerary || [],
                packing_list: aiPlan?.packing_list || [],
                budget_breakdown: aiPlan?.budget_breakdown || {}
            });

            // Create calendar event
            try {
                await base44.entities.CalendarEvent.create({
                    title: `Trip to ${formData.destination}`,
                    date: formData.start_date,
                    end_date: formData.end_date,
                    category: 'travel',
                    description: `Travel to ${formData.destination} - ${aiPlan?.summary || ''}`,
                    all_day: true
                });
            } catch (e) {
                logger.error('Calendar event creation failed:', e);
            }

            toast.success('Trip plan saved!');
            onComplete(trip);
            onOpenChange(false);
            setStep(1);
            setAiPlan(null);
            setFormData({
                destination: '',
                start_date: '',
                end_date: '',
                travelers: 1,
                budget: '',
                interests: '',
                accommodation: '',
                notes: ''
            });
        } catch (error) {
            toast.error('Failed to save trip plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                        AI Trip Planner
                    </DialogTitle>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Destination *</Label>
                                <Input
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    placeholder="Paris, France"
                                />
                            </div>
                            <div>
                                <Label>Number of Travelers</Label>
                                <Input
                                    type="number"
                                    value={formData.travelers}
                                    onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) })}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>End Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Budget (USD)</Label>
                            <Input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                placeholder="3000"
                            />
                        </div>

                        <div>
                            <Label>Interests & Preferences</Label>
                            <Textarea
                                value={formData.interests}
                                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                placeholder="Museums, food tours, hiking, nightlife..."
                                rows={3}
                            />
                        </div>

                        <Button
                            onClick={handleGeneratePlan}
                            disabled={!formData.destination || !formData.start_date || !formData.end_date || loading}
                            className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            {loading ? 'Generating Plan...' : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Trip Plan
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {step === 2 && aiPlan && (
                    <div className="space-y-4">
                        <Card className="p-4 border-[#4A90E2]/20 bg-blue-50">
                            <h3 className="font-medium mb-2">{aiPlan.summary}</h3>
                            <p className="text-sm text-gray-700">{aiPlan.description}</p>
                        </Card>

                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#4A90E2]" />
                                Daily Itinerary
                            </h3>
                            <div className="space-y-2">
                                {aiPlan.itinerary?.map((day, idx) => (
                                    <Card key={idx} className="p-3">
                                        <div className="font-medium text-sm mb-1">Day {day.day}</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {day.activities?.map((activity, i) => (
                                                <li key={i}>• {activity}</li>
                                            ))}
                                        </ul>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#4A90E2]" />
                                Packing List
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {aiPlan.packing_list?.map((item, idx) => (
                                    <Badge key={idx} variant="outline">{item}</Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-[#4A90E2]" />
                                Budget Breakdown
                            </h3>
                            <Card className="p-4">
                                <div className="space-y-2 text-sm">
                                    {Object.entries(aiPlan.budget_breakdown || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-medium">${value}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <div>
                            <Label>Accommodation Details</Label>
                            <Input
                                value={formData.accommodation}
                                onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
                                placeholder="Hotel name or address..."
                            />
                        </div>

                        <div>
                            <Label>Additional Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any notes..."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleSavePlan}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {loading ? 'Saving...' : 'Save Trip Plan'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
