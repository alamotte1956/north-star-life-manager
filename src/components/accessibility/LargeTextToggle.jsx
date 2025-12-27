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
            onClick={toggleLargeText}
            className="bg-gradient-to-r from-[#4A90E2] to-[#2E5C8A] text-white hover:shadow-lg gap-2 min-h-[50px]"
            title="Toggle Large Text Mode"
        >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">{largeText ? 'Normal Text' : 'Large Text'}</span>
        </Button>
    );
}