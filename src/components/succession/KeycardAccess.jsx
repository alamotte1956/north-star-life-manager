import React, { useState } from 'react';
import { Key, Lock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function KeycardAccess({ onAccessGranted, userKeycardCode }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (code === userKeycardCode) {
            onAccessGranted();
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0F1B2E] via-[#1A2B44] to-[#0F1B2E] flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-full blur-2xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-8 rounded-3xl border border-[#C9A95C]/20">
                                <Lock className="w-12 h-12 text-[#C9A95C]" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-light text-white mb-3">
                        Succession Dashboard
                    </h1>
                    <p className="text-white/60 font-light">
                        Enter your keycard code to access emergency information
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                    <div className="mb-6">
                        <label className="block text-white/80 text-sm font-light mb-3">
                            Keycard Code
                        </label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C9A95C]" />
                            <Input
                                type="password"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className={`pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#C9A95C] transition-all ${
                                    error ? 'border-red-500 shake' : ''
                                }`}
                                placeholder="Enter code"
                            />
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Invalid keycard code</span>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37] hover:shadow-lg hover:shadow-[#C9A95C]/30 text-white font-light py-6 rounded-xl"
                    >
                        Access Dashboard
                    </Button>
                </form>

                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-10px); }
                        75% { transform: translateX(10px); }
                    }
                    .shake {
                        animation: shake 0.3s ease-in-out;
                    }
                `}</style>
            </div>
        </div>
    );
}