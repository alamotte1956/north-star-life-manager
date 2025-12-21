import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KeycardAccess from '../components/succession/KeycardAccess';
import EmergencyCard from '../components/succession/EmergencyCard';

export default function Succession() {
    const [hasAccess, setHasAccess] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        base44.auth.me().then(setUser);
    }, []);

    const { data: emergencyInfos = [] } = useQuery({
        queryKey: ['emergencyInfo'],
        queryFn: () => base44.entities.EmergencyInfo.list('-priority', 100),
        enabled: hasAccess
    });

    if (!user || !user.keycard_code) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0F1B2E] via-[#1A2B44] to-[#0F1B2E] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                        <Shield className="w-16 h-16 text-[#C9A95C] mx-auto mb-6" />
                        <h2 className="text-2xl font-light text-white mb-4">
                            Setup Required
                        </h2>
                        <p className="text-white/60 font-light mb-6">
                            You need to set up a keycard code to access the succession dashboard. Please update your profile settings.
                        </p>
                        <Button
                            onClick={() => {
                                const code = prompt('Enter a new keycard code (minimum 6 characters):');
                                if (code && code.length >= 6) {
                                    base44.auth.updateMe({ keycard_code: code }).then(() => {
                                        window.location.reload();
                                    });
                                }
                            }}
                            className="bg-gradient-to-r from-[#C9A95C] to-[#D4AF37] hover:shadow-lg hover:shadow-[#C9A95C]/30 text-white font-light"
                        >
                            Set Keycard Code
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <KeycardAccess 
                onAccessGranted={() => setHasAccess(true)}
                userKeycardCode={user.keycard_code}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0F1B2E] via-[#1A2B44] to-[#0F1B2E]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#C9A95C] to-[#D4AF37] p-4 rounded-2xl">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-white mb-1">
                                Succession Dashboard
                            </h1>
                            <p className="text-white/60 font-light">
                                Emergency codes and critical information
                            </p>
                        </div>
                    </div>
                </div>

                {/* Emergency Info Grid */}
                {emergencyInfos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {emergencyInfos.map(info => (
                            <EmergencyCard key={info.id} info={info} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-4">
                            <Shield className="w-10 h-10 text-white/20" />
                        </div>
                        <p className="text-white/40 font-light mb-6">
                            No emergency information stored yet
                        </p>
                        <Button
                            onClick={() => {
                                const title = prompt('Title:');
                                const content = prompt('Content:');
                                if (title && content) {
                                    base44.entities.EmergencyInfo.create({
                                        title,
                                        content,
                                        category: 'other',
                                        priority: 'medium'
                                    }).then(() => window.location.reload());
                                }
                            }}
                            className="bg-gradient-to-r from-[#C9A95C] to-[#D4AF37] hover:shadow-lg hover:shadow-[#C9A95C]/30 text-white font-light"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Emergency Info
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}