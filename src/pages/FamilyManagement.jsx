import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Copy, Check, UserPlus, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function FamilyManagement() {
    const queryClient = useQueryClient();
    const [showCreateFamily, setShowCreateFamily] = useState(false);
    const [familyName, setFamilyName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: userRecord } = useQuery({
        queryKey: ['userRecord'],
        queryFn: () => base44.entities.User.filter({ email: user?.email }),
        enabled: !!user
    });

    const { data: family } = useQuery({
        queryKey: ['family'],
        queryFn: () => base44.entities.Family.filter({ id: userRecord?.[0]?.family_id }),
        enabled: !!userRecord?.[0]?.family_id
    });

    const { data: familyMembers = [] } = useQuery({
        queryKey: ['familyMembers'],
        queryFn: () => base44.entities.User.filter({ family_id: userRecord?.[0]?.family_id }),
        enabled: !!userRecord?.[0]?.family_id
    });

    const createFamilyMutation = useMutation({
        mutationFn: async () => {
            // Generate cryptographically secure 12-character code
            const array = new Uint8Array(12);
            crypto.getRandomValues(array);
            const code = Array.from(array, byte => byte.toString(36).padStart(2, '0'))
                .join('')
                .substring(0, 12)
                .toUpperCase();
            const newFamily = await base44.entities.Family.create({
                family_name: familyName,
                family_code: code,
                primary_admin_email: user.email
            });

            // Update user with family_id
            if (userRecord && userRecord[0]) {
                await base44.entities.User.update(userRecord[0].id, { family_id: newFamily.id });
            } else {
                await base44.entities.User.create({ email: user.email, family_id: newFamily.id });
            }

            return newFamily;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family'] });
            queryClient.invalidateQueries({ queryKey: ['userRecord'] });
            setShowCreateFamily(false);
            setFamilyName('');
            toast.success('Family created successfully!');
        }
    });

    const joinFamilyMutation = useMutation({
        mutationFn: async () => {
            const families = await base44.entities.Family.filter({ family_code: joinCode.toUpperCase() });
            if (!families.length) {
                throw new Error('Invalid family code');
            }

            const targetFamily = families[0];

            // Update user with family_id
            if (userRecord && userRecord[0]) {
                await base44.entities.User.update(userRecord[0].id, { family_id: targetFamily.id });
            } else {
                await base44.entities.User.create({ email: user.email, family_id: targetFamily.id });
            }

            return targetFamily;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family'] });
            queryClient.invalidateQueries({ queryKey: ['userRecord'] });
            setJoinCode('');
            toast.success('Joined family successfully!');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to join family');
        }
    });

    const copyCode = () => {
        if (family?.[0]?.family_code) {
            navigator.clipboard.writeText(family[0].family_code);
            setCopied(true);
            toast.success('Family code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const hasFamily = userRecord?.[0]?.family_id && family?.[0];
    const isAdmin = hasFamily && family[0].primary_admin_email === user?.email;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl">
                                <Users className="w-8 h-8 text-[#C5A059]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A] mb-1">Family Management</h1>
                            <p className="text-[#64748B] font-light">Manage your family group and shared documents</p>
                        </div>
                    </div>
                </div>

                {!hasFamily ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-light">Create a Family</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!showCreateFamily ? (
                                    <Button onClick={() => setShowCreateFamily(true)} className="w-full bg-[#C5A059]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create New Family
                                    </Button>
                                ) : (
                                    <>
                                        <div>
                                            <Label>Family Name</Label>
                                            <Input
                                                value={familyName}
                                                onChange={(e) => setFamilyName(e.target.value)}
                                                placeholder="e.g., The Smith Family"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setShowCreateFamily(false)} className="flex-1">
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => createFamilyMutation.mutate()}
                                                disabled={!familyName || createFamilyMutation.isPending}
                                                className="flex-1 bg-[#C5A059]"
                                            >
                                                Create Family
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-light">Join a Family</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Family Code</Label>
                                    <Input
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="Enter family code"
                                    />
                                </div>
                                <Button
                                    onClick={() => joinFamilyMutation.mutate()}
                                    disabled={!joinCode || joinFamilyMutation.isPending}
                                    className="w-full bg-[#C5A059]"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Join Family
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-light flex items-center gap-2">
                                    {family[0].family_name}
                                    {isAdmin && <Crown className="w-5 h-5 text-[#C5A059]" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-[#F8F7F4] rounded-lg">
                                    <div className="flex-1">
                                        <Label className="text-sm text-gray-500">Family Code</Label>
                                        <div className="text-2xl font-mono font-bold text-[#0F172A]">
                                            {family[0].family_code}
                                        </div>
                                    </div>
                                    <Button onClick={copyCode} variant="outline" size="icon">
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Share this code with family members to invite them to your family group.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-light">Family Members ({familyMembers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {familyMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#C5A059]/20 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-[#C5A059]" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{member.email}</div>
                                                    {member.email === family[0].primary_admin_email && (
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Crown className="w-3 h-3" />
                                                            Admin
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/5 to-white">
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <h3 className="font-medium text-[#0F172A]">🔒 Family Data Isolation</h3>
                                    <p className="text-sm text-gray-600">
                                        All documents uploaded by family members are shared within your family group. 
                                        Row Level Security (RLS) ensures that only your family can access these documents.
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="font-medium text-gray-700">Storage Used</div>
                                            <div className="text-[#C5A059]">{family[0].storage_used_gb || 0} / {family[0].storage_quota_gb} GB</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-700">Subscription</div>
                                            <div className="text-[#C5A059] capitalize">{family[0].subscription_tier}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}