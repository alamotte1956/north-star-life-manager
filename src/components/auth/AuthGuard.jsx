import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }) {
    const [checking, setChecking] = useState(true);
    const [setupError, setSetupError] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const isAuth = await base44.auth.isAuthenticated();
                
                if (!isAuth) {
                    // Use full URL for proper redirect with custom domains
                    base44.auth.redirectToLogin(window.location.href);
                    return;
                }

                // Check if user has family setup
                const user = await base44.auth.me();
                const userRecords = await base44.entities.User.filter({ email: user.email });
                
                if (userRecords.length === 0 || !userRecords[0].family_id) {
                    // Auto-create family for first-time user
                    const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const family = await base44.entities.Family.create({
                        family_name: `${user.full_name || user.email}'s Family`,
                        family_code: familyCode,
                        primary_admin_email: user.email
                    });

                    // Update or create user record with family_id
                    if (userRecords.length === 0) {
                        await base44.entities.User.create({
                            email: user.email,
                            full_name: user.full_name,
                            family_id: family.id,
                            role: 'admin'
                        });
                    } else {
                        await base44.entities.User.update(userRecords[0].id, {
                            family_id: family.id,
                            role: 'admin'
                        });
                    }
                }

                setChecking(false);
            } catch (error) {
                console.error('Auth setup error:', error);
                setSetupError(error.message);
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
                    <p className="text-[#64748B] font-light">Setting up your account...</p>
                </div>
            </div>
        );
    }

    if (setupError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                        <p className="text-red-800 mb-2">Setup Error</p>
                        <p className="text-sm text-red-600">{setupError}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#C5A059] text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}