import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Sparkles } from 'lucide-react';

export default function SmartInput({ 
    entityType, 
    field, 
    value, 
    onChange, 
    partialData = {},
    ...props 
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (value && value.length > 2) {
            loadSuggestions();
        } else {
            setSuggestions([]);
        }
    }, [value, partialData]);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('suggestFieldValues', {
                entity_type: entityType,
                field,
                partial_data: { ...partialData, [field]: value }
            });

            if (response.data.suggestions) {
                setSuggestions(response.data.suggestions);
                setShowSuggestions(true);
            }
        } catch (error) {
            logger.error('Failed to load suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        onChange({ target: { value: suggestion } });
        setShowSuggestions(false);
    };

    return (
        <div className="relative">
            <div className="relative">
                <Input
                    value={value}
                    onChange={onChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    {...props}
                />
                {loading && (
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37] animate-pulse" />
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}