import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadNewVersion({ document, open, onOpenChange, onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [changeDescription, setChangeDescription] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload a PDF or image file');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);

        try {
            const user = await base44.auth.me();

            // Get existing versions to calculate new version number
            const existingVersions = await base44.entities.DocumentVersion.filter(
                { document_id: document.id },
                '-version_number'
            );
            const latestVersion = existingVersions[0];
            const newVersionNumber = (latestVersion?.version_number || 0) + 1;

            // Upload new file to Supabase
            const uploadResponse = await base44.functions.invoke('supabaseUploadDocument', {
                file: selectedFile,
                document_id: document.id,
                family_id: document.family_id
            });
            const file_url = uploadResponse.data.file_url;

            // Create version entry for the OLD file (if no versions exist yet)
            if (existingVersions.length === 0) {
                await base44.entities.DocumentVersion.create({
                    document_id: document.id,
                    version_number: 1,
                    file_url: document.file_url,
                    title: document.title,
                    change_description: 'Original version',
                    uploaded_by: document.created_by,
                    extracted_text: document.extracted_text,
                    extracted_data: document.extracted_data,
                    file_size_bytes: null,
                    is_current: false
                });
            } else {
                // Mark all existing versions as not current
                for (const version of existingVersions) {
                    if (version.is_current) {
                        await base44.entities.DocumentVersion.update(version.id, { is_current: false });
                    }
                }
            }

            // Create new version entry
            await base44.entities.DocumentVersion.create({
                document_id: document.id,
                version_number: newVersionNumber,
                file_url,
                title: document.title,
                change_description: changeDescription || 'Updated document',
                uploaded_by: user.email,
                file_size_bytes: selectedFile.size,
                is_current: true
            });

            // Update main document record
            await base44.entities.Document.update(document.id, {
                file_url,
                analysis_status: 'pending'
            });

            // Trigger AI analysis for new version
            base44.functions.invoke('analyzeDocument', {
                document_id: document.id,
                file_url
            }).catch(err => console.error('Analysis error:', err));

            toast.success(`Version ${newVersionNumber} uploaded successfully`);
            onUploadComplete?.();
            onOpenChange(false);
            setSelectedFile(null);
            setChangeDescription('');
        } catch (error) {
            toast.error('Upload failed');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload New Version</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Current Document</Label>
                        <p className="text-sm text-[#64748B] mt-1">{document?.title}</p>
                    </div>

                    <div>
                        <Label>Select New File</Label>
                        <div className="mt-2">
                            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[#0F172A]/20 rounded-lg cursor-pointer hover:border-[#C5A059]/50 transition-colors">
                                <input
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/heic,image/heif"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                                    <p className="text-sm text-[#64748B]">
                                        {selectedFile ? selectedFile.name : 'Click to select file'}
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <Label>What Changed? (Optional)</Label>
                        <Textarea
                            placeholder="Describe what was updated in this version..."
                            value={changeDescription}
                            onChange={(e) => setChangeDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                            className="flex-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A]"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Version
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}