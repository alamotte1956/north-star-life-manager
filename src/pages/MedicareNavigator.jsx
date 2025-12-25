import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Info, Loader2, DollarSign, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MedicareNavigator() {
    const [analyzing, setAnalyzing] = useState(false);
    const [recommendations, setRecommendations] = useState(null);
    const [userInfo, setUserInfo] = useState({
        age: '',
        health_conditions: '',
        current_medications: '',
        doctors_specialists: '',
        expected_procedures: '',
        budget: ''
    });

    const analyzeOptions = async () => {
        setAnalyzing(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze Medicare options for this senior:

Age: ${userInfo.age}
Health Conditions: ${userInfo.health_conditions}
Current Medications: ${userInfo.current_medications}
Doctors/Specialists: ${userInfo.doctors_specialists}
Expected Procedures: ${userInfo.expected_procedures}
Monthly Budget: $${userInfo.budget}

Provide comprehensive Medicare guidance:
1. Recommended Plan Type (Original Medicare vs Medicare Advantage)
2. Medigap Policy Recommendations (if applicable)
3. Part D Prescription Drug Plan suggestions
4. Estimated Total Monthly Costs
5. Key Benefits and Coverage Analysis
6. Important Considerations
7. Open Enrollment Timeline
8. Next Steps

Be detailed and senior-friendly.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        recommended_plan: { 
                            type: "object",
                            properties: {
                                plan_type: { type: "string" },
                                rationale: { type: "string" },
                                monthly_premium: { type: "number" }
                            }
                        },
                        medigap_recommendation: { type: "string" },
                        part_d_recommendation: { type: "string" },
                        estimated_total_cost: { type: "number" },
                        key_benefits: { type: "array", items: { type: "string" } },
                        considerations: { type: "array", items: { type: "string" } },
                        enrollment_timeline: { type: "string" },
                        next_steps: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setRecommendations(result);
            toast.success('Analysis complete!');
        } catch (error) {
            toast.error('Failed to analyze options');
        }
        setAnalyzing(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-6xl mx-auto px-6 py-12">
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
                        <p className="text-[#0F1729]/60 font-light">AI-powered guidance for optimal coverage</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Form */}
                    <Card className="border-[#4A90E2]/20">
                        <CardHeader>
                            <CardTitle>Your Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Age</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={userInfo.age}
                                    onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                                    placeholder="65"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Health Conditions</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={userInfo.health_conditions}
                                    onChange={(e) => setUserInfo({ ...userInfo, health_conditions: e.target.value })}
                                    placeholder="Diabetes, high blood pressure, etc."
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Current Medications</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={userInfo.current_medications}
                                    onChange={(e) => setUserInfo({ ...userInfo, current_medications: e.target.value })}
                                    placeholder="List your medications..."
                                    rows="3"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Regular Doctors/Specialists</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={userInfo.doctors_specialists}
                                    onChange={(e) => setUserInfo({ ...userInfo, doctors_specialists: e.target.value })}
                                    placeholder="Primary care, cardiologist, etc."
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Expected Procedures/Services</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={userInfo.expected_procedures}
                                    onChange={(e) => setUserInfo({ ...userInfo, expected_procedures: e.target.value })}
                                    placeholder="Hip replacement, cataract surgery, etc."
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Monthly Budget</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={userInfo.budget}
                                    onChange={(e) => setUserInfo({ ...userInfo, budget: e.target.value })}
                                    placeholder="300"
                                />
                            </div>

                            <Button
                                onClick={analyzeOptions}
                                disabled={analyzing || !userInfo.age}
                                className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4 mr-2" />
                                        Analyze Coverage Options
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <div className="space-y-6">
                        {recommendations ? (
                            <>
                                {/* Recommended Plan */}
                                <Card className="border-[#4A90E2]/20 bg-gradient-to-br from-blue-50 to-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                            Recommended Plan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <Badge className="bg-[#4A90E2] text-white text-lg px-4 py-2">
                                                    {recommendations.recommended_plan.plan_type}
                                                </Badge>
                                            </div>
                                            <p className="text-[#0F1729]">{recommendations.recommended_plan.rationale}</p>
                                            <div className="flex items-center gap-2 text-xl font-medium text-[#4A90E2]">
                                                <DollarSign className="w-6 h-6" />
                                                ${recommendations.recommended_plan.monthly_premium}/month estimated premium
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Key Benefits */}
                                <Card className="border-[#4A90E2]/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-[#4A90E2]" />
                                            Key Benefits
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {recommendations.key_benefits.map((benefit, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Considerations */}
                                <Card className="border-orange-200 bg-orange-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-orange-900">
                                            <Info className="w-5 h-5" />
                                            Important Considerations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {recommendations.considerations.map((item, i) => (
                                                <li key={i} className="text-sm text-orange-900 flex items-start gap-2">
                                                    <span className="font-bold">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Next Steps */}
                                <Card className="border-[#4A90E2]/20">
                                    <CardHeader>
                                        <CardTitle>Next Steps</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ol className="space-y-2">
                                            {recommendations.next_steps.map((step, i) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <span className="font-bold text-[#4A90E2]">{i + 1}.</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ol>
                                    </CardContent>
                                </Card>

                                <div className="text-xs text-[#0F1729]/50 italic p-3 bg-gray-50 rounded">
                                    ⚠️ This is AI-powered guidance for informational purposes. Always verify with Medicare.gov and consult a licensed insurance agent.
                                </div>
                            </>
                        ) : (
                            <Card className="border-[#4A90E2]/20">
                                <CardContent className="py-16 text-center">
                                    <Shield className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                                    <p className="text-[#0F1729]/60 mb-2">Enter your information</p>
                                    <p className="text-sm text-[#0F1729]/40">Get personalized Medicare recommendations</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}