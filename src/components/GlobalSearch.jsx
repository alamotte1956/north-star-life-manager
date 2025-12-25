import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Home, Car, Wrench, Gem, DollarSign, Plane, Heart, Shield, FileText, Filter, X, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const entityConfig = {
    Property: { icon: Home, color: 'text-blue-600', page: 'Properties' },
    Vehicle: { icon: Car, color: 'text-purple-600', page: 'Vehicles' },
    MaintenanceTask: { icon: Wrench, color: 'text-orange-600', page: 'Maintenance' },
    ValuableItem: { icon: Gem, color: 'text-amber-600', page: 'Valuables' },
    Subscription: { icon: DollarSign, color: 'text-green-600', page: 'Subscriptions' },
    TravelPlan: { icon: Plane, color: 'text-sky-600', page: 'Travel' },
    HealthRecord: { icon: Heart, color: 'text-red-600', page: 'Health' },
    Document: { icon: FileText, color: 'text-indigo-600', page: 'Vault' },
    AdvanceDirective: { icon: Shield, color: 'text-slate-600', page: 'Legal' }
};

export default function GlobalSearch({ open, onOpenChange }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        entityType: 'all',
        dateFrom: null,
        dateTo: null,
        category: 'all',
        associatedPerson: ''
    });
    const navigate = useNavigate();

    const { data: properties = [] } = useQuery({
        queryKey: ['search-properties'],
        queryFn: () => base44.entities.Property.list(),
        enabled: open
    });

    const { data: vehicles = [] } = useQuery({
        queryKey: ['search-vehicles'],
        queryFn: () => base44.entities.Vehicle.list(),
        enabled: open
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['search-tasks'],
        queryFn: () => base44.entities.MaintenanceTask.list(),
        enabled: open
    });

    const { data: valuables = [] } = useQuery({
        queryKey: ['search-valuables'],
        queryFn: () => base44.entities.ValuableItem.list(),
        enabled: open
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['search-subscriptions'],
        queryFn: () => base44.entities.Subscription.list(),
        enabled: open
    });

    const { data: trips = [] } = useQuery({
        queryKey: ['search-trips'],
        queryFn: () => base44.entities.TravelPlan.list(),
        enabled: open
    });

    const { data: healthRecords = [] } = useQuery({
        queryKey: ['search-health'],
        queryFn: () => base44.entities.HealthRecord.list(),
        enabled: open
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['search-documents'],
        queryFn: () => base44.entities.Document.list(),
        enabled: open
    });

    const allItems = [
        ...properties.map(p => ({ ...p, _type: 'Property', _name: p.name, _desc: p.address })),
        ...vehicles.map(v => ({ ...v, _type: 'Vehicle', _name: `${v.year} ${v.make} ${v.model}`, _desc: v.license_plate })),
        ...tasks.map(t => ({ ...t, _type: 'MaintenanceTask', _name: t.title, _desc: t.property_name })),
        ...valuables.map(v => ({ ...v, _type: 'ValuableItem', _name: v.name, _desc: v.category })),
        ...subscriptions.map(s => ({ ...s, _type: 'Subscription', _name: s.name, _desc: s.provider })),
        ...trips.map(t => ({ ...t, _type: 'TravelPlan', _name: t.trip_name, _desc: t.destination })),
        ...healthRecords.map(h => ({ ...h, _type: 'HealthRecord', _name: h.title, _desc: h.record_type })),
        ...documents.map(d => ({ ...d, _type: 'Document', _name: d.title, _desc: d.document_type }))
    ];

    const filteredItems = allItems.filter(item => {
        // Text search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesText = (
                item._name?.toLowerCase().includes(query) ||
                item._desc?.toLowerCase().includes(query) ||
                item._type?.toLowerCase().includes(query) ||
                item.notes?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.extracted_text?.toLowerCase().includes(query)
            );
            if (!matchesText) return false;
        }

        // Entity type filter
        if (filters.entityType !== 'all' && item._type !== filters.entityType) {
            return false;
        }

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
            const itemDate = new Date(item.created_date || item.date || item.start_date);
            if (filters.dateFrom && itemDate < filters.dateFrom) return false;
            if (filters.dateTo && itemDate > filters.dateTo) return false;
        }

        // Category filter (for documents, valuables, etc.)
        if (filters.category !== 'all') {
            if (item.category !== filters.category && item.document_type !== filters.category) {
                return false;
            }
        }

        // Associated person filter
        if (filters.associatedPerson.trim()) {
            const person = filters.associatedPerson.toLowerCase();
            const matchesPerson = (
                item.tenant_name?.toLowerCase().includes(person) ||
                item.owner?.toLowerCase().includes(person) ||
                item.created_by?.toLowerCase().includes(person) ||
                item.assigned_to?.toLowerCase().includes(person)
            );
            if (!matchesPerson) return false;
        }

        return true;
    }).slice(0, 30);

    const handleSelect = (item) => {
        const config = entityConfig[item._type];
        if (config) {
            navigate(createPageUrl(config.page));
            onOpenChange(false);
            setSearchQuery('');
        }
    };

    const clearFilters = () => {
        setFilters({
            entityType: 'all',
            dateFrom: null,
            dateTo: null,
            category: 'all',
            associatedPerson: ''
        });
    };

    const hasActiveFilters = filters.entityType !== 'all' || 
        filters.dateFrom || 
        filters.dateTo || 
        filters.category !== 'all' || 
        filters.associatedPerson.trim();

    useEffect(() => {
        if (!open) {
            setSearchQuery('');
            setShowFilters(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 gap-0 max-h-[85vh] flex flex-col">
                <div className="flex items-center border-b px-4 py-3">
                    <Search className="w-5 h-5 text-[#C5A059] mr-2" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search across all your assets..."
                        className="border-0 focus-visible:ring-0 text-base bg-transparent"
                        autoFocus
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="ml-2 gap-2"
                    >
                        <Filter className={`w-4 h-4 ${hasActiveFilters ? 'text-[#C5A059]' : ''}`} />
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center">
                                {[filters.entityType !== 'all', filters.dateFrom, filters.dateTo, filters.category !== 'all', filters.associatedPerson.trim()].filter(Boolean).length}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="border-b bg-[#0a0a0a] p-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-[#C5A059]">Advanced Filters</h3>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-7 text-xs"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Entity Type Filter */}
                            <div>
                                <label className="text-xs text-[#B8935E] mb-1.5 block">Type</label>
                                <Select value={filters.entityType} onValueChange={(value) => setFilters({...filters, entityType: value})}>
                                    <SelectTrigger className="bg-black border-[#C5A059]/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="Property">Properties</SelectItem>
                                        <SelectItem value="Vehicle">Vehicles</SelectItem>
                                        <SelectItem value="Document">Documents</SelectItem>
                                        <SelectItem value="MaintenanceTask">Maintenance</SelectItem>
                                        <SelectItem value="ValuableItem">Valuables</SelectItem>
                                        <SelectItem value="Subscription">Subscriptions</SelectItem>
                                        <SelectItem value="TravelPlan">Travel</SelectItem>
                                        <SelectItem value="HealthRecord">Health</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="text-xs text-[#B8935E] mb-1.5 block">Category</label>
                                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                                    <SelectTrigger className="bg-black border-[#C5A059]/30">
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

                            {/* Date From */}
                            <div>
                                <label className="text-xs text-[#B8935E] mb-1.5 block">From Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-black border-[#C5A059]/30">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {filters.dateFrom ? format(filters.dateFrom, 'PPP') : <span className="text-[#B8935E]/60">Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                            mode="single"
                                            selected={filters.dateFrom}
                                            onSelect={(date) => setFilters({...filters, dateFrom: date})}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="text-xs text-[#B8935E] mb-1.5 block">To Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-black border-[#C5A059]/30">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {filters.dateTo ? format(filters.dateTo, 'PPP') : <span className="text-[#B8935E]/60">Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent
                                            mode="single"
                                            selected={filters.dateTo}
                                            onSelect={(date) => setFilters({...filters, dateTo: date})}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Associated Person */}
                            <div className="md:col-span-2">
                                <label className="text-xs text-[#B8935E] mb-1.5 block">Associated Person</label>
                                <Input
                                    value={filters.associatedPerson}
                                    onChange={(e) => setFilters({...filters, associatedPerson: e.target.value})}
                                    placeholder="Search by owner, tenant, or creator..."
                                    className="bg-black border-[#C5A059]/30"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        <div className="py-2">
                            {filteredItems.map((item, idx) => {
                                const config = entityConfig[item._type];
                                const Icon = config?.icon || FileText;
                                return (
                                    <button
                                        key={`${item._type}-${item.id}-${idx}`}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a] transition-colors text-left"
                                    >
                                        <div className={`p-2 rounded-lg bg-[#0a0a0a] ${config?.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-[#C5A059] truncate">
                                                {item._name}
                                            </div>
                                            {item._desc && (
                                                <div className="text-sm text-[#B8935E] truncate">
                                                    {item._desc}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-xs border-[#C5A059]/30">
                                            {item._type.replace(/([A-Z])/g, ' $1').trim()}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    ) : searchQuery.trim() || hasActiveFilters ? (
                        <div className="py-12 text-center text-[#B8935E]/60">
                            No results found
                        </div>
                    ) : (
                        <div className="py-12 text-center text-[#B8935E]/60">
                            Start typing to search across all your assets
                        </div>
                    )}
                </div>

                <div className="border-t px-4 py-3 text-xs text-[#B8935E]/60 flex items-center justify-between">
                    <span>
                        <kbd className="px-2 py-1 bg-[#0a0a0a] rounded border border-[#C5A059]/30">Cmd+K</kbd> or <kbd className="px-2 py-1 bg-[#0a0a0a] rounded border border-[#C5A059]/30">Ctrl+K</kbd> to open
                    </span>
                    {filteredItems.length > 0 && (
                        <span className="text-[#C5A059]">{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</span>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}