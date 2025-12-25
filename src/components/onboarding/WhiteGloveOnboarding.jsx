import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Video, Calendar, CheckCircle, Phone, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhiteGloveOnboarding() {
    const [formData, setFormData] = useState({
        preferred_date: '',
        preferred_time: '',
        phone: '',
        specific_needs: '',
        topics: {
            documents: false,
            properties: false,
            financial: false,
            health: false,
            estate: false
        }
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await base44.auth.me();
            
            // Send notification to support team
            await base44.integrations.Core.SendEmail({
                to: 'support@northstar.com', // Replace with actual support email
                subject: `White-Glove Onboarding Request - ${user.full_name}`,
                from_name: 'North Star Platform',
                body: `New white-glove onboarding request:

Client: ${user.full_name}
Email: ${user.email}
Phone: ${formData.phone}

Preferred Date: ${formData.preferred_date}
Preferred Time: ${formData.preferred_time}

Topics of Interest:
${Object.entries(formData.topics).filter(([_, v]) => v).map(([k]) => `- ${k}`).join('\n')}

Specific Needs:
${formData.specific_needs}

Please schedule a video consultation.`
            });

            // Send confirmation to user
            await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: 'Your White-Glove Onboarding Request',
                from_name: 'North Star Concierge',
                body: `Dear ${user.full_name},

Thank you for requesting our white-glove onboarding service. We've received your request and a member of our concierge team will contact you within 24 hours to schedule your personalized video consultation.

Your requested time: ${formData.preferred_date} at ${formData.preferred_time}

We look forward to helping you get the most out of North Star.

Best regards,
The North Star Concierge Team`
            });

            setSubmitted(true);
            toast.success('Request submitted! We\'ll contact you within 24 hours.');
        } catch (error) {
            toast.error('Failed to submit request');
        }
    };

    if (submitted) {
        return (
            <Card className="max-w-2xl mx-auto border-[#4A90E2]/20">
                <CardContent className="pt-12 pb-12 text-center">
                    <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-600" />
                    <h2 className="text-3xl font-light text-black mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Request Received
                    </h2>
                    <p className="text-[#0F1729]/70 mb-6">
                        Our concierge team will contact you within 24 hours to schedule your personalized video consultation.
                    </p>
                    <p className="text-sm text-[#0F1729]/60">
                        Check your email for confirmation details.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto border-[#4A90E2]/20">
            <CardHeader className="text-center bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white rounded-t-lg">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <Video className="w-8 h-8" />
                    <CardTitle className="text-3xl font-light" style={{ fontFamily: 'Playfair Display, serif' }}>
                        White-Glove Onboarding
                    </CardTitle>
                </div>
                <p className="text-white/90">Personalized video setup with our concierge team</p>
            </CardHeader>
            <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-blue-900 mb-2">What to Expect:</h3>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>• 60-minute personalized video consultation</li>
                            <li>• Step-by-step platform walkthrough</li>
                            <li>• Help uploading your first documents</li>
                            <li>• Custom setup based on your needs</li>
                            <li>• Ongoing support and guidance</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Preferred Date</Label>
                            <Input
                                type="date"
                                value={formData.preferred_date}
                                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Preferred Time</Label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.preferred_time}
                                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                                required
                            >
                                <option value="">Select time...</option>
                                <option value="9:00 AM">9:00 AM</option>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="11:00 AM">11:00 AM</option>
                                <option value="1:00 PM">1:00 PM</option>
                                <option value="2:00 PM">2:00 PM</option>
                                <option value="3:00 PM">3:00 PM</option>
                                <option value="4:00 PM">4:00 PM</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label>Phone Number</Label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                            required
                        />
                    </div>

                    <div>
                        <Label>Topics You'd Like Help With</Label>
                        <div className="space-y-2 mt-2">
                            {Object.keys(formData.topics).map(topic => (
                                <div key={topic} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.topics[topic]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            topics: { ...formData.topics, [topic]: e.target.checked }
                                        })}
                                    />
                                    <Label className="capitalize">{topic.replace('_', ' ')}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Specific Needs or Questions</Label>
                        <Textarea
                            value={formData.specific_needs}
                            onChange={(e) => setFormData({ ...formData, specific_needs: e.target.value })}
                            placeholder="Tell us what you'd like to accomplish..."
                            rows="4"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-14 text-lg bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                    >
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule My Consultation
                    </Button>

                    <p className="text-xs text-center text-[#0F1729]/50">
                        Available for Premium and Family Office tier members
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}