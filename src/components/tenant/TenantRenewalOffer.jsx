import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function TenantRenewalOffer({ tenantEmail }) {
    const queryClient = useQueryClient();
    const [showResponse, setShowResponse] = useState(null);
    const [tenantNotes, setTenantNotes] = useState('');

    const { data: renewalOffers = [] } = useQuery({
        queryKey: ['renewalOffers', tenantEmail],
        queryFn: () => base44.entities.LeaseRenewal.filter({ tenant_email: tenantEmail }, '-created_date')
    });

    const respondMutation = useMutation({
        mutationFn: async ({ renewalId, status, notes }) => {
            return await base44.entities.LeaseRenewal.update(renewalId, {
                status,
                tenant_response_date: new Date().toISOString(),
                tenant_notes: notes
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['renewalOffers'] });
            toast.success('Response submitted successfully!');
            setShowResponse(null);
            setTenantNotes('');
        },
        onError: () => {
            toast.error('Failed to submit response');
        }
    });

    const handleAccept = (renewal) => {
        respondMutation.mutate({
            renewalId: renewal.id,
            status: 'accepted',
            notes: tenantNotes
        });
    };

    const handleDecline = (renewal) => {
        respondMutation.mutate({
            renewalId: renewal.id,
            status: 'declined',
            notes: tenantNotes
        });
    };

    const pendingOffers = renewalOffers.filter(r => r.status === 'pending');
    const respondedOffers = renewalOffers.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-4">
            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
                <div className="space-y-4">
                    {pendingOffers.map(offer => {
                        const daysToExpire = differenceInDays(new Date(offer.expires_on), new Date());
                        const isExpiringSoon = daysToExpire <= 3;
                        const rentIncrease = offer.proposed_monthly_rent - offer.current_monthly_rent;
                        const isIncrease = rentIncrease > 0;

                        return (
                            <Card key={offer.id} className={`border-2 ${isExpiringSoon ? 'border-orange-300 bg-orange-50/50' : 'border-[#C5A059]/30'}`}>
                                <CardHeader>
                                    <CardTitle className="text-lg font-light flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[#C5A059]" />
                                            Lease Renewal Offer
                                        </div>
                                        <Badge className="bg-blue-600 text-white">Pending</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Property Info */}
                                    <div>
                                        <h3 className="font-medium mb-2">{offer.property_name}</h3>
                                        <div className="text-sm text-gray-600">
                                            Current lease ends: {format(new Date(offer.current_lease_end_date), 'MMM d, yyyy')}
                                        </div>
                                    </div>

                                    {/* Rent Comparison */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-100 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">Current Rent</div>
                                            <div className="text-xl font-light">${offer.current_monthly_rent.toLocaleString()}</div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isIncrease ? 'bg-orange-100' : 'bg-green-100'}`}>
                                            <div className="text-xs text-gray-600 mb-1">Proposed Rent</div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xl font-light">${offer.proposed_monthly_rent.toLocaleString()}</div>
                                                {isIncrease && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        +{offer.rent_adjustment_percentage.toFixed(1)}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {rentIncrease !== 0 && (
                                        <div className={`p-3 rounded-lg ${isIncrease ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                                            <div className="text-sm">
                                                <strong>{isIncrease ? 'Rent Increase' : 'Rent Decrease'}:</strong> ${Math.abs(rentIncrease).toLocaleString()}/month
                                            </div>
                                        </div>
                                    )}

                                    {/* Proposed Term */}
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <span>
                                                <strong>New Term:</strong> {format(new Date(offer.proposed_lease_start_date), 'MMM d, yyyy')} - {format(new Date(offer.proposed_lease_end_date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Market Analysis */}
                                    {offer.market_rate_analysis && (
                                        <div>
                                            <div className="text-sm font-medium mb-2">Market Analysis</div>
                                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                                {offer.market_rate_analysis}
                                            </div>
                                        </div>
                                    )}

                                    {/* Renewal Terms */}
                                    {offer.renewal_terms && (
                                        <div>
                                            <div className="text-sm font-medium mb-2">Renewal Terms</div>
                                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                {offer.renewal_terms}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expiration Warning */}
                                    {isExpiringSoon && (
                                        <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-orange-900">
                                                    <strong>Urgent:</strong> This offer expires in {daysToExpire} day{daysToExpire !== 1 ? 's' : ''} on {format(new Date(offer.expires_on), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Response Section */}
                                    {showResponse === offer.id ? (
                                        <div className="space-y-3 pt-3 border-t">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Add comments (optional)
                                                </label>
                                                <Textarea
                                                    value={tenantNotes}
                                                    onChange={(e) => setTenantNotes(e.target.value)}
                                                    placeholder="Any comments or questions..."
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleAccept(offer)}
                                                    disabled={respondMutation.isPending}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 touch-manipulation"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Accept Renewal
                                                </Button>
                                                <Button
                                                    onClick={() => handleDecline(offer)}
                                                    disabled={respondMutation.isPending}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 touch-manipulation"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Decline
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setShowResponse(null);
                                                    setTenantNotes('');
                                                }}
                                                className="w-full"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => setShowResponse(offer.id)}
                                            className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white h-12 touch-manipulation"
                                        >
                                            Respond to Offer
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Previous Responses */}
            {respondedOffers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-light">Previous Offers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {respondedOffers.map(offer => (
                            <div key={offer.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{offer.property_name}</span>
                                    <Badge className={
                                        offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                        offer.status === 'declined' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }>
                                        {offer.status}
                                    </Badge>
                                </div>
                                <div className="text-xs text-gray-600">
                                    Responded: {format(new Date(offer.tenant_response_date), 'MMM d, yyyy')}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {pendingOffers.length === 0 && respondedOffers.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No renewal offers at this time</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}