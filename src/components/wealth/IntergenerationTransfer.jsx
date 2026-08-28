import React, { useState } from 'react';
import logger from '@/utils/logger'
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function IntergenerationTransfer() {
    const [loading, setLoading] = useState(false);
    const [goals, setGoals] = useState('');
    const [numberOfHeirs, setNumberOfHeirs] = useState('');
    const [plan, setPlan] = useState(null);

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: beneficiaries } = useQuery({
        queryKey: ['beneficiaries'],
        queryFn: () => base44.entities.Beneficiary.filter({ created_by: user?.email }),
        enabled: !!user
    });

    const createTransferPlan = async () => {
        setLoading(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `As an intergenerational wealth transfer expert, create a comprehensive plan for:

Number of Heirs: ${numberOfHeirs}
Current Beneficiaries in System: ${beneficiaries?.length || 0}
Goals & Values: ${goals}

Provide a detailed intergenerational transfer strategy covering:
1. Transfer methods (gifts, trusts, inheritance, insurance)
2. Gift tax strategies (annual exclusion, lifetime exemption)
3. Education funding strategies (529 plans, Coverdell ESAs)
4. Family governance structures
5. Values and legacy transmission
6. Conflict prevention strategies
7. Communication plan with heirs
8. Gradual transfer vs. lump sum analysis
9. Philanthropic opportunities
10. Financial education for heirs

Return as JSON with structure:
{
    "transfer_methods": [{"method": "name", "description": "details", "pros": ["pro1", ...], "cons": ["con1", ...], "best_for": "scenario"}, ...],
    "gift_strategies": [{"strategy": "name", "annual_amount": "amount", "tax_impact": "description"}, ...],
    "education_funding": [{"vehicle": "name", "contribution": "recommended amount", "benefits": ["benefit1", ...]}, ...],
    "governance": {
        "structure": "recommended structure",
        "key_roles": [{"role": "name", "responsibilities": "duties"}, ...],
        "meeting_frequency": "frequency"
    },
    "values_transmission": [{"method": "approach", "description": "how to implement"}, ...],
    "conflict_prevention": [{"issue": "potential problem", "prevention": "how to avoid"}, ...],
    "communication_plan": {
        "when_to_discuss": "timing",
        "what_to_share": ["topic1", "topic2", ...],
        "how_to_approach": "strategy"
    },
    "transfer_timeline": [{"age_range": "range", "actions": ["action1", ...], "rationale": "why"}, ...],
    "heir_education": [{"topic": "subject", "resources": ["resource1", ...], "timing": "when"}, ...],
    "philanthropic_opportunities": [{"option": "name", "benefits": ["benefit1", ...], "structure": "how to set up"}, ...],
    "estimated_costs": {"legal": "amount", "professional": "amount", "ongoing": "amount"}
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        transfer_methods: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    method: { type: "string" },
                                    description: { type: "string" },
                                    pros: { type: "array", items: { type: "string" } },
                                    cons: { type: "array", items: { type: "string" } },
                                    best_for: { type: "string" }
                                }
                            }
                        },
                        gift_strategies: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    strategy: { type: "string" },
                                    annual_amount: { type: "string" },
                                    tax_impact: { type: "string" }
                                }
                            }
                        },
                        education_funding: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    vehicle: { type: "string" },
                                    contribution: { type: "string" },
                                    benefits: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        governance: {
                            type: "object",
                            properties: {
                                structure: { type: "string" },
                                key_roles: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            role: { type: "string" },
                                            responsibilities: { type: "string" }
                                        }
                                    }
                                },
                                meeting_frequency: { type: "string" }
                            }
                        },
                        values_transmission: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    method: { type: "string" },
                                    description: { type: "string" }
                                }
                            }
                        },
                        conflict_prevention: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    issue: { type: "string" },
                                    prevention: { type: "string" }
                                }
                            }
                        },
                        communication_plan: {
                            type: "object",
                            properties: {
                                when_to_discuss: { type: "string" },
                                what_to_share: { type: "array", items: { type: "string" } },
                                how_to_approach: { type: "string" }
                            }
                        },
                        transfer_timeline: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    age_range: { type: "string" },
                                    actions: { type: "array", items: { type: "string" } },
                                    rationale: { type: "string" }
                                }
                            }
                        },
                        heir_education: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    topic: { type: "string" },
                                    resources: { type: "array", items: { type: "string" } },
                                    timing: { type: "string" }
                                }
                            }
                        },
                        philanthropic_opportunities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    option: { type: "string" },
                                    benefits: { type: "array", items: { type: "string" } },
                                    structure: { type: "string" }
                                }
                            }
                        },
                        estimated_costs: {
                            type: "object",
                            properties: {
                                legal: { type: "string" },
                                professional: { type: "string" },
                                ongoing: { type: "string" }
                            }
                        }
                    }
                }
            });

            setPlan(response);
        } catch (error) {
            logger.error('Plan error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Your Legacy Transfer Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Number of Heirs</Label>
                            <Input
                                type="number"
                                value={numberOfHeirs}
                                onChange={(e) => setNumberOfHeirs(e.target.value)}
                                placeholder="e.g., 3"
                            />
                        </div>
                        <div>
                            <Label>Your Goals & Values</Label>
                            <Textarea
                                value={goals}
                                onChange={(e) => setGoals(e.target.value)}
                                placeholder="Example: I want to ensure my children are financially secure but also want to teach them financial responsibility. I value philanthropy and want to instill that in the next generation..."
                                rows={5}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-[#0F1729]/60 mb-2">Beneficiaries in System</p>
                            <p className="text-2xl font-light">{beneficiaries?.length || 0}</p>
                        </div>
                        <Button
                            onClick={createTransferPlan}
                            disabled={loading || !goals || !numberOfHeirs}
                            className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Plan...
                                </>
                            ) : (
                                'Generate Transfer Strategy'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {plan && (
                <>
                    {/* Transfer Methods */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {plan.transfer_methods.map((method, idx) => (
                                    <div key={idx} className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-2">{method.method}</h4>
                                        <p className="text-sm text-[#0F1729]/70 mb-3">{method.description}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                            <div>
                                                <p className="text-xs font-medium text-green-700 mb-1">Pros:</p>
                                                <ul className="space-y-1">
                                                    {method.pros.map((pro, pidx) => (
                                                        <li key={pidx} className="text-xs text-green-600">✓ {pro}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-red-700 mb-1">Cons:</p>
                                                <ul className="space-y-1">
                                                    {method.cons.map((con, cidx) => (
                                                        <li key={cidx} className="text-xs text-red-600">✗ {con}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="mt-2">
                                            Best for: {method.best_for}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Family Governance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Family Governance Structure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium mb-2">Recommended Structure</h4>
                                    <p className="text-sm text-[#0F1729]/70">{plan.governance.structure}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-3">Key Roles</h4>
                                    <div className="space-y-3">
                                        {plan.governance.key_roles.map((role, idx) => (
                                            <div key={idx} className="p-3 border-l-4 border-[#4A90E2] bg-gray-50">
                                                <p className="font-medium text-sm mb-1">{role.role}</p>
                                                <p className="text-xs text-[#0F1729]/70">{role.responsibilities}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded">
                                    <p className="text-sm"><strong>Meeting Frequency:</strong> {plan.governance.meeting_frequency}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Communication Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Communication Strategy with Heirs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">When to Discuss</h4>
                                    <p className="text-sm text-[#0F1729]/70 p-3 bg-gray-50 rounded">
                                        {plan.communication_plan.when_to_discuss}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Topics to Cover</h4>
                                    <ul className="space-y-2">
                                        {plan.communication_plan.what_to_share.map((topic, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <Heart className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                {topic}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Approach Strategy</h4>
                                    <p className="text-sm text-[#0F1729]/70 p-3 bg-gray-50 rounded">
                                        {plan.communication_plan.how_to_approach}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transfer Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Age-Based Transfer Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {plan.transfer_timeline.map((phase, idx) => (
                                    <div key={idx} className="p-4 border-l-4 border-[#D4AF37] bg-yellow-50">
                                        <h4 className="font-medium mb-2">{phase.age_range}</h4>
                                        <ul className="space-y-1 mb-3">
                                            {phase.actions.map((action, aidx) => (
                                                <li key={aidx} className="text-sm flex items-start gap-2">
                                                    <span className="text-[#D4AF37]">•</span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-xs text-[#0F1729]/60 italic">{phase.rationale}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Philanthropic Opportunities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-red-600" />
                                Philanthropic Opportunities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {plan.philanthropic_opportunities.map((opp, idx) => (
                                    <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <h4 className="font-medium mb-2">{opp.option}</h4>
                                        <div className="mb-3">
                                            <p className="text-xs font-medium mb-1">Benefits:</p>
                                            <ul className="space-y-1">
                                                {opp.benefits.map((benefit, bidx) => (
                                                    <li key={bidx} className="text-xs text-[#0F1729]/70">• {benefit}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <p className="text-xs text-[#0F1729]/60">
                                            <strong>How to set up:</strong> {opp.structure}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estimated Costs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estimated Implementation Costs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Legal Setup</p>
                                    <p className="text-2xl font-light">{plan.estimated_costs.legal}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Professional Services</p>
                                    <p className="text-2xl font-light">{plan.estimated_costs.professional}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <p className="text-sm text-[#0F1729]/60 mb-1">Ongoing Costs</p>
                                    <p className="text-2xl font-light">{plan.estimated_costs.ongoing}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}