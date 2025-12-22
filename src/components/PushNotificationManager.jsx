import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        if (!isSupported) {
            toast.error('Push notifications not supported');
            return;
        }

        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                toast.error('Notification permission denied');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Get VAPID public key from backend
            const response = await base44.functions.invoke('getVapidPublicKey', {});
            const publicKey = response.data.public_key;
            
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            // Save subscription to backend
            const saveResponse = await base44.functions.invoke('savePushSubscription', {
                subscription: JSON.stringify(sub)
            });

            if (saveResponse.data.success) {
                setSubscription(sub);
                toast.success('Push notifications enabled!');
            } else {
                throw new Error('Failed to save subscription');
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        if (!subscription) return;

        setLoading(true);
        try {
            await subscription.unsubscribe();
            
            // Remove subscription from backend
            const removeResponse = await base44.functions.invoke('removePushSubscription', {
                endpoint: subscription.endpoint
            });

            if (removeResponse.data.success) {
                setSubscription(null);
                toast.success('Push notifications disabled');
            } else {
                throw new Error('Failed to remove subscription');
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
            toast.error('Failed to disable notifications');
        } finally {
            setLoading(false);
        }
    };

    if (!isSupported) return null;

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={subscription ? unsubscribeFromPush : subscribeToPush}
            disabled={loading}
            className="min-h-[50px] min-w-[50px] border-[#0F172A]/20 hover:border-[#C5A059]/30 shadow-sm"
            title={subscription ? 'Disable notifications' : 'Enable notifications'}
        >
            {subscription ? (
                <Bell className="w-5 h-5 text-[#C5A059]" />
            ) : (
                <BellOff className="w-5 h-5 text-[#64748B]" />
            )}
        </Button>
    );
}