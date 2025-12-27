import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';

export default function CSVImporter({ onImportComplete }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        try {
            // Upload CSV file
            const { file_url } = await base44.integrations.Core.UploadFile({ file });

            // Parse and import transactions
            const response = await base44.functions.invoke('importTransactions', { 
                file_url 
            });

            setResult({
                success: true,
                imported: response.data.imported,
                failed: response.data.failed
            });

            if (onImportComplete) {
                onImportComplete();
            }
        } catch (error) {
            setResult({
                success: false,
                error: error.message
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-light mb-4">Import Transactions</h3>
            
            <div className="space-y-4">
                {!file ? (
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#D4AF37]/30 rounded-lg hover:border-[#D4AF37] transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-[#D4AF37] mb-2" />
                        <span className="text-sm text-black/70">Click to upload CSV file</span>
                        <span className="text-xs text-black/50 mt-1">Bank statements, credit cards</span>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </label>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <FileText className="w-5 h-5 text-[#D4AF37]" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-black/50">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFile(null)}
                            >
                                Remove
                            </Button>
                        </div>

                        <Button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full bg-gradient-to-r from-black to-[#1a1a1a] h-12"
                        >
                            {importing ? 'Importing...' : 'Import Transactions'}
                        </Button>
                    </div>
                )}

                {result && (
                    <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {result.success ? (
                                <Check className="w-5 h-5 text-green-600" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                {result.success ? 'Import Complete' : 'Import Failed'}
                            </span>
                        </div>
                        {result.success && (
                            <p className="text-sm text-green-700">
                                {result.imported} transactions imported successfully
                                {result.failed > 0 && ` (${result.failed} failed)`}
                            </p>
                        )}
                        {result.error && (
                            <p className="text-sm text-red-700">{result.error}</p>
                        )}
                    </div>
                )}

                <div className="text-xs text-black/50 space-y-1">
                    <p className="font-medium">CSV Format:</p>
                    <p>Expected columns: Date, Description, Amount, Category (optional)</p>
                </div>
            </div>
        </Card>
    );
}