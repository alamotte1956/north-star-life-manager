import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOffline, setShowOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showOffline && isOnline) return null;

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom">
            <Badge className={`${
                isOnline 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
            } px-4 py-2 text-sm font-medium flex items-center gap-2 shadow-lg`}>
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        Back online
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        You're offline - Limited functionality
                    </>
                )}
            </Badge>
        </div>
    );
}