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
            variant={simplified ? "default" : "outline"}
            size="sm"
            onClick={toggleView}
            className="gap-2"
            title="Toggle Simplified Navigation"
        >
            {simplified ? <LayoutList className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            {simplified ? 'Full Menu' : 'Simple Menu'}
        </Button>
    );
}