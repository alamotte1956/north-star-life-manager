import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Car, Plus, Calendar, AlertCircle } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, isBefore, addDays } from 'date-fns';

export default function Vehicles() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        year: '',
        make: '',
        model: '',
        vin: '',
        license_plate: '',
        purchase_date: '',
        purchase_price: '',
        current_value: '',
        insurance_provider: '',
        insurance_policy: '',
        registration_expires: '',
        last_service_date: '',
        next_service_due: '',
        stored_at: '',
        notes: ''
    });

    const { data: vehicles = [], refetch } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => base44.entities.Vehicle.list('-created_date')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.Vehicle.create(formData);
        setOpen(false);
        setFormData({
            name: '',
            year: '',
            make: '',
            model: '',
            vin: '',
            license_plate: '',
            purchase_date: '',
            purchase_price: '',
            current_value: '',
            insurance_provider: '',
            insurance_policy: '',
            registration_expires: '',
            last_service_date: '',
            next_service_due: '',
            stored_at: '',
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
                                <Car className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Vehicles</h1>
                            <p className="text-[#1A2B44]/60 font-light">Manage your vehicle fleet</p>
                        </div>
                        </div>

                        <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Vehicle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Vehicle</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Year</Label>
                                        <Input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            placeholder="2024"
                                        />
                                    </div>
                                    <div>
                                        <Label>Nickname</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Make</Label>
                                        <Input
                                            value={formData.make}
                                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Model</Label>
                                        <Input
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>VIN</Label>
                                        <Input
                                            value={formData.vin}
                                            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>License Plate</Label>
                                        <Input
                                            value={formData.license_plate}
                                            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Insurance Provider</Label>
                                        <Input
                                            value={formData.insurance_provider}
                                            onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Registration Expires</Label>
                                        <Input
                                            type="date"
                                            value={formData.registration_expires}
                                            onChange={(e) => setFormData({ ...formData, registration_expires: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Next Service Due</Label>
                                        <Input
                                            type="date"
                                            value={formData.next_service_due}
                                            onChange={(e) => setFormData({ ...formData, next_service_due: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Stored At</Label>
                                        <Input
                                            value={formData.stored_at}
                                            onChange={(e) => setFormData({ ...formData, stored_at: e.target.value })}
                                            placeholder="e.g., Main Garage"
                                        />
                                    </div>
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
                                    Add Vehicle
                                </Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                        </div>
                        </div>

                {vehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map(vehicle => {
                            const regExpiring = vehicle.registration_expires && 
                                isBefore(new Date(vehicle.registration_expires), addDays(new Date(), 60));
                            const serviceUpcoming = vehicle.next_service_due &&
                                isBefore(new Date(vehicle.next_service_due), addDays(new Date(), 30));

                            return (
                                <Card key={vehicle.id} className="shadow-lg hover:shadow-xl transition-all">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#C9A95C]/10 p-3 rounded-lg">
                                                    <Car className="w-6 h-6 text-[#C9A95C]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-light text-[#1A2B44]">
                                                        {vehicle.year} {vehicle.make}
                                                    </h3>
                                                    <p className="text-sm text-[#1A2B44]/60">{vehicle.model}</p>
                                                    {vehicle.name && (
                                                        <Badge className="mt-1 bg-[#C9A95C]/10 text-[#C9A95C] border-[#C9A95C]/20">
                                                            {vehicle.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {vehicle.license_plate && (
                                                <div className="text-[#1A2B44]/70">
                                                    Plate: {vehicle.license_plate}
                                                </div>
                                            )}
                                            
                                            {vehicle.registration_expires && (
                                                <div className={`flex items-center gap-2 ${regExpiring ? 'text-orange-600' : 'text-[#1A2B44]/70'}`}>
                                                    {regExpiring && <AlertCircle className="w-4 h-4" />}
                                                    Registration: {format(new Date(vehicle.registration_expires), 'MMM yyyy')}
                                                </div>
                                            )}

                                            {vehicle.next_service_due && (
                                                <div className={`flex items-center gap-2 ${serviceUpcoming ? 'text-orange-600' : 'text-[#1A2B44]/70'}`}>
                                                    <Calendar className="w-4 h-4 text-[#C9A95C]" />
                                                    Service: {format(new Date(vehicle.next_service_due), 'MMM d')}
                                                </div>
                                            )}

                                            {vehicle.stored_at && (
                                                <div className="text-[#1A2B44]/70">
                                                    Location: {vehicle.stored_at}
                                                </div>
                                            )}

                                            {vehicle.insurance_provider && (
                                                <div className="text-[#1A2B44]/70">
                                                    Insured: {vehicle.insurance_provider}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Car className="w-16 h-16 text-[#1A2B44]/20 mx-auto mb-4" />
                        <p className="text-[#1A2B44]/40 font-light">No vehicles added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}