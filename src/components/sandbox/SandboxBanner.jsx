import React, { useState } from 'react';
import { useSandboxData } from './SandboxDataProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, User, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function SandboxBanner() {
    const { isSandboxMode, clearSandboxData } = useSandboxData();
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);

    if (!isSandboxMode) return null;

    const handleSignUp = () => {
        navigate(createPageUrl('Pricing'));
    };

    const handleLogin = () => {
        base44.auth.redirectToLogin();
    };

    const handleClearData = () => {
        clearSandboxData();
        setShowConfirm(false);
        window.location.reload();
    };

    return (
        <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-300 mb-6">
            <Info className="h-5 w-5 text-green-600" />
            <AlertDescription className="ml-2">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-green-900 mb-1">
                            ✨ Free & Public Access - No Login Required
                        </p>
                        <p className="text-sm text-green-800">
                            This app is completely free for everyone. All your data is stored locally in your browser for privacy.
                        </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowConfirm(true)}
                            className="border-red-300 text-red-700 hover:bg-red-50 gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All Data
                        </Button>
                    </div>
                </div>
            </AlertDescription>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Demo Data?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all demo data from your browser. You can always add more demo data to explore the features.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button variant="outline" onClick={() => setShowConfirm(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleClearData}
                            variant="destructive"
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All Data
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Alert>
    );
}