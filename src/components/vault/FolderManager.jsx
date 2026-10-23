import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Folder, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function FolderManager({ selectedFolder, onFolderSelect }) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
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

    const { data: folders = [] } = useQuery({
        queryKey: ['folders', family_id],
        queryFn: () => base44.entities.DocumentFolder.filter({ family_id }),
        enabled: !!family_id
    });

    const createFolderMutation = useMutation({
        mutationFn: async (name) => {
            const folder = await base44.entities.DocumentFolder.create({
                family_id,
                name,
                created_by: user.email
            });

            // Send notification to family
            await base44.functions.invoke('sendFamilyNotification', {
                family_id,
                notification_type: 'folder_created',
                title: 'New Folder Created',
                message: `${user.email} created folder "${name}"`,
                triggered_by_email: user.email,
                metadata: { folder_id: folder.id }
            });

            return folder;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setShowCreateDialog(false);
            setNewFolderName('');
            toast.success('Folder created');
        }
    });

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#0F172A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Folders
                </h3>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    size="sm"
                    className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg font-medium min-h-[44px]"
                >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                    variant={!selectedFolder ? "default" : "outline"}
                    onClick={() => onFolderSelect(null)}
                    className={`rounded-lg font-medium min-h-[44px] ${!selectedFolder ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A]' : 'border-[#0F172A]/20'}`}
                >
                    <Folder className="w-4 h-4 mr-2" />
                    All Documents
                </Button>

                {folders.map((folder) => (
                    <Button
                        key={folder.id}
                        variant={selectedFolder?.id === folder.id ? "default" : "outline"}
                        onClick={() => onFolderSelect(folder)}
                        className={`rounded-lg font-medium whitespace-nowrap min-h-[44px] ${
                            selectedFolder?.id === folder.id 
                                ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A]' 
                                : 'border-[#0F172A]/20'
                        }`}
                    >
                        <Folder className="w-4 h-4 mr-2" style={{ color: folder.color }} />
                        {folder.name}
                    </Button>
                ))}
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && newFolderName && createFolderMutation.mutate(newFolderName)}
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                                className="flex-1 rounded-lg min-h-[50px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => createFolderMutation.mutate(newFolderName)}
                                disabled={!newFolderName || createFolderMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg min-h-[50px]"
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}