import React, { useState } from
import logger from '@/utils/logger'; 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plug, Calendar, Mail, Cloud, MessageCircle, CheckCircle, XCircle, DollarSign, FileText, Phone, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Integrations() {
    const [syncing, setSyncing] = useState({});
    const [testOpen, setTestOpen] = useState(null);

    const integrations = [
        {
            id: 'googlecalendar',
            name: 'Google Calendar',
            icon: Calendar,
            description: 'Sync events and create automation triggers from calendar',
            scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar'],
            category: 'productivity',
            needsOAuth: true
        },
        {
            id: 'googledrive',
            name: 'Google Drive',
            icon: Cloud,
            description: 'Store and manage documents in your Google Drive',
            scopes: ['https://www.googleapis.com/auth/drive.file'],
            category: 'storage',
            needsOAuth: true
        },
        {
            id: 'slack',
            name: 'Slack',
            icon: MessageCircle,
            description: 'Get real-time notifications and collaboration updates',
            scopes: ['chat:write', 'channels:read', 'users:read'],
            category: 'communication',
            needsOAuth: true
        },
        {
            id: 'quickbooks',
            name: 'QuickBooks',
            icon: DollarSign,
            description: 'Sync transactions and financial data automatically',
            category: 'accounting',
            needsOAuth: false,
            requiresSecrets: ['QUICKBOOKS_ACCESS_TOKEN']
        },
        {
            id: 'xero',
            name: 'Xero',
            icon: FileText,
            description: 'Connect your Xero accounting for seamless financial tracking',
            category: 'accounting',
            needsOAuth: false,
            requiresSecrets: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET']
        },
        {
            id: 'dropbox',
            name: 'Dropbox',
            icon: Cloud,
            description: 'Automatically backup all documents to Dropbox',
            category: 'storage',
            needsOAuth: false,
            requiresSecrets: ['DROPBOX_ACCESS_TOKEN']
        },
        {
            id: 'twilio',
            name: 'Twilio SMS',
            icon: Phone,
            description: 'Send SMS notifications for important updates and reminders',
            category: 'communication',
            needsOAuth: false,
            requiresSecrets: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
        }
    ];

    const handleConnect = async (integration) => {
        if (integration.needsOAuth) {
            try {
                // OAuth-based integrations
                window.location.href = `/auth/connect/${integration.id}`;
            } catch (error) {
                logger.error('Connection error:', error);
                toast.error('Failed to connect');
            }
        } else {
            // Secret-based integrations
            toast.info('Please configure secrets in Settings → Environment Variables');
        }
    };

    const handleSync = async (integrationId) => {
        setSyncing(prev => ({ ...prev, [integrationId]: true }));
        try {
            let result;
            switch(integrationId) {
                case 'quickbooks':
                    result = await base44.functions.invoke('syncQuickBooks', { action: 'sync_transactions' });
                    break;
                case 'dropbox':
                    result = await base44.functions.invoke('syncDropbox', { action: 'backup_all' });
                    break;
                default:
                    throw new Error('Integration not supported');
            }
            toast.success(result.data.message);
        } catch (error) {
            toast.error(error.message || 'Sync failed');
        } finally {
            setSyncing(prev => ({ ...prev, [integrationId]: false }));
        }
    };

    const handleTestSMS = async (phoneNumber, message) => {
        try {
            const result = await base44.functions.invoke('sendTwilioSMS', {
                to: phoneNumber,
                message: message || 'Test message from North Star',
                message_type: 'test'
            });
            toast.success('SMS sent successfully!');
            setTestOpen(null);
        } catch (error) {
            toast.error(error.message || 'Failed to send SMS');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            productivity: 'bg-blue-100 text-blue-700',
            storage: 'bg-green-100 text-green-700',
            communication: 'bg-purple-100 text-purple-700',
            accounting: 'bg-amber-100 text-amber-700'
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl">
                            <Plug className="w-8 h-8 text-[#C5A059]" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-[#0F172A]">Integrations Marketplace</h1>
                        <p className="text-[#64748B] font-light">Connect with popular services</p>
                    </div>
                </div>

                {/* Integration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {integrations.map(integration => {
                        const Icon = integration.icon;
                        const isSyncing = syncing[integration.id];
                        
                        return (
                            <Card key={integration.id} className="hover:shadow-xl transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-[#C5A059]/10 p-3 rounded-xl">
                                                <Icon className="w-6 h-6 text-[#C5A059]" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-lg mb-1 text-[#0F172A]">{integration.name}</h3>
                                                <Badge className={getCategoryColor(integration.category)}>
                                                    {integration.category}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#64748B] mb-4">{integration.description}</p>
                                    
                                    {integration.requiresSecrets && (
                                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                            ⚙️ Requires: {integration.requiresSecrets.join(', ')}
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleConnect(integration)}
                                            className="flex-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] hover:shadow-lg"
                                        >
                                            {integration.needsOAuth ? 'Connect' : 'Setup'}
                                        </Button>
                                        
                                        {(integration.id === 'quickbooks' || integration.id === 'dropbox') && (
                                            <Button
                                                onClick={() => handleSync(integration.id)}
                                                disabled={isSyncing}
                                                variant="outline"
                                                className="min-w-[80px]"
                                            >
                                                {isSyncing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Sync'
                                                )}
                                            </Button>
                                        )}
                                        
                                        {integration.id === 'twilio' && (
                                            <Dialog open={testOpen === 'twilio'} onOpenChange={(open) => setTestOpen(open ? 'twilio' : null)}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline">Test</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Test SMS</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <input
                                                            id="test-phone"
                                                            type="tel"
                                                            placeholder="+1234567890"
                                                            className="w-full p-2 border rounded"
                                                        />
                                                        <textarea
                                                            id="test-message"
                                                            placeholder="Test message"
                                                            className="w-full p-2 border rounded"
                                                            rows={3}
                                                        />
                                                        <Button 
                                                            onClick={() => {
                                                                const phone = document.getElementById('test-phone').value;
                                                                const msg = document.getElementById('test-message').value;
                                                                handleTestSMS(phone, msg);
                                                            }}
                                                            className="w-full"
                                                        >
                                                            Send Test SMS
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Integration Categories */}
                <div className="mb-8">
                    <h2 className="text-2xl font-light text-[#0F172A] mb-4">Integration Benefits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-3 flex items-center gap-2 text-[#0F172A]">
                                    <DollarSign className="w-5 h-5 text-[#C5A059]" />
                                    Accounting
                                </h3>
                                <ul className="space-y-2 text-sm text-[#64748B]">
                                    <li>• Auto-sync financial transactions</li>
                                    <li>• Real-time expense tracking</li>
                                    <li>• Seamless reconciliation</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-3 flex items-center gap-2 text-[#0F172A]">
                                    <Cloud className="w-5 h-5 text-[#C5A059]" />
                                    Cloud Storage
                                </h3>
                                <ul className="space-y-2 text-sm text-[#64748B]">
                                    <li>• Automatic document backup</li>
                                    <li>• Access files from anywhere</li>
                                    <li>• Secure encrypted storage</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-3 flex items-center gap-2 text-[#0F172A]">
                                    <MessageCircle className="w-5 h-5 text-[#C5A059]" />
                                    Communication
                                </h3>
                                <ul className="space-y-2 text-sm text-[#64748B]">
                                    <li>• SMS & Slack notifications</li>
                                    <li>• Team collaboration alerts</li>
                                    <li>• Custom notification rules</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-3 flex items-center gap-2 text-[#0F172A]">
                                    <Calendar className="w-5 h-5 text-[#C5A059]" />
                                    Productivity
                                </h3>
                                <ul className="space-y-2 text-sm text-[#64748B]">
                                    <li>• Calendar event automation</li>
                                    <li>• Task sync & reminders</li>
                                    <li>• Two-way integration</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}