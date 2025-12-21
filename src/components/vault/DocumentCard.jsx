import React, { useState } from 'react';
import { FileText, Calendar, Tag, ExternalLink, Loader2, CheckCircle, AlertCircle, Home, DollarSign, Link2, Eye, Share2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ShareDialog from '@/components/collaboration/ShareDialog';
import CommentsSection from '@/components/collaboration/CommentsSection';

export default function DocumentCard({ document }) {
    const [showDetails, setShowDetails] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showComments, setShowComments] = useState(false);
    
    const statusConfig = {
        pending: { icon: Loader2, color: 'text-slate-400', text: 'Pending Analysis', spin: true },
        analyzing: { icon: Loader2, color: 'text-[#D4AF37]', text: 'Analyzing...', spin: true },
        completed: { icon: CheckCircle, color: 'text-green-600', text: 'Analyzed' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Analysis Failed' }
    };

    const status = statusConfig[document.analysis_status] || statusConfig.pending;
    const StatusIcon = status.icon;

    const categoryColors = {
        legal: 'bg-purple-100 text-purple-700',
        financial: 'bg-green-100 text-green-700',
        property: 'bg-blue-100 text-blue-700',
        vehicle: 'bg-orange-100 text-orange-700',
        health: 'bg-red-100 text-red-700',
        insurance: 'bg-indigo-100 text-indigo-700',
        tax: 'bg-yellow-100 text-yellow-700',
        personal: 'bg-pink-100 text-pink-700',
        other: 'bg-gray-100 text-gray-700'
    };

    return (
        <div className="group relative bg-white border border-[#1B4B7F]/10 rounded-2xl p-6 hover:shadow-xl hover:shadow-[#8B2635]/10 transition-all duration-300">
            {/* Status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
                <StatusIcon className={`w-4 h-4 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
                <span className={`${status.color} font-light`}>{status.text}</span>
            </div>

            {/* Document icon */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#8B2635]/20 rounded-lg blur-md" />
                    <div className="relative bg-gradient-to-br from-[#1B4B7F] to-[#0F2847] p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-[#E8DCC4]" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-light text-black truncate mb-1">
                        {document.title}
                    </h3>
                    <p className="text-sm text-black/50 font-light">
                        {format(new Date(document.created_date), 'MMM d, yyyy')}
                    </p>
                </div>
            </div>

            {/* Document details */}
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {document.category && (
                        <Badge className={`${categoryColors[document.category]} font-light`}>
                            {document.category}
                        </Badge>
                    )}
                    {document.cabin_related && (
                        <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 font-light">
                            <Home className="w-3 h-3 mr-1" />
                            Cabin
                        </Badge>
                    )}
                </div>

                {document.document_type && (
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm text-[#1A2B44]/70 font-light">
                            {document.document_type}
                        </span>
                    </div>
                )}

                {document.amount && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                            ${document.amount.toLocaleString()}
                        </span>
                    </div>
                )}

                {document.expiry_date && (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm text-[#1A2B44]/70 font-light">
                            Expires: {format(new Date(document.expiry_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                )}

                {document.linked_entity_name && (
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-light">
                            {document.linked_entity_type}: {document.linked_entity_name}
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                    <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-lg transition-colors font-light border border-[#D4AF37]/20"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View
                    </a>
                    {document.extracted_text && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDetails(true)}
                            className="flex-1 border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowShare(true)}
                        className="flex-1 border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowComments(!showComments)}
                        className="flex-1 border-[#D4AF37]/20 hover:bg-[#D4AF37]/5"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Comments
                    </Button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-[#D4AF37]/20">
                    <CommentsSection 
                        entityType="Document" 
                        entityId={document.id}
                        showComments={showComments}
                    />
                </div>
            )}

            {/* Share Dialog */}
            <ShareDialog
                open={showShare}
                onOpenChange={setShowShare}
                entityType="Document"
                entityId={document.id}
                entityName={document.title}
            />

            {/* Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{document.title}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* AI Summary */}
                        {document.ai_summary && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                                    <span>✨</span> AI Summary
                                </h3>
                                <p className="text-sm text-blue-800">{document.ai_summary}</p>
                            </div>
                        )}

                        {/* Key Points */}
                        {document.key_points?.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-purple-900 mb-3">Key Points</h3>
                                <ul className="space-y-2">
                                    {document.key_points.map((point, i) => (
                                        <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                                            <span className="font-bold">•</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Items */}
                        {document.action_items?.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-orange-900 mb-3 flex items-center gap-2">
                                    <span>⚡</span> Action Items
                                </h3>
                                <ul className="space-y-2">
                                    {document.action_items.map((item, i) => (
                                        <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                                            <span className="font-bold">{i + 1}.</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Extracted Data */}
                        {document.extracted_data && Object.keys(document.extracted_data).length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-[#1A2B44] mb-3">Extracted Information</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    {Object.entries(document.extracted_data).map(([key, value]) => (
                                        <div key={key} className="flex gap-2">
                                            <span className="text-sm font-medium text-[#1A2B44]/70 capitalize">
                                                {key.replace(/_/g, ' ')}:
                                            </span>
                                            <span className="text-sm text-[#1A2B44]">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Full Text */}
                        {document.extracted_text && (
                            <div>
                                <h3 className="text-sm font-medium text-[#1A2B44] mb-3">Extracted Text (OCR)</h3>
                                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <pre className="text-xs text-[#1A2B44]/80 whitespace-pre-wrap font-mono">
                                        {document.extracted_text}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}