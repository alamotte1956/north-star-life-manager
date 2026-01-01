import React, { useState } from 'react';
import logger from '@/utils/logger';
import { Upload, FileText, Loader2, Camera, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import MobileCameraCapture from './MobileCameraCapture';
import { useRolePermission } from '../family/RoleBasedGuard';

export default function UploadZone({ onUploadComplete }) {
    const [showCamera, setShowCamera] = useState(false);
    const { hasPermission: canUpload } = useRolePermission('documents', 'edit');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [showMetadataDialog, setShowMetadataDialog] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [metadata, setMetadata] = useState({
        title: '',
        category: 'other',
        expiry_date: null
    });

    const handleFile = (file) => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
        if (!file || !validTypes.includes(file.type)) {
            toast.error('Please upload a PDF or image file (JPG, PNG, HEIC)');
            return;
        }

        setPendingFile(file);
        setMetadata({
            title: file.name.replace(/\.(pdf|jpg|jpeg|png|heic|heif)$/i, ''),
            category: 'other',
            expiry_date: null
        });
        setShowMetadataDialog(true);
    };

    const handleUploadWithMetadata = async () => {
        if (!pendingFile) return;

        if (!canUpload) {
            toast.error('You do not have permission to upload documents');
            return;
        }

        setUploading(true);
        setShowMetadataDialog(false);

        try {
            // Upload file
            const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });

            // Create document record
            const document = await base44.entities.Document.create({
                title: metadata.title,
                file_url,
                category: metadata.category,
                expiry_date: metadata.expiry_date,
                analysis_status: 'pending'
            });

            // Trigger AI analysis - detect financial documents
            const isFinancial = ['invoice', 'receipt', 'bill', 'statement', 'tax'].some(term =>
                metadata.title.toLowerCase().includes(term) || 
                metadata.category === 'financial'
            );
            
            base44.functions.invoke('analyzeDocument', {
                document_id: document.id,
                file_url,
                is_financial: isFinancial
            }).catch(err => {
                logger.error('Analysis error:', err);
                toast.error('Analysis failed, but document was saved');
            });

            toast.success('Document uploaded successfully');
            onUploadComplete?.(document);
            setPendingFile(null);
        } catch (error) {
            toast.error('Upload failed');
            logger.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    return (
        <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all bg-white shadow-sm ${
                  dragActive 
                      ? 'border-[#C5A059] bg-[#C5A059]/5' 
                      : 'border-[#0F172A]/20 hover:border-[#C5A059]/50'
              }`}
          >
            {uploading ? (
                <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-[#C5A059] animate-spin" />
                        <p className="text-[#64748B] font-light">Uploading and analyzing...</p>
                    </div>
            ) : (
                <>
                    <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#C5A059]/30 rounded-full blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-6 rounded-2xl shadow-lg">
                                    <Upload className="w-8 h-8 text-[#C5A059]" />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-light text-[#0F172A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Upload Document or Photo
                        </h3>
                        <p className="text-[#64748B] mb-6 font-light">
                            Drag and drop files, take a photo, or browse your device
                        </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            onClick={() => setShowCamera(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A] rounded-lg hover:shadow-lg hover:shadow-[#C5A059]/30 transition-all font-medium min-h-[50px]"
                        >
                            <Camera className="w-5 h-5" />
                            Take Photo
                        </Button>

                            <label className="inline-block">
                            <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/jpg,image/png,image/heic,image/heif"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                className="hidden"
                            />
                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0F172A] to-[#1e293b] text-[#C5A059] rounded-lg cursor-pointer hover:shadow-lg hover:shadow-[#0F172A]/20 transition-all font-medium min-h-[50px]">
                                <FileText className="w-5 h-5" />
                                Choose File
                            </span>
                            </label>
                    </div>
                </>
            )}

            {/* Metadata Dialog */}
            <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Document Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
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

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowMetadataDialog(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUploadWithMetadata}
                                disabled={!metadata.title}
                                className="flex-1 bg-[#C5A059]"
                            >
                                Upload
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <MobileCameraCapture
                open={showCamera}
                onOpenChange={setShowCamera}
                onCapture={handleFile}
            />
        </div>
    );
}