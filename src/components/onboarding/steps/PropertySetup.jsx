import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PropertySetup({ onComplete }) {
    const [properties, setProperties] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentProperty, setCurrentProperty] = useState({
        name: '',
        property_type: 'primary_residence',
        address: '',
        purchase_price: '',
        current_value: '',
        monthly_rent: ''
    });

    const propertyTypes = [
        { value: 'primary_residence', label: 'Primary Residence' },
        { value: 'vacation_home', label: 'Vacation Home' },
        { value: 'cabin', label: 'Cabin' },
        { value: 'investment_property', label: 'Rental/Investment' },
        { value: 'other', label: 'Other' }
    ];

    const handleAddProperty = () => {
        if (!currentProperty.name || !currentProperty.property_type) {
            toast.error('Please fill in property name and type');
            return;
        }

        setProperties([...properties, { ...currentProperty, id: Date.now() }]);
        setCurrentProperty({
            name: '',
            property_type: 'primary_residence',
            address: '',
            purchase_price: '',
            current_value: '',
            monthly_rent: ''
        });
        setShowForm(false);
        toast.success('Property added!');
    };

    const handleRemoveProperty = (id) => {
        setProperties(properties.filter(p => p.id !== id));
    };

    const handleFinish = async () => {
        try {
            // Save all properties to database
            for (const property of properties) {
                const { id, ...propertyData } = property;
                await base44.entities.Property.create({
                    ...propertyData,
                    purchase_price: propertyData.purchase_price ? parseFloat(propertyData.purchase_price) : null,
                    current_value: propertyData.current_value ? parseFloat(propertyData.current_value) : null,
                    monthly_rent: propertyData.monthly_rent ? parseFloat(propertyData.monthly_rent) : null
                });
            }
            
            if (properties.length > 0) {
                toast.success(`${properties.length} propert${properties.length > 1 ? 'ies' : 'y'} added!`);
            }
            onComplete?.();
        } catch (error) {
            toast.error('Failed to save properties');
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-light text-[#0F172A] mb-2">Add Your Properties</h3>
                <p className="text-[#64748B] max-w-xl mx-auto">
                    Track your real estate portfolio with AI-powered maintenance predictions, valuation tracking, and rent optimization.
                </p>
            </div>

            {/* Properties List */}
            {properties.length > 0 && (
                <div className="space-y-3 max-w-2xl mx-auto">
                    {properties.map(property => (
                        <div key={property.id} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-xl border border-[#0F172A]/10">
                            <div className="flex-1">
                                <h4 className="font-medium text-[#0F172A]">{property.name}</h4>
                                <p className="text-sm text-[#64748B]">
                                    {propertyTypes.find(t => t.value === property.property_type)?.label}
                                    {property.address && ` • ${property.address}`}
                                    {property.current_value && ` • $${parseFloat(property.current_value).toLocaleString()}`}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProperty(property.id)}
                            >
                                <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Property Form */}
            {showForm ? (
                <div className="max-w-2xl mx-auto space-y-4 p-6 bg-white border border-[#0F172A]/10 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label>Property Name *</Label>
                            <Input
                                placeholder="e.g., Main Residence, Lake Cabin"
                                value={currentProperty.name}
                                onChange={(e) => setCurrentProperty({...currentProperty, name: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Property Type *</Label>
                            <Select
                                value={currentProperty.property_type}
                                onValueChange={(value) => setCurrentProperty({...currentProperty, property_type: value})}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {propertyTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Address</Label>
                            <Input
                                placeholder="123 Main St, City, State"
                                value={currentProperty.address}
                                onChange={(e) => setCurrentProperty({...currentProperty, address: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Purchase Price ($)</Label>
                            <Input
                                type="number"
                                placeholder="500000"
                                value={currentProperty.purchase_price}
                                onChange={(e) => setCurrentProperty({...currentProperty, purchase_price: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Current Value ($)</Label>
                            <Input
                                type="number"
                                placeholder="550000"
                                value={currentProperty.current_value}
                                onChange={(e) => setCurrentProperty({...currentProperty, current_value: e.target.value})}
                                className="mt-1"
                            />
                        </div>

                        {currentProperty.property_type === 'investment_property' && (
                            <div className="md:col-span-2">
                                <Label>Monthly Rent ($)</Label>
                                <Input
                                    type="number"
                                    placeholder="2500"
                                    value={currentProperty.monthly_rent}
                                    onChange={(e) => setCurrentProperty({...currentProperty, monthly_rent: e.target.value})}
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowForm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddProperty}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Add Property
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center">
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="outline"
                        className="border-dashed border-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                    </Button>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
                <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> Add your properties now to unlock AI-powered maintenance scheduling, 
                    rent pricing suggestions, and property valuation tracking.
                </p>
            </div>

            <div className="flex justify-center pt-4">
                <Button
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white px-8"
                >
                    {properties.length > 0 ? 'Continue' : 'Skip for Now'}
                </Button>
            </div>
        </div>
    );
}