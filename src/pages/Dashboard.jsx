import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
    FileText, Shield, Home, Wrench, Users, Car, DollarSign,
    Gem, Plane, Heart, Calendar, TrendingUp, AlertCircle, CheckCircle, BookOpen, X, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import FinancialAdvisor from '../components/financial/FinancialAdvisor';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import FinancialHealthAlerts from '../components/alerts/FinancialHealthAlerts';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const QuickStatCard = ({ icon: Icon, title, value, subtitle, trend, color, link }) => {
    const content = (
        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    {trend && (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {trend}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-light text-[#1A2B44] mb-1">{value}</div>
                <div className="text-sm text-[#1A2B44]/60 font-light">{title}</div>
                {subtitle && (
                    <div className="text-xs text-[#1A2B44]/40 mt-1">{subtitle}</div>
                )}
            </CardContent>
        </Card>
    );

    return link ? <Link to={createPageUrl(link)}>{content}</Link> : content;
};

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [showGuide, setShowGuide] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const navigate = useNavigate();

    const downloadGuideAsPDF = () => {
        const doc = new jsPDF();
        let y = 20;

        // Title
        doc.setFontSize(20);
        doc.text('North Star - Getting Started Guide', 20, y);
        y += 15;

        // Welcome
        doc.setFontSize(12);
        doc.text('Welcome to Your Life Management Hub', 20, y);
        y += 10;
        doc.setFontSize(10);
        const welcomeText = doc.splitTextToSize('North Star helps you organize and manage all aspects of your life in one secure place. From properties and vehicles to important documents and health records, everything is at your fingertips.', 170);
        doc.text(welcomeText, 20, y);
        y += welcomeText.length * 5 + 10;

        // Quick Start Steps
        doc.setFontSize(14);
        doc.text('Quick Start Guide', 20, y);
        y += 10;

        const steps = [
            { title: '1. Upload Your Documents', text: 'Start by visiting the Vault. Take photos or upload important documents like deeds, insurance policies, and legal papers. Our AI will automatically analyze and categorize them for you.' },
            { title: '2. Add Your Properties & Assets', text: 'Go to Properties, Vehicles, and Valuables to create an inventory of your assets. Track values, maintenance schedules, and important details.' },
            { title: '3. Set Up Maintenance & Rent Collection', text: 'Visit Maintenance to schedule recurring tasks. For rental properties, use Property Management to automate rent collection, send AI-powered reminders, and track payments with integrated Stripe processing.' },
            { title: '4. Track Financial Goals & Investments', text: 'Set financial goals in Budget & Goals, track your investment portfolio in Investments, and manage recurring bills in Bill Payments. Get AI-driven insights on your financial health.' },
            { title: '5. Organize Contacts & Communications', text: 'Add key contacts in the Contacts section. For rental properties, use AI-powered tenant communication tools to generate responses, analyze sentiment, and maintain professional tenant relationships.' },
            { title: '6. Complete Medical & Estate Planning', text: 'Set up your Medical Profile with emergency contacts and medications. Configure Legal & Estate with beneficiaries and advance directives. Use Succession Dashboard for secure emergency access.' }
        ];

        doc.setFontSize(10);
        steps.forEach(step => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.text(step.title, 20, y);
            y += 7;
            doc.setFont(undefined, 'normal');
            const text = doc.splitTextToSize(step.text, 170);
            doc.text(text, 20, y);
            y += text.length * 5 + 8;
        });

        // Key Features
        if (y > 220) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(14);
        doc.text('Key Features', 20, y);
        y += 10;

        const features = [
            'Smart Document Vault: Upload documents and photos. AI automatically extracts key information like expiry dates and document types.',
            'Automated Rent Collection: Set up payment schedules, send AI-personalized reminders, and collect rent online with secure Stripe integration.',
            'Smart Alerts: Receive notifications for upcoming maintenance, expiring documents, and vehicle registration renewals.',
            'Print Anywhere: Every section includes a print button. Print lists, records, or your emergency medical card anytime.'
        ];

        doc.setFontSize(10);
        features.forEach(feature => {
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
            const text = doc.splitTextToSize('• ' + feature, 170);
            doc.text(text, 20, y);
            y += text.length * 5 + 5;
        });

        // Pro Tips
        if (y > 200) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(14);
        doc.text('Pro Tips', 20, y);
        y += 10;

        const tips = [
            'Use your phone\'s camera to quickly capture documents - the app supports direct photo uploads with AI analysis',
            'Set up payment schedules in Property Management to automate rent collection and reminders',
            'Connect external services via Integrations - Google Calendar, Slack, Drive, and more',
            'Use the Email Assistant to manage communications with AI-powered drafting and categorization',
            'The Medical Profile includes a printable emergency card - keep a copy in your wallet',
            'Share specific records with family or advisors using the Collaboration tools'
        ];

        doc.setFontSize(10);
        tips.forEach(tip => {
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
            const text = doc.splitTextToSize('• ' + tip, 170);
            doc.text(text, 20, y);
            y += text.length * 5 + 5;
        });

        doc.save('North-Star-Getting-Started-Guide.pdf');
    };

    useEffect(() => {
        base44.auth.me().then(userData => {
            setUser(userData);
            // Show onboarding if not completed
            if (!userData?.onboarding_completed) {
                setShowOnboarding(true);
            }
        });
    }, []);

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 100)
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list()
    });

    const { data: maintenanceTasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list()
    });

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => base44.entities.Vehicle.list()
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => base44.entities.Subscription.list()
    });

    const { data: valuables = [] } = useQuery({
        queryKey: ['valuables'],
        queryFn: () => base44.entities.ValuableItem.list()
    });

    const { data: upcomingDates = [] } = useQuery({
        queryKey: ['importantDates'],
        queryFn: () => base44.entities.ImportantDate.list()
    });

    // Calculate insights
    const dueTasks = maintenanceTasks.filter(task => {
        if (!task.next_due_date) return false;
        return isBefore(new Date(task.next_due_date), addDays(new Date(), 30));
    });

    const expiringDocs = documents.filter(doc => {
        if (!doc.expiry_date) return false;
        return isBefore(new Date(doc.expiry_date), addDays(new Date(), 60));
    });

    const totalValue = valuables.reduce((sum, item) => sum + (item.current_value || 0), 0);
    const monthlySubscriptions = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
            const amount = s.billing_amount || 0;
            if (s.billing_frequency === 'monthly') return sum + amount;
            if (s.billing_frequency === 'annual') return sum + (amount / 12);
            if (s.billing_frequency === 'quarterly') return sum + (amount / 3);
            return sum;
        }, 0);

    return (
        <>
            {/* Onboarding Flow */}
            {showOnboarding && (
                <OnboardingFlow
                    onComplete={() => {
                        setShowOnboarding(false);
                        navigate(createPageUrl('Dashboard'));
                    }}
                    onSkip={() => setShowOnboarding(false)}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">
                                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
                            </h1>
                            <p className="text-[#1A2B44]/60 font-light">
                                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowGuide(true)}
                            className="flex items-center gap-3 px-6 py-4 min-h-[50px] bg-white border-2 border-[#C5A059] text-[#0F172A] rounded-xl hover:bg-[#C5A059] hover:text-white transition-all font-light shadow-sm"
                        >
                            <BookOpen className="w-6 h-6" />
                            <span className="text-base">Getting Started</span>
                        </button>
                    </div>
                </div>

                {/* Getting Started Guide Modal */}
                {showGuide && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="sticky top-0 bg-gradient-to-r from-[#0F2847] to-[#1B4B7F] p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-8 h-8 text-white" />
                                    <h2 className="text-2xl font-light text-white">Getting Started with North Star</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={downloadGuideAsPDF}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors min-h-[50px]"
                                    >
                                        <Download className="w-5 h-5 text-white" />
                                        <span className="text-white">Download PDF</span>
                                    </button>
                                    <button
                                        onClick={() => setShowGuide(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Welcome Section */}
                                <div>
                                    <h3 className="text-xl font-light text-[#1A2B44] mb-3">Welcome to Your Life Management Hub</h3>
                                    <p className="text-[#1A2B44]/70 font-light leading-relaxed">
                                        North Star helps you organize and manage all aspects of your life in one secure place. 
                                        From properties and vehicles to important documents and health records, everything is at your fingertips.
                                    </p>
                                </div>

                                {/* Quick Start Steps */}
                                <div>
                                    <h3 className="text-xl font-light text-[#1A2B44] mb-4">Quick Start Guide</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#8B2635] text-white rounded-full flex items-center justify-center font-light">1</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-[#1A2B44] mb-1">Upload Your Documents</h4>
                                                <p className="text-sm text-[#1A2B44]/70 font-light">
                                                    Start by visiting the <strong>Vault</strong>. Take photos or upload important documents like deeds, insurance policies, and legal papers. 
                                                    Our AI will automatically analyze and categorize them for you.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#8B2635] text-white rounded-full flex items-center justify-center font-light">2</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-[#1A2B44] mb-1">Add Your Properties & Assets</h4>
                                                <p className="text-sm text-[#1A2B44]/70 font-light">
                                                    Go to <strong>Properties</strong>, <strong>Vehicles</strong>, and <strong>Valuables</strong> to create an inventory of your assets. 
                                                    Track values, maintenance schedules, and important details.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#8B2635] text-white rounded-full flex items-center justify-center font-light">3</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-[#1A2B44] mb-1">Set Up Maintenance & Rent Collection</h4>
                                                <p className="text-sm text-[#1A2B44]/70 font-light">
                                                    Visit <strong>Maintenance</strong> to schedule recurring tasks. For rental properties, use <strong>Property Management</strong> 
                                                    to automate rent collection, send AI-powered reminders, and track payments with integrated Stripe processing.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#8B2635] text-white rounded-full flex items-center justify-center font-light">4</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-[#1A2B44] mb-1">Track Financial Goals & Investments</h4>
                                                <p className="text-sm text-[#1A2B44]/70 font-light">
                                                    Set financial goals in <strong>Budget & Goals</strong>, track your investment portfolio in <strong>Investments</strong>, 
                                                    and manage recurring bills in <strong>Bill Payments</strong>. Get AI-driven insights on your financial health.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#8B2635] text-white rounded-full flex items-center justify-center font-light">5</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-[#1A2B44] mb-1">Organize Contacts & Communications</h4>
                                                <p className="text-sm text-[#1A2B44]/70 font-light">
                                                    Add key contacts in the <strong>Contacts</strong> section. For rental properties, use AI-powered tenant communication tools 
                                                    to generate responses, analyze sentiment, and maintain professional tenant relationships.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#8B2635] text-white rounded-full flex items-center justify-center font-light">6</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-[#1A2B44] mb-1">Complete Medical & Estate Planning</h4>
                                                <p className="text-sm text-[#1A2B44]/70 font-light">
                                                    Set up your <strong>Medical Profile</strong> with emergency contacts and medications. 
                                                    Configure <strong>Legal & Estate</strong> with beneficiaries and advance directives. 
                                                    Use <strong>Succession Dashboard</strong> for secure emergency access.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Features */}
                                <div>
                                    <h3 className="text-xl font-light text-[#1A2B44] mb-4">Key Features</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 border border-[#1B4B7F]/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-5 h-5 text-[#8B2635]" />
                                                <h4 className="font-light text-[#1A2B44]">Smart Document Vault</h4>
                                            </div>
                                            <p className="text-sm text-[#1A2B44]/70 font-light">
                                                Upload documents and photos. AI automatically extracts key information like expiry dates and document types.
                                            </p>
                                        </div>

                                        <div className="p-4 border border-[#1B4B7F]/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DollarSign className="w-5 h-5 text-[#8B2635]" />
                                                <h4 className="font-light text-[#1A2B44]">Automated Rent Collection</h4>
                                            </div>
                                            <p className="text-sm text-[#1A2B44]/70 font-light">
                                                Set up payment schedules, send AI-personalized reminders, and collect rent online with secure Stripe integration.
                                            </p>
                                        </div>

                                        <div className="p-4 border border-[#1B4B7F]/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-5 h-5 text-[#8B2635]" />
                                                <h4 className="font-light text-[#1A2B44]">Smart Alerts</h4>
                                            </div>
                                            <p className="text-sm text-[#1A2B44]/70 font-light">
                                                Receive notifications for upcoming maintenance, expiring documents, and vehicle registration renewals.
                                            </p>
                                        </div>

                                        <div className="p-4 border border-[#1B4B7F]/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Shield className="w-5 h-5 text-[#8B2635]" />
                                                <h4 className="font-light text-[#1A2B44]">Print Anywhere</h4>
                                            </div>
                                            <p className="text-sm text-[#1A2B44]/70 font-light">
                                                Every section includes a print button. Print lists, records, or your emergency medical card anytime.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Tips */}
                                <div className="bg-gradient-to-br from-[#8B2635]/5 to-[#1B4B7F]/5 p-6 rounded-xl border border-[#8B2635]/20">
                                    <h3 className="text-xl font-light text-[#1A2B44] mb-3">💡 Pro Tips</h3>
                                    <ul className="space-y-2 text-sm text-[#1A2B44]/70 font-light">
                                        <li>• Use your phone's camera to quickly capture documents - the app supports direct photo uploads with AI analysis</li>
                                        <li>• Set up payment schedules in Property Management to automate rent collection and reminders</li>
                                        <li>• Connect external services via Integrations - Google Calendar, Slack, Drive, and more</li>
                                        <li>• Use the Email Assistant to manage communications with AI-powered drafting and categorization</li>
                                        <li>• The Medical Profile includes a printable emergency card - keep a copy in your wallet</li>
                                        <li>• Share specific records with family or advisors using the Collaboration tools</li>
                                    </ul>
                                </div>

                                {/* Close Button */}
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowGuide(false)}
                                        className="px-8 py-3 bg-gradient-to-r from-[#8B2635] to-[#A63446] text-white rounded-full hover:shadow-lg transition-all font-light"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Health Alerts */}
                <div className="mb-8">
                    <FinancialHealthAlerts />
                </div>

                {/* AI Financial Advisor */}
                <div className="mb-8">
                    <FinancialAdvisor />
                </div>

                {/* Alerts Section */}
                {(dueTasks.length > 0 || expiringDocs.length > 0) && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-light text-[#1A2B44] mb-2">Attention Required</h3>
                                <div className="space-y-1 text-sm text-[#1A2B44]/70">
                                    {dueTasks.length > 0 && (
                                        <p>• {dueTasks.length} maintenance task{dueTasks.length > 1 ? 's' : ''} due soon</p>
                                    )}
                                    {expiringDocs.length > 0 && (
                                        <p>• {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring within 60 days</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <QuickStatCard
                        icon={Home}
                        title="Properties"
                        value={properties.length}
                        subtitle={`${properties.filter(p => p.seasonal).length} seasonal`}
                        color="bg-blue-500"
                        link="Properties"
                    />
                    <QuickStatCard
                        icon={FileText}
                        title="Documents"
                        value={documents.length}
                        subtitle={`${documents.filter(d => d.analysis_status === 'completed').length} analyzed`}
                        color="bg-[#C9A95C]"
                        link="Vault"
                    />
                    <QuickStatCard
                        icon={Car}
                        title="Vehicles"
                        value={vehicles.length}
                        color="bg-indigo-500"
                        link="Vehicles"
                    />
                    <QuickStatCard
                        icon={Gem}
                        title="Collection Value"
                        value={`$${(totalValue / 1000).toFixed(0)}K`}
                        subtitle={`${valuables.length} items tracked`}
                        color="bg-purple-500"
                        link="Valuables"
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Upcoming Maintenance */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b border-[#1A2B44]/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-light flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-[#C9A95C]" />
                                    Upcoming Maintenance
                                </CardTitle>
                                <Link to={createPageUrl('Maintenance')} className="text-sm text-[#C9A95C] hover:text-[#1A2B44] font-light">
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {dueTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {dueTasks.slice(0, 4).map(task => (
                                        <div key={task.id} className="flex items-start gap-3 p-3 bg-[#F8F7F4] rounded-lg">
                                            <Wrench className="w-4 h-4 text-[#C9A95C] mt-1" />
                                            <div className="flex-1">
                                                <div className="font-light text-[#1A2B44]">{task.title}</div>
                                                <div className="text-sm text-[#1A2B44]/60 font-light">
                                                    {task.property_name} • Due {format(new Date(task.next_due_date), 'MMM d')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[#1A2B44]/40 font-light">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                                    All maintenance up to date
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Expenses */}
                    <Card className="shadow-lg">
                        <CardHeader className="border-b border-[#1A2B44]/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-light flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-[#C9A95C]" />
                                    Monthly Subscriptions
                                </CardTitle>
                                <Link to={createPageUrl('Subscriptions')} className="text-sm text-[#C9A95C] hover:text-[#1A2B44] font-light">
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <div className="text-4xl font-light text-[#1A2B44] mb-1">
                                    ${monthlySubscriptions.toFixed(0)}
                                </div>
                                <div className="text-sm text-[#1A2B44]/60 font-light">
                                    Estimated monthly total
                                </div>
                            </div>
                            <div className="space-y-2">
                                {subscriptions.filter(s => s.status === 'active').slice(0, 3).map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center p-3 bg-[#F8F7F4] rounded-lg">
                                        <span className="font-light text-[#1A2B44]">{sub.name}</span>
                                        <span className="text-[#C9A95C] font-light">
                                            ${sub.billing_amount}/{sub.billing_frequency === 'monthly' ? 'mo' : 'yr'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Access Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to={createPageUrl('Contacts')} className="p-6 bg-white border border-[#1A2B44]/10 rounded-xl hover:shadow-lg hover:border-[#C9A95C]/30 transition-all text-center group">
                        <Users className="w-8 h-8 text-[#C9A95C] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-[#1A2B44]">Contacts</div>
                    </Link>
                    <Link to={createPageUrl('Travel')} className="p-6 bg-white border border-[#1A2B44]/10 rounded-xl hover:shadow-lg hover:border-[#C9A95C]/30 transition-all text-center group">
                        <Plane className="w-8 h-8 text-[#C9A95C] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-[#1A2B44]">Travel</div>
                    </Link>
                    <Link to={createPageUrl('Health')} className="p-6 bg-white border border-[#1A2B44]/10 rounded-xl hover:shadow-lg hover:border-[#C9A95C]/30 transition-all text-center group">
                        <Heart className="w-8 h-8 text-[#C9A95C] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-[#1A2B44]">Health</div>
                    </Link>
                    <Link to={createPageUrl('Calendar')} className="p-6 bg-white border border-[#1A2B44]/10 rounded-xl hover:shadow-lg hover:border-[#C9A95C]/30 transition-all text-center group">
                        <Calendar className="w-8 h-8 text-[#C9A95C] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-[#1A2B44]">Calendar</div>
                    </Link>
                </div>
            </div>
            </div>
        </>
    );
}