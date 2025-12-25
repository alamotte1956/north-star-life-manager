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
import { Gem, Plus, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ArtCollectibles() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [valuationLoading, setValuationLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        artist_creator: '',
        year_acquired: '',
        purchase_price: 0,
        category: 'art',
        description: '',
        provenance: '',
        condition: 'excellent'
    });

    const queryClient = useQueryClient();

    // Using HomeInventoryItem for art & collectibles
    const { data: items = [] } = useQuery({
        queryKey: ['artCollectibles'],
        queryFn: () => base44.entities.HomeInventoryItem.filter({ 
            category: { $in: ['art', 'collectibles', 'jewelry'] }
        })
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.HomeInventoryItem.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['artCollectibles']);
            setDialogOpen(false);
            resetForm();
            toast.success('Item added to collection');
        }
    });

    const resetForm = () => {
        setFormData({
            item_name: '',
            artist_creator: '',
            year_acquired: '',
            purchase_price: 0,
            category: 'art',
            description: '',
            provenance: '',
            condition: 'excellent'
        });
    };

    const handleAIValuation = async () => {
        if (!formData.item_name) {
            toast.error('Please enter item name first');
            return;
        }

        setValuationLoading(true);
        try {
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Provide an estimated market valuation and analysis for this art/collectible:

Item: ${formData.item_name}
Artist/Creator: ${formData.artist_creator}
Year Acquired: ${formData.year_acquired}
Purchase Price: $${formData.purchase_price}
Description: ${formData.description}
Provenance: ${formData.provenance}
Condition: ${formData.condition}

Provide:
1. Estimated current market value range (low and high)
2. Factors affecting value
3. Market trends for this type of item
4. Authenticity considerations
5. Recommendations for preservation
6. Insurance valuation suggestion
7. Appreciation potential`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        estimated_value_low: { type: "number" },
                        estimated_value_high: { type: "number" },
                        confidence_level: { type: "string" },
                        value_factors: { type: "array", items: { type: "string" } },
                        market_trends: { type: "string" },
                        authenticity_notes: { type: "string" },
                        preservation_tips: { type: "array", items: { type: "string" } },
                        insurance_value: { type: "number" },
                        appreciation_outlook: { type: "string" }
                    }
                }
            });

            const avgValue = (result.estimated_value_low + result.estimated_value_high) / 2;
            setFormData({ 
                ...formData, 
                current_value: avgValue,
                ai_valuation: result 
            });
            toast.success('AI valuation complete!');
        } catch (error) {
            toast.error('Failed to generate valuation');
        }
        setValuationLoading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const totalValue = items.reduce((sum, item) => sum + (item.current_value || 0), 0);

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
                            <p className="text-[#0F1729]/60 font-light">AI-powered valuation and tracking</p>
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

                <Card className="mb-8 border-[#4A90E2]/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#0F1729]/60">Total Collection Value</p>
                                <h3 className="text-4xl font-light text-black">
                                    ${totalValue.toLocaleString()}
                                </h3>
                            </div>
                            <Gem className="w-16 h-16 text-[#4A90E2]" />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <Card key={item.id} className="border-[#4A90E2]/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-black mb-1">{item.item_name}</h3>
                                        {item.artist_creator && (
                                            <p className="text-sm text-[#0F1729]/60">by {item.artist_creator}</p>
                                        )}
                                    </div>
                                    {item.ai_detected && (
                                        <Badge className="bg-purple-100 text-purple-700">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            AI Valued
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#0F1729]/60">Purchase Price:</span>
                                        <span className="font-medium">${item.purchase_price?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#0F1729]/60">Current Value:</span>
                                        <span className="font-medium text-[#4A90E2]">
                                            ${item.current_value?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                    {item.current_value > item.purchase_price && (
                                        <div className="flex items-center gap-1 text-sm text-green-600">
                                            <TrendingUp className="w-4 h-4" />
                                            +{(((item.current_value - item.purchase_price) / item.purchase_price) * 100).toFixed(1)}%
                                        </div>
                                    )}
                                </div>

                                <Badge className="bg-[#4A90E2]/10 text-[#4A90E2]">
                                    {item.category}
                                </Badge>
                                {item.condition && (
                                    <Badge variant="outline" className="ml-2">
                                        {item.condition}
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {items.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Gem className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No items in collection yet</p>
                            <p className="text-sm text-[#0F1729]/40">Track and value your art & collectibles</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Art or Collectible</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Item Name *</Label>
                                <Input
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Artist/Creator</Label>
                                    <Input
                                        value={formData.artist_creator}
                                        onChange={(e) => setFormData({ ...formData, artist_creator: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Year Acquired</Label>
                                    <Input
                                        type="number"
                                        value={formData.year_acquired}
                                        onChange={(e) => setFormData({ ...formData, year_acquired: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Purchase Price</Label>
                                <Input
                                    type="number"
                                    value={formData.purchase_price || ''}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Detailed description, dimensions, materials, etc."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Provenance (History of Ownership)</Label>
                                <Textarea
                                    placeholder="Previous owners, exhibitions, documentation..."
                                    value={formData.provenance}
                                    onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAIValuation}
                                disabled={valuationLoading || !formData.item_name}
                                className="w-full"
                            >
                                {valuationLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating AI Valuation...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Get AI Valuation
                                    </>
                                )}
                            </Button>

                            {formData.current_value && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-900 mb-1">AI Estimated Value</p>
                                    <p className="text-2xl font-light text-green-900">
                                        ${formData.current_value.toLocaleString()}
                                    </p>
                                </div>
                            )}

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