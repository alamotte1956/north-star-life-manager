import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';

export default function ConceptExplainer({ concept, onClose }) {
    const { data: explanation, isLoading } = useQuery({
        queryKey: ['conceptExplanation', concept],
        queryFn: async () => {
            const result = await base44.functions.invoke('explainFinancialConcept', {
                concept
            });
            return result.data;
        },
        enabled: !!concept
    });

    return (
        <Dialog open={!!concept} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Understanding: {concept}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-12 text-center">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-[#C5A059] animate-pulse" />
                        <p className="text-gray-500">Generating explanation...</p>
                    </div>
                ) : explanation?.success ? (
                    <div className="space-y-6">
                        {/* Simple Definition */}
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-blue-600" />
                                    Simple Definition
                                </h3>
                                <p className="text-black/80 leading-relaxed">{explanation.explanation.simple_definition}</p>
                            </CardContent>
                        </Card>

                        {/* Why It Matters */}
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    Why It Matters
                                </h3>
                                <p className="text-black/70">{explanation.explanation.why_it_matters}</p>
                            </CardContent>
                        </Card>

                        {/* Real-World Example */}
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-lg mb-2 text-green-900">Real-World Example</h3>
                                <p className="text-green-800">{explanation.explanation.real_world_example}</p>
                            </CardContent>
                        </Card>

                        {/* Common Misconceptions */}
                        {explanation.explanation.common_misconceptions?.length > 0 && (
                            <Card className="bg-yellow-50 border-yellow-200">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-700" />
                                        Common Misconceptions
                                    </h3>
                                    <ul className="space-y-2">
                                        {explanation.explanation.common_misconceptions.map((misconception, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-yellow-900">
                                                <span className="text-yellow-600">•</span>
                                                <span>{misconception}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Practical Application */}
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-lg mb-2">Practical Application</h3>
                                <p className="text-black/70">{explanation.explanation.practical_application}</p>
                            </CardContent>
                        </Card>

                        {/* Next Steps */}
                        {explanation.explanation.next_steps?.length > 0 && (
                            <Card className="bg-gradient-to-br from-[#C5A059]/10 to-[#D4AF37]/10 border-[#C5A059]">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold text-lg mb-3">Next Steps</h3>
                                    <div className="space-y-2">
                                        {explanation.explanation.next_steps.map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                                                <span className="text-black/80">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Related Concepts */}
                        {explanation.explanation.related_concepts?.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Related Concepts</h3>
                                <div className="flex flex-wrap gap-2">
                                    {explanation.explanation.related_concepts.map((related, idx) => (
                                        <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-[#C5A059] hover:text-white transition-colors">
                                            {related}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-red-600">Failed to load explanation</p>
                )}
            </DialogContent>
        </Dialog>
    );
}