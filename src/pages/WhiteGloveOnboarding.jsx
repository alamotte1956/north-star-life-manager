import React from 'react';
import WhiteGloveOnboardingComponent from '../components/onboarding/WhiteGloveOnboarding';

export default function WhiteGloveOnboarding() {
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
                        <h1 className="text-4xl font-light text-black mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            White-Glove Onboarding
                        </h1>
                        <p className="text-[#0F1729]/60 font-light">Personalized video setup assistance</p>
                    </div>
                </div>

                <WhiteGloveOnboardingComponent />
            </div>
        </div>
    );
}