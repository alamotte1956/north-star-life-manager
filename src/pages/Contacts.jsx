import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { listMine } from '@/components/utils/safeQuery';
import { Users, Plus, Phone, Mail, MapPin, Star, Search, Filter, Save, Trash2, Tag, X } from 'lucide-react';
import PrintButton from '../components/PrintButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSandboxData } from '@/components/sandbox/SandboxDataProvider';
import ContactImporter from '@/components/contacts/ContactImporter';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const categoryLabels = {
    attorney: 'Attorney',
    accountant: 'Accountant',
    financial_advisor: 'Financial Advisor',
    physician: 'Physician',
    insurance_agent: 'Insurance Agent',
    property_manager: 'Property Manager',
    contractor: 'Contractor',
    concierge: 'Concierge',
    personal_assistant: 'Personal Assistant',
    family: 'Family',
    friend: 'Friend',
    other: 'Other'
};

export default function Contacts() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const { isSandboxMode } = useSandboxData();
    
    // Advanced search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [advancedFilters, setAdvancedFilters] = useState({
        category: 'all',
        priority: 'all',
        searchIn: ['name', 'company', 'notes']
    });
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    
    // Bulk actions state
    const [selectedContacts, setSelectedContacts] = useState(new Set());
    const [bulkActionOpen, setBulkActionOpen] = useState(false);
    const [bulkTag, setBulkTag] = useState('');
    
    // Saved views state
    const [savedViews, setSavedViews] = useState(() => {
        const saved = localStorage.getItem('contactViews');
        return saved ? JSON.parse(saved) : [];
    });
    const [saveViewOpen, setSaveViewOpen] = useState(false);
    const [viewName, setViewName] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        category: 'other',
        company: '',
        phone: '',
        email: '',
        address: '',
        specialty: '',
        priority: 'medium',
        notes: ''
    });

    const { data: contacts = [], refetch } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => listMine(base44.entities.Contact, { order: '-priority' })
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.Contact.create(formData);
        setOpen(false);
        setFormData({
            name: '',
            category: 'other',
            company: '',
            phone: '',
            email: '',
            address: '',
            specialty: '',
            priority: 'medium',
            notes: ''
        });
        refetch();
    };

    // Advanced filtering logic
    const filteredContacts = contacts.filter(contact => {
        // Category filter
        if (advancedFilters.category !== 'all' && contact.category !== advancedFilters.category) {
            return false;
        }
        
        // Priority filter
        if (advancedFilters.priority !== 'all' && contact.priority !== advancedFilters.priority) {
            return false;
        }
        
        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = advancedFilters.searchIn.some(field => {
                const value = contact[field];
                return value && value.toLowerCase().includes(query);
            });
            if (!matchesSearch) return false;
        }
        
        return true;
    });

    // Bulk actions
    const deleteContactMutation = useMutation({
        mutationFn: (id) => base44.entities.Contact.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['contacts']);
        }
    });

    const updateContactMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['contacts']);
        }
    });

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedContacts.size} contacts?`)) return;
        
        for (const id of selectedContacts) {
            await deleteContactMutation.mutateAsync(id);
        }
        setSelectedContacts(new Set());
        setBulkActionOpen(false);
    };

    const handleBulkTag = async () => {
        if (!bulkTag.trim()) return;
        
        for (const id of selectedContacts) {
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                const currentTags = contact.tags || [];
                if (!currentTags.includes(bulkTag)) {
                    await updateContactMutation.mutateAsync({
                        id,
                        data: { tags: [...currentTags, bulkTag] }
                    });
                }
            }
        }
        setSelectedContacts(new Set());
        setBulkTag('');
        setBulkActionOpen(false);
    };

    const toggleContactSelection = (id) => {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedContacts(newSelected);
    };

    const selectAll = () => {
        if (selectedContacts.size === filteredContacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
        }
    };

    // Saved views
    const saveCurrentView = () => {
        if (!viewName.trim()) return;
        
        const newView = {
            id: Date.now().toString(),
            name: viewName,
            filters: { ...advancedFilters },
            searchQuery
        };
        
        const updated = [...savedViews, newView];
        setSavedViews(updated);
        localStorage.setItem('contactViews', JSON.stringify(updated));
        setViewName('');
        setSaveViewOpen(false);
    };

    const loadView = (view) => {
        setAdvancedFilters(view.filters);
        setSearchQuery(view.searchQuery || '');
    };

    const deleteView = (id) => {
        const updated = savedViews.filter(v => v.id !== id);
        setSavedViews(updated);
        localStorage.setItem('contactViews', JSON.stringify(updated));
    };

    const priorityColors = {
        vip: 'bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/20',
        high: 'bg-orange-100 text-orange-700 border-orange-200',
        medium: 'bg-blue-100 text-blue-700 border-blue-200',
        low: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Contacts</h1>
                            <p className="text-[#0F1729]/60 font-light">Your professional network</p>
                        </div>
                        </div>

                        <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        {!isSandboxMode && <ContactImporter onImportComplete={refetch} />}
                        <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Contact
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New Contact</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categoryLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Company</Label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Specialty</Label>
                                        <Input
                                            value={formData.specialty}
                                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vip">VIP</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Add Contact
                                </Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                        </div>
                        </div>

                {/* Advanced Search and Filters */}
                <div className="mb-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F1729]/40" />
                            <Input
                                placeholder="Search contacts by name, company, or notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <Popover open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="w-4 h-4" />
                                    Filters
                                    {(advancedFilters.category !== 'all' || advancedFilters.priority !== 'all') && (
                                        <Badge className="ml-1 bg-[#4A90E2] text-white">Active</Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={advancedFilters.category}
                                            onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {Object.entries(categoryLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Priority</Label>
                                        <Select
                                            value={advancedFilters.priority}
                                            onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, priority: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Priorities</SelectItem>
                                                <SelectItem value="vip">VIP</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Search In</Label>
                                        <div className="space-y-2 mt-2">
                                            {['name', 'company', 'notes'].map(field => (
                                                <label key={field} className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={advancedFilters.searchIn.includes(field)}
                                                        onCheckedChange={(checked) => {
                                                            const newSearchIn = checked
                                                                ? [...advancedFilters.searchIn, field]
                                                                : advancedFilters.searchIn.filter(f => f !== field);
                                                            setAdvancedFilters({ ...advancedFilters, searchIn: newSearchIn });
                                                        }}
                                                    />
                                                    <span className="text-sm capitalize">{field}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setAdvancedFilters({
                                                category: 'all',
                                                priority: 'all',
                                                searchIn: ['name', 'company', 'notes']
                                            });
                                            setSearchQuery('');
                                        }}
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Saved Views */}
                        {savedViews.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Save className="w-4 h-4" />
                                        Views ({savedViews.length})
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64">
                                    <div className="space-y-2">
                                        <Label>Saved Filter Views</Label>
                                        {savedViews.map(view => (
                                            <div key={view.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                <button
                                                    onClick={() => loadView(view)}
                                                    className="flex-1 text-left text-sm"
                                                >
                                                    {view.name}
                                                </button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteView(view.id)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        <Dialog open={saveViewOpen} onOpenChange={setSaveViewOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Save className="w-4 h-4" />
                                    Save View
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Save Current Filter View</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>View Name</Label>
                                        <Input
                                            placeholder="e.g., VIP Attorneys"
                                            value={viewName}
                                            onChange={(e) => setViewName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={saveCurrentView} className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2]">
                                        Save View
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedContacts.size > 0 && (
                        <div className="bg-[#4A90E2]/10 border border-[#4A90E2]/20 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={selectedContacts.size === filteredContacts.length}
                                    onCheckedChange={selectAll}
                                />
                                <span className="text-sm font-medium">
                                    {selectedContacts.size} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Tag className="w-4 h-4" />
                                            Add Tag
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Tag to {selectedContacts.size} Contacts</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <Input
                                                placeholder="Enter tag name"
                                                value={bulkTag}
                                                onChange={(e) => setBulkTag(e.target.value)}
                                            />
                                            <Button onClick={handleBulkTag} className="w-full">
                                                Add Tag
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-[#0F1729]/60">
                        <span>Showing {filteredContacts.length} of {contacts.length} contacts</span>
                        {filteredContacts.length < contacts.length && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setAdvancedFilters({
                                        category: 'all',
                                        priority: 'all',
                                        searchIn: ['name', 'company', 'notes']
                                    });
                                    setSearchQuery('');
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                </div>

                {filteredContacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContacts.map(contact => (
                            <Card key={contact.id} className="shadow-lg hover:shadow-xl transition-all relative">
                                <CardContent className="pt-6">
                                    <div className="absolute top-4 left-4">
                                        <Checkbox
                                            checked={selectedContacts.has(contact.id)}
                                            onCheckedChange={() => toggleContactSelection(contact.id)}
                                        />
                                    </div>
                                    <div className="flex items-start justify-between mb-4 ml-8">
                                        <div>
                                            <h3 className="text-lg font-light text-black mb-1">
                                                {contact.name}
                                                {contact.priority === 'vip' && (
                                                    <Star className="w-4 h-4 inline ml-2 text-[#4A90E2] fill-[#4A90E2]" />
                                                )}
                                            </h3>
                                            {contact.company && (
                                                <p className="text-sm text-[#0F1729]/60 font-light">{contact.company}</p>
                                            )}
                                        </div>
                                        <Badge className={`${priorityColors[contact.priority]} border font-light`}>
                                            {categoryLabels[contact.category]}
                                        </Badge>
                                    </div>

                                    {contact.specialty && (
                                        <p className="text-sm text-[#0F1729]/70 mb-3 font-light italic">
                                            {contact.specialty}
                                        </p>
                                    )}

                                    <div className="space-y-2">
                                        {contact.phone && (
                                            <div className="flex items-center gap-2 text-sm text-[#0F1729]/70">
                                                <Phone className="w-4 h-4 text-[#4A90E2]" />
                                                <a href={`tel:${contact.phone}`} className="hover:text-[#4A90E2]">
                                                    {contact.phone}
                                                </a>
                                            </div>
                                        )}
                                        {contact.email && (
                                            <div className="flex items-center gap-2 text-sm text-[#0F1729]/70">
                                                <Mail className="w-4 h-4 text-[#4A90E2]" />
                                                <a href={`mailto:${contact.email}`} className="hover:text-[#4A90E2] truncate">
                                                    {contact.email}
                                                </a>
                                            </div>
                                        )}
                                        {contact.address && (
                                            <div className="flex items-start gap-2 text-sm text-[#0F1729]/70">
                                                <MapPin className="w-4 h-4 text-[#4A90E2] mt-0.5" />
                                                <span className="flex-1">{contact.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {contact.tags && contact.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {contact.tags.map((tag, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Users className="w-16 h-16 text-[#0F1729]/20 mx-auto mb-4" />
                        <p className="text-[#0F1729]/40 font-light">
                            {searchQuery || advancedFilters.category !== 'all' || advancedFilters.priority !== 'all' 
                                ? 'No contacts match your filters' 
                                : 'No contacts yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}