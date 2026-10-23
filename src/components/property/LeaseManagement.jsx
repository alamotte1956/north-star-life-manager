import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    FileText, Sparkles, CheckCircle, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaseManagement({ property, onUpdate }) {
    const [activeTab, setActiveTab] = useState('analyze');
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [leaseData, setLeaseData] = useState(null);
    const [generatedLease, setGeneratedLease] = useState(null);
    const [fileUrl, setFileUrl] = useState('');
    
    // Generation form
    const [leaseForm, setLeaseForm] = useState({
        tenant_name: property.tenant_name || '',
        tenant_email: property.tenant_email || '',
        lease_start_date: property.lease_start_date || '',
        lease_end_date: property.lease_end_date || '',
        monthly_rent: property.monthly_rent || '',
        security_deposit: property.security_deposit || '',
        late_fee_amount: 50,
        late_fee_grace_days: 5,
        utilities_included: '',
        pet_policy: '',
        special_terms: ''
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.info('Uploading document...');
            const uploadResult = await base44.integrations.Core.UploadFile({ file });
            setFileUrl(uploadResult.file_url);
            toast.success('Document uploaded!');
        } catch (error) {
            toast.error('Upload failed');
        }
    };

    const handleAnalyzeLease = async () => {
        if (!fileUrl) {
            toast.error('Please upload a lease document first');
            return;
        }

        setAnalyzing(true);
        try {
            const result = await base44.functions.invoke('analyzeLease', {
                file_url: fileUrl
            });

            setLeaseData(result.data.lease_data);
            toast.success('Lease analyzed successfully!');
        } catch (error) {
            toast.error('Failed to analyze lease');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGenerateLease = async () => {
        setGenerating(true);
        try {
            const result = await base44.functions.invoke('generateLeaseDocument', {
                property_id: property.id,
                lease_terms: leaseForm
            });

            setGeneratedLease(result.data);
            toast.success('Lease agreement generated!');
            onUpdate?.();
        } catch (error) {
            toast.error('Failed to generate lease');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card className="border-2 border-[#C5A059]/30">
            <CardHeader>
                <CardTitle className="text-xl font-light flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#C5A059]" />
                    AI Lease Management
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="analyze">Analyze Existing</TabsTrigger>
                        <TabsTrigger value="generate">Generate New</TabsTrigger>
                    </TabsList>

                    {/* Analyze Existing Lease */}
                    <TabsContent value="analyze" className="space-y-4 mt-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">AI Lease Analysis</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Upload a lease agreement and AI will extract all key terms automatically
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Upload Lease Document (PDF/Image)</Label>
                            <div className="mt-2">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#C5A059] file:text-white hover:file:bg-[#D4AF37] cursor-pointer"
                                />
                            </div>
                            {fileUrl && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Document uploaded successfully
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleAnalyzeLease}
                            disabled={analyzing || !fileUrl}
                            className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                        >
                            {analyzing ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing Document...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Analyze Lease with AI
                                </>
                            )}
                        </Button>

                        {/* Analysis Results */}
                        {leaseData && (
                            <div className="mt-6 space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-medium text-green-900 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Extracted Lease Terms
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {leaseData.tenant_name && (
                                        <div>
                                            <div className="text-xs text-gray-600">Tenant</div>
                                            <div className="font-medium">{leaseData.tenant_name}</div>
                                        </div>
                                    )}
                                    {leaseData.lease_start_date && (
                                        <div>
                                            <div className="text-xs text-gray-600">Start Date</div>
                                            <div className="font-medium">{leaseData.lease_start_date}</div>
                                        </div>
                                    )}
                                    {leaseData.lease_end_date && (
                                        <div>
                                            <div className="text-xs text-gray-600">End Date</div>
                                            <div className="font-medium">{leaseData.lease_end_date}</div>
                                        </div>
                                    )}
                                    {leaseData.monthly_rent && (
                                        <div>
                                            <div className="text-xs text-gray-600">Monthly Rent</div>
                                            <div className="font-medium text-green-700">${leaseData.monthly_rent.toLocaleString()}</div>
                                        </div>
                                    )}
                                    {leaseData.security_deposit && (
                                        <div>
                                            <div className="text-xs text-gray-600">Security Deposit</div>
                                            <div className="font-medium">${leaseData.security_deposit.toLocaleString()}</div>
                                        </div>
                                    )}
                                    {leaseData.late_fee_amount && (
                                        <div>
                                            <div className="text-xs text-gray-600">Late Fee</div>
                                            <div className="font-medium">${leaseData.late_fee_amount} after {leaseData.late_fee_grace_days} days</div>
                                        </div>
                                    )}
                                </div>

                                {leaseData.special_clauses?.length > 0 && (
                                    <div>
                                        <div className="text-xs text-gray-600 mb-2">Special Clauses</div>
                                        <ul className="space-y-1">
                                            {leaseData.special_clauses.map((clause, i) => (
                                                <li key={i} className="text-sm">• {clause}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Generate New Lease */}
                    <TabsContent value="generate" className="space-y-4 mt-4">
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-purple-900">AI Lease Generation</p>
                                    <p className="text-xs text-purple-700 mt-1">
                                        Generate a comprehensive lease agreement with AI-powered legal language
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Tenant Name</Label>
                                <Input
                                    value={leaseForm.tenant_name}
                                    onChange={(e) => setLeaseForm({...leaseForm, tenant_name: e.target.value})}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <Label>Tenant Email</Label>
                                <Input
                                    type="email"
                                    value={leaseForm.tenant_email}
                                    onChange={(e) => setLeaseForm({...leaseForm, tenant_email: e.target.value})}
                                    placeholder="tenant@example.com"
                                />
                            </div>
                            <div>
                                <Label>Lease Start Date</Label>
                                <Input
                                    type="date"
                                    value={leaseForm.lease_start_date}
                                    onChange={(e) => setLeaseForm({...leaseForm, lease_start_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Lease End Date</Label>
                                <Input
                                    type="date"
                                    value={leaseForm.lease_end_date}
                                    onChange={(e) => setLeaseForm({...leaseForm, lease_end_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Monthly Rent ($)</Label>
                                <Input
                                    type="number"
                                    value={leaseForm.monthly_rent}
                                    onChange={(e) => setLeaseForm({...leaseForm, monthly_rent: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Security Deposit ($)</Label>
                                <Input
                                    type="number"
                                    value={leaseForm.security_deposit}
                                    onChange={(e) => setLeaseForm({...leaseForm, security_deposit: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Late Fee Amount ($)</Label>
                                <Input
                                    type="number"
                                    value={leaseForm.late_fee_amount}
                                    onChange={(e) => setLeaseForm({...leaseForm, late_fee_amount: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Late Fee Grace Period (days)</Label>
                                <Input
                                    type="number"
                                    value={leaseForm.late_fee_grace_days}
                                    onChange={(e) => setLeaseForm({...leaseForm, late_fee_grace_days: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Utilities Included (optional)</Label>
                            <Input
                                value={leaseForm.utilities_included}
                                onChange={(e) => setLeaseForm({...leaseForm, utilities_included: e.target.value})}
                                placeholder="Water, trash, etc."
                            />
                        </div>

                        <div>
                            <Label>Pet Policy (optional)</Label>
                            <Textarea
                                value={leaseForm.pet_policy}
                                onChange={(e) => setLeaseForm({...leaseForm, pet_policy: e.target.value})}
                                placeholder="No pets / Cats allowed / etc."
                                rows={2}
                            />
                        </div>

                        <div>
                            <Label>Special Terms (optional)</Label>
                            <Textarea
                                value={leaseForm.special_terms}
                                onChange={(e) => setLeaseForm({...leaseForm, special_terms: e.target.value})}
                                placeholder="Any special clauses or addendums..."
                                rows={3}
                            />
                        </div>

                        <Button
                            onClick={handleGenerateLease}
                            disabled={generating || !leaseForm.tenant_name || !leaseForm.monthly_rent}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                        >
                            {generating ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Lease Agreement...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Lease Agreement with AI
                                </>
                            )}
                        </Button>

                        {generatedLease && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-green-900">Lease Agreement Generated</span>
                                    </div>
                                    <Badge className="bg-green-600 text-white">Saved to Documents</Badge>
                                </div>
                                <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                                    <pre className="text-xs whitespace-pre-wrap">{generatedLease.lease_content}</pre>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}