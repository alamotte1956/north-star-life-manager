import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, FileText, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const steps = [
    { id: 'personal', title: 'Personal Information', icon: '👤' },
    { id: 'assets', title: 'Assets & Liabilities', icon: '💰' },
    { id: 'beneficiaries', title: 'Beneficiaries', icon: '👨‍👩‍👧‍👦' },
    { id: 'guardians', title: 'Guardians & Executors', icon: '⚖️' },
    { id: 'healthcare', title: 'Healthcare Directives', icon: '🏥' },
    { id: 'final', title: 'Final Wishes', icon: '✨' }
];

export default function EstatePlanningWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [formData, setFormData] = useState({
        personal: { full_name: '', date_of_birth: '', ssn: '', marital_status: 'single' },
        assets: { real_estate: '', investments: '', bank_accounts: '', other_assets: '', debts: '' },
        beneficiaries: { primary: '', secondary: '', specific_bequests: '' },
        guardians: { minor_guardian: '', executor: '', successor_executor: '', power_of_attorney: '' },
        healthcare: { healthcare_proxy: '', end_of_life_wishes: '', organ_donation: false },
        final: { funeral_preferences: '', burial_cremation: '', special_instructions: '' }
    });

    const updateField = (step, field, value) => {
        setFormData(prev => ({
            ...prev,
            [step]: { ...prev[step], [field]: value }
        }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const generatePlan = async () => {
        setGenerating(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a comprehensive estate planning document based on this information:

${JSON.stringify(formData, null, 2)}

Create a structured estate plan including:
1. Will overview and key provisions
2. Asset distribution plan
3. Guardian and executor appointments
4. Healthcare directives summary
5. Important considerations and recommendations
6. Next steps for attorney review

Make it professional, clear, and legally informative (but note this requires attorney review).`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        overview: { type: "string" },
                        asset_distribution: { type: "string" },
                        appointments: { type: "string" },
                        healthcare: { type: "string" },
                        considerations: { type: "array", items: { type: "string" } },
                        next_steps: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Create document
            await base44.entities.Document.create({
                title: 'Estate Planning Document - Draft',
                category: 'legal',
                document_type: 'Estate Plan',
                ai_summary: result.overview,
                extracted_data: result,
                file_url: 'generated://estate-plan'
            });

            toast.success('Estate plan generated! Review in Vault.');
        } catch (error) {
            toast.error('Failed to generate plan');
        }
        setGenerating(false);
    };

    const step = steps[currentStep];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-8">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                        alt="North Star Logo" 
                        className="w-16 h-16 object-contain"
                    />
                    <div>
                        <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Estate Planning Wizard
                        </h1>
                        <p className="text-[#0F1729]/60 font-light">Step-by-step guidance for comprehensive planning</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                    i <= currentStep ? 'bg-[#4A90E2] text-white' : 'bg-gray-200'
                                }`}>
                                    {i < currentStep ? <CheckCircle className="w-6 h-6" /> : s.icon}
                                </div>
                                <span className="text-xs mt-2 text-center">{s.title}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-12 h-1 mx-2 ${i < currentStep ? 'bg-[#4A90E2]' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <Card className="border-[#4A90E2]/20">
                    <CardHeader>
                        <CardTitle className="text-2xl font-light">
                            {step.icon} {step.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Personal Information */}
                        {step.id === 'personal' && (
                            <>
                                <div>
                                    <Label>Full Legal Name</Label>
                                    <Input
                                        value={formData.personal.full_name}
                                        onChange={(e) => updateField('personal', 'full_name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={formData.personal.date_of_birth}
                                        onChange={(e) => updateField('personal', 'date_of_birth', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Marital Status</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.personal.marital_status}
                                        onChange={(e) => updateField('personal', 'marital_status', e.target.value)}
                                    >
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="divorced">Divorced</option>
                                        <option value="widowed">Widowed</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Assets */}
                        {step.id === 'assets' && (
                            <>
                                <div>
                                    <Label>Real Estate Holdings</Label>
                                    <Textarea
                                        placeholder="List properties, addresses, estimated values..."
                                        value={formData.assets.real_estate}
                                        onChange={(e) => updateField('assets', 'real_estate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Investment Accounts</Label>
                                    <Textarea
                                        placeholder="401(k), IRA, brokerage accounts..."
                                        value={formData.assets.investments}
                                        onChange={(e) => updateField('assets', 'investments', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Bank Accounts</Label>
                                    <Textarea
                                        placeholder="Checking, savings, CDs..."
                                        value={formData.assets.bank_accounts}
                                        onChange={(e) => updateField('assets', 'bank_accounts', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Beneficiaries */}
                        {step.id === 'beneficiaries' && (
                            <>
                                <div>
                                    <Label>Primary Beneficiaries</Label>
                                    <Textarea
                                        placeholder="Names, relationships, percentage of estate..."
                                        value={formData.beneficiaries.primary}
                                        onChange={(e) => updateField('beneficiaries', 'primary', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Secondary/Contingent Beneficiaries</Label>
                                    <Textarea
                                        placeholder="Alternative beneficiaries if primary predeceases..."
                                        value={formData.beneficiaries.secondary}
                                        onChange={(e) => updateField('beneficiaries', 'secondary', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Specific Bequests</Label>
                                    <Textarea
                                        placeholder="Specific items to specific people (jewelry, artwork, etc.)..."
                                        value={formData.beneficiaries.specific_bequests}
                                        onChange={(e) => updateField('beneficiaries', 'specific_bequests', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Guardians & Executors */}
                        {step.id === 'guardians' && (
                            <>
                                <div>
                                    <Label>Guardian for Minor Children</Label>
                                    <Input
                                        placeholder="Full name"
                                        value={formData.guardians.minor_guardian}
                                        onChange={(e) => updateField('guardians', 'minor_guardian', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Executor of Estate</Label>
                                    <Input
                                        placeholder="Person to manage estate"
                                        value={formData.guardians.executor}
                                        onChange={(e) => updateField('guardians', 'executor', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Successor Executor</Label>
                                    <Input
                                        placeholder="Backup executor"
                                        value={formData.guardians.successor_executor}
                                        onChange={(e) => updateField('guardians', 'successor_executor', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Power of Attorney</Label>
                                    <Input
                                        placeholder="Person to handle finances if incapacitated"
                                        value={formData.guardians.power_of_attorney}
                                        onChange={(e) => updateField('guardians', 'power_of_attorney', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Healthcare */}
                        {step.id === 'healthcare' && (
                            <>
                                <div>
                                    <Label>Healthcare Proxy</Label>
                                    <Input
                                        placeholder="Person to make medical decisions"
                                        value={formData.healthcare.healthcare_proxy}
                                        onChange={(e) => updateField('healthcare', 'healthcare_proxy', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>End of Life Wishes</Label>
                                    <Textarea
                                        placeholder="Life support, resuscitation preferences..."
                                        value={formData.healthcare.end_of_life_wishes}
                                        onChange={(e) => updateField('healthcare', 'end_of_life_wishes', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.healthcare.organ_donation}
                                        onChange={(e) => updateField('healthcare', 'organ_donation', e.target.checked)}
                                    />
                                    <Label>I wish to be an organ donor</Label>
                                </div>
                            </>
                        )}

                        {/* Final Wishes */}
                        {step.id === 'final' && (
                            <>
                                <div>
                                    <Label>Funeral/Memorial Preferences</Label>
                                    <Textarea
                                        placeholder="Service type, location, special requests..."
                                        value={formData.final.funeral_preferences}
                                        onChange={(e) => updateField('final', 'funeral_preferences', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Burial or Cremation</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.final.burial_cremation}
                                        onChange={(e) => updateField('final', 'burial_cremation', e.target.value)}
                                    >
                                        <option value="">Select preference</option>
                                        <option value="burial">Burial</option>
                                        <option value="cremation">Cremation</option>
                                        <option value="green_burial">Green Burial</option>
                                        <option value="no_preference">No Preference</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Special Instructions</Label>
                                    <Textarea
                                        placeholder="Any other wishes or instructions..."
                                        value={formData.final.special_instructions}
                                        onChange={(e) => updateField('final', 'special_instructions', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 pt-6">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={prevStep}
                                    className="flex-1"
                                >
                                    Previous
                                </Button>
                            )}
                            {currentStep < steps.length - 1 ? (
                                <Button
                                    onClick={nextStep}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Next <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={generatePlan}
                                    disabled={generating}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    {generating ? 'Generating...' : 'Generate Estate Plan'}
                                </Button>
                            )}
                        </div>

                        <div className="text-xs text-[#0F1729]/50 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            ⚠️ This wizard creates a draft plan for attorney review. Always consult an estate planning attorney for legal advice.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}