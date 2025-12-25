import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gem, Plus, Shield, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import PrintButton from '@/components/PrintButton';

const categoryLabels = {
    jewelry: 'Jewelry',
    art: 'Art',
    wine: 'Wine',
    collectible: 'Collectible',
    antique: 'Antique',
    watches: 'Watches',
    electronics: 'Electronics',
    furniture: 'Furniture',
    other: 'Other'
};

export default function Valuables() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: 'other',
        purchase_date: '',
        purchase_price: '',
        current_value: '',
        last_appraisal_date: '',
        appraiser_name: '',
        serial_number: '',
        location: '',
        insured: false,
        insurance_value: '',
        certificate_url: '',
        image_url: '',
        notes: ''
    });

    const { data: valuables = [], refetch } = useQuery({
        queryKey: ['valuables'],
        queryFn: () => base44.entities.ValuableItem.list('-current_value')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.ValuableItem.create(formData);
        setOpen(false);
        setFormData({
            name: '',
            category: 'other',
            purchase_date: '',
            purchase_price: '',
            current_value: '',
            last_appraisal_date: '',
            appraiser_name: '',
            serial_number: '',
            location: '',
            insured: false,
            insurance_value: '',
            certificate_url: '',
            image_url: '',
            notes: ''
        });
        refetch();
    };

    const totalValue = valuables.reduce((sum, item) => sum + (item.current_value || 0), 0);
    const insuredValue = valuables
        .filter(item => item.insured)
        .reduce((sum, item) => sum + (item.insurance_value || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <Gem className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Valuables</h1>
                            <p className="text-[#0F1729]/60 font-light">Your collection inventory</p>
                        </div>
                        </div>

                        <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Valuable Item</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Item Name</Label>
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
                                        <Label>Purchase Price</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.purchase_price}
                                            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div>
                                        <Label>Current Value</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.current_value}
                                            onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Purchase Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.purchase_date}
                                            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Last Appraisal Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.last_appraisal_date}
                                            onChange={(e) => setFormData({ ...formData, last_appraisal_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Serial Number</Label>
                                        <Input
                                            value={formData.serial_number}
                                            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Location</Label>
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Where it's kept"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.insured}
                                        onChange={(e) => setFormData({ ...formData, insured: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label>Insured</Label>
                                </div>

                                {formData.insured && (
                                    <div>
                                        <Label>Insurance Value</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.insurance_value}
                                            onChange={(e) => setFormData({ ...formData, insurance_value: e.target.value })}
                                            placeholder="$"
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Add Item
                                </Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                        </div>
                        </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Total Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                ${totalValue.toLocaleString()}
                            </div>
                            <p className="text-sm text-[#0F1729]/60 font-light mt-1">
                                {valuables.length} items
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Insured Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                ${insuredValue.toLocaleString()}
                            </div>
                            <p className="text-sm text-[#0F1729]/60 font-light mt-1">
                                {valuables.filter(v => v.insured).length} insured items
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Categories</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-light text-black">
                                {new Set(valuables.map(v => v.category)).size}
                            </div>
                            <p className="text-sm text-[#0F1729]/60 font-light mt-1">
                                Different types
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {valuables.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {valuables.map(item => (
                            <Card key={item.id} className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
                                {item.image_url && (
                                    <div className="h-48 bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] flex items-center justify-center">
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-light text-black mb-1">
                                                {item.name}
                                            </h3>
                                            <Badge className="bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/20">
                                                {categoryLabels[item.category]}
                                            </Badge>
                                        </div>
                                        {item.insured && (
                                            <Shield className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {item.current_value && (
                                            <div className="text-2xl font-light text-[#4A90E2]">
                                                ${item.current_value.toLocaleString()}
                                            </div>
                                        )}

                                        {item.location && (
                                            <div className="text-sm text-[#0F1729]/70">
                                                Location: {item.location}
                                            </div>
                                        )}

                                        {item.last_appraisal_date && (
                                            <div className="text-sm text-[#0F1729]/70">
                                                Appraised: {format(new Date(item.last_appraisal_date), 'MMM yyyy')}
                                            </div>
                                        )}

                                        {item.purchase_price && item.current_value && item.purchase_price > 0 && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <TrendingUp className="w-4 h-4 text-green-500" />
                                                <span className="text-green-600">
                                                    +{(((item.current_value - item.purchase_price) / item.purchase_price) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Gem className="w-16 h-16 text-[#0F1729]/20 mx-auto mb-4" />
                        <p className="text-[#0F1729]/40 font-light">No valuable items tracked yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}