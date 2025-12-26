import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Share2, X, Check, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ShareDialog({ open, onOpenChange, entityType, entityId, entityName }) {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [notes, setNotes] = useState('');
    const [roleId, setRoleId] = useState('');
    const [canReshare, setCanReshare] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');

    const { data: shares = [], refetch } = useQuery({
        queryKey: ['shares', entityType, entityId],
        queryFn: () => base44.entities.SharedAccess.filter({ entity_type: entityType, entity_id: entityId }),
        enabled: open
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['customRoles'],
        queryFn: () => base44.entities.CustomRole.list(),
        enabled: open
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
        enabled: open
    });

    const handleShare = async (e) => {
        e.preventDefault();
        try {
            const selectedUser = users.find(u => u.email === email);
            await base44.entities.SharedAccess.create({
                entity_type: entityType,
                entity_id: entityId,
                entity_name: entityName,
                shared_with_email: email,
                shared_with_name: selectedUser?.full_name || email,
                permission_level: permission,
                can_reshare: canReshare,
                expiry_date: expiryDate || undefined,
                notes
            });

            // Send notification
            await base44.entities.FamilyNotification.create({
                user_email: email,
                title: `${entityName} Shared With You`,
                message: `${entityName} (${entityType}) has been shared with you with ${permission} access.`,
                type: 'share',
                priority: 'normal',
                read: false,
                linked_entity_type: entityType,
                linked_entity_id: entityId
            });

            setEmail('');
            setPermission('view');
            setNotes('');
            setRoleId('');
            setCanReshare(false);
            setExpiryDate('');
            toast.success('Access shared successfully!');
            refetch();
        } catch (error) {
            toast.error('Failed to share access');
        }
    };

    const handleRemoveShare = async (shareId) => {
        await base44.entities.SharedAccess.delete(shareId);
        refetch();
    };

    const getSelectedUserRole = (userEmail) => {
        const user = users.find(u => u.email === userEmail);
        if (!user?.custom_role_id) return null;
        return roles.find(r => r.id === user.custom_role_id);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share {entityName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleShare} className="space-y-4">
                    <div>
                        <Label>Share With</Label>
                        <Select value={email} onValueChange={(val) => setEmail(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(user => {
                                    const userRole = getSelectedUserRole(user.email);
                                    return (
                                        <SelectItem key={user.id} value={user.email}>
                                            <div className="flex items-center gap-2">
                                                <span>{user.full_name || user.email}</span>
                                                {userRole && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        {userRole.role_name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Permission Level</Label>
                        <Select value={permission} onValueChange={setPermission}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="view">View Only</SelectItem>
                                <SelectItem value="comment">View & Comment</SelectItem>
                                <SelectItem value="edit">Can Edit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Expires On (optional)</Label>
                            <Input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={canReshare}
                                    onChange={(e) => setCanReshare(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Can reshare</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <Label>Notes (optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Why sharing this..."
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        <Check className="w-4 h-4 mr-2" />
                        Share Access
                    </Button>
                </form>

                {shares.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-medium mb-3">Shared With</h4>
                        <div className="space-y-2">
                            {shares.map(share => (
                                <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{share.shared_with_name || share.shared_with_email}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {share.permission_level}
                                            </Badge>
                                            {share.expiry_date && (
                                                <Badge variant="outline" className="text-xs bg-yellow-50">
                                                    Expires {format(new Date(share.expiry_date), 'MMM d')}
                                                </Badge>
                                            )}
                                            {share.can_reshare && (
                                                <Badge variant="outline" className="text-xs bg-blue-50">
                                                    Can reshare
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveShare(share.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}