import React, { useState } from 'react';
import logger from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import logger from '@/utils/logger';
import { base44 } from '@/api/base44Client';
import logger from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logger from '@/utils/logger';
import { Button } from '@/components/ui/button';
import logger from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import logger from '@/utils/logger';
import { ScrollArea } from '@/components/ui/scroll-area';
import logger from '@/utils/logger';
import { History, Clock, User, FileText, Download, RotateCcw, Loader2, ExternalLink } from 'lucide-react';
import logger from '@/utils/logger';
import { format } from 'date-fns';
import logger from '@/utils/logger';
import { toast } from 'sonner';
import logger from '@/utils/logger';

export default function DocumentVersionHistory({ document, open, onOpenChange }) {
    const [reverting, setReverting] = useState(null);
    const queryClient = useQueryClient();

    const { data: versions = [], isLoading } = useQuery({
        queryKey: ['documentVersions', document?.id],
        queryFn: () => base44.entities.DocumentVersion.filter({ document_id: document.id }, '-version_number'),
        enabled: !!document && open
    });

    const revertMutation = useMutation({
        mutationFn: async (version) => {
            // Create new version from the old one
            const latestVersion = versions[0];
            const newVersionNumber = (latestVersion?.version_number || 0) + 1;

            // Create new version entry
            await base44.entities.DocumentVersion.create({
                document_id: document.id,
                version_number: newVersionNumber,
                file_url: version.file_url,
                title: version.title,
                change_description: `Reverted to version ${version.version_number}`,
                uploaded_by: (await base44.auth.me()).email,
                extracted_text: version.extracted_text,
                extracted_data: version.extracted_data,
                is_current: true
            });

            // Update all other versions to not be current
            for (const v of versions) {
                if (v.is_current) {
                    await base44.entities.DocumentVersion.update(v.id, { is_current: false });
                }
            }

            // Update main document
            await base44.entities.Document.update(document.id, {
                file_url: version.file_url,
                title: version.title,
                extracted_text: version.extracted_text,
                extracted_data: version.extracted_data
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentVersions'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('Document reverted successfully');
            setReverting(null);
        },
        onError: (error) => {
            toast.error('Failed to revert document');
            logger.error(error);
            setReverting(null);
        }
    });

    const handleRevert = (version) => {
        if (confirm(`Revert to version ${version.version_number}? This will create a new version with the old content.`)) {
            setReverting(version.id);
            revertMutation.mutate(version);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return 'Unknown';
        const mb = bytes / (1024 * 1024);
        return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-[#C5A059]" />
                        Version History - {document?.title}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[500px] pr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
                            <p className="text-[#64748B]">No version history available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className={`p-4 border rounded-lg ${
                                        version.is_current
                                            ? 'border-[#C5A059] bg-[#C5A059]/5'
                                            : 'border-[#0F172A]/10'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-2 rounded-lg">
                                                <FileText className="w-5 h-5 text-[#C5A059]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-[#0F172A]">
                                                        Version {version.version_number}
                                                    </h3>
                                                    {version.is_current && (
                                                        <Badge className="bg-[#C5A059] text-[#0F172A]">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[#64748B]">
                                                    {version.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={version.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-[#0F172A]/5 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4 text-[#64748B]" />
                                            </a>
                                            {!version.is_current && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRevert(version)}
                                                    disabled={reverting === version.id}
                                                    className="gap-2"
                                                >
                                                    {reverting === version.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="w-4 h-4" />
                                                    )}
                                                    Revert
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-[#64748B]">
                                            <Clock className="w-4 h-4" />
                                            {format(new Date(version.created_date), 'MMM dd, yyyy • HH:mm')}
                                        </div>
                                        <div className="flex items-center gap-2 text-[#64748B]">
                                            <User className="w-4 h-4" />
                                            {version.uploaded_by || version.created_by}
                                        </div>
                                        {version.file_size_bytes && (
                                            <div className="flex items-center gap-2 text-[#64748B]">
                                                <Download className="w-4 h-4" />
                                                {formatBytes(version.file_size_bytes)}
                                            </div>
                                        )}
                                        {version.change_description && (
                                            <div className="mt-2 p-2 bg-[#0F172A]/5 rounded text-[#0F172A]">
                                                <span className="font-medium">Changes: </span>
                                                {version.change_description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}