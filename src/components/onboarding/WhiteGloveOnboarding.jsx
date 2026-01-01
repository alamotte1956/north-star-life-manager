import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
    Video, Phone, CheckCircle, PlayCircle, 
    ArrowRight, Users, FileText, Heart, DollarSign, Shield,
    Clock, MessageSquare, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhiteGloveOnboarding({ onComplete }) {
    const [step, setStep] = useState(1);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [formData, setFormData] = useState({
        preferences: {
            wants_video_call: false,
            preferred_time: '',
            phone_number: '',
            primary_goals: [],
            tech_comfort: 'beginner'
        },
        setup: {
            uploaded_first_document: false,
            added_property: false,
            connected_bank: false,
            set_beneficiaries: false
        }
    });

    const totalSteps = 5;
    const progress = (step / totalSteps) * 100;

    const tutorials = [
        {
            title: 'Welcome to North Star',
            duration: '3:00',
            description: 'A quick introduction to your life management platform',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            icon: Sparkles
        },
        {
            title: 'Your Secure Vault',
            duration: '4:30',
            description: 'How to upload and organize your important documents',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            icon: FileText
        },
        {
            title: 'Family Collaboration',
            duration: '5:00',
            description: 'Share documents and coordinate with loved ones',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            icon: Users
        }
    ];

    const [watchedVideos, setWatchedVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const scheduleCall = async () => {
        try {
            await base44.integrations.Core.SendEmail({
                to: 'onboarding@northstar.com',
                subject: 'White-Glove Onboarding Request',
                body: `New user requesting personalized onboarding assistance:
                
Phone: ${formData.preferences.phone_number}
Preferred Time: ${formData.preferences.preferred_time}
Tech Comfort Level: ${formData.preferences.tech_comfort}
Primary Goals: ${formData.preferences.primary_goals.join(', ')}

Please schedule a video call with this user.`
            });

            toast.success('Onboarding call scheduled! We\'ll contact you shortly.');
            setShowVideoCall(false);
        } catch (error) {
            toast.error('Failed to schedule call');
        }
    };

    const markVideoWatched = (index) => {
        if (!watchedVideos.includes(index)) {
            setWatchedVideos([...watchedVideos, index]);
        }
    };

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleComplete = async () => {
        try {
            await base44.auth.updateMe({
                onboarding_completed: true,
                onboarding_preferences: formData.preferences
            });
            toast.success('Setup complete! Welcome to North Star.');
            if (onComplete) onComplete();
        } catch (error) {
            toast.error('Failed to save preferences');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] flex items-center justify-center p-6">
            <Card className="max-w-4xl w-full border-[#4A90E2]/20">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                                alt="North Star Logo" 
                                className="w-12 h-12 object-contain"
                            />
                            <CardTitle className="text-2xl">Welcome to North Star</CardTitle>
                        </div>
                        <Badge className="bg-[#4A90E2] text-white">
                            Step {step} of {totalSteps}
                        </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Step 1: Welcome & Video Call Option */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Let's Get You Started
                                </h2>
                                <p className="text-lg text-[#0F1729]/60 max-w-2xl mx-auto">
                                    We're here to help you every step of the way. Choose how you'd like to begin:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card 
                                    className="border-2 border-[#4A90E2] bg-gradient-to-br from-[#4A90E2]/5 to-white cursor-pointer hover:shadow-lg transition-all"
                                    onClick={() => setShowVideoCall(true)}
                                >
                                    <CardContent className="pt-6 text-center space-y-3">
                                        <Video className="w-16 h-16 mx-auto text-[#4A90E2]" />
                                        <h3 className="text-xl font-medium text-black">
                                            Schedule a Personal Call
                                        </h3>
                                        <p className="text-[#0F1729]/60">
                                            Get one-on-one help from a real person via video call
                                        </p>
                                        <Badge className="bg-green-100 text-green-700">
                                            Recommended for New Users
                                        </Badge>
                                    </CardContent>
                                </Card>

                                <Card 
                                    className="border-2 border-[#0F1729]/20 cursor-pointer hover:shadow-lg transition-all"
                                    onClick={handleNext}
                                >
                                    <CardContent className="pt-6 text-center space-y-3">
                                        <PlayCircle className="w-16 h-16 mx-auto text-[#0F1729]/60" />
                                        <h3 className="text-xl font-medium text-black">
                                            Self-Guided Setup
                                        </h3>
                                        <p className="text-[#0F1729]/60">
                                            Watch short videos and set up at your own pace
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="text-center">
                                <Button
                                    variant="ghost"
                                    onClick={handleNext}
                                    className="text-[#0F1729]/60"
                                >
                                    Skip for now
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Tell Us About Yourself */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-light text-black text-center">
                                Tell Us About Your Goals
                            </h2>

                            <div>
                                <Label className="text-lg mb-3 block">What would you like help with? (Select all that apply)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { value: 'documents', label: 'Organizing Documents', icon: FileText },
                                        { value: 'estate', label: 'Estate Planning', icon: Shield },
                                        { value: 'finance', label: 'Financial Management', icon: DollarSign },
                                        { value: 'health', label: 'Health Records', icon: Heart },
                                        { value: 'family', label: 'Family Coordination', icon: Users }
                                    ].map((goal) => {
                                        const Icon = goal.icon;
                                        const isSelected = formData.preferences.primary_goals.includes(goal.value);
                                        return (
                                            <Card
                                                key={goal.value}
                                                className={`cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? 'border-2 border-[#4A90E2] bg-[#4A90E2]/5' 
                                                        : 'border border-gray-200 hover:border-[#4A90E2]/50'
                                                }`}
                                                onClick={() => {
                                                    const goals = isSelected
                                                        ? formData.preferences.primary_goals.filter(g => g !== goal.value)
                                                        : [...formData.preferences.primary_goals, goal.value];
                                                    setFormData({
                                                        ...formData,
                                                        preferences: { ...formData.preferences, primary_goals: goals }
                                                    });
                                                }}
                                            >
                                                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-[#4A90E2]' : 'text-[#0F1729]/60'}`} />
                                                    <span className="font-medium">{goal.label}</span>
                                                    {isSelected && <CheckCircle className="w-5 h-5 text-[#4A90E2] ml-auto" />}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <Label className="text-lg">How comfortable are you with technology?</Label>
                                <Select 
                                    value={formData.preferences.tech_comfort}
                                    onValueChange={(val) => setFormData({
                                        ...formData,
                                        preferences: { ...formData.preferences, tech_comfort: val }
                                    })}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner - I prefer step-by-step guidance</SelectItem>
                                        <SelectItem value="intermediate">Intermediate - I can figure things out</SelectItem>
                                        <SelectItem value="advanced">Advanced - I'm tech-savvy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleNext}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                size="lg"
                            >
                                Continue
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Watch Quick Tutorials */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-light text-black mb-2">
                                    Quick Video Tutorials
                                </h2>
                                <p className="text-[#0F1729]/60">
                                    Watch these short videos to get familiar with North Star (Optional)
                                </p>
                            </div>

                            <div className="space-y-4">
                                {tutorials.map((tutorial, index) => {
                                    const Icon = tutorial.icon;
                                    const isWatched = watchedVideos.includes(index);
                                    return (
                                        <Card 
                                            key={index}
                                            className={`cursor-pointer transition-all ${
                                                isWatched ? 'border-green-500 bg-green-50' : 'hover:shadow-md'
                                            }`}
                                            onClick={() => setSelectedVideo({ ...tutorial, index })}
                                        >
                                            <CardContent className="pt-4 pb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-lg ${isWatched ? 'bg-green-100' : 'bg-[#4A90E2]/10'}`}>
                                                        {isWatched ? (
                                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                                        ) : (
                                                            <Icon className="w-6 h-6 text-[#4A90E2]" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-black">{tutorial.title}</h3>
                                                        <p className="text-sm text-[#0F1729]/60">{tutorial.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="outline" className="mb-1">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {tutorial.duration}
                                                        </Badge>
                                                        <PlayCircle className="w-8 h-8 text-[#4A90E2] mx-auto" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleNext}
                                    className="flex-1"
                                    size="lg"
                                >
                                    Skip Videos
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={watchedVideos.length === 0}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    size="lg"
                                >
                                    Continue
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Core Setup Tasks */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-light text-black mb-2">
                                    Let's Set Up Your Essentials
                                </h2>
                                <p className="text-[#0F1729]/60">
                                    Complete these core tasks to get the most out of North Star
                                </p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { 
                                        key: 'uploaded_first_document',
                                        title: 'Upload Your First Document',
                                        description: 'Add an important document to your secure vault',
                                        link: '/Vault'
                                    },
                                    {
                                        key: 'added_property',
                                        title: 'Add a Property',
                                        description: 'Track your real estate assets',
                                        link: '/Properties'
                                    },
                                    {
                                        key: 'set_beneficiaries',
                                        title: 'Set Estate Beneficiaries',
                                        description: 'Designate who inherits your assets',
                                        link: '/Legal'
                                    }
                                ].map((task) => {
                                    const isDone = formData.setup[task.key];
                                    return (
                                        <Card 
                                            key={task.key}
                                            className={isDone ? 'border-green-500 bg-green-50' : 'border-[#4A90E2]/20'}
                                        >
                                            <CardContent className="pt-4 pb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {isDone ? (
                                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border-2 border-[#0F1729]/20" />
                                                    )}
                                                    <div>
                                                        <h3 className="font-medium text-black">{task.title}</h3>
                                                        <p className="text-sm text-[#0F1729]/60">{task.description}</p>
                                                    </div>
                                                </div>
                                                {!isDone && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            window.location.href = task.link;
                                                        }}
                                                    >
                                                        Set Up
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>💡 Tip:</strong> You can complete these tasks anytime. Click "Continue" when you're ready to finish setup.
                                </p>
                            </div>

                            <Button
                                onClick={handleNext}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                size="lg"
                            >
                                Continue
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Step 5: Complete */}
                    {step === 5 && (
                        <div className="text-center space-y-6 py-8">
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-light text-black mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    You're All Set!
                                </h2>
                                <p className="text-lg text-[#0F1729]/60">
                                    Welcome to North Star. Your life management platform is ready.
                                </p>
                            </div>

                            <Card className="border-[#4A90E2]/20 text-left">
                                <CardContent className="pt-6 space-y-3">
                                    <h3 className="font-medium text-black mb-3">Need Help Anytime?</h3>
                                    <div className="space-y-2 text-sm text-[#0F1729]/60">
                                        <div className="flex items-center gap-2">
                                            <Video className="w-4 h-4 text-[#4A90E2]" />
                                            <span>Access video tutorials from the help menu</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-[#4A90E2]" />
                                            <span>Use the AI chat assistant (bottom right corner)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-[#4A90E2]" />
                                            <span>Premium members: Schedule video calls anytime</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                onClick={handleComplete}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                size="lg"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Video Call Scheduling Dialog */}
            <Dialog open={showVideoCall} onOpenChange={setShowVideoCall}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-[#4A90E2]" />
                            Schedule Your Personal Onboarding Call
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-900">
                                <strong>✓ Included with your plan</strong><br />
                                Get personalized help from a real person at no extra cost.
                            </p>
                        </div>

                        <div>
                            <Label>Your Phone Number *</Label>
                            <Input
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={formData.preferences.phone_number}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    preferences: { ...formData.preferences, phone_number: e.target.value }
                                })}
                            />
                        </div>

                        <div>
                            <Label>Preferred Time</Label>
                            <Select
                                value={formData.preferences.preferred_time}
                                onValueChange={(val) => setFormData({
                                    ...formData,
                                    preferences: { ...formData.preferences, preferred_time: val }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a time..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                                    <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                                    <SelectItem value="evening">Evening (5 PM - 7 PM)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowVideoCall(false)}
                                className="flex-1"
                            >
                                Maybe Later
                            </Button>
                            <Button
                                onClick={scheduleCall}
                                disabled={!formData.preferences.phone_number}
                                className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                Schedule Call
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Video Player Dialog */}
            <Dialog open={!!selectedVideo} onOpenChange={() => {
                if (selectedVideo) {
                    markVideoWatched(selectedVideo.index);
                }
                setSelectedVideo(null);
            }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedVideo?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video">
                        <iframe
                            width="100%"
                            height="100%"
                            src={selectedVideo?.videoUrl}
                            title={selectedVideo?.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-lg"
                        />
                    </div>
                    <p className="text-[#0F1729]/60">{selectedVideo?.description}</p>
                </DialogContent>
            </Dialog>
        </div>
    );
}