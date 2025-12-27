import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrintButton({ className = '' }) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <Button
            variant="outline"
            onClick={handlePrint}
            className={`border-[#0F172A]/20 hover:bg-[#C5A059]/10 hover:border-[#C5A059]/30 print:hidden touch-manipulation active:scale-98 transition-all min-h-[50px] rounded-lg shadow-sm font-medium text-[#0F172A] ${className}`}
        >
            <Printer className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Print</span>
        </Button>
    );
}