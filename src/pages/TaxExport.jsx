import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxExport() {
    const [taxYear, setTaxYear] = useState(new Date().getFullYear());
    const [software, setSoftware] = useState('turbotax');
    const [exporting, setExporting] = useState(false);
    const [exportData, setExportData] = useState(null);

    const handleExport = async () => {
        setExporting(true);
        try {
            const result = await base44.functions.invoke('exportToTaxSoftware', {
                tax_year: taxYear,
                software
            });
            
            setExportData(result.data);
            toast.success('Tax data exported successfully');
        } catch (error) {
            toast.error('Export failed');
        }
        setExporting(false);
    };

    const downloadJSON = () => {
        const dataStr = JSON.stringify(exportData.export_data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tax-export-${taxYear}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Tax Filing Integration</h1>
                    <p className="text-[#1A2B44]/60">Export your financial data for tax software</p>
                </div>

                {/* Export Form */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Generate Tax Export</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Tax Year</Label>
                                    <Input
                                        type="number"
                                        value={taxYear}
                                        onChange={(e) => setTaxYear(parseInt(e.target.value))}
                                        min="2020"
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                                <div>
                                    <Label>Tax Software</Label>
                                    <Select value={software} onValueChange={setSoftware}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="turbotax">TurboTax</SelectItem>
                                            <SelectItem value="hrblock">H&R Block</SelectItem>
                                            <SelectItem value="taxact">TaxAct</SelectItem>
                                            <SelectItem value="freetaxusa">FreeTaxUSA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black"
                            >
                                {exporting ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <FileText className="w-5 h-5 mr-2" />
                                )}
                                Generate Tax Export
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Results */}
                {exportData && (
                    <div className="space-y-6">
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                    <div>
                                        <h3 className="text-lg font-medium text-green-900">Export Ready</h3>
                                        <p className="text-sm text-green-700">
                                            Your {taxYear} tax data has been compiled
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={downloadJSON} className="bg-green-600 hover:bg-green-700 text-white">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download JSON File
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Tax Summary */}
                        {exportData.export_data.summary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tax Summary for {taxYear}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-[#1A2B44]/60 mb-1">Rental Income</div>
                                            <div className="text-xl font-light text-green-600">
                                                ${(exportData.export_data.summary.rental_income || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#1A2B44]/60 mb-1">Rental Expenses</div>
                                            <div className="text-xl font-light text-red-600">
                                                ${(exportData.export_data.summary.rental_expenses || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#1A2B44]/60 mb-1">Investment Gains</div>
                                            <div className="text-xl font-light text-green-600">
                                                ${(exportData.export_data.summary.investment_gains || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#1A2B44]/60 mb-1">Investment Losses</div>
                                            <div className="text-xl font-light text-red-600">
                                                ${(exportData.export_data.summary.investment_losses || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {exportData.export_data.summary.missing_documents?.length > 0 && (
                                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <h4 className="font-medium text-yellow-900 mb-2">Missing Documents</h4>
                                            <ul className="space-y-1">
                                                {exportData.export_data.summary.missing_documents.map((doc, i) => (
                                                    <li key={i} className="text-sm text-yellow-800">• {doc}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Info Card */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <h3 className="font-medium text-blue-900 mb-3">📊 Tax Filing Made Easy</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li>• Automatically compiles rental income, expenses, and investment data</li>
                            <li>• Organizes all tax-related documents in one place</li>
                            <li>• Identifies missing forms and documentation</li>
                            <li>• Exports in format compatible with major tax software</li>
                            <li>• Suggests tax optimization strategies throughout the year</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}