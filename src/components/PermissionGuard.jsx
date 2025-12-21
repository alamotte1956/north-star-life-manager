import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PermissionGuard({ section, action = 'view', children, fallback = null }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            try {
                const userData = await base44.auth.me();
                setUser(userData);

                // Admins have all permissions
                if (userData.role === 'admin') {
                    setHasPermission(true);
                    setLoading(false);
                    return;
                }

                // Check custom role
                if (userData.custom_role_id) {
                    const roles = await base44.entities.CustomRole.list();
                    const userRole = roles.find(r => r.id === userData.custom_role_id);
                    setRole(userRole);

                    if (userRole && userRole.permissions[section]) {
                        const sectionPerms = userRole.permissions[section];
                        setHasPermission(sectionPerms[action] === true);
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Permission check failed:', error);
                setLoading(false);
            }
        };

        checkPermission();
    }, [section, action]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
                <div className="animate-pulse text-[#64748B]">Loading...</div>
            </div>
        );
    }

    if (!hasPermission) {
        if (fallback) return fallback;
        
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA] px-6">
                <Card className="max-w-md w-full border-red-200">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-light text-[#0F172A] mb-2">Access Restricted</h2>
                        <p className="text-[#64748B] mb-6">
                            You don't have permission to {action} {section}. Contact your administrator to request access.
                        </p>
                        <div className="text-sm text-[#64748B] bg-[#F8F9FA] p-4 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Shield className="w-4 h-4" />
                                <span className="font-medium">Your Current Role</span>
                            </div>
                            <p>{role?.role_name || user?.role || 'No role assigned'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}

// Hook for component-level permission checks
export function usePermission(section, action = 'view') {
    const [hasPermission, setHasPermission] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const user = await base44.auth.me();
                
                if (user.role === 'admin') {
                    setHasPermission(true);
                    setLoading(false);
                    return;
                }

                if (user.custom_role_id) {
                    const roles = await base44.entities.CustomRole.list();
                    const userRole = roles.find(r => r.id === user.custom_role_id);
                    if (userRole && userRole.permissions[section]) {
                        setHasPermission(userRole.permissions[section][action] === true);
                    }
                }

                setLoading(false);
            } catch {
                setLoading(false);
            }
        };
        check();
    }, [section, action]);

    return { hasPermission, loading };
}