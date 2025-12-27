import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, DollarSign, TrendingUp, TrendingDown, Gift } from 'lucide-react';

export default function ScenarioBuilder({ onApply, onCancel }) {
    const [scenario, setScenario] = useState({
        monthly_income: '',
        monthly_savings_increase: '',
        investment_return_rate: '',
        expense_reduction: '',
        one_time_windfall: '',
        major_expense: '',
        major_expense_year: ''
    });

    const presetScenarios = [
        {
            name: 'Career Promotion',
            icon: TrendingUp,
            data: { monthly_income: 10000, monthly_savings_increase: 1000 }
        },
        {
            name: 'Aggressive Savings',
            icon: DollarSign,
            data: { monthly_savings_increase: 1500, expense_reduction: 500 }
        },
        {
            name: 'Inheritance/Windfall',
            icon: Gift,
            data: { one_time_windfall: 50000 }
        },
        {
            name: 'Major Purchase',
            icon: TrendingDown,
            data: { major_expense: 30000, major_expense_year: '2' }
        }
    ];

    const applyPreset = (preset) => {
        setScenario(prev => ({ ...prev, ...preset.data }));
    };

    return (
        <Card className="border-[#C5A059]/30">
            <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#C5A059]" />
                    What-If Scenario Builder
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Preset Scenarios */}
                <div>
                    <Label className="mb-2 block">Quick Scenarios</Label>
                    <div className="grid grid-cols-4 gap-3">
                        {presetScenarios.map((preset, i) => {
                            const Icon = preset.icon;
                            return (
                                <Button
                                    key={i}
                                    variant="outline"
                                    onClick={() => applyPreset(preset)}
                                    className="h-auto py-3 flex-col gap-2"
                                >
                                    <Icon className="w-5 h-5 text-[#C5A059]" />
                                    <span className="text-xs">{preset.name}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Monthly Income</Label>
                        <Input
                            type="number"
                            value={scenario.monthly_income}
                            onChange={(e) => setScenario({ ...scenario, monthly_income: e.target.value })}
                            placeholder="e.g., 8000"
                        />
                    </div>
                    <div>
                        <Label>Increase Monthly Savings By</Label>
                        <Input
                            type="number"
                            value={scenario.monthly_savings_increase}
                            onChange={(e) => setScenario({ ...scenario, monthly_savings_increase: e.target.value })}
                            placeholder="e.g., 500"
                        />
                    </div>
                    <div>
                        <Label>Expected Investment Return (%)</Label>
                        <Input
                            type="number"
                            value={scenario.investment_return_rate}
                            onChange={(e) => setScenario({ ...scenario, investment_return_rate: e.target.value })}
                            placeholder="e.g., 8"
                        />
                    </div>
                    <div>
                        <Label>Reduce Monthly Expenses By</Label>
                        <Input
                            type="number"
                            value={scenario.expense_reduction}
                            onChange={(e) => setScenario({ ...scenario, expense_reduction: e.target.value })}
                            placeholder="e.g., 300"
                        />
                    </div>
                    <div>
                        <Label>One-Time Windfall</Label>
                        <Input
                            type="number"
                            value={scenario.one_time_windfall}
                            onChange={(e) => setScenario({ ...scenario, one_time_windfall: e.target.value })}
                            placeholder="e.g., 10000"
                        />
                    </div>
                    <div>
                        <Label>Major Expense Amount</Label>
                        <Input
                            type="number"
                            value={scenario.major_expense}
                            onChange={(e) => setScenario({ ...scenario, major_expense: e.target.value })}
                            placeholder="e.g., 25000"
                        />
                    </div>
                    <div>
                        <Label>Major Expense Year</Label>
                        <Input
                            type="number"
                            value={scenario.major_expense_year}
                            onChange={(e) => setScenario({ ...scenario, major_expense_year: e.target.value })}
                            placeholder="e.g., 2"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => onApply(scenario)}
                        className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                    >
                        Apply Scenario
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}