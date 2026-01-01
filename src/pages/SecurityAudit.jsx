import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, Copy, Lock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SecurityAudit() {
    const [copied, setCopied] = useState('');

    // All entities in the app categorized by sensitivity
    const entities = {
        critical: [
            { name: 'Document', reason: 'Contains uploaded files, PDFs, scans, sensitive documents' },
            { name: 'EmergencyInfo', reason: 'Contains emergency contacts and medical info' },
            { name: 'HealthRecord', reason: 'HIPAA-protected medical data' },
            { name: 'Medication', reason: 'Medical prescription information' },
            { name: 'AdvanceDirective', reason: 'Legal healthcare directives' },
            { name: 'MedicalEmergencyInfo', reason: 'Emergency medical information' }
        ],
        financial: [
            { name: 'BankAccount', reason: 'Bank account details and balances' },
            { name: 'Investment', reason: 'Investment holdings and values' },
            { name: 'Transaction', reason: 'Financial transaction history' },
            { name: 'BillPayment', reason: 'Bill payment information' },
            { name: 'CreditScore', reason: 'Credit history and scores' },
            { name: 'Budget', reason: 'Budget and spending data' },
            { name: 'BudgetTransaction', reason: 'Transaction categorization' },
            { name: 'FinancialGoal', reason: 'Financial goals and targets' },
            { name: 'PaymentMethod', reason: 'Payment method details' },
            { name: 'ScheduledPayment', reason: 'Scheduled payment information' }
        ],
        personal: [
            { name: 'Property', reason: 'Property ownership details' },
            { name: 'Vehicle', reason: 'Vehicle ownership information' },
            { name: 'Contact', reason: 'Personal contacts' },
            { name: 'ValuableItem', reason: 'Valuables and collectibles' },
            { name: 'HomeInventoryItem', reason: 'Home inventory' },
            { name: 'VideoMessage', reason: 'Legacy video messages' },
            { name: 'InternationalAsset', reason: 'International assets' },
            { name: 'TravelPlan', reason: 'Travel plans' },
            { name: 'ImportantDate', reason: 'Important dates and events' }
        ],
        business: [
            { name: 'BusinessClient', reason: 'Client information' },
            { name: 'Project', reason: 'Project details' },
            { name: 'Invoice', reason: 'Invoice data' },
            { name: 'Contract', reason: 'Contract information' },
            { name: 'BusinessExpense', reason: 'Business expense records' }
        ],
        operational: [
            { name: 'MaintenanceTask', reason: 'Maintenance tasks' },
            { name: 'CalendarEvent', reason: 'Calendar events' },
            { name: 'Subscription', reason: 'Subscription tracking' },
            { name: 'Automation', reason: 'Automation rules' },
            { name: 'Comment', reason: 'User comments (may contain secrets)' },
            { name: 'Beneficiary', reason: 'Beneficiary information' },
            { name: 'InsuranceQuote', reason: 'Insurance quotes' },
            { name: 'ProfessionalBooking', reason: 'Professional bookings' },
            { name: 'ConciergeRequest', reason: 'Concierge requests' },
            { name: 'BillNegotiation', reason: 'Bill negotiation data' },
            { name: 'ScheduledReport', reason: 'Scheduled reports' },
            { name: 'Communication', reason: 'Communications' },
            { name: 'NotificationPreference', reason: 'Notification settings' },
            { name: 'CategorizationRule', reason: 'Categorization rules' }
        ]
    };

    const rlsTemplate = `Create: userId == auth.userId
Read/List: userId == auth.userId
Update: userId == auth.userId
Delete: userId == auth.userId`;

    const copyRLS = (entityName) => {
        navigator.clipboard.writeText(rlsTemplate);
        setCopied(entityName);
        toast.success('RLS template copied!');
        setTimeout(() => setCopied(''), 2000);
    };

    const renderEntityList = (entityList, color, icon) => (
        <div className="space-y-2">
            {entityList.map(entity => (
                <Card key={entity.name} className="border-l-4" style={{ borderLeftColor: color }}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {icon}
                                    <h3 className="font-mono font-bold text-sm">{entity.name}</h3>
                                </div>
                                <p className="text-xs text-gray-600">{entity.reason}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyRLS(entity.name)}
                            >
                                {copied === entity.name ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/30 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-2xl">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-black">Security Audit</h1>
                        <p className="text-[#0F1729]/60 font-light">Configure RLS policies for all entities</p>
                    </div>
                </div>

                {/* Instructions */}
                <Card className="mb-8 bg-amber-50 border-amber-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                            <AlertTriangle className="w-5 h-5" />
                            Action Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm text-amber-900">
                            <p className="font-bold">To fix "security check failed" errors:</p>
                            <ol className="list-decimal ml-6 space-y-2">
                                <li>Go to your <strong>Base44 Dashboard</strong> (not this app)</li>
                                <li>Navigate to <strong>Data → Entities</strong> or <strong>Settings → Security</strong></li>
                                <li>Click <strong>"Run Security Scan"</strong></li>
                                <li>For each entity below, click <strong>"Resolve with AI"</strong> OR manually set the RLS rules</li>
                                <li>Re-run security scan until all pass</li>
                            </ol>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-amber-200">
                            <h3 className="font-bold text-sm mb-2 text-amber-900">RLS Template (copy for each entity):</h3>
                            <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
{rlsTemplate}
                            </pre>
                            <p className="text-xs text-amber-800 mt-2">
                                Replace <code>userId</code> with your actual user ID field name (might be <code>created_by</code> or <code>user_email</code>)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Critical Entities */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-900">
                            <Lock className="w-5 h-5" />
                            🔴 Critical (Highest Sensitivity) - {entities.critical.length} entities
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Medical records, legal documents, emergency info. Disable offline caching for these.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {renderEntityList(entities.critical, '#dc2626', <AlertTriangle className="w-4 h-4 text-red-600" />)}
                    </CardContent>
                </Card>

                {/* Financial Entities */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-900">
                            <Database className="w-5 h-5" />
                            🟠 Financial Data - {entities.financial.length} entities
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Banking, investments, transactions, credit scores.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {renderEntityList(entities.financial, '#ea580c', <AlertTriangle className="w-4 h-4 text-orange-600" />)}
                    </CardContent>
                </Card>

                {/* Personal Entities */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Shield className="w-5 h-5" />
                            🔵 Personal Assets - {entities.personal.length} entities
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Properties, vehicles, valuables, contacts.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {renderEntityList(entities.personal, '#2563eb', <Shield className="w-4 h-4 text-blue-600" />)}
                    </CardContent>
                </Card>

                {/* Business Entities */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Database className="w-5 h-5" />
                            🟣 Business Data - {entities.business.length} entities
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Clients, projects, invoices, contracts.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {renderEntityList(entities.business, '#9333ea', <Database className="w-4 h-4 text-purple-600" />)}
                    </CardContent>
                </Card>

                {/* Operational Entities */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <Shield className="w-5 h-5" />
                            ⚫ Operational Data - {entities.operational.length} entities
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Tasks, events, settings. Still require owner-only access.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {renderEntityList(entities.operational, '#6b7280', <Shield className="w-4 h-4 text-gray-600" />)}
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card className="bg-blue-50 border-blue-300">
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <h3 className="font-bold text-blue-900">📊 Summary</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="text-2xl font-bold text-red-600">{entities.critical.length}</div>
                                    <div className="text-xs text-gray-600">Critical</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="text-2xl font-bold text-orange-600">{entities.financial.length}</div>
                                    <div className="text-xs text-gray-600">Financial</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="text-2xl font-bold text-blue-600">{entities.personal.length}</div>
                                    <div className="text-xs text-gray-600">Personal</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                    <div className="text-2xl font-bold text-purple-600">{entities.business.length}</div>
                                    <div className="text-xs text-gray-600">Business</div>
                                </div>
                            </div>
                            <p className="text-sm text-blue-900 mt-4">
                                <strong>Total: {entities.critical.length + entities.financial.length + entities.personal.length + entities.business.length + entities.operational.length} entities</strong> require RLS configuration in Base44 dashboard.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}