import React, { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UploadZone({ onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file');
            return;
        }

        setUploading(true);
        try {
            // Upload file
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            // Create document record
            const document = await base44.entities.Document.create({
                title: file.name.replace('.pdf', ''),
                file_url,
                analysis_status: 'pending'
            });

            // Trigger AI analysis
            base44.functions.invoke('analyzeDocument', {
                document_id: document.id,
                file_url
            }).catch(err => {
                console.error('Analysis error:', err);
                toast.error('Analysis failed, but document was saved');
            });

            toast.success('Document uploaded successfully');
            onUploadComplete?.(document);
        } catch (error) {
            toast.error('Upload failed');
            console.error(error);
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
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive 
                    ? 'border-[#8B2635] bg-[#8B2635]/5' 
                    : 'border-[#1B4B7F]/20 hover:border-[#8B2635]/50'
            }`}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-[#8B2635] animate-spin" />
                    <p className="text-[#1A2B44]/60 font-light">Uploading and analyzing...</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#8B2635]/20 rounded-full blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1B4B7F] to-[#0F2847] p-6 rounded-2xl">
                                <Upload className="w-8 h-8 text-[#E8DCC4]" />
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-light text-[#1A2B44] mb-2">
                        Upload Document
                    </h3>
                    <p className="text-[#1A2B44]/60 mb-6 font-light">
                        Drag and drop your PDF here, or click to browse
                    </p>
                    
                    <label className="inline-block">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#1B4B7F] to-[#0F2847] text-white rounded-full cursor-pointer hover:shadow-lg hover:shadow-[#8B2635]/20 transition-all font-light">
                            <FileText className="w-4 h-4" />
                            Select PDF
                        </span>
                    </label>
                </>
            )}
        </div>
    );
}