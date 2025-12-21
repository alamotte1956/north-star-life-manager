import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, Plus, MapPin, Calendar, DollarSign, Snowflake, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const propertyTypeLabels = {
    primary_residence: 'Primary Residence',
    vacation_home: 'Vacation Home',
    cabin: 'Cabin',
    investment_property: 'Investment Property',
    other: 'Other'
};

export default function Properties() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        property_type: 'primary_residence',
        seasonal: false,
        season_open: '',
        season_close: '',
        square_footage: '',
        purchase_date: '',
        purchase_price: '',
        current_value: '',
        property_tax_annual: '',
        insurance_provider: '',
        insurance_policy_number: '',
        notes: ''
    });

    const { data: properties = [], refetch } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list('-created_date')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.Property.create(formData);
        setOpen(false);
        setFormData({
            name: '',
            address: '',
            property_type: 'primary_residence',
            seasonal: false,
            season_open: '',
            season_close: '',
            square_footage: '',
            purchase_date: '',
            purchase_price: '',
            current_value: '',
            property_tax_annual: '',
            insurance_provider: '',
            insurance_policy_number: '',
            notes: ''
        });
        refetch();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <Home className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Properties</h1>
                            <p className="text-[#1A2B44]/60 font-light">Manage your real estate portfolio</p>
                        </div>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Property
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Property</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Property Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Main Residence"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Property Type</Label>
                                        <Select
                                            value={formData.property_type}
                                            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(propertyTypeLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full address"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Square Footage</Label>
                                        <Input
                                            type="number"
                                            value={formData.square_footage}
                                            onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Purchase Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.purchase_date}
                                            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Purchase Price</Label>
                                        <Input
                                            type="number"
                                            value={formData.purchase_price}
                                            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div>
                                        <Label>Current Value</Label>
                                        <Input
                                            type="number"
                                            value={formData.current_value}
                                            onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.seasonal}
                                        onChange={(e) => setFormData({ ...formData, seasonal: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label>Seasonal Property</Label>
                                </div>

                                {formData.seasonal && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Season Open</Label>
                                            <Input
                                                value={formData.season_open}
                                                onChange={(e) => setFormData({ ...formData, season_open: e.target.value })}
                                                placeholder="e.g., May"
                                            />
                                        </div>
                                        <div>
                                            <Label>Season Close</Label>
                                            <Input
                                                value={formData.season_close}
                                                onChange={(e) => setFormData({ ...formData, season_close: e.target.value })}
                                                placeholder="e.g., October"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37]">
                                    Add Property
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {properties.map(property => (
                            <Card key={property.id} className="shadow-lg hover:shadow-xl transition-all">
                                <CardHeader className="border-b border-[#1A2B44]/10">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-light text-[#1A2B44]">
                                                {property.name}
                                            </CardTitle>
                                            <Badge className="mt-2 bg-[#C9A95C]/10 text-[#C9A95C] border-[#C9A95C]/20">
                                                {propertyTypeLabels[property.property_type]}
                                            </Badge>
                                        </div>
                                        {property.seasonal && (
                                            <div className="flex gap-1">
                                                <Snowflake className="w-4 h-4 text-blue-500" />
                                                <Sun className="w-4 h-4 text-orange-500" />
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    {property.address && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-[#C9A95C] mt-0.5" />
                                            <span className="text-[#1A2B44]/70 font-light">{property.address}</span>
                                        </div>
                                    )}
                                    
                                    {property.current_value && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign className="w-4 h-4 text-[#C9A95C]" />
                                            <span className="text-[#1A2B44]/70 font-light">
                                                Current Value: ${property.current_value.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {property.seasonal && property.season_open && property.season_close && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-[#C9A95C]" />
                                            <span className="text-[#1A2B44]/70 font-light">
                                                Open {property.season_open} - {property.season_close}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Home className="w-16 h-16 text-[#1A2B44]/20 mx-auto mb-4" />
                        <p className="text-[#1A2B44]/40 font-light">No properties added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}