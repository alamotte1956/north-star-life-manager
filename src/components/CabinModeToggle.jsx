import React from 'react';
import { Home } from 'lucide-react';

export default function CabinModeToggle({ enabled, onChange }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
                enabled
                    ? 'bg-gradient-to-r from-[#C9A95C] to-[#D4AF37] text-white shadow-lg shadow-[#C9A95C]/30'
                    : 'bg-white border border-[#1A2B44]/20 text-[#1A2B44]/60 hover:border-[#C9A95C]/50'
            }`}
        >
            <Home className={`w-5 h-5 ${enabled ? 'text-white' : 'text-[#C9A95C]'}`} />
            <span className="font-light">Cabin Mode</span>
            {enabled && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
        </button>
    );
}