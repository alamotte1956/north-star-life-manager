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
            className={`border-[#1B4B7F]/20 hover:bg-[#1B4B7F]/5 print:hidden touch-manipulation active:scale-98 transition-transform h-11 sm:h-10 ${className}`}
        >
            <Printer className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Print</span>
        </Button>
    );
}