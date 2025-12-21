import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function RenewalManagement({ properties }) {
    const [generating, setGenerating] = useState(null);
    const [leaseTerm, setLeaseTerm] = useState(12);

    const { data: renewalOffers = [], refetch } = useQuery({
        queryKey: ['allRenewalOffers'],
        queryFn: () => base44.entities.LeaseRenewal.list('-created_date')
    });

    const handleGenerateOffer = async (property) => {
        setGenerating(property.id);
        try {
            await base44.functions.invoke('generateRenewalOffer', {
                property_id: property.id,
                proposed_lease_term_months: leaseTerm
            });
            toast.success('Renewal offer generated and sent to tenant!');
            refetch();
        } catch (error) {
            toast.error('Failed to generate renewal offer');
        } finally {
            setGenerating(null);
        }
    };

    const propertiesWithLeases = properties.filter(p => p.lease_end_date && p.tenant_email);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[#C5A059]" />
                        Lease Renewal Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label>Default Renewal Term (months)</Label>
                        <Input
                            type="number"
                            value={leaseTerm}
                            onChange={(e) => setLeaseTerm(parseInt(e.target.value))}
                            min="6"
                            max="24"
                            className="w-32"
                        />
                    </div>
                </CardContent>
            </Card>

            {propertiesWithLeases.map(property => {
                const propertyOffers = renewalOffers.filter(r => r.property_id === property.id);
                const pendingOffer = propertyOffers.find(r => r.status === 'pending');
                const latestOffer = propertyOffers[0];

                return (
                    <Card key={property.id}>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">{property.name}</CardTitle>
                            <div className="text-sm text-gray-600">
                                Tenant: {property.tenant_name} ({property.tenant_email})
                            </div>
                            <div className="text-sm text-gray-600">
                                Lease ends: {format(new Date(property.lease_end_date), 'MMM d, yyyy')}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingOffer ? (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-blue-900">Pending Renewal Offer</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Current Rent</div>
                                            <div className="font-medium">${pendingOffer.current_monthly_rent.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Proposed Rent</div>
                                            <div className="font-medium">${pendingOffer.proposed_monthly_rent.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Adjustment</div>
                                            <div className="font-medium">{pendingOffer.rent_adjustment_percentage > 0 ? '+' : ''}{pendingOffer.rent_adjustment_percentage.toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Expires</div>
                                            <div className="font-medium">{format(new Date(pendingOffer.expires_on), 'MMM d, yyyy')}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : latestOffer ? (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Last Offer</span>
                                        <Badge className={
                                            latestOffer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            latestOffer.status === 'declined' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }>
                                            {latestOffer.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {latestOffer.status === 'declined' && <XCircle className="w-3 h-3 mr-1" />}
                                            {latestOffer.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {latestOffer.tenant_response_date 
                                            ? `Response: ${format(new Date(latestOffer.tenant_response_date), 'MMM d, yyyy')}`
                                            : 'No response yet'
                                        }
                                    </div>
                                    {latestOffer.tenant_notes && (
                                        <div className="mt-2 text-sm text-gray-700">
                                            <strong>Tenant notes:</strong> {latestOffer.tenant_notes}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            <Button
                                onClick={() => handleGenerateOffer(property)}
                                disabled={generating === property.id || !!pendingOffer}
                                className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                            >
                                {generating === property.id ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Generating Offer...
                                    </>
                                ) : pendingOffer ? (
                                    'Offer Already Sent'
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate AI Renewal Offer
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}