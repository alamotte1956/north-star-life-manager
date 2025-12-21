import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Plus, Phone, Mail, MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('all');
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
        queryFn: () => base44.entities.Contact.list('-priority')
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

    const filteredContacts = filter === 'all'
        ? contacts
        : contacts.filter(c => c.category === filter);

    const priorityColors = {
        vip: 'bg-[#C9A95C]/10 text-[#C9A95C] border-[#C9A95C]/20',
        high: 'bg-orange-100 text-orange-700 border-orange-200',
        medium: 'bg-blue-100 text-blue-700 border-blue-200',
        low: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <Users className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Contacts</h1>
                            <p className="text-[#1A2B44]/60 font-light">Your professional network</p>
                        </div>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
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

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37]">
                                    Add Contact
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="mb-6">
                    <Tabs value={filter} onValueChange={setFilter}>
                        <TabsList className="bg-white border border-[#1A2B44]/10">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="attorney">Legal</TabsTrigger>
                            <TabsTrigger value="financial_advisor">Financial</TabsTrigger>
                            <TabsTrigger value="physician">Medical</TabsTrigger>
                            <TabsTrigger value="property_manager">Property</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {filteredContacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContacts.map(contact => (
                            <Card key={contact.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-light text-[#1A2B44] mb-1">
                                                {contact.name}
                                                {contact.priority === 'vip' && (
                                                    <Star className="w-4 h-4 inline ml-2 text-[#C9A95C] fill-[#C9A95C]" />
                                                )}
                                            </h3>
                                            {contact.company && (
                                                <p className="text-sm text-[#1A2B44]/60 font-light">{contact.company}</p>
                                            )}
                                        </div>
                                        <Badge className={`${priorityColors[contact.priority]} border font-light`}>
                                            {categoryLabels[contact.category]}
                                        </Badge>
                                    </div>

                                    {contact.specialty && (
                                        <p className="text-sm text-[#1A2B44]/70 mb-3 font-light italic">
                                            {contact.specialty}
                                        </p>
                                    )}

                                    <div className="space-y-2">
                                        {contact.phone && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/70">
                                                <Phone className="w-4 h-4 text-[#C9A95C]" />
                                                <a href={`tel:${contact.phone}`} className="hover:text-[#C9A95C]">
                                                    {contact.phone}
                                                </a>
                                            </div>
                                        )}
                                        {contact.email && (
                                            <div className="flex items-center gap-2 text-sm text-[#1A2B44]/70">
                                                <Mail className="w-4 h-4 text-[#C9A95C]" />
                                                <a href={`mailto:${contact.email}`} className="hover:text-[#C9A95C] truncate">
                                                    {contact.email}
                                                </a>
                                            </div>
                                        )}
                                        {contact.address && (
                                            <div className="flex items-start gap-2 text-sm text-[#1A2B44]/70">
                                                <MapPin className="w-4 h-4 text-[#C9A95C] mt-0.5" />
                                                <span className="flex-1">{contact.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Users className="w-16 h-16 text-[#1A2B44]/20 mx-auto mb-4" />
                        <p className="text-[#1A2B44]/40 font-light">No contacts yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}