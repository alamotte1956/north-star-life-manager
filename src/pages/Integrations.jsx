import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plug, Calendar, Mail, Cloud, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Integrations() {
    const integrations = [
        {
            id: 'googlecalendar',
            name: 'Google Calendar',
            icon: Calendar,
            description: 'Sync events and create automation triggers from calendar',
            scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar']
        },
        {
            id: 'googledrive',
            name: 'Google Drive',
            icon: Cloud,
            description: 'Store and manage documents in your Google Drive',
            scopes: ['https://www.googleapis.com/auth/drive.file']
        },
        {
            id: 'slack',
            name: 'Slack',
            icon: MessageCircle,
            description: 'Get real-time notifications and collaboration updates',
            scopes: ['chat:write', 'channels:read', 'users:read']
        }
    ];

    const handleConnect = async (integration) => {
        try {
            // This will be handled by the request_oauth_authorization tool
            window.location.href = `/auth/connect/${integration.id}`;
        } catch (error) {
            console.error('Connection error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                            <Plug className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-black">Integrations</h1>
                        <p className="text-black/70 font-light">Connect external services</p>
                    </div>
                </div>

                {/* Integration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {integrations.map(integration => {
                        const Icon = integration.icon;
                        return (
                            <Card key={integration.id} className="hover:shadow-xl transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                                            <Icon className="w-6 h-6 text-[#D4AF37]" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-lg mb-1">{integration.name}</h3>
                                            <p className="text-sm text-black/60">{integration.description}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleConnect(integration)}
                                        className="w-full bg-gradient-to-r from-black to-[#1a1a1a]"
                                    >
                                        Connect
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Features Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                                Google Calendar Features
                            </h3>
                            <ul className="space-y-2 text-sm text-black/70">
                                <li>• Auto-create maintenance tasks from calendar events</li>
                                <li>• Sync important dates and reminders</li>
                                <li>• Two-way calendar integration</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Cloud className="w-5 h-5 text-[#D4AF37]" />
                                Google Drive Features
                            </h3>
                            <ul className="space-y-2 text-sm text-black/70">
                                <li>• Automatically backup all documents</li>
                                <li>• Access files from anywhere</li>
                                <li>• Seamless file sharing with team</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-[#D4AF37]" />
                                Email Automation
                            </h3>
                            <ul className="space-y-2 text-sm text-black/70">
                                <li>• Parse invoices and receipts automatically</li>
                                <li>• Create subscriptions from billing emails</li>
                                <li>• Send reminder notifications</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                                Slack Notifications
                            </h3>
                            <ul className="space-y-2 text-sm text-black/70">
                                <li>• Real-time collaboration updates</li>
                                <li>• Task assignment notifications</li>
                                <li>• Shared item alerts</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}