import React, { useState } from 'react';
import logger from '@/utils/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Scan, DollarSign, Home, Package, Sparkles, Image } from 'lucide-react';
import { toast } from 'sonner';

export default function HomeInventory() {
    const [showScanner, setShowScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [detectionResults, setDetectionResults] = useState(null);
    const queryClient = useQueryClient();

    const { data: items = [] } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: () => base44.entities.HomeInventoryItem.list('-created_date')
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list()
    });

    const scanMutation = useMutation({
        mutationFn: async (file) => {
            // Upload image first
            const uploadResult = await base44.integrations.Core.UploadFile({ file });
            
            // Analyze with AI
            return base44.functions.invoke('analyzeHomeInventory', {
                image_url: uploadResult.file_url,
                room: 'Living Room',
                property_id: properties[0]?.id || null
            });
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            setDetectionResults(result.data);
            toast.success(`Detected ${result.data.detected_items} items worth $${result.data.total_value.toLocaleString()}`);
            setScanning(false);
        },
        onError: (error) => {
            logger.error('Scan error:', error);
            toast.error(error?.response?.data?.error || 'Scan failed - please try again');
            setScanning(false);
        }
    });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
        
        setScanning(true);
        scanMutation.mutate(file);
    };

    const totalValue = items.reduce((sum, item) => sum + (item.current_value || 0), 0);
    const insuredItems = items.filter(i => i.insured).length;

    const categoryColors = {
        electronics: 'bg-blue-100 text-blue-700',
        furniture: 'bg-green-100 text-green-700',
        appliances: 'bg-purple-100 text-purple-700',
        jewelry: 'bg-pink-100 text-pink-700',
        art: 'bg-yellow-100 text-yellow-700',
        collectibles: 'bg-orange-100 text-orange-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Home Inventory</h1>
                            <p className="text-[#1A2B44]/60">AI-powered room scanning and item cataloging</p>
                        </div>
                        <Button onClick={() => setShowScanner(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Camera className="w-5 h-5 mr-2" />
                            Scan Room
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Total Value</span>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${totalValue.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Items Tracked</span>
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">{items.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Insured</span>
                                <Home className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">{insuredItems}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">AI Detected</span>
                                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                {items.filter(i => i.ai_detected).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* How It Works */}
                <Card className="mb-8 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <Scan className="w-8 h-8 text-blue-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-blue-900 mb-2">AI-Powered Room Scanning</h3>
                                <p className="text-sm text-blue-800 mb-3">
                                    Take photos of your rooms and our AI will automatically detect and catalog valuable items for insurance purposes.
                                </p>
                                <ul className="space-y-1 text-sm text-blue-700">
                                    <li>• Automatically detects electronics, furniture, appliances, and more</li>
                                    <li>• Estimates current market value</li>
                                    <li>• Tracks condition and depreciation</li>
                                    <li>• Perfect for insurance claims and estate planning</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{item.item_name}</CardTitle>
                                        {item.brand && (
                                            <p className="text-sm text-[#1A2B44]/60">{item.brand}</p>
                                        )}
                                    </div>
                                    {item.ai_detected && (
                                        <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            AI
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {item.photos?.[0] && (
                                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                            <img 
                                                src={item.photos[0]} 
                                                alt={item.item_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <Badge className={categoryColors[item.category] || 'bg-gray-100 text-gray-700'}>
                                            {item.category}
                                        </Badge>
                                        {item.insured && (
                                            <Badge className="bg-green-100 text-green-700">Insured</Badge>
                                        )}
                                    </div>

                                    {item.current_value && (
                                        <div className="text-2xl font-light text-green-600">
                                            ${item.current_value.toLocaleString()}
                                        </div>
                                    )}

                                    {item.room && (
                                        <div className="text-sm text-[#1A2B44]/60">
                                            📍 {item.room}
                                            {item.property_name && ` • ${item.property_name}`}
                                        </div>
                                    )}

                                    {item.condition && (
                                        <div className="text-sm">
                                            Condition: <span className="font-medium capitalize">{item.condition}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Scanner Dialog */}
                <Dialog open={showScanner} onOpenChange={(open) => {
                    setShowScanner(open);
                    if (!open) {
                        setPreviewImage(null);
                        setDetectionResults(null);
                    }
                }}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Scan Room with AI</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Preview Image */}
                            {previewImage && (
                                <div className="relative">
                                    <img 
                                        src={previewImage} 
                                        alt="Room preview" 
                                        className="w-full rounded-lg border-2 border-[#D4AF37]/30"
                                    />
                                    {scanning && (
                                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#D4AF37] animate-pulse" />
                                                <p className="text-white text-lg">Analyzing room...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Detection Results */}
                            {detectionResults && !scanning && (
                                <Card className="border-green-200 bg-green-50">
                                    <CardHeader>
                                        <CardTitle className="text-green-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5" />
                                            Detection Complete!
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-green-800">
                                            <p>✓ Detected {detectionResults.detected_items} items</p>
                                            <p>✓ Total estimated value: ${detectionResults.total_value?.toLocaleString()}</p>
                                            <p className="text-sm text-green-700 mt-4">Items have been added to your inventory below.</p>
                                        </div>
                                        <Button 
                                            onClick={() => {
                                                setShowScanner(false);
                                                setPreviewImage(null);
                                                setDetectionResults(null);
                                            }}
                                            className="mt-4 w-full"
                                        >
                                            View Inventory
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Upload Area */}
                            {!previewImage && (
                                <div className="border-2 border-dashed border-[#D4AF37]/30 rounded-lg p-12 text-center">
                                    <Camera className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
                                    <h3 className="text-lg font-medium text-[#1A2B44] mb-2">
                                        Take a Photo of Your Room
                                    </h3>
                                    <p className="text-sm text-[#1A2B44]/60 mb-6">
                                        Our AI will detect and catalog all valuable items
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="room-photo"
                                    />
                                    <label htmlFor="room-photo">
                                        <Button asChild className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                            <span>
                                                <Image className="w-4 h-4 mr-2" />
                                                Choose Photo
                                            </span>
                                        </Button>
                                    </label>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}