import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList } from 'lucide-react';

export default function SimplifiedViewToggle() {
    const [simplified, setSimplified] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('simplifiedView') === 'true';
        setSimplified(saved);
    }, []);

    const toggleView = () => {
        const newValue = !simplified;
        setSimplified(newValue);
        localStorage.setItem('simplifiedView', String(newValue));
        window.location.reload(); // Reload to apply nav changes
    };

    return (
        <Button
            onClick={toggleView}
            className="bg-gradient-to-r from-[#4A90E2] to-[#2E5C8A] text-white hover:shadow-lg gap-2 min-h-[50px]"
            title="Toggle Simplified Navigation"
        >
            {simplified ? <LayoutList className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            <span className="hidden sm:inline">{simplified ? 'Full Menu' : 'Simple Menu'}</span>
        </Button>
    );
}