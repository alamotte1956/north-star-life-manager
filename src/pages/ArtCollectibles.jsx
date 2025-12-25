import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Gem, Plus, TrendingUp, Sparkles, Loader2, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function ArtCollectibles() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [valuationDialog, setValuationDialog] = useState(null);
    const [valuating, setValuating] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        artist_creator: '',
        category: 'fine_art',
        year_created: '',
        purchase_price: '',
        purchase_date: '',
        current_value: '',
        last_appraisal_date: '',
        condition: 'excellent',
        provenance: '',
        insurance_value: '',
        location: ''
    });

    const queryClient = useQueryClient();

    const { data: collectibles = [] } = useQuery({
        queryKey: ['artCollectibles'],
        queryFn: () => base44.entities.ValuableItem.filter({ category: { $in: ['fine_art', 'collectible', 'antique', 'rare_item'] } })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ValuableItem.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['artCollectibles']);
            setDialogOpen(false);
            resetForm();
            toast.success('Item added!');
        }
    });

    const getAIValuation = async (item) => {
        setValuating(true);
        setValuationDialog(item);
        
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Provide an estimated valuation and market analysis for this art/collectible:

Item: ${item.item_name}
Artist/Creator: ${item.artist_creator || 'Unknown'}
Category: ${item.category}
Year: ${item.year_created || 'Unknown'}
Condition: ${item.condition}
Purchase Price: $${item.purchase_price || 'Unknown'}
Provenance: ${item.provenance || 'Not provided'}

Provide:
1. Estimated Current Market Value (range)
2. Market Trend (increasing/stable/declining)
3. Comparable Sales (if available)
4. Factors Affecting Value
5. Insurance Recommendation
6. Suggestions for Preservation
7. Sale Potential and Best Venues

Use current auction data and art market knowledge.`,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        estimated_value_min: { type: "number" },
                        estimated_value_max: { type: "number" },
                        market_trend: { type: "string" },
                        comparable_sales: { type: "array", items: { type: "string" } },
                        value_factors: { type: "array", items: { type: "string" } },
                        insurance_recommendation: { type: "string" },
                        preservation_tips: { type: "array", items: { type: "string" } },
                        sale_venues: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Update item with AI valuation
            await base44.entities.ValuableItem.update(item.id, {
                current_value: (result.estimated_value_min + result.estimated_value_max) / 2,
                last_appraisal_date: new Date().toISOString().split('T')[0],
                ai_valuation: result
            });

            queryClient.invalidateQueries(['artCollectibles']);
            toast.success('Valuation complete!');
        } catch (error) {
            toast.error('Failed to get valuation');
        }
        setValuating(false);
    };

    const resetForm = () => {
        setFormData({
            item_name: '',
            artist_creator: '',
            category: 'fine_art',
            year_created: '',
            purchase_price: '',
            purchase_date: '',
            current_value: '',
            last_appraisal_date: '',
            condition: 'excellent',
            provenance: '',
            insurance_value: '',
            location: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const totalValue = collectibles.reduce((sum, item) => sum + (item.current_value || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Art & Collectibles
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">AI-powered valuations and collection management</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </Button>
                </div>

                {/* Summary */}
                <Card className="mb-8 border-[#4A90E2]/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#0F1729]/60 mb-1">Total Collection Value</p>
                                <p className="text-4xl font-light text-black">${totalValue.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[#0F1729]/60 mb-1">Items Tracked</p>
                                <p className="text-4xl font-light text-black">{collectibles.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Collectibles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collectibles.map((item) => (
                        <Card key={item.id} className="border-[#4A90E2]/20 hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg font-light">{item.item_name}</CardTitle>
                                    {item.current_value && (
                                        <Badge className="bg-green-100 text-green-700">
                                            ${item.current_value.toLocaleString()}
                                        </Badge>
                                    )}
                                </div>
                                {item.artist_creator && (
                                    <p className="text-sm text-[#0F1729]/60">by {item.artist_creator}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm text-[#0F1729]/70 space-y-1">
                                    {item.year_created && <p><strong>Year:</strong> {item.year_created}</p>}
                                    {item.condition && <p><strong>Condition:</strong> {item.condition}</p>}
                                    {item.location && <p><strong>Location:</strong> {item.location}</p>}
                                </div>

                                {item.last_appraisal_date && (
                                    <div className="flex items-center gap-2 text-sm text-[#0F1729]/60 p-2 bg-blue-50 rounded">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        Last appraised: {new Date(item.last_appraisal_date).toLocaleDateString()}
                                    </div>
                                )}

                                <Button
                                    onClick={() => getAIValuation(item)}
                                    className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                    size="sm"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    AI Valuation
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* AI Valuation Dialog */}
                <Dialog open={!!valuationDialog} onOpenChange={() => setValuationDialog(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#4A90E2]" />
                                AI Valuation Report
                            </DialogTitle>
                        </DialogHeader>

                        {valuating ? (
                            <div className="py-12 text-center">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#4A90E2]" />
                                <p className="text-[#0F1729]/60">Analyzing market data and comparable sales...</p>
                            </div>
                        ) : valuationDialog?.ai_valuation ? (
                            <div className="space-y-4">
                                <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                                    <CardContent className="pt-6">
                                        <p className="text-sm text-green-800 mb-2">Estimated Market Value</p>
                                        <p className="text-3xl font-medium text-green-900">
                                            ${valuationDialog.ai_valuation.estimated_value_min?.toLocaleString()} - 
                                            ${valuationDialog.ai_valuation.estimated_value_max?.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-green-700 mt-2">
                                            Trend: {valuationDialog.ai_valuation.market_trend}
                                        </p>
                                    </CardContent>
                                </Card>

                                {valuationDialog.ai_valuation.comparable_sales?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Comparable Sales</h4>
                                        <ul className="space-y-1 text-sm text-[#0F1729]/80">
                                            {valuationDialog.ai_valuation.comparable_sales.map((sale, i) => (
                                                <li key={i}>• {sale}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {valuationDialog.ai_valuation.preservation_tips?.length > 0 && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Preservation Tips</h4>
                                        <ul className="space-y-1 text-sm text-blue-800">
                                            {valuationDialog.ai_valuation.preservation_tips.map((tip, i) => (
                                                <li key={i}>• {tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="text-xs text-[#0F1729]/50 italic p-3 bg-gray-50 rounded">
                                    ⚠️ AI valuation for reference only. Consult certified appraisers for official valuations.
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-[#0F1729]/60">Click "AI Valuation" to get market analysis</p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Add Item Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Art or Collectible</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Item Name</Label>
                                <Input
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Artist / Creator</Label>
                                <Input
                                    value={formData.artist_creator}
                                    onChange={(e) => setFormData({ ...formData, artist_creator: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Category</Label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="fine_art">Fine Art (Painting, Sculpture)</option>
                                        <option value="collectible">Collectible</option>
                                        <option value="antique">Antique</option>
                                        <option value="rare_item">Rare Item</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Year Created</Label>
                                    <Input
                                        value={formData.year_created}
                                        onChange={(e) => setFormData({ ...formData, year_created: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Purchase Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.purchase_price}
                                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Purchase Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Condition</Label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                >
                                    <option value="mint">Mint</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                </select>
                            </div>

                            <div>
                                <Label>Provenance / History</Label>
                                <Textarea
                                    value={formData.provenance}
                                    onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
                                    placeholder="Ownership history, exhibitions, publications..."
                                    rows="3"
                                />
                            </div>

                            <div>
                                <Label>Storage Location</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Home, vault, gallery..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Add to Collection
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}