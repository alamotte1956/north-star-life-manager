import React, { useState } from 'react';
import { Shield, FileText, Phone, CreditCard, Eye, EyeOff, MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categoryConfig = {
    security_code: { icon: Shield, label: 'Security Code', color: 'from-red-500 to-red-600' },
    legal_document: { icon: FileText, label: 'Legal Document', color: 'from-blue-500 to-blue-600' },
    emergency_contact: { icon: Phone, label: 'Emergency Contact', color: 'from-green-500 to-green-600' },
    account_info: { icon: CreditCard, label: 'Account Info', color: 'from-purple-500 to-purple-600' },
    other: { icon: AlertTriangle, label: 'Other', color: 'from-gray-500 to-gray-600' }
};

const priorityColors = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
};

export default function EmergencyCard({ info }) {
    const [revealed, setRevealed] = useState(false);
    const category = categoryConfig[info.category] || categoryConfig.other;
    const Icon = category.icon;

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#C9A95C]/30 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-br ${category.color} p-3 rounded-xl`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-light text-white">{info.title}</h3>
                        <p className="text-sm text-white/50 font-light">{category.label}</p>
                    </div>
                </div>
                <Badge className={`${priorityColors[info.priority]} border font-light`}>
                    {info.priority}
                </Badge>
            </div>

            {info.location && (
                <div className="flex items-center gap-2 mb-4 text-white/60">
                    <MapPin className="w-4 h-4 text-[#C9A95C]" />
                    <span className="text-sm font-light">{info.location}</span>
                </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 relative">
                {revealed ? (
                    <p className="text-white font-mono text-sm whitespace-pre-wrap">
                        {info.content}
                    </p>
                ) : (
                    <div className="flex items-center justify-center py-4">
                        <div className="flex gap-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-white/20 rounded-full" />
                            ))}
                        </div>
                    </div>
                )}
                
                <button
                    onClick={() => setRevealed(!revealed)}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                    {revealed ? (
                        <EyeOff className="w-4 h-4 text-white" />
                    ) : (
                        <Eye className="w-4 h-4 text-white" />
                    )}
                </button>
            </div>
        </div>
    );
}