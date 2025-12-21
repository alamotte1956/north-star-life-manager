import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function SupabaseUploadZone({ onUploadComplete, linkedEntity }) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [metadata, setMetadata] = useState({
        title: '',
        category: 'other',
        expiry_date: null,
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
        <Card className="border-2 border-dashed border-[#0F172A]/20 bg-white shadow-sm hover:border-[#C5A059]/50 transition-all">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#0F172A]/10 border-dashed rounded-lg cursor-pointer bg-[#F8F9FA] hover:bg-[#C5A059]/5 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <FileText className="w-10 h-10 mb-3 text-[#C5A059]" />
                                        <p className="text-sm text-gray-700">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 mb-3 text-[#C5A059]" />
                                        <p className="mb-2 text-sm text-[#64748B]">
                                            <span className="font-medium text-[#0F172A]">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-[#64748B]">PDF, PNG, JPG (MAX. 10MB)</p>
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

                            <div>
                                <Label>Expiry Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {metadata.expiry_date ? format(new Date(metadata.expiry_date), 'PPP') : 'Set expiry date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                            mode="single"
                                            selected={metadata.expiry_date ? new Date(metadata.expiry_date) : undefined}
                                            onSelect={(date) => setMetadata({ ...metadata, expiry_date: date ? date.toISOString().split('T')[0] : null })}
                                            disabled={(date) => date < new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-gray-500 mt-1">Get notified before expiration</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-[#C5A059]/10 to-[#C5A059]/5 border border-[#C5A059]/30 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <FileText className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-[#0F172A] font-light">
                                        <strong className="font-medium">Secure Storage:</strong> This document will be encrypted and stored in Supabase with Row Level Security. Only your family can access it.
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={uploading || !metadata.title}
                                className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg font-medium hover:shadow-lg hover:shadow-[#C5A059]/30 transition-all min-h-[50px]"
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