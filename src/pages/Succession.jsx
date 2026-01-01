import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Plus } from 'lucide-react';
import { listMine } from '@/components/utils/safeQuery';
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
        queryFn: () => listMine(base44.entities.EmergencyInfo, { order: '-priority', limit: 100 }),
        enabled: hasAccess
    });

    if (!user || !user.keycard_code) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="bg-white backdrop-blur-xl border border-[#4A90E2]/20 rounded-2xl p-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#4A90E2]/10 rounded-full mb-6">
                            <Shield className="w-12 h-12 text-[#4A90E2]" />
                        </div>
                        <h2 className="text-2xl font-light text-black mb-3">
                            Setup Required
                        </h2>
                        <p className="text-[#0F1729]/70 font-light mb-8 leading-relaxed">
                            Set up your secure keycard code to access critical emergency information and succession details.
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
                            className="min-h-[50px] px-8 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:shadow-lg hover:shadow-[#C5A059]/30 text-[#0F172A] font-medium rounded-xl"
                        >
                            <Shield className="w-5 h-5 mr-2" />
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
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl shadow-lg">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">
                                Succession Dashboard
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                <p className="text-[#0F1729]/70 font-light">
                                    Succession Ready • Emergency Access Active
                                </p>
                            </div>
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
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#4A90E2]/10 rounded-full mb-4">
                            <Shield className="w-10 h-10 text-[#4A90E2]/40" />
                        </div>
                        <p className="text-[#0F1729]/40 font-light mb-6">
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
                            className="min-h-[50px] px-8 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:shadow-lg hover:shadow-[#C5A059]/30 text-[#0F172A] font-medium rounded-xl"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Emergency Info
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}