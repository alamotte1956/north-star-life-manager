import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function DemoCTA() {
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me().catch(() => null)
    });

    const { data: subscription } = useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            const subs = await base44.entities.Subscription_Plan.filter({ 
                created_by: user?.email 
            });
            return subs[0];
        },
        enabled: !!user
    });

    const isDemo = !user;
    const isPaid = user?.role === 'admin' || subscription?.status === 'active';

    if (!isDemo && isPaid) return null;

    return (
        <Card className="border-2 border-[#4A90E2] bg-gradient-to-r from-[#4A90E2]/10 to-[#7BB3E0]/10">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] rounded-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-black mb-1">
                                {isDemo ? 'Unlock Full Features' : 'Upgrade Your Plan'}
                            </h3>
                            <p className="text-sm text-[#0F1729]/70">
                                {isDemo 
                                    ? 'Sign up now to save your data and access all premium features'
                                    : 'Unlock unlimited documents, AI insights, and advanced features'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isDemo ? (
                            <>
                                <Button
                                    onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                                    variant="outline"
                                    className="border-[#4A90E2]"
                                >
                                    Sign In
                                </Button>
                                <Link to={createPageUrl('Pricing')}>
                                    <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                        Sign Up Free
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <Link to={createPageUrl('Pricing')}>
                                <Button className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white">
                                    Upgrade Now
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}