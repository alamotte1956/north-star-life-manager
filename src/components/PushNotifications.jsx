import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                toast.error('Notification permission denied');
                setIsLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Get VAPID public key from backend
            const keyResult = await base44.functions.invoke('getVapidPublicKey');
            const vapidPublicKey = keyResult.data.public_key;
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Save subscription to backend
            await base44.entities.User.update(
                (await base44.auth.me()).id,
                { push_subscription: JSON.stringify(subscription) }
            );

            setIsSubscribed(true);
            toast.success('Push notifications enabled');
        } catch (error) {
            console.error('Error subscribing to push:', error);
            toast.error('Failed to enable push notifications');
        }
        setIsLoading(false);
    };

    const unsubscribeFromPush = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                
                // Remove subscription from backend
                await base44.entities.User.update(
                    (await base44.auth.me()).id,
                    { push_subscription: null }
                );
                
                setIsSubscribed(false);
                toast.success('Push notifications disabled');
            }
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            toast.error('Failed to disable push notifications');
        }
        setIsLoading(false);
    };

    if (!isSupported) return null;

    return (
        <Button
            variant="outline"
            onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
            disabled={isLoading}
            className="border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
        >
            {isSubscribed ? (
                <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Disable Push Notifications
                </>
            ) : (
                <>
                    <Bell className="w-4 h-4 mr-2" />
                    Enable Push Notifications
                </>
            )}
        </Button>
    );
}