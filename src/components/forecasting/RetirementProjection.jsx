import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function RetirementProjection({ retirement }) {
    const getScoreColor = (score) => {
        if (score >= 8) return 'bg-green-600';
        if (score >= 6) return 'bg-blue-600';
        if (score >= 4) return 'bg-yellow-600';
        return 'bg-red-600';
    };

    return (
        <Card className="border-purple-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Retirement Readiness
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[#64748B]">Score:</span>
                        <div className={`w-12 h-12 rounded-full ${getScoreColor(retirement.retirement_score)} flex items-center justify-center text-white font-bold`}>
                            {retirement.retirement_score}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <DollarSign className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                        <div className="text-xl font-light text-[#0F172A]">
                            ${retirement.estimated_retirement_savings.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#64748B]">Projected Savings</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Calendar className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                        <div className="text-xl font-light text-[#0F172A]">
                            {retirement.years_until_retirement} years
                        </div>
                        <div className="text-xs text-[#64748B]">Until Retirement</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                        <div className="text-xl font-light text-[#0F172A]">
                            ${retirement.monthly_retirement_income_projection.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#64748B]">Monthly Income</div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Assessment</h4>
                    <p className="text-sm text-purple-800">{retirement.assessment}</p>
                </div>

                <div>
                    <h4 className="font-medium text-[#0F172A] mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                        {retirement.recommendations?.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
                                <span className="text-[#0F172A]/80">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}