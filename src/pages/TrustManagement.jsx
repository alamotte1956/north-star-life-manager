import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Users, FileText, DollarSign, Calendar, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TrustManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [generatingDoc, setGeneratingDoc] = useState(null);
    const [formData, setFormData] = useState({
        trust_name: '',
        trust_type: 'revocable_living',
        grantor_name: '',
        trustee_name: '',
        beneficiaries: '',
        trust_assets: '',
        establishment_date: '',
        trust_value: 0,
        purpose: '',
        special_provisions: ''
    });

    const queryClient = useQueryClient();

    // Using Document entity to store trust documents
    const { data: trusts = [] } = useQuery({
        queryKey: ['trusts'],
        queryFn: async () => {
            const docs = await base44.entities.Document.list();
            return docs.filter(d => d.category === 'legal' && d.document_type?.toLowerCase().includes('trust'));
        }
    });

    const { data: professionals = [] } = useQuery({
        queryKey: ['estateProfessionals'],
        queryFn: async () => {
            const profs = await base44.entities.Professional.list();
            return profs.filter(p => p.professional_type === 'estate_attorney' || p.professional_type === 'tax_attorney');
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            // Generate trust document using AI
            const trustDoc = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a comprehensive ${data.trust_type.replace('_', ' ')} trust document with the following details:

Trust Name: ${data.trust_name}
Grantor: ${data.grantor_name}
Trustee: ${data.trustee_name}
Beneficiaries: ${data.beneficiaries}
Assets Included: ${data.trust_assets}
Establishment Date: ${data.establishment_date}
Estimated Trust Value: $${data.trust_value.toLocaleString()}
Purpose: ${data.purpose}
Special Provisions: ${data.special_provisions || 'None'}

Generate:
1. Complete trust document text with all standard legal clauses
2. Executive summary
3. Key provisions list
4. Required signatures section
5. Amendment procedures
6. Distribution schedule
7. Trustee powers and duties

Format as a formal legal document. Include standard trust provisions for the specified type.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        document_text: { type: "string" },
                        executive_summary: { type: "string" },
                        key_provisions: { type: "array", items: { type: "string" } },
                        required_signatures: { type: "array", items: { type: "string" } },
                        next_steps: { type: "array", items: { type: "string" } },
                        legal_review_checklist: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Save to database
            return await base44.entities.Document.create({
                title: data.trust_name,
                category: 'legal',
                document_type: `${data.trust_type.replace('_', ' ')} Trust`,
                extracted_data: {
                    ...data,
                    generated_content: trustDoc,
                    generation_date: new Date().toISOString()
                },
                ai_summary: trustDoc.executive_summary,
                key_points: trustDoc.key_provisions,
                action_items: trustDoc.next_steps,
                suggested_tags: ['trust', 'estate-planning', 'legal-review-needed'],
                file_url: 'system://generated-trust-document'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['trusts']);
            setDialogOpen(false);
            resetForm();
            toast.success('Trust document generated! Please have it reviewed by an attorney.');
        }
    });

    const resetForm = () => {
        setFormData({
            trust_name: '',
            trust_type: 'revocable_living',
            grantor_name: '',
            trustee_name: '',
            beneficiaries: '',
            trust_assets: '',
            establishment_date: '',
            trust_value: 0,
            purpose: '',
            special_provisions: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const downloadTrustDocument = async (trust) => {
        setGeneratingDoc(trust.id);
        try {
            const response = await base44.functions.invoke('generateTrustPDF', {
                trust_id: trust.id
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${trust.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            toast.success('Trust document downloaded');
        } catch (error) {
            toast.error('Failed to generate PDF');
        }
        setGeneratingDoc(null);
    };

    const totalTrustValue = trusts.reduce((sum, t) => sum + (t.extracted_data?.trust_value || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Trust Management
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">AI-powered trust document generation and management</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Trust
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Active Trusts</p>
                                    <h3 className="text-3xl font-light text-black">{trusts.length}</h3>
                                </div>
                                <Shield className="w-10 h-10 text-[#4A90E2]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Total Trust Value</p>
                                    <h3 className="text-3xl font-light text-black">
                                        ${totalTrustValue.toLocaleString()}
                                    </h3>
                                </div>
                                <DollarSign className="w-10 h-10 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#0F1729]/60">Estate Attorneys</p>
                                    <h3 className="text-3xl font-light text-black">{professionals.length}</h3>
                                </div>
                                <Users className="w-10 h-10 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Connect with Professional */}
                {professionals.length > 0 && (
                    <Card className="mb-8 border-green-500 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Users className="w-8 h-8 text-green-600" />
                                <div className="flex-1">
                                    <h3 className="font-medium text-green-900 mb-2">Connect with Estate Planning Professionals</h3>
                                    <p className="text-sm text-green-800 mb-4">
                                        Have your AI-generated trust documents reviewed by vetted estate attorneys
                                    </p>
                                    <Link to={createPageUrl('ProfessionalMarketplace')}>
                                        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-100">
                                            Browse {professionals.length} Estate Attorneys
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Trust Documents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {trusts.map((trust) => {
                        const data = trust.extracted_data || {};
                        return (
                            <Card key={trust.id} className="border-[#4A90E2]/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[#4A90E2]" />
                                            {trust.title}
                                        </span>
                                        <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                            {trust.document_type}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {trust.ai_summary && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm text-blue-900">{trust.ai_summary}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {data.grantor_name && (
                                            <div>
                                                <p className="text-[#0F1729]/60">Grantor</p>
                                                <p className="font-medium text-black">{data.grantor_name}</p>
                                            </div>
                                        )}
                                        {data.trustee_name && (
                                            <div>
                                                <p className="text-[#0F1729]/60">Trustee</p>
                                                <p className="font-medium text-black">{data.trustee_name}</p>
                                            </div>
                                        )}
                                        {data.establishment_date && (
                                            <div>
                                                <p className="text-[#0F1729]/60">Established</p>
                                                <p className="font-medium text-black">
                                                    {format(new Date(data.establishment_date), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        )}
                                        {data.trust_value && (
                                            <div>
                                                <p className="text-[#0F1729]/60">Value</p>
                                                <p className="font-medium text-black">
                                                    ${data.trust_value.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {trust.key_points?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-[#0F1729]/60 mb-2">Key Provisions</h4>
                                            <ul className="space-y-1">
                                                {trust.key_points.slice(0, 3).map((point, i) => (
                                                    <li key={i} className="text-sm text-[#0F1729] flex items-start gap-2">
                                                        <span>•</span>
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {trust.action_items?.length > 0 && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <h4 className="text-sm font-medium text-orange-900 mb-2">Next Steps</h4>
                                            <ul className="space-y-1">
                                                {trust.action_items.slice(0, 2).map((item, i) => (
                                                    <li key={i} className="text-sm text-orange-800">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-[#4A90E2]/10">
                                        <Button
                                            variant="outline"
                                            onClick={() => downloadTrustDocument(trust)}
                                            disabled={generatingDoc === trust.id}
                                            className="flex-1"
                                        >
                                            {generatingDoc === trust.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download PDF
                                                </>
                                            )}
                                        </Button>
                                        <Link to={createPageUrl('ProfessionalMarketplace')} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                <Users className="w-4 h-4 mr-2" />
                                                Attorney Review
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {trusts.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Shield className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No trusts created yet</p>
                            <p className="text-sm text-[#0F1729]/40">Create a trust document to protect your assets</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Trust Document</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Trust Name *</Label>
                                <Input
                                    placeholder="e.g., Smith Family Revocable Living Trust"
                                    value={formData.trust_name}
                                    onChange={(e) => setFormData({ ...formData, trust_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Trust Type *</Label>
                                <Select 
                                    value={formData.trust_type} 
                                    onValueChange={(val) => setFormData({ ...formData, trust_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="revocable_living">Revocable Living Trust</SelectItem>
                                        <SelectItem value="irrevocable">Irrevocable Trust</SelectItem>
                                        <SelectItem value="charitable">Charitable Remainder Trust</SelectItem>
                                        <SelectItem value="special_needs">Special Needs Trust</SelectItem>
                                        <SelectItem value="bypass">Bypass Trust (AB Trust)</SelectItem>
                                        <SelectItem value="generation_skipping">Generation-Skipping Trust</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Grantor (Creator) *</Label>
                                    <Input
                                        value={formData.grantor_name}
                                        onChange={(e) => setFormData({ ...formData, grantor_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Trustee *</Label>
                                    <Input
                                        value={formData.trustee_name}
                                        onChange={(e) => setFormData({ ...formData, trustee_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Beneficiaries *</Label>
                                <Textarea
                                    placeholder="List all beneficiaries and their relationship (e.g., spouse, children, grandchildren)"
                                    value={formData.beneficiaries}
                                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Assets to Include in Trust</Label>
                                <Textarea
                                    placeholder="Real estate, bank accounts, investments, etc."
                                    value={formData.trust_assets}
                                    onChange={(e) => setFormData({ ...formData, trust_assets: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Establishment Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.establishment_date}
                                        onChange={(e) => setFormData({ ...formData, establishment_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Estimated Trust Value</Label>
                                    <Input
                                        type="number"
                                        value={formData.trust_value || ''}
                                        onChange={(e) => setFormData({ ...formData, trust_value: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Trust Purpose</Label>
                                <Textarea
                                    placeholder="What is the purpose of this trust? (e.g., asset protection, tax planning, care for minors)"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <Label>Special Provisions (Optional)</Label>
                                <Textarea
                                    placeholder="Any special instructions or conditions"
                                    value={formData.special_provisions}
                                    onChange={(e) => setFormData({ ...formData, special_provisions: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-900">
                                    ⚖️ <strong>Important:</strong> AI-generated trust documents must be reviewed and finalized by a licensed attorney before execution. This is a starting draft only.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Trust Document'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}