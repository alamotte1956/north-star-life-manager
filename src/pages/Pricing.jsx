import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Check, Zap, Crown, Building2, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
    {
        id: 'basic',
        name: 'Basic',
        price: 49,
        icon: Zap,
        features: [
            'Up to 50 documents',
            'Basic automation',
            '5 properties & vehicles',
            'Email support',
            'Mobile app access'
        ]
    },
    {
        id: 'premium',
        name: 'Plus',
        price: 99,
        icon: Crown,
        popular: true,
        features: [
            'Unlimited documents',
            'Advanced AI automation',
            'Unlimited properties & vehicles',
            'Priority support',
            'Google Calendar sync',
            'Slack integration',
            'AI assistant',
            'Custom reports'
        ]
    },
    {
        id: 'enterprise',
        name: 'Premium',
        price: 199,
        icon: Building2,
        features: [
            'Everything in Plus',
            'Team collaboration (up to 10 users)',
            'Advanced security',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantee',
            'White-label options'
        ]
    }
];

export default function Pricing() {
    const [loading, setLoading] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState({});

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const isFreeUser = user?.user_type === 'master_admin' || user?.user_type === 'staff';
    const isAdmin = user?.role === 'admin' || user?.user_type === 'master_admin';

    const { data: currentSubscription } = useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            const subs = await base44.entities.Subscription_Plan.filter({ 
                created_by: user?.email 
            });
            return subs[0];
        },
        enabled: !!user
    });

    const handleSubscribe = async (planId) => {
        if (isFreeUser) {
            alert(user.user_type === 'master_admin' ? 'Master Admin users have free access to all features.' : 'Staff users have free access to all features.');
            return;
        }

        if (!acceptedTerms[planId]) {
            alert('Please accept the Terms of Service and Privacy Policy to continue.');
            return;
        }

        setLoading(planId);
        try {
            const result = await base44.functions.invoke('createCheckoutSession', {
                plan_id: planId
            });

            // Redirect to Stripe Checkout
            window.location.href = result.data.checkout_url;
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Error creating subscription. Please try again.');
            setLoading(null);
        }
    };

    const handleManage = async () => {
        try {
            const result = await base44.functions.invoke('createPortalSession');
            window.location.href = result.data.portal_url;
        } catch (error) {
            console.error('Portal error:', error);
            alert('Error opening customer portal. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-light text-black mb-4">Choose Your Plan</h1>
                    <p className="text-xl text-black/70 font-light">
                        Unlock the full power of North Star Life Manager
                    </p>
                    <Badge className="mt-4 bg-green-600 text-white px-6 py-2 text-base">
                        🎉 14-Day Free Trial - No Credit Card Required
                    </Badge>
                </div>

                {/* Free Access Banner */}
                {isFreeUser && (
                    <div className="mb-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-center">
                        <p className="text-white font-light text-xl mb-2">
                            {user?.user_type === 'master_admin' ? '👑 Master Admin Access' : '⭐ Staff Access'} - All Features Unlocked
                        </p>
                        <p className="text-white/90 text-sm">
                            {user?.user_type === 'master_admin' 
                                ? 'As Master Admin, you have full access to all premium features and can manage user roles.' 
                                : 'As a Staff member, you have free access to all premium features without billing.'}
                        </p>
                    </div>
                )}

                {/* Current Subscription Banner */}
                {!isAdmin && currentSubscription && (
                    <div className="mb-8 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-2xl p-6 text-center">
                        <p className="text-black font-light mb-3">
                            You're currently on the <strong>{currentSubscription.plan_name}</strong> plan
                        </p>
                        <Button
                            onClick={handleManage}
                            variant="outline"
                            className="bg-white hover:bg-white/90"
                        >
                            Manage Subscription
                        </Button>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {plans.map(plan => {
                        const Icon = plan.icon;
                        const isCurrentPlan = currentSubscription?.plan_name === plan.id;
                        
                        return (
                            <Card 
                                key={plan.id} 
                                className={`relative hover:shadow-2xl transition-all ${
                                    plan.popular ? 'border-[#D4AF37] border-2 scale-105' : ''
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-4 py-1">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}
                                
                                <CardHeader className="text-center pb-8 pt-8">
                                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl flex items-center justify-center">
                                        <Icon className="w-8 h-8 text-[#D4AF37]" />
                                    </div>
                                    <CardTitle className="text-2xl font-light mb-2">{plan.name}</CardTitle>
                                    <div className="text-4xl font-light text-black">
                                        ${plan.price}
                                        <span className="text-lg text-black/60">/month</span>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-6">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                                                <span className="text-black/80 font-light">{feature}</span>
                                            </li>
                                        ))}
                                        </ul>

                                        {!isAdmin && !isCurrentPlan && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                            <Checkbox
                                                id={`terms-${plan.id}`}
                                                checked={acceptedTerms[plan.id] || false}
                                                onCheckedChange={(checked) => 
                                                    setAcceptedTerms(prev => ({ ...prev, [plan.id]: checked }))
                                                }
                                                className="mt-1"
                                            />
                                            <label htmlFor={`terms-${plan.id}`} className="text-xs text-black/80 cursor-pointer">
                                                I acknowledge that this platform is for informational purposes only and does not constitute legal, financial, or medical advice. I have read and agree to the{' '}
                                                <Link to={createPageUrl('Terms')} className="text-blue-600 underline" target="_blank">
                                                    Terms of Service
                                                </Link>
                                                {' '}and{' '}
                                                <Link to={createPageUrl('Privacy')} className="text-blue-600 underline" target="_blank">
                                                    Privacy Policy
                                                </Link>.
                                            </label>
                                        </div>
                                        )}

                                        <Button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={loading === plan.id || isCurrentPlan || isFreeUser || (!acceptedTerms[plan.id] && !isFreeUser && !isCurrentPlan)}
                                        className={`w-full h-12 ${
                                            plan.popular 
                                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg' 
                                                : 'bg-gradient-to-r from-black to-[#1a1a1a]'
                                        }`}
                                        >
                                        {isFreeUser ? (
                                            user?.user_type === 'master_admin' ? 'Master Admin - Free Access' : 'Staff - Free Access'
                                        ) : loading === plan.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : isCurrentPlan ? (
                                            'Current Plan'
                                        ) : (
                                            'Get Started'
                                        )}
                                        </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-light text-black text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-2">Can I change plans later?</h3>
                                <p className="text-sm text-black/70">
                                    Yes, you can upgrade or downgrade your plan at any time from your account settings.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
                                <p className="text-sm text-black/70">
                                    We accept all major credit cards through Stripe's secure payment processing.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-2">How does the 14-day free trial work?</h3>
                                <p className="text-sm text-black/70">
                                    Start with a full 14-day free trial of any plan. No credit card required to start. You'll only be charged after the trial period ends.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-medium mb-2">Can I cancel anytime?</h3>
                                <p className="text-sm text-black/70">
                                    Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}