import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Share2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

export default function ShareDialog({ entityType, entityId, entityName }) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [notes, setNotes] = useState('');

    const { data: shares = [], refetch } = useQuery({
        queryKey: ['shares', entityType, entityId],
        queryFn: () => base44.entities.SharedAccess.filter({ entity_type: entityType, entity_id: entityId }),
        enabled: open
    });

    const handleShare = async (e) => {
        e.preventDefault();
        await base44.entities.SharedAccess.create({
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            shared_with_email: email,
            permission_level: permission,
            notes
        });
        setEmail('');
        setPermission('view');
        setNotes('');
        refetch();
    };

    const handleRemoveShare = async (shareId) => {
        await base44.entities.SharedAccess.delete(shareId);
        refetch();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Share {entityName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleShare} className="space-y-4">
                    <div>
                        <Label>Email Address</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            required
                        />
                    </div>

                    <div>
                        <Label>Permission Level</Label>
                        <Select value={permission} onValueChange={setPermission}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="view">View Only</SelectItem>
                                <SelectItem value="edit">Can Edit</SelectItem>
                            </SelectContent>
                        </Select>
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
                                        <div className="text-sm">{share.shared_with_email}</div>
                                        <Badge variant="outline" className="text-xs mt-1">
                                            {share.permission_level}
                                        </Badge>
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