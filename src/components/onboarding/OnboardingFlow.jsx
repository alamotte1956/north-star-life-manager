import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    CheckCircle, ChevronRight, Sparkles, DollarSign, 
    Home, TrendingUp, X, Link as LinkIcon, Target, Calendar, Video, PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import WhiteGloveOnboarding from './WhiteGloveOnboarding';
import AccountingSetup from './steps/AccountingSetup';
import GoalsSetup from './steps/GoalsSetup';
import PropertySetup from './steps/PropertySetup';

export default function OnboardingFlow({ onComplete, onSkip }) {
    const [showWhiteGlove, setShowWhiteGlove] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [user, setUser] = useState(null);

    useEffect(() => {
        base44.auth.me().then(setUser);
    }, []);

    // Show white-glove onboarding first
    if (showWhiteGlove) {
        return (
            <WhiteGloveOnboarding 
                onComplete={() => {
                    setShowWhiteGlove(false);
                    // Mark as complete
                    base44.auth.updateMe({ onboarding_completed: true }).then(() => {
                        if (onComplete) onComplete();
                    });
                }}
            />
        );
    }

    const steps = [
        {
            id: 'welcome',
            title: 'Welcome to North Star',
            icon: Sparkles,
            color: 'text-[#C5A059]',
            component: WelcomeStep
        },
        {
            id: 'accounting',
            title: 'Connect Accounting',
            icon: DollarSign,
            color: 'text-green-600',
            component: AccountingSetup
        },
        {
            id: 'goals',
            title: 'Set Financial Goals',
            icon: Target,
            color: 'text-purple-600',
            component: GoalsSetup
        },
        {
            id: 'property',
            title: 'Add Properties',
            icon: Home,
            color: 'text-blue-600',
            component: PropertySetup
        },
        {
            id: 'complete',
            title: 'Ready to Go!',
            icon: CheckCircle,
            color: 'text-green-600',
            component: CompleteStep
        }
    ];

    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    const handleNext = () => {
        setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepComplete = async (data) => {
        setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
        
        if (currentStep === steps.length - 1) {
            // Mark onboarding as complete
            await base44.auth.updateMe({ onboarding_completed: true });
            toast.success('Onboarding complete! Welcome to North Star 🎉');
            onComplete?.();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSkipAll = async () => {
        await base44.auth.updateMe({ onboarding_completed: true });
        onSkip?.();
    };

    const StepComponent = currentStepData.component;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0F172A]/95 to-[#1e293b]/95 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
                <Card className="w-full max-w-4xl shadow-2xl border-[#C5A059]/20">
                    {/* Header */}
                    <CardHeader className="border-b border-[#0F172A]/10 relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                                    alt="North Star" 
                                    className="w-10 h-10"
                                />
                                <div>
                                    <h2 className="text-2xl font-light text-[#0F172A]">Getting Started</h2>
                                    <p className="text-sm text-[#64748B]">Let's set up your account</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSkipAll}
                                className="print:hidden"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[#64748B]">Step {currentStep + 1} of {steps.length}</span>
                                <span className="text-[#C5A059] font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        {/* Step Indicators */}
                        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
                            {steps.map((step, idx) => {
                                const Icon = step.icon;
                                const isCompleted = completedSteps.has(step.id);
                                const isCurrent = idx === currentStep;
                                
                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                                            isCurrent 
                                                ? 'bg-[#C5A059]/10 border border-[#C5A059]' 
                                                : isCompleted
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-[#F8F9FA] border border-[#0F172A]/10'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Icon className={`w-4 h-4 ${isCurrent ? step.color : 'text-[#64748B]'}`} />
                                        )}
                                        <span className={`text-xs font-light whitespace-nowrap ${
                                            isCurrent ? 'text-[#0F172A]' : 'text-[#64748B]'
                                        }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardHeader>

                    {/* Step Content */}
                    <CardContent className="pt-8 pb-6">
                        <StepComponent 
                            onNext={handleNext}
                            onComplete={handleStepComplete}
                            user={user}
                        />
                    </CardContent>

                    {/* Footer Navigation */}
                    {currentStepData.id !== 'welcome' && currentStepData.id !== 'complete' && (
                        <div className="border-t border-[#0F172A]/10 p-6 flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                            >
                                Back
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleNext}
                                className="text-[#64748B]"
                            >
                                Skip this step
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function WelcomeStep({ onNext, user }) {
    return (
        <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#C5A059] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <div>
                <h3 className="text-3xl font-light text-[#0F172A] mb-3">
                    Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
                </h3>
                <p className="text-[#64748B] max-w-xl mx-auto leading-relaxed">
                    Let's get you set up with North Star. We'll walk you through connecting your accounts, 
                    setting financial goals, and managing your properties. This will only take a few minutes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                <div className="p-4 bg-[#F8F9FA] rounded-xl text-left">
                    <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                    <h4 className="font-medium text-[#0F172A] mb-2">Connect Accounts</h4>
                    <p className="text-sm text-[#64748B]">Link QuickBooks or Xero for automated financial tracking</p>
                </div>
                
                <div className="p-4 bg-[#F8F9FA] rounded-xl text-left">
                    <Target className="w-8 h-8 text-purple-600 mb-3" />
                    <h4 className="font-medium text-[#0F172A] mb-2">Set Goals</h4>
                    <p className="text-sm text-[#64748B]">Define financial targets and track your progress</p>
                </div>
                
                <div className="p-4 bg-[#F8F9FA] rounded-xl text-left">
                    <Home className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="font-medium text-[#0F172A] mb-2">Add Properties</h4>
                    <p className="text-sm text-[#64748B]">Manage real estate with AI-powered insights</p>
                </div>
            </div>

            <Button
                onClick={onNext}
                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white px-8 py-6 text-lg"
            >
                Let's Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
    );
}

function CompleteStep({ onComplete, user }) {
    return (
        <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <div>
                <h3 className="text-3xl font-light text-[#0F172A] mb-3">
                    You're All Set! 🎉
                </h3>
                <p className="text-[#64748B] max-w-xl mx-auto leading-relaxed">
                    Your North Star account is configured and ready to go. Start exploring your 
                    dashboard to see AI-powered insights, manage your properties, and track your financial goals.
                </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
                <h4 className="font-medium text-[#0F172A] mb-4">Quick Tips to Get Started:</h4>
                <ul className="space-y-3 text-left">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#64748B]">
                            Upload important documents to your Vault - AI will automatically extract key information
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#64748B]">
                            Check your Financial Dashboard for AI-powered spending insights and recommendations
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#64748B]">
                            Set up rent collection automation in Property Management
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#64748B]">
                            Use the global search (⌘K) to quickly find anything across your account
                        </span>
                    </li>
                </ul>
            </div>

            <Button
                onClick={onComplete}
                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white px-8 py-6 text-lg"
            >
                Go to Dashboard
                <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
    );
}