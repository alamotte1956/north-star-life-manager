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
            className={`border-[#1B4B7F]/20 hover:bg-[#1B4B7F]/5 print:hidden ${className}`}
        >
            <Printer className="w-4 h-4 mr-2" />
            Print
        </Button>
    );
}