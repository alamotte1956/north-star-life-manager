import React from 'react';
import { Home } from 'lucide-react';

export default function CabinModeToggle({ enabled, onChange }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${
                enabled
                    ? 'bg-gradient-to-r from-[#8B2635] to-[#A63446] text-white shadow-lg shadow-[#8B2635]/30'
                    : 'bg-white border border-[#1B4B7F]/20 text-[#1B4B7F]/60 hover:border-[#8B2635]/50'
            }`}
        >
            <Home className={`w-5 h-5 ${enabled ? 'text-white' : 'text-[#8B2635]'}`} />
            <span className="font-light">Cabin Mode</span>
            {enabled && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
        </button>
    );
}