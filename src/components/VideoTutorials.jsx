import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Clock, BookOpen } from 'lucide-react';

export default function VideoTutorials() {
    const [selectedVideo, setSelectedVideo] = useState(null);

    const tutorials = [
        {
            id: 1,
            title: 'Getting Started with North Star',
            duration: '5:30',
            category: 'Basics',
            description: 'Learn the fundamentals of navigating North Star',
            thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 2,
            title: 'Organizing Your Vault',
            duration: '8:15',
            category: 'Documents',
            description: 'Best practices for document organization and tagging',
            thumbnail: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 3,
            title: 'Setting Up Financial Tracking',
            duration: '12:00',
            category: 'Finance',
            description: 'Connect bank accounts and track investments',
            thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 4,
            title: 'Estate Planning Wizard',
            duration: '10:45',
            category: 'Legal',
            description: 'Step-by-step guide to estate planning',
            thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 5,
            title: 'Health Records Management',
            duration: '7:20',
            category: 'Health',
            description: 'Organizing medical records and prescriptions',
            thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 6,
            title: 'Family Collaboration Features',
            duration: '9:30',
            category: 'Collaboration',
            description: 'Share documents and coordinate with family',
            thumbnail: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
    ];

    const categories = [...new Set(tutorials.map(t => t.category))];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-8">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                        alt="North Star Logo" 
                        className="w-16 h-16 object-contain"
                    />
                    <div>
                        <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Video Tutorials
                        </h1>
                        <p className="text-[#0F1729]/60 font-light">Learn at your own pace with guided walkthroughs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tutorials.map((tutorial) => (
                        <Card 
                            key={tutorial.id} 
                            className="border-[#4A90E2]/20 cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedVideo(tutorial)}
                        >
                            <div className="relative">
                                <img
                                    src={tutorial.thumbnail}
                                    alt={tutorial.title}
                                    className="w-full h-48 object-cover rounded-t-lg"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors rounded-t-lg">
                                    <PlayCircle className="w-16 h-16 text-white" />
                                </div>
                                <Badge className="absolute top-3 right-3 bg-black/70 text-white">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {tutorial.duration}
                                </Badge>
                            </div>
                            <CardContent className="pt-4">
                                <Badge className="bg-[#4A90E2]/10 text-[#4A90E2] mb-2">
                                    {tutorial.category}
                                </Badge>
                                <h3 className="font-medium text-black mb-2">{tutorial.title}</h3>
                                <p className="text-sm text-[#0F1729]/60">{tutorial.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="mt-8 border-[#4A90E2]/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <BookOpen className="w-12 h-12 text-[#4A90E2]" />
                            <div>
                                <h3 className="font-medium text-black mb-1">Need personalized help?</h3>
                                <p className="text-sm text-[#0F1729]/60 mb-2">
                                    Premium and Family Office members get access to live video onboarding sessions
                                </p>
                                <Button variant="outline" size="sm">
                                    Schedule a Session
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
                    <DialogContent className="max-w-4xl">
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
        </div>
    );
}