import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings, Bell, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantSettings({ tenantEmail }) {
    const queryClient = useQueryClient();
    const [preferences, setPreferences] = useState(null);

    const { data: existingPrefs } = useQuery({
        queryKey: ['tenantPreferences', tenantEmail],
        queryFn: async () => {
            const prefs = await base44.entities.TenantNotificationPreference.filter({ tenant_email: tenantEmail });
            return prefs[0] || null;
        }
    });

    useEffect(() => {
        if (existingPrefs) {
            setPreferences(existingPrefs);
        } else {
            setPreferences({
                tenant_email: tenantEmail,
                rent_due_enabled: true,
                rent_due_days_before: 3,
                rent_overdue_enabled: true,
                maintenance_update_enabled: true,
                maintenance_completed_enabled: true,
                lease_expiring_enabled: true,
                lease_expiring_days_before: 60,
                announcements_enabled: true,
                payment_received_enabled: true,
                in_app_enabled: true,
                email_enabled: false
            });
        }
    }, [existingPrefs, tenantEmail]);

    const saveMutation = useMutation({
        mutationFn: async (prefs) => {
            if (existingPrefs) {
                return await base44.entities.TenantNotificationPreference.update(existingPrefs.id, prefs);
            } else {
                return await base44.entities.TenantNotificationPreference.create(prefs);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantPreferences'] });
            toast.success('Settings saved successfully!');
        },
        onError: () => {
            toast.error('Failed to save settings');
        }
    });

    const handleSave = () => {
        saveMutation.mutate(preferences);
    };

    if (!preferences) {
        return <div className="text-center py-8">Loading...</div>;
    }

    const notificationTypes = [
        {
            key: 'rent_due',
            label: 'Upcoming Rent Payments',
            description: 'Get reminded before rent is due',
            hasDays: true,
            daysKey: 'rent_due_days_before'
        },
        {
            key: 'rent_overdue',
            label: 'Overdue Rent',
            description: 'Alert when rent payment is late'
        },
        {
            key: 'maintenance_update',
            label: 'Maintenance Updates',
            description: 'Status changes on your requests'
        },
        {
            key: 'maintenance_completed',
            label: 'Maintenance Completed',
            description: 'When work is finished'
        },
        {
            key: 'lease_expiring',
            label: 'Lease Expiration',
            description: 'Upcoming lease end date',
            hasDays: true,
            daysKey: 'lease_expiring_days_before'
        },
        {
            key: 'announcements',
            label: 'Announcements',
            description: 'Messages from property manager'
        },
        {
            key: 'payment_received',
            label: 'Payment Confirmations',
            description: 'When your payment is received'
        }
    ];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#C5A059]" />
                        Notification Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Delivery Methods */}
                    <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#C5A059]" />
                            Delivery Methods
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-sm">In-App Notifications</div>
                                    <div className="text-xs text-gray-600">Show alerts in the app</div>
                                </div>
                                <Switch
                                    checked={preferences.in_app_enabled}
                                    onCheckedChange={(checked) => 
                                        setPreferences({...preferences, in_app_enabled: checked})
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-sm">Email Notifications</div>
                                    <div className="text-xs text-gray-600">Send to your email</div>
                                </div>
                                <Switch
                                    checked={preferences.email_enabled}
                                    onCheckedChange={(checked) => 
                                        setPreferences({...preferences, email_enabled: checked})
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notification Types */}
                    <div>
                        <h3 className="font-medium mb-3">Notification Types</h3>
                        <div className="space-y-3">
                            {notificationTypes.map(type => (
                                <div key={type.key} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-medium text-sm">{type.label}</div>
                                            <div className="text-xs text-gray-600">{type.description}</div>
                                        </div>
                                        <Switch
                                            checked={preferences[`${type.key}_enabled`]}
                                            onCheckedChange={(checked) => 
                                                setPreferences({...preferences, [`${type.key}_enabled`]: checked})
                                            }
                                        />
                                    </div>
                                    {type.hasDays && preferences[`${type.key}_enabled`] && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Label className="text-xs">Notify</Label>
                                            <Input
                                                type="number"
                                                value={preferences[type.daysKey]}
                                                onChange={(e) => 
                                                    setPreferences({...preferences, [type.daysKey]: parseInt(e.target.value)})
                                                }
                                                className="w-16 h-8 text-sm"
                                                min="1"
                                            />
                                            <span className="text-xs text-gray-600">days before</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white h-12 touch-manipulation"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}