import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, FileText, Users, Home, DollarSign, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EstatePlanning() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        marital_status: '',
        has_children: '',
        num_children: 0,
        
        // Step 2: Assets
        total_estate_value: 0,
        real_estate_value: 0,
        investments_value: 0,
        business_value: 0,
        
        // Step 3: Beneficiaries
        primary_beneficiaries: '',
        contingent_beneficiaries: '',
        executor: '',
        
        // Step 4: Healthcare
        has_healthcare_proxy: '',
        has_living_will: '',
        organ_donor: '',
        
        // Step 5: Special Wishes
        charitable_bequests: '',
        special_instructions: '',
        burial_preferences: ''
    });

    const totalSteps = 5;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const [generatingWill, setGeneratingWill] = useState(false);

    const generateWill = async () => {
        setGeneratingWill(true);
        try {
            const response = await base44.functions.invoke('generateWill', {
                testator_name: formData.grantor_name || user.full_name,
                state: 'California', // Could add state selector
                marital_status: formData.marital_status,
                spouse_name: formData.marital_status === 'married' ? 'Spouse' : null,
                children: formData.has_children === 'yes' ? `${formData.num_children} children` : 'None',
                executor: formData.executor,
                beneficiaries: formData.primary_beneficiaries,
                asset_distribution: `Estate valued at $${formData.total_estate_value.toLocaleString()}`,
                special_bequests: formData.charitable_bequests,
                funeral_wishes: formData.burial_preferences
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Last-Will-Testament.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            toast.success('Will generated! Have it reviewed by an attorney.');
        } catch (error) {
            toast.error('Failed to generate will');
        }
        setGeneratingWill(false);
    };

    const handleSubmit = async () => {
        try {
            // Generate AI recommendations
            const recommendations = await base44.integrations.Core.InvokeLLM({
                prompt: `Based on this estate planning information, provide comprehensive recommendations:

${JSON.stringify(formData, null, 2)}

Provide:
1. Estate planning priorities (top 5 actions)
2. Tax optimization strategies
3. Document checklist (what legal documents are needed)
4. Professional recommendations (estate attorney, tax advisor, etc.)
5. Timeline for implementation
6. Common pitfalls to avoid
7. Questions to ask your attorney`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        priorities: { type: "array", items: { type: "string" } },
                        tax_strategies: { type: "array", items: { type: "string" } },
                        document_checklist: { type: "array", items: { type: "string" } },
                        professional_needs: { type: "array", items: { type: "string" } },
                        timeline: { type: "string" },
                        pitfalls: { type: "array", items: { type: "string" } },
                        attorney_questions: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Save to database
            await base44.entities.Document.create({
                title: 'Estate Planning Recommendations',
                category: 'legal',
                document_type: 'Estate Plan',
                extracted_data: { ...formData, ...recommendations },
                ai_summary: `Estate planning recommendations generated for ${formData.marital_status} individual with estate value of $${formData.total_estate_value.toLocaleString()}`,
                file_url: 'system://estate-plan-wizard'
            });

            toast.success('Estate plan recommendations generated!');
            setStep(6); // Show results
        } catch (error) {
            toast.error('Failed to generate recommendations');
        }
    };

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
                        <p className="text-[#0F1729]/60 font-light">Step-by-step guidance for securing your legacy</p>
                    </div>
                </div>

                <Card className="border-[#4A90E2]/20 mb-6">
                    <CardContent className="pt-6">
                        <Progress value={progress} className="mb-2" />
                        <p className="text-sm text-[#0F1729]/60 text-center">
                            Step {step} of {totalSteps}
                        </p>
                    </CardContent>
                </Card>

                {/* Step 1: Basic Information */}
                {step === 1 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#4A90E2]" />
                                Family Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Marital Status</Label>
                                <RadioGroup value={formData.marital_status} onValueChange={(val) => setFormData({ ...formData, marital_status: val })}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="single" id="single" />
                                        <Label htmlFor="single">Single</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="married" id="married" />
                                        <Label htmlFor="married">Married</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="widowed" id="widowed" />
                                        <Label htmlFor="widowed">Widowed</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="divorced" id="divorced" />
                                        <Label htmlFor="divorced">Divorced</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>Do you have children?</Label>
                                <RadioGroup value={formData.has_children} onValueChange={(val) => setFormData({ ...formData, has_children: val })}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="yes" />
                                        <Label htmlFor="yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="no" />
                                        <Label htmlFor="no">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {formData.has_children === 'yes' && (
                                <div>
                                    <Label>Number of Children</Label>
                                    <Input
                                        type="number"
                                        value={formData.num_children}
                                        onChange={(e) => setFormData({ ...formData, num_children: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Assets */}
                {step === 2 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-[#4A90E2]" />
                                Asset Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Estimated Total Estate Value</Label>
                                <Input
                                    type="number"
                                    placeholder="$0"
                                    value={formData.total_estate_value || ''}
                                    onChange={(e) => setFormData({ ...formData, total_estate_value: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label>Real Estate Value</Label>
                                <Input
                                    type="number"
                                    placeholder="$0"
                                    value={formData.real_estate_value || ''}
                                    onChange={(e) => setFormData({ ...formData, real_estate_value: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label>Investments & Retirement Accounts</Label>
                                <Input
                                    type="number"
                                    placeholder="$0"
                                    value={formData.investments_value || ''}
                                    onChange={(e) => setFormData({ ...formData, investments_value: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label>Business Interests</Label>
                                <Input
                                    type="number"
                                    placeholder="$0"
                                    value={formData.business_value || ''}
                                    onChange={(e) => setFormData({ ...formData, business_value: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Beneficiaries */}
                {step === 3 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-[#4A90E2]" />
                                Beneficiaries & Executor
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Primary Beneficiaries</Label>
                                <Textarea
                                    placeholder="Who should inherit your assets? (e.g., spouse, children, charities)"
                                    value={formData.primary_beneficiaries}
                                    onChange={(e) => setFormData({ ...formData, primary_beneficiaries: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Contingent Beneficiaries</Label>
                                <Textarea
                                    placeholder="Backup beneficiaries if primary ones cannot inherit"
                                    value={formData.contingent_beneficiaries}
                                    onChange={(e) => setFormData({ ...formData, contingent_beneficiaries: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Executor (Estate Administrator)</Label>
                                <Input
                                    placeholder="Who will manage your estate?"
                                    value={formData.executor}
                                    onChange={(e) => setFormData({ ...formData, executor: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Healthcare Directives */}
                {step === 4 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-[#4A90E2]" />
                                Healthcare Directives
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Do you have a Healthcare Proxy/Power of Attorney?</Label>
                                <RadioGroup value={formData.has_healthcare_proxy} onValueChange={(val) => setFormData({ ...formData, has_healthcare_proxy: val })}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="proxy-yes" />
                                        <Label htmlFor="proxy-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="proxy-no" />
                                        <Label htmlFor="proxy-no">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>Do you have a Living Will/Advance Directive?</Label>
                                <RadioGroup value={formData.has_living_will} onValueChange={(val) => setFormData({ ...formData, has_living_will: val })}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="will-yes" />
                                        <Label htmlFor="will-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="will-no" />
                                        <Label htmlFor="will-no">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>Organ Donor Preference</Label>
                                <RadioGroup value={formData.organ_donor} onValueChange={(val) => setFormData({ ...formData, organ_donor: val })}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="donor-yes" />
                                        <Label htmlFor="donor-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="donor-no" />
                                        <Label htmlFor="donor-no">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Special Wishes */}
                {step === 5 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#4A90E2]" />
                                Special Wishes & Instructions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Charitable Bequests</Label>
                                <Textarea
                                    placeholder="Any charities or causes you wish to support?"
                                    value={formData.charitable_bequests}
                                    onChange={(e) => setFormData({ ...formData, charitable_bequests: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Special Instructions</Label>
                                <Textarea
                                    placeholder="Any specific wishes for distribution of personal items, care of pets, etc."
                                    value={formData.special_instructions}
                                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                                    rows={4}
                                />
                            </div>

                            <div>
                                <Label>Funeral/Burial Preferences</Label>
                                <Textarea
                                    placeholder="Your preferences for funeral arrangements"
                                    value={formData.burial_preferences}
                                    onChange={(e) => setFormData({ ...formData, burial_preferences: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Buttons */}
                {step <= totalSteps && (
                    <div className="space-y-4">
                        <div className="flex justify-between mt-6">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={step === 1}
                            >
                                Back
                            </Button>
                            {step < totalSteps ? (
                                <Button
                                    onClick={handleNext}
                                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                                >
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={generateWill}
                                        disabled={generatingWill}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        {generatingWill ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                                        ) : (
                                            <><FileText className="w-4 h-4" />Generate Will</>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Get Recommendations
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        {step === totalSteps && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-4 pb-4">
                                    <p className="text-sm text-blue-900 text-center">
                                        💡 Generate a draft will now, or get personalized recommendations first
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}