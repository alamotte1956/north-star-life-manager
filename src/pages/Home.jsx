import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Home() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            setLoading(true);
            try {
                const user = await base44.auth.me();
                if (user && user.username) {
                    navigate(createPageUrl('Dashboard'));
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error checking user:', error);
                setLoading(false);
            }
        };
        checkUser();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setSaving(true);
        try {
            await base44.auth.updateMe({ username: username.trim() });
            navigate(createPageUrl('Dashboard'));
        } catch (error) {
            console.error('Failed to save username:', error);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <div 
                    className="absolute inset-0"
                    style={{
                        backgroundColor: '#1E3A5F',
                        backgroundImage: `
                            radial-gradient(ellipse at 20% 30%, rgba(74, 144, 226, 0.3) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 70%, rgba(46, 92, 138, 0.3) 0%, transparent 50%),
                            repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                            repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)
                        `,
                        backgroundBlendMode: 'overlay',
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
                    }}
                />
                <Loader2 className="w-8 h-8 animate-spin text-white relative z-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <div 
                className="absolute inset-0"
                style={{
                    backgroundColor: '#1E3A5F',
                    backgroundImage: `
                        radial-gradient(ellipse at 20% 30%, rgba(74, 144, 226, 0.3) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(46, 92, 138, 0.3) 0%, transparent 50%),
                        repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
                        repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)
                    `,
                    backgroundBlendMode: 'overlay',
                    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
                }}
            />
            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-12">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                        alt="North Star Logo" 
                        className="w-32 h-32 mx-auto mb-8 object-contain drop-shadow-2xl"
                    />
                    <h1 className="text-5xl font-light text-white mb-4 drop-shadow-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Welcome to North Star
                    </h1>
                    <p className="text-lg text-white/90 font-light drop-shadow-md">
                        Your comprehensive life management platform
                    </p>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8">
                    <h2 className="text-2xl font-light text-black mb-2 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Choose Your Username
                    </h2>
                    <p className="text-sm text-[#0F1729]/60 mb-6 text-center">
                        This will be how you're identified in the system
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Input
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="h-14 text-lg text-center"
                                required
                                minLength={3}
                                maxLength={30}
                                autoFocus
                            />
                            <p className="text-xs text-[#0F1729]/50 mt-2 text-center">
                                3-30 characters, letters and numbers only
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={saving || !username.trim()}
                            className="w-full h-14 text-lg bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white hover:shadow-lg transition-all"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                'Continue to Dashboard'
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-sm text-white/70 mt-8 drop-shadow-md">
                    Your secure, all-in-one life management hub
                </p>
            </div>
        </div>
    );
}