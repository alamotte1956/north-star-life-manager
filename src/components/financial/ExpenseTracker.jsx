import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Receipt, Upload, Sparkles, TrendingUp, TrendingDown, DollarSign, Camera, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ExpenseTracker() {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [insights, setInsights] = useState(null);
    const [timeframe, setTimeframe] = useState('30');

    const { data: transactions = [], refetch } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => base44.entities.Transaction.list('-date', 100)
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Upload file
            const uploadResult = await base44.integrations.Core.UploadFile({ file });
            const fileUrl = uploadResult.file_url;

            // Extract receipt data
            const extractResult = await base44.functions.invoke('extractReceiptData', {
                file_url: fileUrl
            });

            setExtractedData(extractResult.data);
            toast.success('Receipt data extracted!');
        } catch (error) {
            toast.error('Failed to process receipt');
        } finally {
            setUploading(false);
        }
    };

    const saveTransaction = async () => {
        if (!extractedData) return;

        try {
            await base44.entities.Transaction.create({
                date: extractedData.extracted_data.date,
                description: extractedData.categorization.description || extractedData.extracted_data.merchant,
                amount: -extractedData.extracted_data.total_amount,
                category: extractedData.categorization.category,
                merchant: extractedData.extracted_data.merchant,
                linked_entity_type: extractedData.categorization.linked_entity_type,
                linked_entity_id: extractedData.categorization.linked_entity_id,
                linked_entity_name: extractedData.categorization.linked_entity_name,
                notes: `Receipt #${extractedData.extracted_data.receipt_number || 'N/A'}\n${extractedData.categorization.reasoning}`
            });

            toast.success('Transaction saved!');
            setUploadOpen(false);
            setExtractedData(null);
            refetch();
        } catch (error) {
            toast.error('Failed to save transaction');
        }
    };

    const getSpendingInsights = async () => {
        setInsightsLoading(true);
        try {
            const result = await base44.functions.invoke('getSpendingInsights', {
                timeframe
            });
            setInsights(result.data);
            toast.success('Insights generated!');
        } catch (error) {
            toast.error('Failed to generate insights');
        } finally {
            setInsightsLoading(false);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            property: 'bg-blue-100 text-blue-700',
            vehicle: 'bg-indigo-100 text-indigo-700',
            maintenance: 'bg-orange-100 text-orange-700',
            utilities: 'bg-cyan-100 text-cyan-700',
            groceries: 'bg-green-100 text-green-700',
            dining: 'bg-pink-100 text-pink-700',
            entertainment: 'bg-purple-100 text-purple-700',
            health: 'bg-red-100 text-red-700',
            travel: 'bg-yellow-100 text-yellow-700'
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-light text-[#1A2B44]">Expense Tracker</h2>
                    <p className="text-sm text-gray-600">AI-powered receipt scanning & insights</p>
                </div>
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Receipt className="w-4 h-4 mr-2" />
                            Scan Receipt
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Scan Receipt</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {!extractedData ? (
                                <div>
                                    <Label>Upload Receipt Image</Label>
                                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="receipt-upload"
                                        />
                                        <label htmlFor="receipt-upload" className="cursor-pointer">
                                            {uploading ? (
                                                <div>
                                                    <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 animate-spin" />
                                                    <p className="text-sm text-gray-600">Processing receipt...</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-600">Take photo or upload receipt</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-900 mb-2">
                                            <Receipt className="w-5 h-5" />
                                            <span className="font-medium">Receipt Extracted</span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-gray-600">Merchant:</span>
                                                    <div className="font-medium">{extractedData.extracted_data.merchant}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Date:</span>
                                                    <div className="font-medium">{extractedData.extracted_data.date}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Amount:</span>
                                                    <div className="font-medium text-lg">${extractedData.extracted_data.total_amount}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Category:</span>
                                                    <Badge className={getCategoryColor(extractedData.categorization.category)}>
                                                        {extractedData.categorization.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {extractedData.categorization.linked_entity_name && (
                                                <div className="pt-2 border-t border-green-300">
                                                    <span className="text-gray-600">Linked to:</span>
                                                    <div className="font-medium">
                                                        {extractedData.categorization.linked_entity_type}: {extractedData.categorization.linked_entity_name}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {extractedData.extracted_data.line_items?.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm font-medium text-gray-700 mb-2">Line Items:</div>
                                            <div className="space-y-1">
                                                {extractedData.extracted_data.line_items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{item.description}</span>
                                                        <span className="font-medium">${item.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button onClick={saveTransaction} className="flex-1">
                                            Save Transaction
                                        </Button>
                                        <Button onClick={() => setExtractedData(null)} variant="outline">
                                            Scan Another
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="insights">
                <TabsList>
                    <TabsTrigger value="insights">Spending Insights</TabsTrigger>
                    <TabsTrigger value="recent">Recent Expenses</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Select value={timeframe} onValueChange={setTimeframe}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                                <SelectItem value="365">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={getSpendingInsights} disabled={insightsLoading}>
                            <Sparkles className={`w-4 h-4 mr-2 ${insightsLoading ? 'animate-spin' : ''}`} />
                            {insightsLoading ? 'Analyzing...' : 'Generate Insights'}
                        </Button>
                    </div>

                    {insights && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <div className="text-3xl font-bold text-[#1A2B44]">
                                                ${insights.total_spending.toFixed(0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Spending</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold text-[#1A2B44]">
                                                {insights.transaction_count}
                                            </div>
                                            <div className="text-sm text-gray-600">Transactions</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Key Trends */}
                            {insights.insights.key_trends?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            Key Trends
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {insights.insights.key_trends.map((trend, idx) => (
                                                <li key={idx} className="text-sm text-gray-700">• {trend}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Cost Savings */}
                            {insights.insights.cost_savings?.length > 0 && (
                                <Card className="border-green-200">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2 text-green-900">
                                            <DollarSign className="w-5 h-5" />
                                            Cost Savings Opportunities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {insights.insights.cost_savings.map((saving, idx) => (
                                            <div key={idx} className="bg-green-50 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-medium text-green-900">{saving.opportunity}</h5>
                                                    <Badge className="bg-green-600 text-white">
                                                        Save ${saving.estimated_savings}
                                                    </Badge>
                                                </div>
                                                <ul className="space-y-1 text-sm text-green-800">
                                                    {saving.action_steps.map((step, sIdx) => (
                                                        <li key={sIdx}>→ {step}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Anomalies */}
                            {insights.insights.anomalies?.length > 0 && (
                                <Card className="border-orange-200">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2 text-orange-900">
                                            <AlertCircle className="w-5 h-5" />
                                            Unusual Spending
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {insights.insights.anomalies.map((anomaly, idx) => (
                                            <div key={idx} className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                                                <Badge className={
                                                    anomaly.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                    anomaly.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }>
                                                    {anomaly.category}
                                                </Badge>
                                                <span className="text-sm text-gray-700">{anomaly.description}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="recent">
                    <div className="space-y-3">
                        {transactions.slice(0, 20).map(transaction => (
                            <Card key={transaction.id}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-[#1A2B44]">{transaction.description}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className={getCategoryColor(transaction.category)}>
                                                    {transaction.category}
                                                </Badge>
                                                {transaction.linked_entity_name && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {transaction.linked_entity_name}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {format(new Date(transaction.date), 'MMM d, yyyy')}
                                                {transaction.merchant && ` • ${transaction.merchant}`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}