import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function NotificationSettings() {
    const queryClient = useQueryClient();

    const { data: preferences = [], isLoading } = useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: () => base44.entities.NotificationPreference.list()
    });

    const currentPrefs = preferences[0] || {
        maintenance_reminders: true,
        maintenance_days_before: 7,
        document_reminders: true,
        document_days_before: 30,
        subscription_reminders: true,
        subscription_days_before: 5,
        vehicle_reminders: true,
        vehicle_days_before: 7,
        important_date_reminders: true,
        notification_frequency: 'daily'
    };

    const [formData, setFormData] = useState(currentPrefs);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (preferences.length > 0) {
                return base44.entities.NotificationPreference.update(preferences[0].id, data);
            } else {
                return base44.entities.NotificationPreference.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
            toast.success('Notification settings saved');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    React.useEffect(() => {
        if (preferences.length > 0) {
            setFormData(preferences[0]);
        }
    }, [preferences]);

    if (isLoading) {
        return <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] flex items-center justify-center">
            <div>Loading...</div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                            <Bell className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-[#1A2B44]">Notification Settings</h1>
                        <p className="text-[#1A2B44]/60 font-light">Configure your email reminders</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Maintenance Reminders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Maintenance Tasks</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.maintenance_reminders}
                                        onChange={(e) => setFormData({ ...formData, maintenance_reminders: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <Label>Enable maintenance task reminders</Label>
                                </div>
                                {formData.maintenance_reminders && (
                                    <div>
                                        <Label>Remind me this many days before due date</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={formData.maintenance_days_before}
                                            onChange={(e) => setFormData({ ...formData, maintenance_days_before: parseInt(e.target.value) })}
                                            className="w-32"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Document Expiration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Document Expiration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.document_reminders}
                                        onChange={(e) => setFormData({ ...formData, document_reminders: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <Label>Enable document expiration reminders</Label>
                                </div>
                                {formData.document_reminders && (
                                    <div>
                                        <Label>Remind me this many days before expiration</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="90"
                                            value={formData.document_days_before}
                                            onChange={(e) => setFormData({ ...formData, document_days_before: parseInt(e.target.value) })}
                                            className="w-32"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Subscription Renewals */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Subscription Renewals</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.subscription_reminders}
                                        onChange={(e) => setFormData({ ...formData, subscription_reminders: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <Label>Enable subscription renewal reminders</Label>
                                </div>
                                {formData.subscription_reminders && (
                                    <div>
                                        <Label>Remind me this many days before billing</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={formData.subscription_days_before}
                                            onChange={(e) => setFormData({ ...formData, subscription_days_before: parseInt(e.target.value) })}
                                            className="w-32"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Vehicle Reminders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Vehicle Service & Registration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.vehicle_reminders}
                                        onChange={(e) => setFormData({ ...formData, vehicle_reminders: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <Label>Enable vehicle service/registration reminders</Label>
                                </div>
                                {formData.vehicle_reminders && (
                                    <div>
                                        <Label>Remind me this many days before due</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={formData.vehicle_days_before}
                                            onChange={(e) => setFormData({ ...formData, vehicle_days_before: parseInt(e.target.value) })}
                                            className="w-32"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Important Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Important Dates</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.important_date_reminders}
                                        onChange={(e) => setFormData({ ...formData, important_date_reminders: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <Label>Enable important date reminders</Label>
                                </div>
                                <p className="text-sm text-[#1A2B44]/60">
                                    Uses the reminder days configured for each individual important date
                                </p>
                            </CardContent>
                        </Card>

                        {/* Notification Frequency */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-light">Email Frequency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <Label>How often should we send notification emails?</Label>
                                    <Select
                                        value={formData.notification_frequency}
                                        onValueChange={(value) => setFormData({ ...formData, notification_frequency: value })}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily Digest</SelectItem>
                                            <SelectItem value="weekly">Weekly Digest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-8">
                        <Button
                            type="submit"
                            disabled={saveMutation.isPending}
                            className="bg-gradient-to-r from-black to-[#1a1a1a] hover:shadow-lg text-[#D4AF37] w-full sm:w-auto"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}