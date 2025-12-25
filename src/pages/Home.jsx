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
            try {
                const user = await base44.auth.me();
                if (user?.username) {
                    const defaultPage = user.default_page || 'Dashboard';
                    navigate(createPageUrl(defaultPage));
                } else {
                    setLoading(false);
                }
            } catch (error) {
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
            await base44.auth.updateMe({ username: username.trim(), default_page: 'Dashboard' });
            navigate(createPageUrl('Dashboard'));
        } catch (error) {
            console.error('Failed to save username:', error);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#4A90E2]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/2bced8a31_Gemini_Generated_Image_gyjjqjgyjjqjgyjj.jpg" 
                        alt="North Star Logo" 
                        className="w-32 h-32 mx-auto mb-8 object-contain"
                    />
                    <h1 className="text-5xl font-light text-black mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Welcome to North Star
                    </h1>
                    <p className="text-lg text-[#0F1729]/60 font-light">
                        Your comprehensive life management platform
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-[#4A90E2]/20 p-8">
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

                <p className="text-center text-sm text-[#0F1729]/40 mt-8">
                    Your secure, all-in-one life management hub
                </p>
            </div>
        </div>
    );
}