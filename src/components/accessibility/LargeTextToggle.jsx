import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Type } from 'lucide-react';

export default function LargeTextToggle() {
    const [largeText, setLargeText] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('largeTextMode') === 'true';
        setLargeText(saved);
        if (saved) {
            document.documentElement.classList.add('large-text-mode');
        }
    }, []);

    const toggleLargeText = () => {
        const newValue = !largeText;
        setLargeText(newValue);
        localStorage.setItem('largeTextMode', String(newValue));
        
        if (newValue) {
            document.documentElement.classList.add('large-text-mode');
        } else {
            document.documentElement.classList.remove('large-text-mode');
        }
    };

    return (
        <Button
            variant={largeText ? "default" : "outline"}
            size="sm"
            onClick={toggleLargeText}
            className="gap-2"
            title="Toggle Large Text Mode"
        >
            <Type className="w-4 h-4" />
            {largeText ? 'Normal Text' : 'Large Text'}
        </Button>
    );
}