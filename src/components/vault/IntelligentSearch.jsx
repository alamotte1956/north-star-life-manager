import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText, Loader2, Filter, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function IntelligentSearch({ onDocumentSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: 'all',
        document_type: 'all',
        date_from: '',
        date_to: '',
        amount_min: '',
        amount_max: '',
        has_expiry: false,
        linked_entity_type: 'all'
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setSearched(true);
        try {
            const result = await base44.functions.invoke('searchDocuments', { 
                query,
                filters: hasActiveFilters() ? filters : null
            });
            setResults(result.data.results || []);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        }
        setSearching(false);
    };

    const hasActiveFilters = () => {
        return filters.category !== 'all' ||
               filters.document_type !== 'all' ||
               filters.date_from ||
               filters.date_to ||
               filters.amount_min ||
               filters.amount_max ||
               filters.has_expiry ||
               filters.linked_entity_type !== 'all';
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            document_type: 'all',
            date_from: '',
            date_to: '',
            amount_min: '',
            amount_max: '',
            has_expiry: false,
            linked_entity_type: 'all'
        });
    };

    const getRelevanceColor = (score) => {
        if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
        if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-300';
        if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-gray-100 text-gray-700 border-gray-300';
    };

    return (
        <div className="mb-8">
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search documents intelligently (e.g., 'property leases', 'medical bills over $500')"
                            className="pl-10"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={hasActiveFilters() ? 'border-[#D4AF37] bg-[#D4AF37]/5' : ''}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {hasActiveFilters() && (
                            <Badge className="ml-2 bg-[#D4AF37] text-white">
                                {Object.values(filters).filter(v => v && v !== 'all').length}
                            </Badge>
                        )}
                    </Button>
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
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <Card className="border-[#D4AF37]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-[#1A2B44]">Advanced Filters</h3>
                                {hasActiveFilters() && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Category</Label>
                                    <Select value={filters.category} onValueChange={(v) => setFilters({...filters, category: v})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="legal">Legal</SelectItem>
                                            <SelectItem value="financial">Financial</SelectItem>
                                            <SelectItem value="property">Property</SelectItem>
                                            <SelectItem value="vehicle">Vehicle</SelectItem>
                                            <SelectItem value="health">Health</SelectItem>
                                            <SelectItem value="insurance">Insurance</SelectItem>
                                            <SelectItem value="tax">Tax</SelectItem>
                                            <SelectItem value="personal">Personal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Linked To</Label>
                                    <Select value={filters.linked_entity_type} onValueChange={(v) => setFilters({...filters, linked_entity_type: v})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Entities</SelectItem>
                                            <SelectItem value="Property">Properties</SelectItem>
                                            <SelectItem value="Vehicle">Vehicles</SelectItem>
                                            <SelectItem value="Subscription">Subscriptions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        checked={filters.has_expiry}
                                        onChange={(e) => setFilters({...filters, has_expiry: e.target.checked})}
                                        className="rounded"
                                    />
                                    <Label>Has Expiry Date</Label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label>Date From</Label>
                                    <Input
                                        type="date"
                                        value={filters.date_from}
                                        onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Date To</Label>
                                    <Input
                                        type="date"
                                        value={filters.date_to}
                                        onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label>Min Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={filters.amount_min}
                                        onChange={(e) => setFilters({...filters, amount_min: e.target.value})}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <Label>Max Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={filters.amount_max}
                                        onChange={(e) => setFilters({...filters, amount_max: e.target.value})}
                                        placeholder="No limit"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </form>

            {searched && results.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-light text-black">
                                Found {results.length} result{results.length !== 1 ? 's' : ''}
                            </h3>
                            {hasActiveFilters() && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {Object.values(filters).filter(v => v && v !== 'all').length} filter{Object.values(filters).filter(v => v && v !== 'all').length !== 1 ? 's' : ''} applied
                                </p>
                            )}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setResults([]);
                                setSearched(false);
                                setQuery('');
                                clearFilters();
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
                                                {doc.ai_summary || 'No summary available'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={`${getRelevanceColor(doc.relevance_score)} border ml-2`}>
                                        {doc.relevance_score}% match
                                    </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <Badge variant="outline" className="text-xs">
                                        {doc.document_type || doc.category}
                                    </Badge>
                                    {doc.amount && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                            ${doc.amount.toLocaleString()}
                                        </Badge>
                                    )}
                                    {doc.linked_entity_name && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                                            {doc.linked_entity_type}: {doc.linked_entity_name}
                                        </Badge>
                                    )}
                                    {doc.expiry_date && (
                                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                        </Badge>
                                    )}
                                </div>
                                
                                <p className="text-xs text-black/50 mt-2 italic">{doc.match_reason}</p>
                                
                                {doc.key_points?.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-600">
                                        <span className="font-medium">Key: </span>
                                        {doc.key_points.slice(0, 2).join(' • ')}
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