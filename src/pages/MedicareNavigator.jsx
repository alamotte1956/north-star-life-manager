import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MedicareNavigator() {
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState(null);
    const [formData, setFormData] = useState({
        age: '',
        current_insurance: '',
        chronic_conditions: '',
        prescription_count: '',
        annual_income: '',
        preferred_doctors: '',
        travel_frequency: ''
    });

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Act as a Medicare insurance expert. Analyze this profile and recommend the best Medicare options:

Age: ${formData.age}
Current Insurance: ${formData.current_insurance}
Chronic Conditions: ${formData.chronic_conditions || 'None'}
Monthly Prescriptions: ${formData.prescription_count}
Annual Income: ${formData.annual_income}
Has Preferred Doctors: ${formData.preferred_doctors}
Travel Frequency: ${formData.travel_frequency}

Provide comprehensive recommendations for:
1. Original Medicare (Part A & B) vs Medicare Advantage (Part C)
2. Whether to add Part D (prescription coverage)
3. Medigap supplemental insurance recommendations
4. Cost comparison (monthly premiums, out-of-pocket max, deductibles)
5. Coverage recommendations based on their health profile
6. Top 3 specific plans to research
7. Key questions to ask insurance agents
8. Enrollment timeline and deadlines`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        primary_recommendation: { type: "string" },
                        recommended_coverage_type: { type: "string" },
                        reasons: { type: "array", items: { type: "string" } },
                        estimated_monthly_cost: { type: "number" },
                        part_d_needed: { type: "boolean" },
                        medigap_recommendation: { type: "string" },
                        top_plans: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    plan_name: { type: "string" },
                                    type: { type: "string" },
                                    monthly_premium: { type: "number" },
                                    key_benefits: { type: "array", items: { type: "string" } },
                                    considerations: { type: "string" }
                                }
                            }
                        },
                        questions_to_ask: { type: "array", items: { type: "string" } },
                        enrollment_advice: { type: "string" },
                        cost_breakdown: {
                            type: "object",
                            properties: {
                                monthly_premium: { type: "number" },
                                annual_deductible: { type: "number" },
                                out_of_pocket_max: { type: "number" }
                            }
                        }
                    }
                }
            });

            setRecommendations(result);
            toast.success('Analysis complete!');
        } catch (error) {
            toast.error('Failed to generate recommendations');
        }
        setLoading(false);
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
                            Medicare Navigator
                        </h1>
                        <p className="text-[#0F1729]/60 font-light">AI-powered Medicare & insurance guidance</p>
                    </div>
                </div>

                {!recommendations ? (
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-[#4A90E2]" />
                                Tell Us About Your Situation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label>Your Age</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    placeholder="65"
                                />
                            </div>

                            <div>
                                <Label>Current Insurance Status</Label>
                                <RadioGroup 
                                    value={formData.current_insurance} 
                                    onValueChange={(val) => setFormData({ ...formData, current_insurance: val })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="employer" id="employer" />
                                        <Label htmlFor="employer">Employer Coverage</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="marketplace" id="marketplace" />
                                        <Label htmlFor="marketplace">Marketplace/ACA</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="none" id="none" />
                                        <Label htmlFor="none">No Coverage</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="medicare" id="medicare" />
                                        <Label htmlFor="medicare">Already on Medicare</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>Chronic Health Conditions</Label>
                                <Input
                                    value={formData.chronic_conditions}
                                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                                    placeholder="e.g., Diabetes, Heart Disease, None"
                                />
                            </div>

                            <div>
                                <Label>Number of Monthly Prescriptions</Label>
                                <Input
                                    type="number"
                                    value={formData.prescription_count}
                                    onChange={(e) => setFormData({ ...formData, prescription_count: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <Label>Annual Household Income</Label>
                                <Input
                                    type="number"
                                    value={formData.annual_income}
                                    onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                                    placeholder="$0"
                                />
                            </div>

                            <div>
                                <Label>Do you have preferred doctors you want to keep?</Label>
                                <RadioGroup 
                                    value={formData.preferred_doctors} 
                                    onValueChange={(val) => setFormData({ ...formData, preferred_doctors: val })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yes" id="docs-yes" />
                                        <Label htmlFor="docs-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="docs-no" />
                                        <Label htmlFor="docs-no">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>How often do you travel?</Label>
                                <RadioGroup 
                                    value={formData.travel_frequency} 
                                    onValueChange={(val) => setFormData({ ...formData, travel_frequency: val })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="rarely" id="rarely" />
                                        <Label htmlFor="rarely">Rarely</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="occasionally" id="occasionally" />
                                        <Label htmlFor="occasionally">Occasionally</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="frequently" id="frequently" />
                                        <Label htmlFor="frequently">Frequently</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={loading || !formData.age}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Get Recommendations
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Primary Recommendation */}
                        <Card className="border-[#4A90E2]/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Our Recommendation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <Badge className="bg-green-600 text-white mb-2">
                                        {recommendations.recommended_coverage_type}
                                    </Badge>
                                    <p className="text-lg text-green-900">{recommendations.primary_recommendation}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Why This Works For You:</h3>
                                    <ul className="space-y-2">
                                        {recommendations.reasons.map((reason, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-[#0F1729]/60">Est. Monthly</p>
                                        <p className="text-2xl font-light text-black">
                                            ${recommendations.estimated_monthly_cost}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#0F1729]/60">Part D Needed</p>
                                        <p className="text-2xl font-light text-black">
                                            {recommendations.part_d_needed ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#0F1729]/60">Medigap</p>
                                        <p className="text-sm font-light text-black mt-2">
                                            {recommendations.medigap_recommendation}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Plans */}
                        <Card className="border-[#4A90E2]/20">
                            <CardHeader>
                                <CardTitle>Top Plans to Research</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recommendations.top_plans.map((plan, i) => (
                                    <div key={i} className="bg-white border border-[#4A90E2]/20 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-medium text-black">{plan.plan_name}</h3>
                                                <Badge className="bg-[#4A90E2]/10 text-[#4A90E2] mt-1">
                                                    {plan.type}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-light text-black">
                                                    ${plan.monthly_premium}
                                                </p>
                                                <p className="text-xs text-[#0F1729]/60">/month</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            {plan.key_benefits.map((benefit, j) => (
                                                <div key={j} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-[#4A90E2] mt-0.5" />
                                                    {benefit}
                                                </div>
                                            ))}
                                        </div>
                                        {plan.considerations && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                                                <p className="text-yellow-900">{plan.considerations}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Questions to Ask */}
                        <Card className="border-[#4A90E2]/20">
                            <CardHeader>
                                <CardTitle>Questions to Ask Insurance Agents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {recommendations.questions_to_ask.map((q, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="font-bold text-[#4A90E2]">{i + 1}.</span>
                                            {q}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Button
                            variant="outline"
                            onClick={() => setRecommendations(null)}
                            className="w-full"
                        >
                            Start New Analysis
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}