import { useEffect } from 'react';

const PWAManager = () => {
    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                    
                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        // Add manifest dynamically
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = createManifestDataURL();
        document.head.appendChild(manifestLink);

        // Add theme color
        const themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        themeColorMeta.content = '#C5A059';
        document.head.appendChild(themeColorMeta);

        // Add apple touch icon
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png';
        document.head.appendChild(appleTouchIcon);

        return () => {
            if (manifestLink.parentNode) {
                manifestLink.parentNode.removeChild(manifestLink);
            }
            if (themeColorMeta.parentNode) {
                themeColorMeta.parentNode.removeChild(themeColorMeta);
            }
        };
    }, []);

    return null;
};

// Create manifest as data URL since we can't create static files
function createManifestDataURL() {
    const manifest = {
        name: 'North Star Life Manager',
        short_name: 'North Star',
        description: 'Complete life management platform with AI-powered insights',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#C5A059',
        orientation: 'portrait-primary',
        icons: [
            {
                src: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
            }
        ],
        categories: ['finance', 'productivity', 'lifestyle'],
        shortcuts: [
            {
                name: 'Dashboard',
                url: '/Dashboard',
                description: 'View your dashboard'
            },
            {
                name: 'Documents',
                url: '/Vault',
                description: 'Access your documents'
            },
            {
                name: 'Financial Health',
                url: '/FinancialHealth',
                description: 'Check financial health'
            }
        ]
    };

    const manifestJSON = JSON.stringify(manifest);
    const blob = new Blob([manifestJSON], { type: 'application/json' });
    return URL.createObjectURL(blob);
}

// Service Worker inline (since we can't create sw.js file)
export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        const swCode = `
const CACHE_NAME = 'north-star-v1';
const RUNTIME_CACHE = 'north-star-runtime';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== location.origin) {
        return;
    }

    if (url.pathname.includes('/api/') || url.pathname.includes('base44')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request).then((response) => {
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'North Star';
    const options = {
        body: data.body || 'You have a new notification',
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png',
        data: data.url || '/',
        vibrate: [200, 100, 200],
        tag: data.tag || 'general',
        requireInteraction: data.priority === 'high'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (let client of clientList) {
                    if (client.url === event.notification.data && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data);
                }
            })
    );
});
        `;

        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swURL = URL.createObjectURL(blob);

        navigator.serviceWorker
            .register(swURL)
            .then((registration) => {
                console.log('Service Worker registered successfully');
                
                // Check for updates
                setInterval(() => {
                    registration.update();
                }, 60000);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
};

export default PWAManager;