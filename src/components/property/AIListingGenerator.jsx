import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AIListingGenerator({ property }) {
    const [loading, setLoading] = useState(false);
    const [listing, setListing] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('generateListingDescription', {
                property_id: property.id
            });

            setListing(result.data.listing);
            toast.success('Listing generated successfully!');
        } catch (error) {
            toast.error('Failed to generate listing');
        }
        setLoading(false);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    AI Listing Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                >
                    <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Generating...' : 'Generate Listing Description'}
                </Button>

                {listing && (
                    <div className="space-y-4 mt-4">
                        {/* Headline */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-xs font-medium text-green-900">Headline</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopy(listing.headline)}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="font-semibold text-lg text-green-900">{listing.headline}</p>
                        </div>

                        {/* Short Description */}
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-xs font-medium">Short Description</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopy(listing.short_description)}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="text-sm text-gray-700">{listing.short_description}</p>
                        </div>

                        {/* Full Description */}
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-xs font-medium">Full Description</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopy(listing.full_description)}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.full_description}</p>
                        </div>

                        {/* Key Highlights */}
                        {listing.key_highlights?.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-xs font-medium text-blue-900 mb-2">Key Highlights</p>
                                <ul className="space-y-1">
                                    {listing.key_highlights.map((highlight, idx) => (
                                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                            <span>✓</span>
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* SEO Keywords */}
                        {listing.seo_keywords?.length > 0 && (
                            <div>
                                <p className="text-xs font-medium mb-2">SEO Keywords</p>
                                <div className="flex flex-wrap gap-1">
                                    {listing.seo_keywords.map((keyword, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {listing.target_audience && (
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <p className="text-xs font-medium text-purple-900 mb-1">Target Audience</p>
                                <p className="text-sm text-purple-800">{listing.target_audience}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}