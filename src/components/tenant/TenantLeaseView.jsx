import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, FileText, User } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantLeaseView({ property }) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#C5A059]" />
                        Lease Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <User className="w-5 h-5 text-[#C5A059] mt-0.5" />
                            <div className="flex-1">
                                <div className="text-xs text-gray-600 mb-1">Tenant Name</div>
                                <div className="font-medium">{property.tenant_name || 'Not specified'}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-[#C5A059] mt-0.5" />
                            <div className="flex-1">
                                <div className="text-xs text-gray-600 mb-1">Lease Period</div>
                                <div className="font-medium">
                                    {property.lease_start_date ? format(new Date(property.lease_start_date), 'MMM d, yyyy') : 'N/A'}
                                    {' → '}
                                    {property.lease_end_date ? format(new Date(property.lease_end_date), 'MMM d, yyyy') : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                                <div className="text-xs text-green-700 mb-1">Monthly Rent</div>
                                <div className="text-2xl font-light text-green-900">
                                    ${property.monthly_rent?.toLocaleString() || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {property.security_deposit && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <DollarSign className="w-5 h-5 text-[#C5A059] mt-0.5" />
                                <div className="flex-1">
                                    <div className="text-xs text-gray-600 mb-1">Security Deposit</div>
                                    <div className="font-medium">${property.security_deposit.toLocaleString()}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {property.address && (
                        <div>
                            <div className="text-xs text-gray-600">Address</div>
                            <div className="text-sm">{property.address}</div>
                        </div>
                    )}
                    {property.property_type && (
                        <div>
                            <div className="text-xs text-gray-600">Property Type</div>
                            <div className="text-sm capitalize">{property.property_type.replace('_', ' ')}</div>
                        </div>
                    )}
                    {property.square_footage && (
                        <div>
                            <div className="text-xs text-gray-600">Square Footage</div>
                            <div className="text-sm">{property.square_footage.toLocaleString()} sq ft</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}