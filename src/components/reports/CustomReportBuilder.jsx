import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function CustomReportBuilder({ open, onOpenChange, documents }) {
    const [generating, setGenerating] = useState(false);
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

            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `custom-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            toast.success('Custom report generated');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to generate report');
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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

                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={generating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={generateReport}
                            disabled={generating || Object.values(selectedFields).every(v => !v)}
                            className="flex-1 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#0F172A]"
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
                </div>
            </DialogContent>
        </Dialog>
    );
}