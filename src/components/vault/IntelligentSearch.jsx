import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText, Loader2 } from 'lucide-react';

export default function IntelligentSearch({ onDocumentSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setSearched(true);
        try {
            const result = await base44.functions.invoke('searchDocuments', { query });
            setResults(result.data.results || []);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        }
        setSearching(false);
    };

    const getRelevanceColor = (score) => {
        if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
        if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-300';
        if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-gray-100 text-gray-700 border-gray-300';
    };

    return (
        <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search documents intelligently (e.g., 'medical records from 2024', 'insurance policies')"
                        className="pl-10"
                    />
                </div>
                <Button 
                    type="submit" 
                    disabled={searching || !query.trim()}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                >
                    {searching ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Search
                        </>
                    )}
                </Button>
            </form>

            {searched && results.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-light text-black">
                            Found {results.length} result{results.length !== 1 ? 's' : ''}
                        </h3>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setResults([]);
                                setSearched(false);
                                setQuery('');
                            }}
                        >
                            Clear
                        </Button>
                    </div>
                    {results.map((doc) => (
                        <Card 
                            key={doc.id} 
                            className="cursor-pointer hover:shadow-lg transition-all"
                            onClick={() => onDocumentSelect && onDocumentSelect(doc)}
                        >
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start gap-3 flex-1">
                                        <FileText className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-black">{doc.title}</h4>
                                            <p className="text-sm text-black/60 mt-1">
                                                {doc.extracted_data?.summary || 'No summary available'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={`${getRelevanceColor(doc.relevance_score)} border ml-2`}>
                                        {doc.relevance_score}% match
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <Badge variant="outline" className="text-xs">
                                        {doc.document_type || doc.category}
                                    </Badge>
                                    <span className="text-xs text-black/40">•</span>
                                    <span className="text-xs text-black/60">{doc.match_reason}</span>
                                </div>
                                {doc.extracted_data?.keywords && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {doc.extracted_data.keywords.slice(0, 5).map((keyword, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {searched && results.length === 0 && !searching && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-black/60">No documents found matching "{query}"</p>
                        <p className="text-sm text-black/40 mt-2">Try different keywords or check your filters</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}