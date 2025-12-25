import React from 'react';
import { useSandboxData } from './SandboxDataProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SandboxBanner() {
    const { isSandboxMode } = useSandboxData();
    const navigate = useNavigate();

    if (!isSandboxMode) return null;

    const handleSignUp = () => {
        navigate(createPageUrl('Pricing'));
    };

    const handleLogin = () => {
        base44.auth.redirectToLogin();
    };

    return (
        <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 mb-6">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertDescription className="ml-2">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-blue-900 mb-1">
                            🎮 Demo Mode - Your data is temporary
                        </p>
                        <p className="text-sm text-blue-800">
                            You're exploring with sample data. Sign up to save your real information permanently.
                        </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleLogin}
                            className="border-blue-300 text-blue-900"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Log In
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSignUp}
                            className="bg-gradient-to-r from-[#4A90E2] to-[#2E5C8A] text-white"
                        >
                            Sign Up Free
                        </Button>
                    </div>
                </div>
            </AlertDescription>
        </Alert>
    );
}