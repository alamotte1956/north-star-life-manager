import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MedicationInteractionChecker({ medications }) {
    const [checking, setChecking] = useState(false);
    const [interactions, setInteractions] = useState(null);

    const checkInteractions = async () => {
        setChecking(true);
        try {
            const medList = medications.map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency
            }));

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze these medications for potential interactions, contraindications, and safety concerns:

${JSON.stringify(medList, null, 2)}

Provide:
1. Critical interactions (if any) - urgent medical attention needed
2. Moderate interactions - monitor carefully
3. Minor interactions - generally safe but be aware
4. Overall safety assessment
5. Recommendations for patient and doctor discussion

Be thorough but clear. Prioritize patient safety.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        critical_interactions: { 
                            type: "array", 
                            items: { 
                                type: "object",
                                properties: {
                                    medications: { type: "array", items: { type: "string" } },
                                    risk: { type: "string" },
                                    action: { type: "string" }
                                }
                            }
                        },
                        moderate_interactions: { 
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    medications: { type: "array", items: { type: "string" } },
                                    description: { type: "string" }
                                }
                            }
                        },
                        minor_interactions: { type: "array", items: { type: "string" } },
                        overall_safety: { type: "string" },
                        recommendations: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setInteractions(result);
            toast.success('Interaction check complete');
        } catch (error) {
            toast.error('Failed to check interactions');
        }
        setChecking(false);
    };

    return (
        <Card className="border-[#4A90E2]/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        Medication Interaction Checker
                    </span>
                    <Button
                        onClick={checkInteractions}
                        disabled={checking || medications.length < 2}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                    >
                        {checking ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            'Check Interactions'
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!interactions && medications.length < 2 && (
                    <p className="text-sm text-[#0F1729]/60 text-center py-8">
                        Add at least 2 medications to check for interactions
                    </p>
                )}

                {interactions && (
                    <div className="space-y-4">
                        {/* Critical Interactions */}
                        {interactions.critical_interactions?.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Critical Interactions - Seek Medical Advice
                                </h3>
                                {interactions.critical_interactions.map((interaction, i) => (
                                    <div key={i} className="mb-3 last:mb-0">
                                        <p className="text-sm font-medium text-red-800 mb-1">
                                            {interaction.medications.join(' + ')}
                                        </p>
                                        <p className="text-sm text-red-700 mb-1">{interaction.risk}</p>
                                        <p className="text-sm text-red-900 font-medium">{interaction.action}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Moderate Interactions */}
                        {interactions.moderate_interactions?.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                                    <Info className="w-5 h-5" />
                                    Moderate Interactions - Monitor Carefully
                                </h3>
                                {interactions.moderate_interactions.map((interaction, i) => (
                                    <div key={i} className="mb-2 last:mb-0">
                                        <p className="text-sm font-medium text-orange-800">
                                            {interaction.medications.join(' + ')}
                                        </p>
                                        <p className="text-sm text-orange-700">{interaction.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Critical/Moderate Interactions */}
                        {(!interactions.critical_interactions || interactions.critical_interactions.length === 0) &&
                         (!interactions.moderate_interactions || interactions.moderate_interactions.length === 0) && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-green-900 mb-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <h3 className="font-medium">No Critical Interactions Detected</h3>
                                </div>
                                <p className="text-sm text-green-800">{interactions.overall_safety}</p>
                            </div>
                        )}

                        {/* Recommendations */}
                        {interactions.recommendations?.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-3">Recommendations</h3>
                                <ul className="space-y-2">
                                    {interactions.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                            <span className="font-bold">•</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="text-xs text-[#0F1729]/50 italic mt-4 p-3 bg-gray-50 rounded">
                            ⚠️ This is an AI-powered analysis for informational purposes only. Always consult your healthcare provider before making medication changes.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}