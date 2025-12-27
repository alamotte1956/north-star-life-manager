import React from 'react';
import { Video } from 'lucide-react';

export default function VideoTutorialsPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="text-center">
                <Video className="w-24 h-24 mx-auto mb-6 text-[#4A90E2]" />
                <h1 className="text-4xl font-light text-black mb-4">Video Tutorials</h1>
                <p className="text-xl text-[#0F1729]/70">Coming Soon</p>
            </div>
        </div>
    );
}