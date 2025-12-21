import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Sparkles } from 'lucide-react';
import UploadZone from '../components/vault/UploadZone';
import DocumentCard from '../components/vault/DocumentCard';
import CabinModeToggle from '../components/CabinModeToggle';
import IntelligentSearch from '../components/vault/IntelligentSearch';

export default function Vault() {
    const [cabinMode, setCabinMode] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

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
                            <div className="absolute inset-0 bg-[#C5A059]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#0F172A] to-[#1e293b] p-4 rounded-2xl">
                                <FileText className="w-8 h-8 text-[#C5A059]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#0F172A] mb-1">
                                Secure Vault
                            </h1>
                            <p className="text-[#64748B] font-light flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                                AI OCR & Auto-categorization
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-8">
                        <div className="bg-white border border-[#C5A059]/20 rounded-xl px-6 py-4 shadow-sm">
                            <div className="text-3xl font-light text-[#0F172A] mb-1">
                                {filteredDocuments.length}
                            </div>
                            <div className="text-sm text-[#64748B] font-light">
                                Secure {filteredDocuments.length === 1 ? 'File' : 'Files'}
                            </div>
                        </div>
                        <CabinModeToggle enabled={cabinMode} onChange={setCabinMode} />
                    </div>
                </div>

                {/* Intelligent Search */}
                <IntelligentSearch 
                    onDocumentSelect={(doc) => setSelectedDocument(doc)} 
                />

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
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-[#0F172A]/5 rounded-full mb-6">
                            <FileText className="w-12 h-12 text-[#0F172A]/20" />
                        </div>
                        <h3 className="text-xl font-light text-[#0F172A] mb-2">
                            {cabinMode ? 'No cabin documents' : 'Your vault is empty'}
                        </h3>
                        <p className="text-[#64748B] font-light">
                            {cabinMode ? 'Upload cabin-related documents to get started' : 'Take a photo or upload a document to begin'}
                        </p>
                    </div>
                )}
            </div>
        </div>
        </PermissionGuard>
    );
}