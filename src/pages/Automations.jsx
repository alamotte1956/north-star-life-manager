import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Calendar, Mail, Webhook, Clock, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CSVImporter from '../components/automation/CSVImporter';
import SubscriptionAutomation from '../components/automation/SubscriptionAutomation';

export default function Automations() {
    const { data: automations = [], refetch } = useQuery({
        queryKey: ['automations'],
        queryFn: () => base44.entities.Automation.list('-created_date')
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => base44.entities.Transaction.list('-date', 20)
    });

    const triggerIcons = {
        email: Mail,
        calendar: Calendar,
        webhook: Webhook,
        scheduled: Clock
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                                <Zap className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Automations</h1>
                            <p className="text-black/70 font-light">Smart data entry & imports</p>
                        </div>
                    </div>
                </div>

                {/* CSV Importer */}
                <div className="mb-8">
                    <CSVImporter onImportComplete={refetch} />
                </div>

                {/* Subscription Automation */}
                <div className="mb-8">
                    <SubscriptionAutomation onUpdate={refetch} />
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-light mb-1">Check Subscription Renewals</h3>
                                    <p className="text-sm text-black/60">Manually trigger renewal notifications</p>
                                </div>
                                <Button
                                    onClick={async () => {
                                        try {
                                            await base44.functions.invoke('checkSubscriptionRenewals');
                                            alert('Renewal check completed');
                                        } catch (error) {
                                            alert('Error: ' + error.message);
                                        }
                                    }}
                                    className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]"
                                >
                                    <Bell className="w-4 h-4 mr-2" />
                                    Check Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-light text-black mb-4">Recent Transactions</h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {transactions.map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex-1">
                                                <p className="font-medium">{txn.description}</p>
                                                <p className="text-sm text-black/50">{txn.merchant}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ${Math.abs(txn.amount).toLocaleString()}
                                                </p>
                                                <Badge className="mt-1">{txn.category}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Automation Rules */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-light text-black">Automation Rules</h2>
                        <Button className="bg-gradient-to-r from-black to-[#1a1a1a]">
                            <Plus className="w-4 h-4 mr-2" />
                            New Rule
                        </Button>
                    </div>

                    {automations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {automations.map(automation => {
                                const Icon = triggerIcons[automation.trigger_type] || Zap;
                                return (
                                    <Card key={automation.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-[#D4AF37]/10 p-2 rounded-lg">
                                                        <Icon className="w-5 h-5 text-[#D4AF37]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{automation.name}</h3>
                                                        <p className="text-sm text-black/50">{automation.trigger_type} → {automation.action_type}</p>
                                                    </div>
                                                </div>
                                                <Badge className={automation.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                    {automation.enabled ? 'Active' : 'Disabled'}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-center py-12">
                                <Zap className="w-12 h-12 text-black/20 mx-auto mb-4" />
                                <p className="text-black/40">No automation rules yet</p>
                                <p className="text-sm text-black/30 mt-2">Create rules to automatically import data and create records</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Feature Info */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <Mail className="w-8 h-8 text-[#D4AF37] mb-3" />
                            <h3 className="font-medium mb-2">Email Parsing</h3>
                            <p className="text-sm text-black/60">Auto-create subscriptions from invoice emails (Netflix, Spotify, etc.)</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <Bell className="w-8 h-8 text-[#D4AF37] mb-3" />
                            <h3 className="font-medium mb-2">Renewal Tracking</h3>
                            <p className="text-sm text-black/60">Automatic notifications for upcoming subscription renewals</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <Zap className="w-8 h-8 text-[#D4AF37] mb-3" />
                            <h3 className="font-medium mb-2">Smart Suggestions</h3>
                            <p className="text-sm text-black/60">AI-powered field suggestions based on your history</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}