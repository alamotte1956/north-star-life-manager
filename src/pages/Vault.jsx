import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Sparkles } from 'lucide-react';
import UploadZone from '../components/vault/UploadZone';
import DocumentCard from '../components/vault/DocumentCard';
import CabinModeToggle from '../components/CabinModeToggle';

export default function Vault() {
    const [cabinMode, setCabinMode] = useState(false);

    const { data: documents = [], refetch } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 100),
        refetchInterval: 3000 // Poll for analysis updates
    });

    const filteredDocuments = cabinMode 
        ? documents.filter(doc => doc.cabin_related)
        : documents;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                                <FileText className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-1">
                                Secure Vault
                            </h1>
                            <p className="text-[#1A2B44]/60 font-light flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                AI OCR & Auto-categorization
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-8">
                        <div className="text-sm text-[#1A2B44]/50 font-light">
                            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
                        </div>
                        <CabinModeToggle enabled={cabinMode} onChange={setCabinMode} />
                    </div>
                </div>

                {/* Upload Zone */}
                <div className="mb-12">
                    <UploadZone onUploadComplete={refetch} />
                </div>

                {/* Documents Grid */}
                {filteredDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map(doc => (
                            <DocumentCard key={doc.id} document={doc} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1A2B44]/5 rounded-full mb-4">
                            <FileText className="w-10 h-10 text-[#1A2B44]/20" />
                        </div>
                        <p className="text-[#1A2B44]/40 font-light">
                            {cabinMode ? 'No cabin-related documents yet' : 'No documents uploaded yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}