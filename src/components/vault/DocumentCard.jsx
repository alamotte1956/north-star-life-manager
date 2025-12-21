import React from 'react';
import { FileText, Calendar, Tag, ExternalLink, Loader2, CheckCircle, AlertCircle, Home } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function DocumentCard({ document }) {
    const statusConfig = {
        pending: { icon: Loader2, color: 'text-slate-400', text: 'Pending Analysis', spin: true },
        analyzing: { icon: Loader2, color: 'text-[#C9A95C]', text: 'Analyzing...', spin: true },
        completed: { icon: CheckCircle, color: 'text-green-600', text: 'Analyzed' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Analysis Failed' }
    };

    const status = statusConfig[document.analysis_status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
        <div className="group relative bg-white border border-[#1A2B44]/10 rounded-2xl p-6 hover:shadow-xl hover:shadow-[#C9A95C]/10 transition-all duration-300">
            {/* Status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
                <StatusIcon className={`w-4 h-4 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
                <span className={`${status.color} font-light`}>{status.text}</span>
            </div>

            {/* Document icon */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#C9A95C]/20 rounded-lg blur-md" />
                    <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-[#C9A95C]" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-light text-[#1A2B44] truncate mb-1">
                        {document.title}
                    </h3>
                    <p className="text-sm text-[#1A2B44]/50 font-light">
                        {format(new Date(document.created_date), 'MMM d, yyyy')}
                    </p>
                </div>
            </div>

            {/* Document details */}
            <div className="space-y-3">
                {document.document_type && (
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#C9A95C]" />
                        <span className="text-sm text-[#1A2B44]/70 font-light">
                            {document.document_type}
                        </span>
                    </div>
                )}

                {document.expiry_date && (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#C9A95C]" />
                        <span className="text-sm text-[#1A2B44]/70 font-light">
                            Expires: {format(new Date(document.expiry_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                )}

                {document.cabin_related && (
                    <Badge className="bg-[#C9A95C]/10 text-[#C9A95C] border-[#C9A95C]/20 hover:bg-[#C9A95C]/20 font-light">
                        <Home className="w-3 h-3 mr-1" />
                        Cabin Property
                    </Badge>
                )}
            </div>

            {/* View document link */}
            <a
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#C9A95C] hover:text-[#1A2B44] transition-colors font-light"
            >
                View Document
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
}