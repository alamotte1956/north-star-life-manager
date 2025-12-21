import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Scale, Plus, FileText, Shield, Users } from 'lucide-react';
import PrintButton from '../components/PrintButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const directiveLabels = {
    living_will: 'Living Will',
    healthcare_proxy: 'Healthcare Proxy',
    power_of_attorney_financial: 'Power of Attorney (Financial)',
    power_of_attorney_healthcare: 'Power of Attorney (Healthcare)',
    dnr_order: 'DNR Order',
    organ_donation: 'Organ Donation Authorization'
};

const accountTypeLabels = {
    life_insurance: 'Life Insurance',
    retirement_account: 'Retirement Account',
    bank_account: 'Bank Account',
    investment_account: 'Investment Account',
    trust: 'Trust',
    will: 'Will',
    other: 'Other'
};

export default function Legal() {
    const [directiveOpen, setDirectiveOpen] = useState(false);
    const [beneficiaryOpen, setBeneficiaryOpen] = useState(false);
    
    const [directiveForm, setDirectiveForm] = useState({
        document_type: 'living_will',
        title: '',
        agent_name: '',
        agent_phone: '',
        agent_email: '',
        alternate_agent_name: '',
        alternate_agent_phone: '',
        execution_date: '',
        witness_names: '',
        notarized: false,
        document_url: '',
        attorney_name: '',
        stored_location: '',
        notes: ''
    });

    const [beneficiaryForm, setBeneficiaryForm] = useState({
        account_type: 'life_insurance',
        account_name: '',
        institution: '',
        account_number: '',
        primary_beneficiary_name: '',
        primary_beneficiary_relationship: '',
        primary_beneficiary_percentage: 100,
        contingent_beneficiary_name: '',
        contingent_beneficiary_relationship: '',
        last_updated: '',
        document_url: '',
        notes: ''
    });

    const { data: directives = [], refetch: refetchDirectives } = useQuery({
        queryKey: ['advanceDirectives'],
        queryFn: () => base44.entities.AdvanceDirective.list('-execution_date')
    });

    const { data: beneficiaries = [], refetch: refetchBeneficiaries } = useQuery({
        queryKey: ['beneficiaries'],
        queryFn: () => base44.entities.Beneficiary.list('account_type')
    });

    const handleDirectiveSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.AdvanceDirective.create(directiveForm);
        setDirectiveOpen(false);
        setDirectiveForm({
            document_type: 'living_will',
            title: '',
            agent_name: '',
            agent_phone: '',
            agent_email: '',
            alternate_agent_name: '',
            alternate_agent_phone: '',
            execution_date: '',
            witness_names: '',
            notarized: false,
            document_url: '',
            attorney_name: '',
            stored_location: '',
            notes: ''
        });
        refetchDirectives();
    };

    const handleBeneficiarySubmit = async (e) => {
        e.preventDefault();
        await base44.entities.Beneficiary.create(beneficiaryForm);
        setBeneficiaryOpen(false);
        setBeneficiaryForm({
            account_type: 'life_insurance',
            account_name: '',
            institution: '',
            account_number: '',
            primary_beneficiary_name: '',
            primary_beneficiary_relationship: '',
            primary_beneficiary_percentage: 100,
            contingent_beneficiary_name: '',
            contingent_beneficiary_relationship: '',
            last_updated: '',
            document_url: '',
            notes: ''
        });
        refetchBeneficiaries();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#8B2635]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1B4B7F] to-[#0F2847] p-4 rounded-2xl">
                                <Scale className="w-8 h-8 text-[#E8DCC4]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1B4B7F]">Legal & Estate</h1>
                            <p className="text-[#1B4B7F]/60 font-light">Advance directives & beneficiary information</p>
                        </div>
                    </div>
                </div>

                <div className="mb-4 flex justify-end print:hidden">
                    <PrintButton />
                </div>

                <Tabs defaultValue="directives" className="space-y-6">
                    <TabsList className="bg-white border border-[#1B4B7F]/10 print:hidden">
                        <TabsTrigger value="directives">Advance Directives</TabsTrigger>
                        <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
                    </TabsList>

                    {/* Advance Directives Tab */}
                    <TabsContent value="directives">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[#1B4B7F]/60 font-light">Critical legal documents for healthcare and financial decisions</p>
                            <Dialog open={directiveOpen} onOpenChange={setDirectiveOpen} className="print:hidden">
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-[#1B4B7F] to-[#0F2847] hover:shadow-lg text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Directive
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Add Advance Directive</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleDirectiveSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Document Type</Label>
                                                <Select
                                                    value={directiveForm.document_type}
                                                    onValueChange={(value) => setDirectiveForm({ ...directiveForm, document_type: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(directiveLabels).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Title</Label>
                                                <Input
                                                    value={directiveForm.title}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, title: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Agent/Representative Name</Label>
                                                <Input
                                                    value={directiveForm.agent_name}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, agent_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Agent Phone</Label>
                                                <Input
                                                    type="tel"
                                                    value={directiveForm.agent_phone}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, agent_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Alternate Agent</Label>
                                                <Input
                                                    value={directiveForm.alternate_agent_name}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, alternate_agent_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Execution Date</Label>
                                                <Input
                                                    type="date"
                                                    value={directiveForm.execution_date}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, execution_date: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Attorney Name</Label>
                                                <Input
                                                    value={directiveForm.attorney_name}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, attorney_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Document Location</Label>
                                                <Input
                                                    value={directiveForm.stored_location}
                                                    onChange={(e) => setDirectiveForm({ ...directiveForm, stored_location: e.target.value })}
                                                    placeholder="e.g., Safe deposit box"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={directiveForm.notarized}
                                                onChange={(e) => setDirectiveForm({ ...directiveForm, notarized: e.target.checked })}
                                                className="rounded"
                                            />
                                            <Label>Notarized</Label>
                                        </div>

                                        <div>
                                            <Label>Notes</Label>
                                            <Textarea
                                                value={directiveForm.notes}
                                                onChange={(e) => setDirectiveForm({ ...directiveForm, notes: e.target.value })}
                                                rows={3}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full bg-gradient-to-r from-[#8B2635] to-[#A63446]">
                                            Add Directive
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {directives.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {directives.map(directive => (
                                    <Card key={directive.id} className="shadow-lg hover:shadow-xl transition-all">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-[#8B2635]/10 p-2 rounded-lg">
                                                        <Shield className="w-5 h-5 text-[#8B2635]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-light text-[#1B4B7F]">{directive.title}</h3>
                                                        <Badge className="mt-1 bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                            {directiveLabels[directive.document_type]}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {directive.notarized && (
                                                    <Badge className="bg-green-50 text-green-700 border-green-200">
                                                        Notarized
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                {directive.agent_name && (
                                                    <div>
                                                        <span className="text-[#1B4B7F]/50">Agent:</span>
                                                        <span className="text-[#1B4B7F]/70 ml-2">{directive.agent_name}</span>
                                                    </div>
                                                )}
                                                {directive.agent_phone && (
                                                    <div className="text-[#1B4B7F]/70">{directive.agent_phone}</div>
                                                )}
                                                {directive.execution_date && (
                                                    <div className="text-[#1B4B7F]/50 text-xs">
                                                        Executed: {format(new Date(directive.execution_date), 'MMM d, yyyy')}
                                                    </div>
                                                )}
                                                {directive.stored_location && (
                                                    <div className="text-[#1B4B7F]/50 text-xs">
                                                        Location: {directive.stored_location}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center py-16">
                                <Shield className="w-16 h-16 text-[#1B4B7F]/20 mx-auto mb-4" />
                                <p className="text-[#1B4B7F]/40 font-light">No advance directives recorded</p>
                                <p className="text-[#1B4B7F]/30 text-sm mt-2">Add critical legal documents for your attorney</p>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Beneficiaries Tab */}
                    <TabsContent value="beneficiaries">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-[#1B4B7F]/60 font-light">Track beneficiary designations across accounts</p>
                            <Dialog open={beneficiaryOpen} onOpenChange={setBeneficiaryOpen} className="print:hidden">
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-[#1B4B7F] to-[#0F2847] hover:shadow-lg text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Beneficiary
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Add Beneficiary Designation</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleBeneficiarySubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Account Type</Label>
                                                <Select
                                                    value={beneficiaryForm.account_type}
                                                    onValueChange={(value) => setBeneficiaryForm({ ...beneficiaryForm, account_type: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(accountTypeLabels).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Account Name</Label>
                                                <Input
                                                    value={beneficiaryForm.account_name}
                                                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, account_name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Institution</Label>
                                                <Input
                                                    value={beneficiaryForm.institution}
                                                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, institution: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Account Number</Label>
                                                <Input
                                                    value={beneficiaryForm.account_number}
                                                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, account_number: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-medium text-[#1B4B7F] mb-3">Primary Beneficiary</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Name</Label>
                                                    <Input
                                                        value={beneficiaryForm.primary_beneficiary_name}
                                                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, primary_beneficiary_name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Relationship</Label>
                                                    <Input
                                                        value={beneficiaryForm.primary_beneficiary_relationship}
                                                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, primary_beneficiary_relationship: e.target.value })}
                                                        placeholder="e.g., Spouse, Child"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-medium text-[#1B4B7F] mb-3">Contingent Beneficiary</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Name</Label>
                                                    <Input
                                                        value={beneficiaryForm.contingent_beneficiary_name}
                                                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, contingent_beneficiary_name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Relationship</Label>
                                                    <Input
                                                        value={beneficiaryForm.contingent_beneficiary_relationship}
                                                        onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, contingent_beneficiary_relationship: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Last Updated</Label>
                                            <Input
                                                type="date"
                                                value={beneficiaryForm.last_updated}
                                                onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, last_updated: e.target.value })}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full bg-gradient-to-r from-[#8B2635] to-[#A63446]">
                                            Add Beneficiary
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {beneficiaries.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {beneficiaries.map(ben => (
                                    <Card key={ben.id} className="shadow-lg hover:shadow-xl transition-all">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="bg-[#8B2635]/10 p-2 rounded-lg">
                                                    <Users className="w-5 h-5 text-[#8B2635]" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-light text-[#1B4B7F]">{ben.account_name}</h3>
                                                    <Badge className="mt-1 bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                        {accountTypeLabels[ben.account_type]}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm">
                                                {ben.institution && (
                                                    <div className="text-[#1B4B7F]/60">{ben.institution}</div>
                                                )}
                                                {ben.primary_beneficiary_name && (
                                                    <div className="border-t pt-2">
                                                        <div className="text-[#1B4B7F]/50 text-xs mb-1">Primary Beneficiary:</div>
                                                        <div className="text-[#1B4B7F] font-medium">
                                                            {ben.primary_beneficiary_name}
                                                        </div>
                                                        {ben.primary_beneficiary_relationship && (
                                                            <div className="text-[#1B4B7F]/60 text-xs">
                                                                {ben.primary_beneficiary_relationship}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {ben.contingent_beneficiary_name && (
                                                    <div className="border-t pt-2">
                                                        <div className="text-[#1B4B7F]/50 text-xs mb-1">Contingent:</div>
                                                        <div className="text-[#1B4B7F]">
                                                            {ben.contingent_beneficiary_name}
                                                        </div>
                                                    </div>
                                                )}
                                                {ben.last_updated && (
                                                    <div className="text-[#1B4B7F]/40 text-xs">
                                                        Updated: {format(new Date(ben.last_updated), 'MMM yyyy')}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center py-16">
                                <Users className="w-16 h-16 text-[#1B4B7F]/20 mx-auto mb-4" />
                                <p className="text-[#1B4B7F]/40 font-light">No beneficiary designations recorded</p>
                                <p className="text-[#1B4B7F]/30 text-sm mt-2">Track who inherits your accounts and policies</p>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}