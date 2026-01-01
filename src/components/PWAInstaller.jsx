import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        logger.debug('SW registered:', registration);
                    })
                    .catch(err => {
                        logger.debug('SW registration failed:', err);
                    });
            });
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Check if already dismissed
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            logger.debug('PWA installed');
        }
        
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-24 sm:w-96 z-40 bg-gradient-to-r from-black to-[#1a1a1a] text-white rounded-2xl shadow-2xl border border-[#D4AF37]/30 p-4 animate-in slide-in-from-bottom">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-white/50 hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">★</span>
                </div>
                
                <div className="flex-1 min-w-0">
                    <h3 className="font-light text-[#D4AF37] mb-1">Install North Star</h3>
                    <p className="text-sm text-white/70 mb-3">
                        Add to your home screen for quick access and offline features
                    </p>
                    
                    <Button
                        onClick={handleInstallClick}
                        className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black hover:shadow-lg touch-manipulation"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Install App
                    </Button>
                </div>
            </div>
        </div>
    );
}