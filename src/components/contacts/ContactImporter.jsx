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

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError('');
        setSuccess('');

        try {
            const text = await file.text();
            const rows = text.split('\n').filter(row => row.trim());
            
            // Parse CSV with proper quote handling
            const headers = parseCSVLine(rows[0]).map(h => h.toLowerCase().trim());
            const contacts = [];

            for (let i = 1; i < rows.length; i++) {
                const values = parseCSVLine(rows[i]);
                const contact = {};
                
                headers.forEach((header, idx) => {
                    if (values[idx]) {
                        contact[header] = values[idx].replace(/^"|"$/g, '').trim();
                    }
                });

                // Comprehensive mapping for Google Contacts, Apple Contacts, and custom formats
                const mappedContact = {
                    name: contact.name || 
                          contact['full name'] || 
                          contact.fullname ||
                          `${contact['first name'] || contact['given name'] || ''} ${contact['last name'] || contact['family name'] || ''}`.trim() ||
                          contact['display name'] ||
                          '',
                    
                    email: contact.email || 
                           contact['e-mail address'] || 
                           contact['e-mail 1 - value'] ||
                           contact['email 1 - value'] ||
                           contact['primary email'] ||
                           '',
                    
                    phone: contact.phone || 
                           contact['phone number'] ||
                           contact['phone 1 - value'] ||
                           contact['mobile phone'] ||
                           contact['primary phone'] ||
                           '',
                    
                    company: contact.company || 
                             contact.organization || 
                             contact['organization 1 - name'] ||
                             contact['company name'] ||
                             '',
                    
                    address: contact.address || 
                             contact['home address'] ||
                             contact['address 1 - formatted'] ||
                             contact['street address'] ||
                             '',
                    
                    category: contact.category || 'other',
                    
                    specialty: contact.specialty || 
                              contact.title || 
                              contact['job title'] ||
                              contact['organization 1 - title'] ||
                              '',
                    
                    priority: contact.priority || 'medium',
                    
                    notes: contact.notes || 
                           contact.note || 
                           contact.comments ||
                           ''
                };

                // Only add if we have at least a name
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
                            Automatically imports from Google Contacts, Apple Contacts, or any CSV with name, email, phone, company fields
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