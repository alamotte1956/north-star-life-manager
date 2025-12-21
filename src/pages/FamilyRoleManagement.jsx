import React from 'react';
import { Shield } from 'lucide-react';
import FamilyMemberManager from '../components/family/FamilyMemberManager';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function FamilyRoleManagement() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl shadow-lg">
                                    <Shield className="w-8 h-8 text-[#C5A059]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Family Role Management
                                </h1>
                                <p className="text-[#64748B] font-light">
                                    Assign roles to control member permissions
                                </p>
                            </div>
                        </div>

                        <Link to={createPageUrl('RoleManagement')}>
                            <Button 
                                variant="outline"
                                className="border-[#0F172A]/20 rounded-lg min-h-[50px]"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Roles
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    <FamilyMemberManager />

                    <div className="bg-gradient-to-br from-[#C5A059]/10 to-white border border-[#C5A059]/20 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-[#0F172A] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                            How Role-Based Access Works
                        </h3>
                        <ul className="space-y-2 text-sm text-[#64748B]">
                            <li className="flex gap-2">
                                <span className="text-[#C5A059] font-bold">•</span>
                                <span><strong>Family Admins</strong> have full access to all features and can manage roles</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#C5A059] font-bold">•</span>
                                <span><strong>Custom Roles</strong> define specific permissions for documents, folders, and other features</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#C5A059] font-bold">•</span>
                                <span><strong>Assigned Members</strong> can only perform actions allowed by their role</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#C5A059] font-bold">•</span>
                                <span><strong>Security</strong> is enforced at the database level with Row Level Security (RLS)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}