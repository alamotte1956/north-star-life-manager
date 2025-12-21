import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupabaseUploadZone({ onUploadComplete, linkedEntity }) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [metadata, setMetadata] = useState({
        title: '',
        category: 'other',
        linked_entity_type: linkedEntity?.type || '',
        linked_entity_id: linkedEntity?.id || '',
        linked_entity_name: linkedEntity?.name || ''
    });

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!metadata.title) {
                setMetadata({ ...metadata, title: selectedFile.name });
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify(metadata));

            const response = await base44.functions.invoke('supabaseUploadDocument', formData);

            toast.success('Document uploaded securely to Supabase!');
            setFile(null);
            setMetadata({ ...metadata, title: '' });
            onUploadComplete?.();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="border-2 border-dashed border-[#C5A059]/30 bg-gradient-to-br from-[#F8F7F4] to-white">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#C5A059]/20 border-dashed rounded-lg cursor-pointer bg-[#F8F7F4] hover:bg-[#C5A059]/5 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <FileText className="w-10 h-10 mb-3 text-[#C5A059]" />
                                        <p className="text-sm text-gray-700">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileSelect}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {file && (
                        <>
                            <div>
                                <Label>Document Title</Label>
                                <Input
                                    value={metadata.title}
                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                    placeholder="Enter document title..."
                                />
                            </div>

                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={metadata.category}
                                    onValueChange={(value) => setMetadata({ ...metadata, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="legal">Legal</SelectItem>
                                        <SelectItem value="financial">Financial</SelectItem>
                                        <SelectItem value="property">Property</SelectItem>
                                        <SelectItem value="vehicle">Vehicle</SelectItem>
                                        <SelectItem value="health">Health</SelectItem>
                                        <SelectItem value="insurance">Insurance</SelectItem>
                                        <SelectItem value="tax">Tax</SelectItem>
                                        <SelectItem value="personal">Personal</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900">
                                        <strong>Secure Storage:</strong> This document will be encrypted and stored in Supabase with Row Level Security. Only you can access it.
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={uploading || !metadata.title}
                                className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] h-12"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading Securely...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload to Supabase
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}