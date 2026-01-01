import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Phone, Heart, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EmergencyResponse() {
    const [triggering, setTriggering] = useState(false);
    const [location, setLocation] = useState(null);
    const queryClient = useQueryClient();

    const { data: broadcasts = [] } = useQuery({
        queryKey: ['emergency-broadcasts'],
        queryFn: () => base44.entities.EmergencyBroadcast.list('-created_date')
    });

    const { data: emergencyContacts = [] } = useQuery({
        queryKey: ['emergency-contacts'],
        queryFn: () => base44.entities.EmergencyInfo.list()
    });

    const triggerMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('triggerEmergencyBroadcast', data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['emergency-broadcasts'] });
            toast.success(`Emergency alert sent to ${result.data.contacts_notified} contacts`);
            setTriggering(false);
        },
        onError: () => {
            toast.error('Failed to send emergency alert');
            setTriggering(false);
        }
    });

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            });
        }
    };

    const handleEmergency = (type) => {
        setTriggering(true);
        getLocation();
        
        setTimeout(() => {
            triggerMutation.mutate({
                emergency_type: type,
                message: `Emergency alert triggered from North Star app`,
                latitude: location?.latitude,
                longitude: location?.longitude,
                address: null
            });
        }, 1000);
    };

    const resolveEmergency = async (broadcastId) => {
        await base44.entities.EmergencyBroadcast.update(broadcastId, {
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolution_notes: 'Resolved by user'
        });
        queryClient.invalidateQueries({ queryKey: ['emergency-broadcasts'] });
        toast.success('Emergency resolved');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Emergency Response System</h1>
                    <p className="text-[#1A2B44]/60">One-touch emergency broadcast to your trusted contacts</p>
                </div>

                {/* Emergency Buttons */}
                <Card className="mb-8 border-red-300 bg-gradient-to-br from-red-50 to-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-900">
                            <AlertTriangle className="w-6 h-6" />
                            Emergency Alert
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-800 mb-6">
                            Tap any button to instantly notify your emergency contacts with your location and medical information.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button
                                onClick={() => handleEmergency('medical')}
                                disabled={triggering}
                                className="h-24 bg-red-600 hover:bg-red-700 text-white flex flex-col gap-2"
                            >
                                <Heart className="w-8 h-8" />
                                <span>Medical</span>
                            </Button>
                            <Button
                                onClick={() => handleEmergency('accident')}
                                disabled={triggering}
                                className="h-24 bg-orange-600 hover:bg-orange-700 text-white flex flex-col gap-2"
                            >
                                <AlertTriangle className="w-8 h-8" />
                                <span>Accident</span>
                            </Button>
                            <Button
                                onClick={() => handleEmergency('security')}
                                disabled={triggering}
                                className="h-24 bg-purple-600 hover:bg-purple-700 text-white flex flex-col gap-2"
                            >
                                <AlertTriangle className="w-8 h-8" />
                                <span>Security</span>
                            </Button>
                            <Button
                                onClick={() => handleEmergency('other')}
                                disabled={triggering}
                                className="h-24 bg-gray-600 hover:bg-gray-700 text-white flex flex-col gap-2"
                            >
                                <Phone className="w-8 h-8" />
                                <span>General</span>
                            </Button>
                        </div>
                        {triggering && (
                            <div className="mt-4 text-center text-red-700">
                                <div className="animate-pulse">Sending emergency broadcast...</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Emergency Contacts */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#D4AF37]" />
                            Emergency Contacts ({emergencyContacts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {emergencyContacts.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-[#1A2B44]/60 mb-4">No emergency contacts configured</p>
                                <Button variant="outline">Add Emergency Contact</Button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {emergencyContacts.map((contact) => (
                                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-[#1A2B44]">{contact.name}</div>
                                            <div className="text-sm text-[#1A2B44]/60">{contact.relationship}</div>
                                        </div>
                                        <div className="text-right text-sm text-[#1A2B44]/60">
                                            <div>{contact.phone}</div>
                                            <div>{contact.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Broadcasts */}
                {broadcasts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-4">Emergency History</h2>
                        <div className="space-y-4">
                            {broadcasts.map((broadcast) => (
                                <Card key={broadcast.id} className={
                                    broadcast.resolved 
                                        ? 'border-green-200 bg-green-50' 
                                        : 'border-orange-200 bg-orange-50'
                                }>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                                    <span className="font-medium text-[#1A2B44] capitalize">
                                                        {broadcast.emergency_type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#1A2B44]/60">
                                                    {new Date(broadcast.created_date).toLocaleString()}
                                                </p>
                                            </div>
                                            <Badge className={
                                                broadcast.resolved 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-orange-100 text-orange-700'
                                            }>
                                                {broadcast.resolved ? 'Resolved' : 'Active'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[#1A2B44]/70 mb-4">{broadcast.message}</p>

                                        {broadcast.location?.address && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60 mb-3">
                                                <MapPin className="w-4 h-4" />
                                                {broadcast.location.address}
                                            </div>
                                        )}

                                        <div className="text-sm text-[#1A2B44]/60 mb-3">
                                            Notified {broadcast.contacts_notified?.length || 0} emergency contacts
                                        </div>

                                        {!broadcast.resolved && (
                                            <Button
                                                onClick={() => resolveEmergency(broadcast.id)}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark as Resolved
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <h3 className="font-medium text-blue-900 mb-3">How Emergency Response Works</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li>• One-touch emergency broadcast to all your emergency contacts</li>
                            <li>• Automatically includes your GPS location</li>
                            <li>• Sends critical medical information (blood type, allergies, medications)</li>
                            <li>• Notifications via email and SMS</li>
                            <li>• Contacts can reply "SAFE" to confirm you're okay</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}