import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, BookOpen, FileText, Home, DollarSign, Heart, Shield } from 'lucide-react';

const tutorials = [
    {
        id: 'getting-started',
        title: 'Getting Started with North Star',
        description: 'Complete walkthrough of platform features',
        duration: '5:30',
        icon: BookOpen,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Replace with actual tutorial
    },
    {
        id: 'document-vault',
        title: 'Using the Document Vault',
        description: 'Upload, organize, and share documents',
        duration: '3:45',
        icon: FileText,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: 'property-management',
        title: 'Property Management Basics',
        description: 'Rent collection and maintenance tracking',
        duration: '4:20',
        icon: Home,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: 'financial-tracking',
        title: 'Financial Dashboard Overview',
        description: 'Budget, investments, and goals',
        duration: '6:15',
        icon: DollarSign,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: 'health-records',
        title: 'Medical Profile Setup',
        description: 'Health records and emergency information',
        duration: '3:00',
        icon: Heart,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        id: 'estate-planning',
        title: 'Estate Planning & Succession',
        description: 'Beneficiaries, directives, and emergency access',
        duration: '7:00',
        icon: Shield,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
];

export default function VideoTutorials({ open, onOpenChange }) {
    const [selectedVideo, setSelectedVideo] = useState(null);

    return (
        <>
            <Dialog open={open && !selectedVideo} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Play className="w-6 h-6 text-[#4A90E2]" />
                            Video Tutorials
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tutorials.map((tutorial) => {
                            const Icon = tutorial.icon;
                            return (
                                <Card 
                                    key={tutorial.id}
                                    className="cursor-pointer hover:shadow-lg transition-all border-[#4A90E2]/20"
                                    onClick={() => setSelectedVideo(tutorial)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] rounded-lg">
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-black mb-1">{tutorial.title}</h3>
                                                <p className="text-sm text-[#0F1729]/60 mb-2">{tutorial.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <Play className="w-3 h-3 text-[#4A90E2]" />
                                                    <span className="text-xs text-[#4A90E2]">{tutorial.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Video Player Dialog */}
            <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
                <DialogContent className="max-w-5xl">
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
                    <p className="text-sm text-[#0F1729]/60">{selectedVideo?.description}</p>
                </DialogContent>
            </Dialog>
        </>
    );
}