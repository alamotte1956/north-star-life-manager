import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function CustomReportBuilder({ open, onOpenChange, documents }) {
    const [generating, setGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState(null);
    const [selectedFields, setSelectedFields] = useState({
        title: true,
        category: true,
        created_date: true,
        created_by: true,
        document_type: false,
        expiry_date: false,
        amount: false,
        extracted_text: false,
        ai_summary: false,
        linked_entity_name: false,
        folder_name: false
    });

    const fieldLabels = {
        title: 'Document Title',
        category: 'Category',
        created_date: 'Upload Date',
        created_by: 'Uploaded By',
        document_type: 'Document Type',
        expiry_date: 'Expiry Date',
        amount: 'Amount',
        extracted_text: 'Extracted Text (OCR)',
        ai_summary: 'AI Summary',
        linked_entity_name: 'Linked To',
        folder_name: 'Folder'
    };

    const toggleField = (field) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const generateReport = async () => {
        setGenerating(true);
        try {
            // Filter document data based on selected fields
            const reportData = documents.map(doc => {
                const filtered = {};
                Object.keys(selectedFields).forEach(field => {
                    if (selectedFields[field] && doc[field] !== undefined) {
                        filtered[field] = doc[field];
                    }
                });
                return filtered;
            });

            // Convert to CSV
            const selectedFieldNames = Object.keys(selectedFields).filter(f => selectedFields[f]);
            const headers = selectedFieldNames.map(f => fieldLabels[f]).join(',');
            const rows = reportData.map(doc => 
                selectedFieldNames.map(field => {
                    const value = doc[field] || '';
                    // Escape commas and quotes for CSV
                    return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            );
            const csv = [headers, ...rows].join('\n');

            setGeneratedReport(csv);
            toast.success('Custom report generated');
        } catch (error) {
            toast.error('Failed to generate report');
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedReport) return;
        
        const blob = new Blob([generatedReport], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    const handlePrint = () => {
        if (!generatedReport) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Custom Document Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        pre { white-space: pre-wrap; word-wrap: break-word; }
                        @media print {
                            body { margin: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Document Report</h1>
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
        onOpenChange(false);
        setGeneratedReport(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Custom Report Builder</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-[#64748B]">
                        Select the fields to include in your custom report
                    </p>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {Object.keys(fieldLabels).map(field => (
                            <div key={field} className="flex items-center space-x-2">
                                <Checkbox
                                    id={field}
                                    checked={selectedFields[field]}
                                    onCheckedChange={() => toggleField(field)}
                                />
                                <Label htmlFor={field} className="cursor-pointer">
                                    {fieldLabels[field]}
                                </Label>
                            </div>
                        ))}
                    </div>

                    {generatedReport ? (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-900 font-medium">✓ Report ready!</p>
                            </div>
                            
                            <div className="flex gap-2">
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
                                    Download CSV
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1"
                                disabled={generating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={generateReport}
                                disabled={generating || Object.values(selectedFields).every(v => !v)}
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
                                        Generate CSV
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}