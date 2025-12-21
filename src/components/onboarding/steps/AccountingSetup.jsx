import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountingSetup({ onComplete }) {
    const [connecting, setConnecting] = useState(null);
    const [connected, setConnected] = useState(null);

    const integrations = [
        {
            id: 'quickbooks',
            name: 'QuickBooks',
            description: 'Sync invoices, expenses, and financial reports automatically',
            logo: '💼',
            popular: true
        },
        {
            id: 'xero',
            name: 'Xero',
            description: 'Real-time accounting data synchronization',
            logo: '📊',
            popular: false
        }
    ];

    const handleConnect = async (integration) => {
        setConnecting(integration.id);
        try {
            // Simulate connection process - in real app this would open OAuth flow
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const result = await base44.functions.invoke(`sync${integration.name}`, {});
            if (result.data?.success) {
                setConnected(integration.id);
                toast.success(`${integration.name} connected successfully!`);
            } else {
                toast.error(`Failed to connect ${integration.name}`);
            }
        } catch (error) {
            toast.error(`Connection failed. You can set this up later.`);
        } finally {
            setConnecting(null);
        }
    };

    const handleSkipForNow = () => {
        onComplete?.();
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-light text-[#0F172A] mb-2">Connect Your Accounting</h3>
                <p className="text-[#64748B] max-w-xl mx-auto">
                    Link your accounting software to get AI-powered financial insights and automated expense tracking
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {integrations.map(integration => (
                    <Card 
                        key={integration.id}
                        className={`relative overflow-hidden transition-all ${
                            connected === integration.id 
                                ? 'border-green-500 bg-green-50' 
                                : 'hover:shadow-lg'
                        }`}
                    >
                        {integration.popular && (
                            <Badge className="absolute top-3 right-3 bg-[#C5A059] text-white">
                                Popular
                            </Badge>
                        )}
                        
                        <CardContent className="pt-6">
                            <div className="text-4xl mb-4">{integration.logo}</div>
                            <h4 className="text-lg font-medium text-[#0F172A] mb-2">{integration.name}</h4>
                            <p className="text-sm text-[#64748B] mb-4 min-h-[40px]">{integration.description}</p>
                            
                            {connected === integration.id ? (
                                <Button
                                    className="w-full bg-green-600 text-white"
                                    disabled
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Connected
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleConnect(integration)}
                                    disabled={connecting !== null}
                                    className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                                >
                                    {connecting === integration.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Connect {integration.name}
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
                <p className="text-sm text-blue-900 flex items-start gap-2">
                    <span className="text-blue-600 text-lg">💡</span>
                    <span>
                        <strong>Pro tip:</strong> Connecting your accounting software enables automated expense 
                        categorization, real-time cash flow analysis, and AI-driven tax optimization suggestions.
                    </span>
                </p>
            </div>

            <div className="flex justify-center gap-3 pt-4">
                {connected ? (
                    <Button
                        onClick={handleSkipForNow}
                        className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white px-8"
                    >
                        Continue
                    </Button>
                ) : (
                    <Button
                        onClick={handleSkipForNow}
                        variant="outline"
                        className="px-8"
                    >
                        Skip for Now
                    </Button>
                )}
            </div>
        </div>
    );
}