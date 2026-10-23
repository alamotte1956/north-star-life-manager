import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Download, Loader2, Printer } from 'lucide-react';
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
    const [generatedReport, setGeneratedReport] = useState(null);
    const [selectedType, setSelectedType] = useState('monthly_spending');
    const [selectedFormat, setSelectedFormat] = useState('pdf');

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await base44.functions.invoke('generateAIReport', {
                report_type: selectedType,
                format: selectedFormat
            });

            setGeneratedReport(response.data);
            toast.success('Report generated successfully!');
            if (onReportGenerated) onReportGenerated();
        } catch (error) {
            toast.error('Failed to generate report');
        }
        setGenerating(false);
    };

    const handleDownload = () => {
        if (!generatedReport) return;
        
        const blob = new Blob([generatedReport], { 
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
    };

    const handlePrint = () => {
        if (!generatedReport) return;
        
        const reportTitle = reportTypes.find(t => t.value === selectedType)?.label || 'Report';
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h1 { color: #0F1729; }
                        @media print {
                            body { margin: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <pre id="content"></pre>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
        // Set textContent to prevent XSS
        printWindow.document.getElementById('content').textContent = generatedReport;
    };

    const handleClose = () => {
        setDialogOpen(false);
        setGeneratedReport(null);
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

            <Dialog open={dialogOpen} onOpenChange={handleClose}>
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

                        {generatedReport ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-900 font-medium">✓ Report generated successfully!</p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrint}
                                        className="flex-1"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print
                                    </Button>
                                    <Button
                                        onClick={handleDownload}
                                        className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download {selectedFormat.toUpperCase()}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
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
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}