import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';

export default function ContactImporter({ onImportComplete }) {
    const [open, setOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError('');
        setSuccess('');

        try {
            const text = await file.text();
            const rows = text.split('\n').filter(row => row.trim());
            
            // Parse CSV (simple parsing, assumes comma-separated)
            const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
            const contacts = [];

            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',').map(v => v.trim());
                const contact = {};
                
                headers.forEach((header, idx) => {
                    if (values[idx]) {
                        contact[header] = values[idx];
                    }
                });

                // Map common CSV headers to our schema
                const mappedContact = {
                    name: contact.name || contact.full_name || contact.fullname || '',
                    email: contact.email || '',
                    phone: contact.phone || contact.phone_number || '',
                    company: contact.company || contact.organization || '',
                    address: contact.address || '',
                    category: contact.category || 'other',
                    specialty: contact.specialty || contact.title || '',
                    priority: contact.priority || 'medium',
                    notes: contact.notes || ''
                };

                if (mappedContact.name) {
                    contacts.push(mappedContact);
                }
            }

            // Bulk create contacts
            if (contacts.length > 0) {
                await base44.entities.Contact.bulkCreate(contacts);
                setSuccess(`Successfully imported ${contacts.length} contacts!`);
                setTimeout(() => {
                    onImportComplete();
                    setOpen(false);
                }, 2000);
            } else {
                setError('No valid contacts found in CSV file');
            }
        } catch (err) {
            setError(err.message || 'Failed to import contacts');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const template = 'name,email,phone,company,category,specialty,priority,address,notes\nJohn Doe,john@example.com,555-1234,Acme Corp,attorney,Estate Law,high,"123 Main St","Important client"\nJane Smith,jane@example.com,555-5678,Smith & Co,financial_advisor,Wealth Management,vip,"456 Oak Ave","VIP advisor"';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-[#4A90E2]/20">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Contacts from CSV</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            Upload a CSV file with columns: name, email, phone, company, category, specialty, priority, address, notes
                        </AlertDescription>
                    </Alert>

                    <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        className="w-full"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV Template
                    </Button>

                    <div className="border-2 border-dashed border-[#4A90E2]/30 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={importing}
                            className="hidden"
                            id="csv-upload"
                        />
                        <label
                            htmlFor="csv-upload"
                            className="cursor-pointer"
                        >
                            <Upload className="w-12 h-12 text-[#4A90E2]/50 mx-auto mb-2" />
                            <p className="text-sm text-[#0F1729]/60">
                                {importing ? 'Importing...' : 'Click to upload CSV file'}
                            </p>
                        </label>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="bg-green-50 text-green-900 border-green-200">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}