import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Plus, Pill, Shield, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isBefore, addDays } from 'date-fns';

const recordTypeLabels = {
    prescription: 'Prescription',
    insurance: 'Insurance',
    vaccination: 'Vaccination',
    test_result: 'Test Result',
    medical_condition: 'Medical Condition',
    provider_info: 'Provider Info',
    other: 'Other'
};

export default function Health() {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        record_type: 'other',
        title: '',
        provider_name: '',
        date: '',
        expiry_date: '',
        prescription_name: '',
        dosage: '',
        pharmacy: '',
        insurance_provider: '',
        policy_number: '',
        group_number: '',
        document_url: '',
        notes: ''
    });

    const { data: records = [], refetch } = useQuery({
        queryKey: ['healthRecords'],
        queryFn: () => base44.entities.HealthRecord.list('-date')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.HealthRecord.create(formData);
        setOpen(false);
        setFormData({
            record_type: 'other',
            title: '',
            provider_name: '',
            date: '',
            expiry_date: '',
            prescription_name: '',
            dosage: '',
            pharmacy: '',
            insurance_provider: '',
            policy_number: '',
            group_number: '',
            document_url: '',
            notes: ''
        });
        refetch();
    };

    const filteredRecords = filter === 'all'
        ? records
        : records.filter(r => r.record_type === filter);

    const categoryIcons = {
        prescription: Pill,
        insurance: Shield,
        vaccination: Heart,
        test_result: FileText,
        medical_condition: Heart,
        provider_info: Heart,
        other: FileText
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <Heart className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Health</h1>
                            <p className="text-[#1A2B44]/60 font-light">Medical records & wellness</p>
                        </div>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Health Record</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Record Type</Label>
                                        <Select
                                            value={formData.record_type}
                                            onValueChange={(value) => setFormData({ ...formData, record_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(recordTypeLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Provider/Doctor</Label>
                                        <Input
                                            value={formData.provider_name}
                                            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {(formData.record_type === 'prescription' || formData.record_type === 'insurance') && (
                                    <div>
                                        <Label>Expiry/Renewal Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        />
                                    </div>
                                )}

                                {formData.record_type === 'prescription' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Medication Name</Label>
                                                <Input
                                                    value={formData.prescription_name}
                                                    onChange={(e) => setFormData({ ...formData, prescription_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Dosage</Label>
                                                <Input
                                                    value={formData.dosage}
                                                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Pharmacy</Label>
                                            <Input
                                                value={formData.pharmacy}
                                                onChange={(e) => setFormData({ ...formData, pharmacy: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}

                                {formData.record_type === 'insurance' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Policy Number</Label>
                                            <Input
                                                value={formData.policy_number}
                                                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Group Number</Label>
                                            <Input
                                                value={formData.group_number}
                                                onChange={(e) => setFormData({ ...formData, group_number: e.target.value })}
                                            />
                                        </div>
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

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37]">
                                    Add Record
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="mb-6">
                    <Tabs value={filter} onValueChange={setFilter}>
                        <TabsList className="bg-white border border-[#1A2B44]/10">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
                            <TabsTrigger value="insurance">Insurance</TabsTrigger>
                            <TabsTrigger value="vaccination">Vaccinations</TabsTrigger>
                            <TabsTrigger value="provider_info">Providers</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {filteredRecords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecords.map(record => {
                            const Icon = categoryIcons[record.record_type] || FileText;
                            const isExpiring = record.expiry_date &&
                                isBefore(new Date(record.expiry_date), addDays(new Date(), 60));

                            return (
                                <Card key={record.id} className="shadow-lg hover:shadow-xl transition-all">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="bg-[#C9A95C]/10 p-2 rounded-lg">
                                                <Icon className="w-5 h-5 text-[#C9A95C]" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-light text-[#1A2B44] mb-1">
                                                    {record.title}
                                                </h3>
                                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                    {recordTypeLabels[record.record_type]}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {record.provider_name && (
                                                <div className="text-[#1A2B44]/70">
                                                    Provider: {record.provider_name}
                                                </div>
                                            )}

                                            {record.prescription_name && (
                                                <div className="text-[#1A2B44]/70">
                                                    Medication: {record.prescription_name}
                                                    {record.dosage && ` (${record.dosage})`}
                                                </div>
                                            )}

                                            {record.policy_number && (
                                                <div className="text-[#1A2B44]/70">
                                                    Policy: {record.policy_number}
                                                </div>
                                            )}

                                            {record.expiry_date && (
                                                <div className={`${isExpiring ? 'text-orange-600' : 'text-[#1A2B44]/70'}`}>
                                                    {isExpiring && '⚠️ '}
                                                    Expires: {format(new Date(record.expiry_date), 'MMM d, yyyy')}
                                                </div>
                                            )}

                                            {record.date && (
                                                <div className="text-[#1A2B44]/50 text-xs">
                                                    {format(new Date(record.date), 'MMM d, yyyy')}
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
                        <Heart className="w-16 h-16 text-[#1A2B44]/20 mx-auto mb-4" />
                        <p className="text-[#1A2B44]/40 font-light">No health records yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}