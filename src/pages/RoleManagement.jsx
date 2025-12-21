import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, Plus, Edit, Trash2, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';
import PermissionGuard from '@/components/PermissionGuard';

const permissionSections = [
    { key: 'properties', label: 'Properties', icon: '🏠' },
    { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { key: 'documents', label: 'Documents', icon: '📄' },
    { key: 'financial', label: 'Financial', icon: '💰' },
    { key: 'calendar', label: 'Calendar', icon: '📅' },
    { key: 'contacts', label: 'Contacts', icon: '👥' },
    { key: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { key: 'health', label: 'Health', icon: '❤️' },
    { key: 'legal', label: 'Legal & Estate', icon: '⚖️' },
    { key: 'reports', label: 'Reports', icon: '📊' },
    { key: 'user_management', label: 'User Management', icon: '👤' }
];

export default function RoleManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        role_name: '',
        description: '',
        permissions: {}
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['customRoles'],
        queryFn: () => base44.entities.CustomRole.list()
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list()
    });

    const createRoleMutation = useMutation({
        mutationFn: (data) => editingRole 
            ? base44.entities.CustomRole.update(editingRole.id, data)
            : base44.entities.CustomRole.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['customRoles']);
            setDialogOpen(false);
            setEditingRole(null);
            toast.success(editingRole ? 'Role updated!' : 'Role created!');
        }
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (id) => base44.entities.CustomRole.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['customRoles']);
            toast.success('Role deleted!');
        }
    });

    const updateUserRoleMutation = useMutation({
        mutationFn: ({ userId, roleId, roleName }) => 
            base44.auth.updateMe({ custom_role_id: roleId, custom_role_name: roleName }),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('User role updated!');
        }
    });

    const initializePermissions = () => {
        const perms = {};
        permissionSections.forEach(section => {
            perms[section.key] = {
                view: false,
                edit: false,
                delete: section.key === 'reports' ? undefined : false,
                generate: section.key === 'reports' ? false : undefined,
                invite: section.key === 'user_management' ? false : undefined,
                edit_roles: section.key === 'user_management' ? false : undefined
            };
        });
        return perms;
    };

    const handleOpenDialog = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                role_name: role.role_name,
                description: role.description || '',
                permissions: role.permissions
            });
        } else {
            setEditingRole(null);
            setFormData({
                role_name: '',
                description: '',
                permissions: initializePermissions()
            });
        }
        setDialogOpen(true);
    };

    const handlePermissionChange = (section, permission, value) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [section]: {
                    ...prev.permissions[section],
                    [permission]: value
                }
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createRoleMutation.mutate(formData);
    };

    return (
        <PermissionGuard section="user_management" action="view">
            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#F8F9FA]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-2xl">
                                <Shield className="w-8 h-8 text-[#C5A059]" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-light text-[#0F172A]">Role Management</h1>
                                <p className="text-[#64748B] font-light">Control access and permissions</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setUserDialogOpen(true)}
                                className="gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Manage Users
                            </Button>
                            <Button
                                onClick={() => handleOpenDialog()}
                                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create Role
                            </Button>
                        </div>
                    </div>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map(role => (
                            <Card key={role.id} className="border-[#0F172A]/10">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-light flex items-center gap-2">
                                                <Lock className="w-5 h-5 text-[#C5A059]" />
                                                {role.role_name}
                                            </CardTitle>
                                            {role.description && (
                                                <p className="text-sm text-[#64748B] mt-2">{role.description}</p>
                                            )}
                                        </div>
                                        <Badge className={role.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                            {role.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 mb-4">
                                        {permissionSections.map(section => {
                                            const perms = role.permissions[section.key];
                                            if (!perms) return null;
                                            const activePerms = Object.entries(perms).filter(([_, v]) => v === true);
                                            if (activePerms.length === 0) return null;
                                            
                                            return (
                                                <div key={section.key} className="flex items-center justify-between text-sm">
                                                    <span className="text-[#0F172A]/70">{section.icon} {section.label}</span>
                                                    <div className="flex gap-1">
                                                        {activePerms.map(([perm]) => (
                                                            <Badge key={perm} variant="outline" className="text-xs">
                                                                {perm}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenDialog(role)}
                                            className="flex-1"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Delete this role?')) {
                                                    deleteRoleMutation.mutate(role.id);
                                                }
                                            }}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Create/Edit Role Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Role Name</Label>
                                        <Input
                                            value={formData.role_name}
                                            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                                            placeholder="e.g., Property Manager"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="What this role does..."
                                            rows={1}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-4">Permissions</h3>
                                    <div className="space-y-4">
                                        {permissionSections.map(section => (
                                            <Card key={section.key} className="bg-[#F8F9FA]">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                                        <span>{section.icon}</span>
                                                        {section.label}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {section.key === 'reports' ? (
                                                            <>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.view || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'view', val)}
                                                                    />
                                                                    <Label>View</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.generate || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'generate', val)}
                                                                    />
                                                                    <Label>Generate</Label>
                                                                </div>
                                                            </>
                                                        ) : section.key === 'user_management' ? (
                                                            <>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.view || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'view', val)}
                                                                    />
                                                                    <Label>View</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.invite || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'invite', val)}
                                                                    />
                                                                    <Label>Invite</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.edit_roles || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'edit_roles', val)}
                                                                    />
                                                                    <Label>Edit Roles</Label>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.view || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'view', val)}
                                                                    />
                                                                    <Label>View</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.edit || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'edit', val)}
                                                                    />
                                                                    <Label>Edit</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={formData.permissions[section.key]?.delete || false}
                                                                        onCheckedChange={(val) => handlePermissionChange(section.key, 'delete', val)}
                                                                    />
                                                                    <Label>Delete</Label>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white">
                                        {editingRole ? 'Update Role' : 'Create Role'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* User Management Dialog */}
                    <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Manage User Roles</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                                {users.map(user => (
                                    <Card key={user.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{user.full_name}</div>
                                                    <div className="text-sm text-[#64748B]">{user.email}</div>
                                                    {user.custom_role_name && (
                                                        <Badge className="mt-2 bg-[#C5A059]/10 text-[#C5A059]">
                                                            {user.custom_role_name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <select
                                                    className="px-3 py-2 border rounded-lg"
                                                    value={user.custom_role_id || ''}
                                                    onChange={(e) => {
                                                        const selectedRole = roles.find(r => r.id === e.target.value);
                                                        updateUserRoleMutation.mutate({
                                                            userId: user.id,
                                                            roleId: e.target.value,
                                                            roleName: selectedRole?.role_name
                                                        });
                                                    }}
                                                >
                                                    <option value="">No Custom Role</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.role_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </PermissionGuard>
    );
}