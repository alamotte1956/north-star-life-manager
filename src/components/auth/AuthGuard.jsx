import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }) {
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const isAuth = await base44.auth.isAuthenticated();
            
            if (!isAuth) {
                base44.auth.redirectToLogin(window.location.pathname);
            } else {
                setChecking(false);
            }
        };

        checkAuth();
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#C5A059] animate-spin" />
                    <p className="text-[#64748B] font-light">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}