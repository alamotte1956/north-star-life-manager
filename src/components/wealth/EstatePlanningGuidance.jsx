import React, { useState } from 'react';
import logger from '@/utils/logger'
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, FileText, Users, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EstatePlanningGuidance() {
    const [loading, setLoading] = useState(false);
    const [situation, setSituation] = useState('');
    const [guidance, setGuidance] = useState(null);

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: beneficiaries } = useQuery({
        queryKey: ['beneficiaries'],
        queryFn: () => base44.entities.Beneficiary.filter({ created_by: user?.email }),
        enabled: !!user
    });

    const { data: documents } = useQuery({
        queryKey: ['estate-docs'],
        queryFn: () => base44.entities.Document.filter({ 
            created_by: user?.email,
            category: 'legal'
        }),
        enabled: !!user
    });

    const getGuidance = async () => {
        setLoading(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `As an estate planning expert, provide comprehensive guidance for this situation:

User Situation: ${situation}
Number of Beneficiaries: ${beneficiaries?.length || 0}
Existing Legal Documents: ${documents?.length || 0}

Provide detailed estate planning guidance covering:
1. Essential documents needed (will, trust, power of attorney, healthcare directive)
2. Tax optimization strategies (estate tax, gift tax, generation-skipping transfer tax)
3. Asset protection recommendations
4. Beneficiary designation review
5. Charitable giving opportunities
6. Trust structure recommendations
7. Timeline and priority actions
8. Potential pitfalls to avoid

Return as JSON with structure:
{
    "priority_score": 1-10,
    "essential_documents": [{"name": "doc name", "description": "why needed", "urgency": "high/medium/low"}, ...],
    "tax_strategies": [{"strategy": "name", "description": "details", "potential_savings": "estimated %"}, ...],
    "asset_protection": ["recommendation1", "recommendation2", ...],
    "beneficiary_guidance": ["guidance1", "guidance2", ...],
    "trust_recommendations": [{"type": "trust type", "purpose": "description", "benefits": ["benefit1", ...]}, ...],
    "timeline": [{"phase": "name", "timeframe": "duration", "actions": ["action1", ...]}, ...],
    "pitfalls": [{"issue": "problem", "solution": "how to avoid"}, ...],
    "estimated_cost": "cost range"
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        priority_score: { type: "number" },
                        essential_documents: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                    urgency: { type: "string" }
                                }
                            }
                        },
                        tax_strategies: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    strategy: { type: "string" },
                                    description: { type: "string" },
                                    potential_savings: { type: "string" }
                                }
                            }
                        },
                        asset_protection: { type: "array", items: { type: "string" } },
                        beneficiary_guidance: { type: "array", items: { type: "string" } },
                        trust_recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    purpose: { type: "string" },
                                    benefits: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        timeline: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    phase: { type: "string" },
                                    timeframe: { type: "string" },
                                    actions: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        pitfalls: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    issue: { type: "string" },
                                    solution: { type: "string" }
                                }
                            }
                        },
                        estimated_cost: { type: "string" }
                    }
                }
            });

            setGuidance(response);
        } catch (error) {
            logger.error('Guidance error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Describe Your Estate Planning Situation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Your Situation, Goals, and Concerns</Label>
                            <Textarea
                                value={situation}
                                onChange={(e) => setSituation(e.target.value)}
                                placeholder="Example: I have $2M in assets, 3 children, own 2 properties, and want to minimize estate taxes while ensuring smooth transfer to my children. I'm also concerned about protecting assets from potential lawsuits..."
                                rows={6}
                                className="mt-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-[#0F1729]/60">Beneficiaries</p>
                                <p className="text-2xl font-light">{beneficiaries?.length || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[#0F1729]/60">Legal Documents</p>
                                <p className="text-2xl font-light">{documents?.length || 0}</p>
                            </div>
                        </div>
                        <Button
                            onClick={getGuidance}
                            disabled={loading || !situation}
                            className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Get AI Estate Planning Guidance'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {guidance && (
                <>
                    {/* Priority Score */}
                    <Card className="border-2 border-[#D4AF37]">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium mb-1">Planning Priority</h3>
                                    <p className="text-sm text-[#0F1729]/60">How urgently you need estate planning</p>
                                </div>
                                <div className="text-5xl font-light text-[#D4AF37]">
                                    {guidance.priority_score}/10
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Essential Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Essential Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guidance.essential_documents.map((doc, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium">{doc.name}</h4>
                                            <Badge className={
                                                doc.urgency === 'high' ? 'bg-red-600' :
                                                doc.urgency === 'medium' ? 'bg-yellow-600' :
                                                'bg-green-600'
                                            }>
                                                {doc.urgency} priority
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-[#0F1729]/70">{doc.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tax Strategies */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Tax Optimization Strategies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guidance.tax_strategies.map((strategy, idx) => (
                                    <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-green-900">{strategy.strategy}</h4>
                                            <Badge className="bg-green-600">
                                                Save {strategy.potential_savings}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-green-800">{strategy.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trust Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Trust Structure Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guidance.trust_recommendations.map((trust, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-1">{trust.type}</h4>
                                        <p className="text-sm text-[#0F1729]/70 mb-3">{trust.purpose}</p>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-[#0F1729]/60">Benefits:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {trust.benefits.map((benefit, bidx) => (
                                                    <li key={bidx} className="text-sm text-[#0F1729]/70">{benefit}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Implementation Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guidance.timeline.map((phase, idx) => (
                                    <div key={idx} className="p-4 border-l-4 border-[#4A90E2] bg-blue-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{phase.phase}</h4>
                                            <Badge variant="outline">{phase.timeframe}</Badge>
                                        </div>
                                        <ul className="space-y-1">
                                            {phase.actions.map((action, aidx) => (
                                                <li key={aidx} className="text-sm text-[#0F1729]/70 flex items-start gap-2">
                                                    <span className="text-[#4A90E2]">•</span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pitfalls */}
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-900">
                                <AlertTriangle className="w-5 h-5" />
                                Common Pitfalls to Avoid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {guidance.pitfalls.map((pitfall, idx) => (
                                    <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <h4 className="font-medium text-red-900 mb-2">⚠️ {pitfall.issue}</h4>
                                        <p className="text-sm text-red-800">
                                            <strong>Solution:</strong> {pitfall.solution}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estimated Cost */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-[#0F1729]/60 mb-2">Estimated Professional Fees</p>
                                <p className="text-3xl font-light text-[#2E5C8A]">{guidance.estimated_cost}</p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}