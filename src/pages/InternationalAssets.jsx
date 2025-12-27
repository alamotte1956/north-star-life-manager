import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, RefreshCw, DollarSign, TrendingUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InternationalAssets() {
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({
        asset_type: '',
        asset_name: '',
        country: '',
        local_currency: '',
        value_local: '',
        institution_name: ''
    });
    const queryClient = useQueryClient();

    const { data: assets = [] } = useQuery({
        queryKey: ['international-assets'],
        queryFn: () => base44.entities.InternationalAsset.list('-created_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.InternationalAsset.create({
            ...data,
            value_local: parseFloat(data.value_local),
            value_usd: parseFloat(data.value_local) // Initial USD value, will be updated by exchange rate
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['international-assets'] });
            setShowAdd(false);
            toast.success('International asset added');
        }
    });

    const updateRatesMutation = useMutation({
        mutationFn: () => base44.functions.invoke('updateCurrencyRates', {}),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['international-assets'] });
            toast.success(`Updated ${result.data.updated_count} assets`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const totalValueUSD = assets.reduce((sum, a) => sum + (a.value_usd || 0), 0);
    const groupedByCountry = assets.reduce((acc, asset) => {
        if (!acc[asset.country]) acc[asset.country] = [];
        acc[asset.country].push(asset);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                                alt="North Star Logo" 
                                className="w-16 h-16 object-contain"
                            />
                            <div>
                                <h1 className="text-4xl font-light text-black mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    International Assets
                                </h1>
                                <p className="text-[#0F1729]/60 font-light">Real-time multi-currency tracking</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => updateRatesMutation.mutate()}
                                disabled={updateRatesMutation.isPending}
                                variant="outline"
                            >
                                <RefreshCw className={`w-5 h-5 mr-2 ${updateRatesMutation.isPending ? 'animate-spin' : ''}`} />
                                Update Rates
                            </Button>
                            <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                <Globe className="w-5 h-5 mr-2" />
                                Add Asset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#0F1729]/60">Total Value (USD)</span>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-light text-black">
                                ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            {assets.length > 0 && assets[0]?.last_rate_update && (
                                <p className="text-xs text-[#0F1729]/40 mt-2">
                                    Updated: {new Date(assets[0].last_rate_update).toLocaleString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#0F1729]/60">Countries</span>
                                <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-light text-black">
                                {Object.keys(groupedByCountry).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#0F1729]/60">Total Assets</span>
                                <Building2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-3xl font-light text-black">{assets.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assets by Country */}
                {Object.entries(groupedByCountry).map(([country, countryAssets]) => (
                    <div key={country} className="mb-8">
                        <h2 className="text-2xl font-light text-black mb-4 flex items-center gap-2">
                            <Globe className="w-6 h-6 text-[#4A90E2]" />
                            {country}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {countryAssets.map((asset) => (
                                <Card key={asset.id} className="border-[#4A90E2]/20">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg text-black">{asset.asset_name}</CardTitle>
                                                <p className="text-sm text-[#0F1729]/60 capitalize">
                                                    {asset.asset_type.replace('_', ' ')}
                                                </p>
                                            </div>
                                            <Badge className="bg-blue-100 text-blue-700">
                                                {asset.local_currency}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                                                <div className="text-sm text-green-900 mb-1">Local Value</div>
                                                <div className="text-2xl font-light text-green-900">
                                                    {asset.local_currency} {asset.value_local?.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-green-700 mt-2">
                                                    ≈ ${asset.value_usd?.toLocaleString()} USD
                                                </div>
                                            </div>

                                            {asset.institution_name && (
                                                <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                                    <Building2 className="w-4 h-4" />
                                                    {asset.institution_name}
                                                </div>
                                            )}

                                            {asset.exchange_rate && (
                                                <div className="text-xs text-[#1A2B44]/60">
                                                    Exchange Rate: 1 USD = {asset.exchange_rate.toFixed(4)} {asset.local_currency}
                                                    {asset.last_rate_update && (
                                                        <span className="ml-2">
                                                            (Updated {new Date(asset.last_rate_update).toLocaleDateString()})
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {asset.tax_reporting_required && (
                                                <Badge className="bg-yellow-100 text-yellow-700">
                                                    Tax Reporting Required
                                                </Badge>
                                            )}

                                            {asset.fbar_reporting && (
                                                <Badge className="bg-orange-100 text-orange-700">
                                                    FBAR Required
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Add Asset Dialog */}
                <Dialog open={showAdd} onOpenChange={setShowAdd}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add International Asset</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Asset Type</Label>
                                <Select
                                    value={formData.asset_type}
                                    onValueChange={(value) => setFormData({ ...formData, asset_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="property">Property</SelectItem>
                                        <SelectItem value="bank_account">Bank Account</SelectItem>
                                        <SelectItem value="investment">Investment</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Asset Name</Label>
                                <Input
                                    value={formData.asset_name}
                                    onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                                    placeholder="e.g., Paris Apartment, Swiss Bank Account"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Country</Label>
                                    <Input
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        placeholder="e.g., France"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Currency Code</Label>
                                    <Input
                                        value={formData.local_currency}
                                        onChange={(e) => setFormData({ ...formData, local_currency: e.target.value.toUpperCase() })}
                                        placeholder="EUR, GBP, JPY"
                                        maxLength={3}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Value (Local Currency)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.value_local}
                                    onChange={(e) => setFormData({ ...formData, value_local: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <Label>Institution Name (Optional)</Label>
                                <Input
                                    value={formData.institution_name}
                                    onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                                    placeholder="Bank or institution name"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    Exchange rates will be automatically updated daily. USD equivalent will be calculated based on current rates.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Add Asset
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Info Card */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <h3 className="font-medium text-blue-900 mb-3">💼 International Asset Management</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li>• Real-time currency conversion using live exchange rates</li>
                            <li>• Track properties, bank accounts, investments, and businesses worldwide</li>
                            <li>• FBAR and tax reporting flags for U.S. compliance</li>
                            <li>• Automatic daily exchange rate updates</li>
                            <li>• Consolidated net worth view across all currencies</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}