import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Download, Loader2, FileText, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const reportTypes = [
    { value: 'monthly_spending', label: 'Monthly Spending Analysis', icon: '💰' },
    { value: 'investment_performance', label: 'Investment Performance Review', icon: '📈' },
    { value: 'succession_documents', label: 'Succession Document Status', icon: '📋' },
    { value: 'property_analytics', label: 'Property Analytics Report', icon: '🏠' },
    { value: 'budget_summary', label: 'Budget Summary Report', icon: '💳' },
    { value: 'tax_summary', label: 'Tax Summary Report', icon: '📊' }
];

export default function AIReportGenerator({ onReportGenerated }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedType, setSelectedType] = useState('monthly_spending');
    const [selectedFormat, setSelectedFormat] = useState('pdf');

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await base44.functions.invoke('generateAIReport', {
                report_type: selectedType,
                format: selectedFormat
            });

            // Download the file
            const blob = new Blob([response.data], { 
                type: selectedFormat === 'pdf' ? 'application/pdf' : 'text/csv' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedType}-report.${selectedFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            toast.success('Report generated successfully!');
            setDialogOpen(false);
            if (onReportGenerated) onReportGenerated();
        } catch (error) {
            toast.error('Failed to generate report');
        }
        setGenerating(false);
    };

    return (
        <>
            <Button
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
            >
                <Sparkles className="w-4 h-4" />
                AI Report Generator
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                            AI-Powered Report Generator
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div>
                            <Label className="mb-3 block">Select Report Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {reportTypes.map(type => (
                                    <Card
                                        key={type.value}
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            selectedType === type.value 
                                                ? 'border-[#4A90E2] border-2 bg-[#4A90E2]/5' 
                                                : 'border-gray-200'
                                        }`}
                                        onClick={() => setSelectedType(type.value)}
                                    >
                                        <CardContent className="pt-6 text-center">
                                            <div className="text-3xl mb-2">{type.icon}</div>
                                            <div className="text-sm font-medium">{type.label}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Export Format</Label>
                            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <strong>AI-Powered Analysis:</strong> Our AI will analyze your data and generate 
                                comprehensive insights, trends, and actionable recommendations tailored to your financial situation.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}