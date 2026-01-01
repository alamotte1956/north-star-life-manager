import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RoleBasedGuard({ 
    section, 
    action, 
    children, 
    fallback 
}) {
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: userRecord } = useQuery({
        queryKey: ['userRecord'],
        queryFn: () => base44.entities.User.filter({ email: user?.email }),
        enabled: !!user
    });

    const family_id = userRecord?.[0]?.family_id;
    const isAdmin = userRecord?.[0]?.role === 'admin';

    const { data: memberRole } = useQuery({
        queryKey: ['memberRole', family_id, user?.email],
        queryFn: async () => {
            const roles = await base44.entities.FamilyMemberRole.filter({
                family_id,
                user_email: user.email
            });
            return roles[0] || null;
        },
        enabled: !!family_id && !!user && !isAdmin
    });

    // Admins have all permissions
    if (isAdmin) {
        return <>{children}</>;
    }

    // Check if user has the required permission
    const permissions = memberRole?.permissions?.[section] || {};
    const hasPermission = permissions[action] === true;

    if (hasPermission) {
        return <>{children}</>;
    }

    // Show fallback or default restricted message
    if (fallback) {
        return fallback;
    }

    return (
        <Card className="border-[#0F172A]/10 shadow-sm">
            <CardContent className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F172A]/5 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-[#64748B]" />
                </div>
                <h3 className="text-lg font-medium text-[#0F172A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Access Restricted
                </h3>
                <p className="text-[#64748B] font-light">
                    Your role does not have {action} permission for {section}.
                    <br />
                    Contact your family admin to update your permissions.
                </p>
            </CardContent>
        </Card>
    );
}

// Hook for programmatic permission checks
export function useRolePermission(section, action) {
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: userRecord } = useQuery({
        queryKey: ['userRecord'],
        queryFn: () => base44.entities.User.filter({ email: user?.email }),
        enabled: !!user
    });

    const family_id = userRecord?.[0]?.family_id;
    const isAdmin = userRecord?.[0]?.role === 'admin';

    const { data: memberRole, isLoading } = useQuery({
        queryKey: ['memberRole', family_id, user?.email],
        queryFn: async () => {
            const roles = await base44.entities.FamilyMemberRole.filter({
                family_id,
                user_email: user.email
            });
            return roles[0] || null;
        },
        enabled: !!family_id && !!user && !isAdmin
    });

    if (isAdmin) {
        return { hasPermission: true, isLoading: false };
    }

    const permissions = memberRole?.permissions?.[section] || {};
    const hasPermission = permissions[action] === true;

    return { hasPermission, isLoading };
}