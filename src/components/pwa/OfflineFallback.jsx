import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw, FileText, DollarSign, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOfflineData } from './OfflineDataManager';

export default function OfflineFallback({ type = 'general' }) {
    const [offlineData, setOfflineData] = React.useState(null);

    React.useEffect(() => {
        // Load cached data for offline viewing
        const data = {
            documents: getOfflineData('documents'),
            investments: getOfflineData('investments'),
            properties: getOfflineData('properties'),
            bills: getOfflineData('bills'),
            emergency: getOfflineData('emergency')
        };
        setOfflineData(data);
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6 flex items-center justify-center">
            <div className="max-w-2xl w-full">
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <WifiOff className="w-10 h-10 text-white" />
                        </div>
                        
                        <h2 className="text-2xl font-light text-[#1A2B44] mb-3">You're Offline</h2>
                        <p className="text-[#1A2B44]/70 mb-6">
                            Some features require an internet connection. You can still access cached data below.
                        </p>

                        <Button 
                            onClick={handleRetry}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black mb-8"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>

                        {offlineData && (
                            <div className="text-left space-y-4">
                                <h3 className="text-lg font-medium text-[#1A2B44] mb-4">Available Offline</h3>
                                
                                {offlineData.documents && (
                                    <div className="p-4 bg-white rounded-lg border border-[#D4AF37]/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FileText className="w-5 h-5 text-[#D4AF37]" />
                                            <span className="font-medium text-[#1A2B44]">
                                                {offlineData.documents.length} Cached Documents
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#1A2B44]/60">
                                            Recent documents are available for viewing
                                        </p>
                                    </div>
                                )}

                                {offlineData.investments && (
                                    <div className="p-4 bg-white rounded-lg border border-[#D4AF37]/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                            <span className="font-medium text-[#1A2B44]">
                                                Investment Portfolio
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#1A2B44]/60">
                                            Last synced values available
                                        </p>
                                    </div>
                                )}

                                {offlineData.properties && (
                                    <div className="p-4 bg-white rounded-lg border border-[#D4AF37]/20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Home className="w-5 h-5 text-blue-600" />
                                            <span className="font-medium text-[#1A2B44]">
                                                {offlineData.properties.length} Properties
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#1A2B44]/60">
                                            Property information cached
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-sm text-[#1A2B44]/60">
                    Data will sync automatically when you're back online
                </div>
            </div>
        </div>
    );
}