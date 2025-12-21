import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Home, Car, Wrench, Gem, DollarSign, Plane, Heart, Shield, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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

    const filteredItems = searchQuery.trim()
        ? allItems.filter(item => {
            const query = searchQuery.toLowerCase();
            return (
                item._name?.toLowerCase().includes(query) ||
                item._desc?.toLowerCase().includes(query) ||
                item._type?.toLowerCase().includes(query)
            );
        }).slice(0, 20)
        : [];

    const handleSelect = (item) => {
        const config = entityConfig[item._type];
        if (config) {
            navigate(createPageUrl(config.page));
            onOpenChange(false);
            setSearchQuery('');
        }
    };

    useEffect(() => {
        if (!open) {
            setSearchQuery('');
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 gap-0">
                <div className="flex items-center border-b px-4 py-3">
                    <Search className="w-5 h-5 text-[#1A2B44]/40 mr-2" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search properties, vehicles, tasks..."
                        className="border-0 focus-visible:ring-0 text-base"
                        autoFocus
                    />
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        <div className="py-2">
                            {filteredItems.map((item, idx) => {
                                const config = entityConfig[item._type];
                                const Icon = config?.icon || FileText;
                                return (
                                    <button
                                        key={`${item._type}-${item.id}-${idx}`}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className={`p-2 rounded-lg bg-gray-50 ${config?.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-[#1A2B44] truncate">
                                                {item._name}
                                            </div>
                                            {item._desc && (
                                                <div className="text-sm text-[#1A2B44]/60 truncate">
                                                    {item._desc}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {item._type.replace(/([A-Z])/g, ' $1').trim()}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    ) : searchQuery.trim() ? (
                        <div className="py-12 text-center text-[#1A2B44]/40">
                            No results found for "{searchQuery}"
                        </div>
                    ) : (
                        <div className="py-12 text-center text-[#1A2B44]/40">
                            Start typing to search across all your assets
                        </div>
                    )}
                </div>

                <div className="border-t px-4 py-3 text-xs text-[#1A2B44]/40">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Cmd+K</kbd> or <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+K</kbd> to open
                </div>
            </DialogContent>
        </Dialog>
    );
}