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

    const downloadExecutiveSummary = () => {
        const doc = new jsPDF();
        let y = 20;

        // Title Page
        doc.setFontSize(24);
        doc.text('North Star', 105, y, { align: 'center' });
        y += 10;
        doc.setFontSize(16);
        doc.text('Executive Summary', 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.text('Complete Life Management Platform', 105, y, { align: 'center' });
        y += 20;

        // Overview
        doc.setFontSize(14);
        doc.text('Platform Overview', 20, y);
        y += 8;
        doc.setFontSize(10);
        const overview = doc.splitTextToSize('North Star is a comprehensive life management platform that centralizes all aspects of personal and property management. From document storage to investment tracking, the platform provides AI-powered insights and automation to simplify complex life administration tasks.', 170);
        doc.text(overview, 20, y);
        y += overview.length * 5 + 10;

        // Core Modules
        doc.setFontSize(14);
        doc.text('Core Modules', 20, y);
        y += 8;

        const modules = [
            { title: 'Document Vault & AI Analysis', features: 'Secure document storage with AI-powered OCR, automatic categorization, expiry tracking, version control, and intelligent search. Supports mobile capture and family sharing.' },
            { title: 'Property Management Suite', features: 'Complete rental property management with automated rent collection via Stripe, AI-powered tenant communications, lease management, renewal tracking, and rental listing generation.' },
            { title: 'Maintenance & Vendor Management', features: 'Smart maintenance scheduling, AI vendor assignment based on specialty and location, work tracking, tenant feedback collection, and automated reminders.' },
            { title: 'Financial Management', features: 'Budget tracking with AI insights, financial goal setting and monitoring, investment portfolio analysis, bill payment automation, credit score tracking, and comprehensive financial health dashboard.' },
            { title: 'Investment Portfolio', features: 'Real-time portfolio tracking, AI-powered risk analysis, diversification recommendations, market trend monitoring, rebalancing suggestions, and personalized investment strategies.' },
            { title: 'Bill Payments & Automation', features: 'Automated bill payment scheduling, recurring payment detection, payment method management, approval workflows, and smart reminders.' },
            { title: 'Health & Medical Profile', features: 'Health records storage, medication tracking, wearable data integration, emergency medical information, printable medical cards, and health trend analysis.' },
            { title: 'Assets & Valuables', features: 'Vehicle management with maintenance tracking, valuable items inventory with insurance documentation, and comprehensive asset valuation.' },
            { title: 'Travel & Planning', features: 'Trip planning, itinerary management, document organization for travel, and important date tracking.' },
            { title: 'Legal & Estate Planning', features: 'Beneficiary management, advance directives, power of attorney documents, succession planning, and secure emergency access system.' },
            { title: 'Contacts & Communications', features: 'Centralized contact management, AI email assistant, relationship tracking, and communication history.' },
            { title: 'Calendar Integration', features: 'Smart calendar with auto-scheduling, maintenance reminders, bill due dates, and integration with Google Calendar.' },
            { title: 'Family Collaboration', features: 'Multi-user access, role-based permissions, task assignment, shared documents, activity logging, and family notifications.' }
        ];

        doc.setFontSize(10);
        modules.forEach(module => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.text('• ' + module.title, 20, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            const text = doc.splitTextToSize(module.features, 165);
            doc.text(text, 25, y);
            y += text.length * 5 + 6;
        });

        // AI Features
        if (y > 220) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(14);
        doc.text('AI-Powered Features', 20, y);
        y += 8;

        const aiFeatures = [
            'Document analysis and data extraction',
            'Financial health monitoring with proactive alerts',
            'Investment portfolio risk analysis and recommendations',
            'Budget optimization and spending insights',
            'Tenant communication drafting and sentiment analysis',
            'Vendor matching and assignment',
            'Market trend analysis',
            'Personalized investment strategies',
            'Automated categorization and tagging',
            'Predictive maintenance scheduling',
            'Rent pricing suggestions',
            'Property listing generation'
        ];

        doc.setFontSize(10);
        aiFeatures.forEach(feature => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text('• ' + feature, 20, y);
            y += 6;
        });

        // Integrations
        if (y > 220) {
            doc.addPage();
            y = 20;
        }
        y += 5;
        doc.setFontSize(14);
        doc.text('Platform Integrations', 20, y);
        y += 8;
        doc.setFontSize(10);
        const integrations = doc.splitTextToSize('Stripe (payments), Google Calendar, Google Drive, Slack, Dropbox, QuickBooks, Twilio (SMS), and more. OAuth-based secure connections.', 170);
        doc.text(integrations, 20, y);
        y += integrations.length * 5 + 10;

        // Security & Access
        doc.setFontSize(14);
        doc.text('Security & Access Control', 20, y);
        y += 8;
        doc.setFontSize(10);
        const security = [
            'Enterprise-grade encryption for all data',
            'Role-based access control with custom permissions',
            'Secure document storage with Supabase',
            'Multi-factor authentication support',
            'Audit logging for all actions',
            'Emergency access system with time-locked access',
            'HIPAA-compliant medical data handling'
        ];
        security.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text('• ' + item, 20, y);
            y += 6;
        });

        // Use Cases
        if (y > 200) {
            doc.addPage();
            y = 20;
        }
        y += 5;
        doc.setFontSize(14);
        doc.text('Primary Use Cases', 20, y);
        y += 8;
        doc.setFontSize(10);
        const useCases = [
            'Landlords & Property Managers: Comprehensive rental management, automated collection, tenant portals',
            'High-Net-Worth Individuals: Asset tracking, estate planning, wealth management',
            'Families: Shared document vault, emergency preparedness, collaborative planning',
            'Estate Executors: Succession planning, secure information access',
            'Professionals: Document organization, financial tracking, investment management'
        ];
        useCases.forEach(useCase => {
            if (y > 265) {
                doc.addPage();
                y = 20;
            }
            const text = doc.splitTextToSize('• ' + useCase, 170);
            doc.text(text, 20, y);
            y += text.length * 5 + 5;
        });

        // Automation Capabilities
        if (y > 200) {
            doc.addPage();
            y = 20;
        }
        y += 5;
        doc.setFontSize(14);
        doc.text('Automation Capabilities', 20, y);
        y += 8;
        doc.setFontSize(10);
        const automation = [
            'Automated rent collection and reminders',
            'Smart bill payment scheduling and execution',
            'Document expiry notifications',
            'Maintenance task reminders',
            'Subscription renewal alerts',
            'Investment rebalancing suggestions',
            'Budget overspending alerts',
            'Workflow rules for document handling'
        ];
        automation.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text('• ' + item, 20, y);
            y += 6;
        });

        // Key Benefits
        if (y > 200) {
            doc.addPage();
            y = 20;
        }
        y += 5;
        doc.setFontSize(14);
        doc.text('Key Benefits', 20, y);
        y += 8;
        doc.setFontSize(10);
        const benefits = [
            'Centralized Information: All life data in one secure platform',
            'Time Savings: Automation reduces manual tasks by 70%+',
            'Risk Reduction: Proactive alerts prevent missed deadlines and payments',
            'Financial Optimization: AI-driven insights improve investment returns',
            'Peace of Mind: Emergency access system ensures family preparedness',
            'Compliance: Automated tracking ensures regulatory compliance',
            'Scalability: Manages unlimited properties, documents, and assets'
        ];
        benefits.forEach(benefit => {
            if (y > 265) {
                doc.addPage();
                y = 20;
            }
            const text = doc.splitTextToSize('• ' + benefit, 170);
            doc.text(text, 20, y);
            y += text.length * 5 + 5;
        });

        doc.save('North-Star-Executive-Summary.pdf');
    };

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
            {/* White-Glove Onboarding */}
            {showOnboarding && (
                <OnboardingFlow
                    onComplete={() => {
                        setShowOnboarding(false);
                        window.location.reload();
                    }}
                    onSkip={() => setShowOnboarding(false)}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
                <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-black mb-2">
                                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">
                                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link
                                to={createPageUrl('Pricing')}
                                className="flex items-center justify-center px-6 py-4 min-h-[50px] bg-gradient-to-r from-[#4A90E2] to-[#2E5C8A] text-white rounded-xl hover:shadow-lg transition-all font-medium text-lg"
                            >
                                Sign Up / Upgrade
                            </Link>
                            <button
                                onClick={() => setShowGuide(true)}
                                className="flex items-center gap-3 px-6 py-4 min-h-[50px] bg-white border-2 border-[#4A90E2] text-[#0F1729] rounded-xl hover:bg-[#4A90E2] hover:text-white transition-all font-light shadow-sm"
                            >
                                <BookOpen className="w-6 h-6" />
                                <span className="text-base">Getting Started</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Getting Started Guide Modal */}
                {showGuide && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="sticky top-0 bg-gradient-to-r from-[#0F1729] to-[#2E5C8A] p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-8 h-8 text-white" />
                                    <h2 className="text-2xl font-light text-white">Getting Started with North Star Life Manager</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={downloadExecutiveSummary}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] hover:bg-[#2E5C8A] rounded-lg transition-colors min-h-[50px]"
                                    >
                                        <FileText className="w-5 h-5 text-white" />
                                        <span className="text-white text-sm">Executive Summary</span>
                                    </button>
                                    <button
                                        onClick={downloadGuideAsPDF}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors min-h-[50px]"
                                    >
                                        <Download className="w-5 h-5 text-white" />
                                        <span className="text-white text-sm">PDF Guide</span>
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
                                    <h3 className="text-xl font-light text-black mb-3">Welcome to Your Life Management Hub</h3>
                                    <p className="text-[#0F1729]/70 font-light leading-relaxed">
                                        North Star helps you organize and manage all aspects of your life in one secure place. 
                                        From properties and vehicles to important documents and health records, everything is at your fingertips.
                                    </p>
                                </div>

                                {/* Quick Start Steps */}
                                <div>
                                    <h3 className="text-xl font-light text-black mb-4">Quick Start Guide</h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 p-4 bg-[#E8EEF5] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">1</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Upload & Organize Documents</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Start with the <strong>Vault</strong> - upload documents via mobile camera or desktop. 
                                                    AI automatically extracts dates, amounts, and categories. Create folders for better organization.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">2</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Connect Your Financial Life</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Visit <strong>Banking Hub</strong> to connect bank accounts. Set up <strong>Bill Payments</strong> and 
                                                    <strong> Automated Payments</strong>. Track <strong>Investments</strong> and analyze your 
                                                    <strong> Financial Health</strong> dashboard for AI-driven insights.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#E8EEF5] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">3</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Track Health & Wellness</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Set up your <strong>Medical Profile</strong> with medications and conditions. 
                                                    Log health data to enable our <strong>Wellness Insights</strong> correlation engine, 
                                                    which reveals how your health impacts spending patterns.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">4</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Manage Properties & Assets</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Add <strong>Properties</strong> (including rental properties with automated rent collection), 
                                                    <strong> Vehicles</strong>, <strong>Valuables</strong>, and <strong>Home Inventory</strong>. 
                                                    Set up <strong>Maintenance</strong> tasks with AI vendor assignment and smart scheduling.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#E8EEF5] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">5</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Business Management (Optional)</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    If you run a business, explore <strong>Business Hub</strong> for client management, 
                                                    project tracking, invoicing, contracts, and expense management with QuickBooks/Xero integration.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">6</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Estate Planning & Security</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Complete <strong>Legal & Estate</strong> with beneficiaries, advance directives, and 
                                                    <strong> Legacy Messages</strong>. Set up <strong>Succession</strong> for emergency access 
                                                    and create your <strong>Emergency Response</strong> profile.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#E8EEF5] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">7</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Optimize & Automate</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Use <strong>Bill Negotiation</strong> to reduce recurring costs, 
                                                    <strong> Insurance Shopping</strong> for better coverage, and 
                                                    <strong> Concierge Service</strong> for white-glove task assistance. 
                                                    Connect <strong>Integrations</strong> like Google Calendar and Slack.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 p-4 bg-[#F8F7F4] rounded-xl">
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-light">8</div>
                                            <div className="flex-1">
                                                <h4 className="font-light text-black mb-1">Collaborate & Delegate</h4>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
                                                    Invite family members via <strong>Collaboration</strong>, assign roles in 
                                                    <strong> Family Roles</strong>, create <strong>Workflows</strong> for document handling, 
                                                    and manage shared <strong>Family To-Do</strong> lists.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Features */}
                                <div>
                                    <h3 className="text-xl font-light text-black mb-4">Key Features</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 border border-[#1B4B7F]/20 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-5 h-5 text-[#8B2635]" />
                                                <h4 className="font-light text-black">Smart Document Vault</h4>
                                                </div>
                                                <p className="text-sm text-[#0F1729]/70 font-light">
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
                                <div className="bg-gradient-to-br from-[#4A90E2]/5 to-[#2E5C8A]/5 p-6 rounded-xl border border-[#4A90E2]/20">
                                <h3 className="text-xl font-light text-black mb-3">💡 Pro Tips</h3>
                                <ul className="space-y-2 text-sm text-[#0F1729]/70 font-light">
                                        <li>• <strong>Mobile Power:</strong> Use your phone camera to capture documents instantly - AI analyzes them in real-time</li>
                                        <li>• <strong>Smart Automation:</strong> Set up automated rent collection, bill payments, and maintenance reminders to save hours each month</li>
                                        <li>• <strong>Wellness-Money Link:</strong> Enable health tracking to discover how sleep, stress, and exercise affect your spending habits</li>
                                        <li>• <strong>AI Advisor:</strong> Use the Financial Advisor and Investment Advisor chatbots for personalized guidance anytime</li>
                                        <li>• <strong>External Integrations:</strong> Connect Google Calendar, Slack, Drive, QuickBooks, and more in the Integrations section</li>
                                        <li>• <strong>Emergency Prepared:</strong> Print your Medical Emergency Card and set up Succession access for family members</li>
                                        <li>• <strong>Professional Help:</strong> Book video calls with CPAs, attorneys, and advisors through Professional Network</li>
                                        <li>• <strong>Cost Savings:</strong> Use Bill Negotiation and Insurance Shopping to reduce monthly expenses automatically</li>
                                        <li>• <strong>Business Features:</strong> Freelancers and consultants can manage clients, projects, and invoices in Business Hub</li>
                                        <li>• <strong>Global Search:</strong> Press ⌘K (Ctrl+K on Windows) to search across all your documents, contacts, and data instantly</li>
                                    </ul>
                                </div>

                                {/* Close Button */}
                                <div className="text-center space-y-3">
                                    <button
                                        onClick={() => setShowGuide(false)}
                                        className="px-8 py-3 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white rounded-full hover:shadow-lg transition-all font-light"
                                    >
                                        Get Started
                                    </button>
                                    <div>
                                        <Link 
                                            to={createPageUrl('VideoCallScheduler')}
                                            className="text-sm text-[#4A90E2] hover:text-[#2E5C8A] underline"
                                            onClick={() => setShowGuide(false)}
                                        >
                                            Or schedule a personal video call for help
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Health Alerts */}
                <div className="mb-8">
                    <FinancialHealthAlerts />
                </div>

                {/* Wellness Insights - Correlation Engine */}
                <div className="mb-8">
                    {/* Wellness insights component would go here */}
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
                                <Link to={createPageUrl('Maintenance')} className="text-sm text-[#4A90E2] hover:text-black font-light">
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {dueTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {dueTasks.slice(0, 4).map(task => (
                                        <div key={task.id} className="flex items-start gap-3 p-3 bg-[#E8EEF5] rounded-lg">
                                            <Wrench className="w-4 h-4 text-[#4A90E2] mt-1" />
                                            <div className="flex-1">
                                                <div className="font-light text-[#1A2B44]">{task.title}</div>
                                                <div className="text-sm text-[#0F1729]/60 font-light">
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
                                <Link to={createPageUrl('Subscriptions')} className="text-sm text-[#4A90E2] hover:text-black font-light">
                                    View all
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <div className="text-4xl font-light text-black mb-1">
                                    ${monthlySubscriptions.toFixed(0)}
                                </div>
                                <div className="text-sm text-[#1A2B44]/60 font-light">
                                    Estimated monthly total
                                </div>
                            </div>
                            <div className="space-y-2">
                                {subscriptions.filter(s => s.status === 'active').slice(0, 3).map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center p-3 bg-[#E8EEF5] rounded-lg">
                                        <span className="font-light text-black">{sub.name}</span>
                                        <span className="text-[#4A90E2] font-light">
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
                    <Link to={createPageUrl('Contacts')} className="p-6 bg-white border border-[#B8D4ED] rounded-xl hover:shadow-lg hover:border-[#4A90E2] transition-all text-center group">
                        <Users className="w-8 h-8 text-[#4A90E2] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-black">Contacts</div>
                    </Link>
                    <Link to={createPageUrl('Travel')} className="p-6 bg-white border border-[#B8D4ED] rounded-xl hover:shadow-lg hover:border-[#4A90E2] transition-all text-center group">
                        <Plane className="w-8 h-8 text-[#4A90E2] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-black">Travel</div>
                    </Link>
                    <Link to={createPageUrl('Health')} className="p-6 bg-white border border-[#B8D4ED] rounded-xl hover:shadow-lg hover:border-[#4A90E2] transition-all text-center group">
                        <Heart className="w-8 h-8 text-[#4A90E2] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-black">Health</div>
                    </Link>
                    <Link to={createPageUrl('Calendar')} className="p-6 bg-white border border-[#B8D4ED] rounded-xl hover:shadow-lg hover:border-[#4A90E2] transition-all text-center group">
                        <Calendar className="w-8 h-8 text-[#4A90E2] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <div className="font-light text-black">Calendar</div>
                    </Link>
                </div>
            </div>
            </div>
        </>
    );
}