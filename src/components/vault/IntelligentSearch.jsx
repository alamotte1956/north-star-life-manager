import React, { useState } from 'react';
import logger from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText, Loader2, Filter, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function IntelligentSearch({ onDocumentSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        dateFrom: '',
        dateTo: '',
        minAmount: '',
        maxAmount: '',
        uploader: '',
        expiryStatus: ''
    });

    const { data: users = [] } = useQuery({
        queryKey: ['familyUsers'],
        queryFn: async () => {
            const user = await base44.auth.me();
            const userRecord = await base44.entities.User.filter({ email: user.email });
            if (userRecord?.[0]?.family_id) {
                return await base44.entities.User.filter({ family_id: userRecord[0].family_id });
            }
            return [];
        }
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setSearched(true);
        try {
            const result = await base44.functions.invoke('searchDocuments', {
                query: query.trim(),
                category: filters.category || null,
                dateFrom: filters.dateFrom || null,
                dateTo: filters.dateTo || null,
                minAmount: filters.minAmount ? parseFloat(filters.minAmount) : null,
                maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : null,
                uploader: filters.uploader || null,
                expiryStatus: filters.expiryStatus || null
            });
            setResults(result.data.results || []);
        } catch (error) {
            logger.error('Search error:', error);
            toast.error('Search failed');
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const hasActiveFilters = () => {
        return filters.category || filters.dateFrom || filters.dateTo || 
               filters.minAmount || filters.maxAmount || filters.uploader || filters.expiryStatus;
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            dateFrom: '',
            dateTo: '',
            minAmount: '',
            maxAmount: '',
            uploader: '',
            expiryStatus: ''
        });
    };

    const getRelevanceColor = (score) => {
        if (score >= 150) return 'bg-green-100 text-green-700 border-green-300';
        if (score >= 80) return 'bg-blue-100 text-blue-700 border-blue-300';
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
                            placeholder="Search documents (handles typos, searches full text & metadata)..."
                            className="pl-10"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={hasActiveFilters() ? 'border-[#C5A059] bg-[#C5A059]/5' : ''}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {hasActiveFilters() && (
                            <Badge className="ml-2 bg-[#C5A059] text-white">
                                {Object.values(filters).filter(v => v).length}
                            </Badge>
                        )}
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={searching || !query.trim()}
                        className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A]"
                    >
                        {searching ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Search
                            </>
                        )}
                    </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <Card className="border-[#C5A059]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-[#0F172A]">Advanced Filters</h3>
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
                                            <SelectValue placeholder="All categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>All Categories</SelectItem>
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
                                    <Label>Uploader</Label>
                                    <Select value={filters.uploader} onValueChange={(v) => setFilters({...filters, uploader: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>All Users</SelectItem>
                                            {users.map(user => (
                                                <SelectItem key={user.email} value={user.email}>
                                                    {user.full_name || user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Expiry Status</Label>
                                    <Select value={filters.expiryStatus} onValueChange={(v) => setFilters({...filters, expiryStatus: v})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>Any Status</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="expiring_soon">Expiring Soon (30 days)</SelectItem>
                                            <SelectItem value="valid">Valid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label>Date From</Label>
                                    <Input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label>Date To</Label>
                                    <Input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label>Min Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={filters.minAmount}
                                        onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <Label>Max Amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={filters.maxAmount}
                                        onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
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
                            <h3 className="text-lg font-light text-[#0F172A]">
                                Found {results.length} result{results.length !== 1 ? 's' : ''}
                            </h3>
                            {hasActiveFilters() && (
                                <p className="text-sm text-[#64748B] mt-1">
                                    {Object.values(filters).filter(v => v).length} filter{Object.values(filters).filter(v => v).length !== 1 ? 's' : ''} applied
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
                            className="cursor-pointer hover:shadow-lg transition-all border-[#0F172A]/10"
                            onClick={() => onDocumentSelect && onDocumentSelect(doc)}
                        >
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start gap-3 flex-1">
                                        <FileText className="w-5 h-5 text-[#C5A059] mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-[#0F172A]">{doc.title}</h4>
                                            {doc.snippet && (
                                                <p className="text-sm text-[#64748B] mt-1 italic">
                                                    {doc.snippet}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge className={`${getRelevanceColor(doc.relevance_score)} border ml-2`}>
                                        Score: {Math.round(doc.relevance_score)}
                                    </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {doc.category && (
                                        <Badge variant="outline" className="text-xs">
                                            {doc.category}
                                        </Badge>
                                    )}
                                    {doc.document_type && (
                                        <Badge variant="outline" className="text-xs">
                                            {doc.document_type}
                                        </Badge>
                                    )}
                                    {doc.amount && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                            ${doc.amount.toLocaleString()}
                                        </Badge>
                                    )}
                                    {doc.created_by && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                                            By: {doc.created_by.split('@')[0]}
                                        </Badge>
                                    )}
                                    {doc.expiry_date && (
                                        <Badge className="bg-orange-100 text-orange-700 text-xs">
                                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {searched && results.length === 0 && !searching && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-[#64748B]">No documents found matching "{query}"</p>
                        <p className="text-sm text-[#64748B]/70 mt-2">Try different keywords or adjust your filters</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}