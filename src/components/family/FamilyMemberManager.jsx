import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Shield, Edit, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function FamilyMemberManager() {
    const queryClient = useQueryClient();

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
    
    const { data: family } = useQuery({
        queryKey: ['family', family_id],
        queryFn: () => base44.entities.Family.filter({ id: family_id }),
        enabled: !!family_id
    });
    
    const isMasterAdmin = user?.email === family?.[0]?.primary_admin_email;

    const { data: familyMembers = [] } = useQuery({
        queryKey: ['familyMembers', family_id],
        queryFn: () => base44.entities.User.filter({ family_id }),
        enabled: !!family_id
    });

    const { data: customRoles = [] } = useQuery({
        queryKey: ['customRoles'],
        queryFn: () => base44.entities.CustomRole.filter({ is_active: true })
    });

    const { data: memberRoles = [] } = useQuery({
        queryKey: ['memberRoles', family_id],
        queryFn: () => base44.entities.FamilyMemberRole.filter({ family_id }),
        enabled: !!family_id
    });

    const assignRoleMutation = useMutation({
        mutationFn: async ({ member_email, role_id, role_name, permissions }) => {
            // Check if role assignment exists
            const existing = memberRoles.find(mr => mr.user_email === member_email);
            
            if (existing) {
                return await base44.entities.FamilyMemberRole.update(existing.id, {
                    role_id,
                    role_name,
                    permissions,
                    assigned_by_email: user.email
                });
            } else {
                return await base44.entities.FamilyMemberRole.create({
                    family_id,
                    user_email: member_email,
                    role_id,
                    role_name,
                    permissions,
                    assigned_by_email: user.email
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberRoles'] });
            toast.success('Role assigned successfully');
        }
    });

    const getMemberRole = (email) => {
        return memberRoles.find(mr => mr.user_email === email);
    };

    if (!isAdmin) {
        return (
            <Card className="border-[#0F172A]/10 shadow-sm">
                <CardContent className="py-8 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-[#64748B]/30" />
                    <p className="text-[#64748B]">Only family admins can manage member roles</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-[#0F172A]/10 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    <Users className="w-5 h-5 text-[#C5A059]" />
                    Family Member Roles
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {familyMembers.map((member) => {
                    const memberRole = getMemberRole(member.email);
                    
                    return (
                        <div 
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-lg border border-[#0F172A]/10"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F172A] to-[#1e293b] flex items-center justify-center text-[#C5A059] font-medium">
                                        {member.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#0F172A]">{member.email}</p>
                                        {member.role === 'admin' && (
                                            <Badge className="bg-[#C5A059] text-[#0F172A] mt-1">
                                                Family Admin
                                            </Badge>
                                        )}
                                        {memberRole && (
                                            <Badge variant="outline" className="mt-1">
                                                {memberRole.role_name}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {member.email !== user.email && (isMasterAdmin || member.role !== 'admin') && (
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={memberRole?.role_id || ''}
                                        onValueChange={(roleId) => {
                                            const selectedRole = customRoles.find(r => r.id === roleId);
                                            if (selectedRole) {
                                                assignRoleMutation.mutate({
                                                    member_email: member.email,
                                                    role_id: selectedRole.id,
                                                    role_name: selectedRole.role_name,
                                                    permissions: selectedRole.permissions
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-48 min-h-[44px]">
                                            <SelectValue placeholder="Assign role..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customRoles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.role_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}