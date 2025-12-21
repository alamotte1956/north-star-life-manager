import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

export default function MobileDocumentViewer({ document, open, onOpenChange }) {
    const [zoom, setZoom] = useState(100);

    if (!document) return null;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
                    text: document.ai_summary || 'Document from North Star',
                    url: document.file_url
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    toast.error('Failed to share');
                }
            }
        } else {
            navigator.clipboard.writeText(document.file_url);
            toast.success('Link copied to clipboard');
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = document.file_url;
        link.download = document.title;
        link.click();
        toast.success('Downloading...');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full h-screen p-0 m-0 rounded-none">
                {/* Mobile Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0F172A] to-[#1e293b] border-b border-[#C5A059]/20 safe-area-inset">
                    <div className="flex items-center justify-between px-4 h-16">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-white min-h-[50px] min-w-[50px]"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                        
                        <div className="flex-1 mx-4 truncate">
                            <h3 className="text-white font-medium truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                                {document.title}
                            </h3>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleShare}
                                className="text-white min-h-[50px] min-w-[50px]"
                            >
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDownload}
                                className="text-white min-h-[50px] min-w-[50px]"
                            >
                                <Download className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Document Viewer */}
                <div className="pt-16 h-full overflow-auto bg-[#F8F9FA]">
                    <div className="p-4">
                        {/* AI Summary Card */}
                        {document.ai_summary && (
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-[#C5A059]/20">
                                <h4 className="font-medium text-[#0F172A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    AI Summary
                                </h4>
                                <p className="text-[#64748B] text-sm leading-relaxed">
                                    {document.ai_summary}
                                </p>
                            </div>
                        )}

                        {/* Key Points */}
                        {document.key_points?.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-[#C5A059]/20">
                                <h4 className="font-medium text-[#0F172A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Key Points
                                </h4>
                                <ul className="space-y-2">
                                    {document.key_points.map((point, idx) => (
                                        <li key={idx} className="flex gap-2 text-sm text-[#64748B]">
                                            <span className="text-[#C5A059] font-bold">•</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Document Image/PDF */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-[#0F172A]/10">
                            {document.file_url.endsWith('.pdf') ? (
                                <iframe
                                    src={document.file_url}
                                    className="w-full"
                                    style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
                                    title={document.title}
                                />
                            ) : (
                                <img
                                    src={document.file_url}
                                    alt={document.title}
                                    className="w-full h-auto"
                                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Zoom Controls for Images */}
                {!document.file_url.endsWith('.pdf') && (
                    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-[#0F172A]/10 flex gap-2 p-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(Math.max(50, zoom - 25))}
                            className="rounded-full"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </Button>
                        <div className="px-3 flex items-center justify-center min-w-[60px] text-sm font-medium">
                            {zoom}%
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(Math.min(200, zoom + 25))}
                            className="rounded-full"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}