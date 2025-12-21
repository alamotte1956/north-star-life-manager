import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Smartphone, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings() {
    const queryClient = useQueryClient();
    const [preferences, setPreferences] = useState({
        document_expiry_enabled: true,
        document_expiry_days_before: 30,
        maintenance_due_enabled: true,
        bill_due_enabled: true,
        subscription_renewal_enabled: true,
        in_app_enabled: true,
        email_enabled: true
    });

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: existingPrefs } = useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: () => base44.entities.NotificationPreference.filter({ user_email: user?.email }),
        enabled: !!user
    });

    useEffect(() => {
        if (existingPrefs && existingPrefs[0]) {
            setPreferences(prev => ({ ...prev, ...existingPrefs[0] }));
        }
    }, [existingPrefs]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (existingPrefs && existingPrefs[0]) {
                return base44.entities.NotificationPreference.update(existingPrefs[0].id, preferences);
            } else {
                return base44.entities.NotificationPreference.create({
                    user_email: user.email,
                    ...preferences
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
            toast.success('Notification preferences saved!');
        }
    });

    const notificationTypes = [
        {
            key: 'document_expiry',
            label: 'Document Expiry',
            description: 'Get notified before documents expire',
            hasDaysSetting: true
        },
        {
            key: 'maintenance_due',
            label: 'Maintenance Due',
            description: 'Reminders for upcoming maintenance tasks'
        },
        {
            key: 'bill_due',
            label: 'Bills Due',
            description: 'Reminders for bill payments'
        },
        {
            key: 'subscription_renewal',
            label: 'Subscription Renewals',
            description: 'Notifications for subscription renewals'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl">
                                <Bell className="w-8 h-8 text-[#C5A059]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A] mb-1">
                                Notification Settings
                            </h1>
                            <p className="text-[#64748B] font-light">
                                Manage your alerts and reminders
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Notification Types */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light">Notification Types</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {notificationTypes.map(type => (
                                <div key={type.key} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <Label className="text-base">{type.label}</Label>
                                            <p className="text-sm text-gray-500">{type.description}</p>
                                        </div>
                                        <Switch
                                            checked={preferences[`${type.key}_enabled`]}
                                            onCheckedChange={(checked) => 
                                                setPreferences({ ...preferences, [`${type.key}_enabled`]: checked })
                                            }
                                        />
                                    </div>
                                    {type.hasDaysSetting && preferences[`${type.key}_enabled`] && (
                                        <div className="ml-4 flex items-center gap-4">
                                            <Label className="text-sm">Remind me</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={preferences[`${type.key}_days_before`]}
                                                onChange={(e) => 
                                                    setPreferences({ ...preferences, [`${type.key}_days_before`]: parseInt(e.target.value) })
                                                }
                                                className="w-20"
                                            />
                                            <Label className="text-sm">days before expiry</Label>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Delivery Channels */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-light">Delivery Channels</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-[#C5A059]" />
                                    <div>
                                        <Label className="text-base">In-App Notifications</Label>
                                        <p className="text-sm text-gray-500">Show notifications in the app</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={preferences.in_app_enabled}
                                    onCheckedChange={(checked) => 
                                        setPreferences({ ...preferences, in_app_enabled: checked })
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-[#C5A059]" />
                                    <div>
                                        <Label className="text-base">Email Notifications</Label>
                                        <p className="text-sm text-gray-500">Send notifications to {user?.email}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={preferences.email_enabled}
                                    onCheckedChange={(checked) => 
                                        setPreferences({ ...preferences, email_enabled: checked })
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] h-12"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </div>
        </div>
    );
}