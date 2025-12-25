import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
    LayoutDashboard, FileText, Shield, Home, Wrench, Users, Car,
    DollarSign, Gem, Plane, Heart, Calendar, LogOut, Menu, X, Search, Plug, TrendingUp, Zap, CheckCircle, Activity, AlertCircle, Globe, Briefcase, Play
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlobalSearch from '@/components/GlobalSearch';
import ChatAssistant from '@/components/ChatAssistant';
import PWAInstaller from '@/components/PWAInstaller';
import ProactiveAssistant from '@/components/ProactiveAssistant';
import PushNotificationManager from '@/components/PushNotificationManager';
import AuthGuard from '@/components/auth/AuthGuard';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import OfflineDataManager from '@/components/pwa/OfflineDataManager';
import PWAManager from '@/components/pwa/PWAManager';
import LargeTextToggle from '@/components/accessibility/LargeTextToggle';
import SimplifiedViewToggle from '@/components/accessibility/SimplifiedViewToggle';
import VideoTutorials from '@/components/VideoTutorials';

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [simplifiedView, setSimplifiedView] = useState(false);
    const [tutorialsOpen, setTutorialsOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('simplifiedView') === 'true';
        setSimplifiedView(saved);
    }, []);

    const handleLogout = () => {
        base44.auth.logout();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const navItems = [
        // Main
        { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', essential: true },

        // Documents & Vault
        { name: 'Vault', icon: FileText, path: 'Vault', essential: true },
        { name: 'Reports', icon: FileText, path: 'Reports', essential: false },

        // Properties & Assets
        { name: 'Properties', icon: Home, path: 'Properties', essential: true },
        { name: 'Property Management', icon: TrendingUp, path: 'PropertyManagement', essential: false },
        { name: 'Maintenance', icon: Wrench, path: 'Maintenance', essential: false },
        { name: 'Vehicles', icon: Car, path: 'Vehicles', essential: true },
        { name: 'Valuables', icon: Gem, path: 'Valuables', essential: false },
        { name: 'Home Inventory', icon: Home, path: 'HomeInventory', essential: false },

        // Financial Management
        { name: 'Financial Dashboard', icon: TrendingUp, path: 'FinancialDashboard', essential: true },
        { name: 'Budget & Goals', icon: TrendingUp, path: 'Budget', essential: false },
        { name: 'Financial Health', icon: Activity, path: 'FinancialHealth', essential: false },
        { name: 'Banking Hub', icon: DollarSign, path: 'BankingHub', essential: false },
        { name: 'Investments', icon: TrendingUp, path: 'Investments', essential: true },
        { name: 'Bill Payments', icon: DollarSign, path: 'BillPayments', essential: false },
        { name: 'Auto Payments', icon: Zap, path: 'AutomatedPayments', essential: false },
        { name: 'Subscriptions', icon: DollarSign, path: 'Subscriptions', essential: false },
        { name: 'Credit Score', icon: Shield, path: 'CreditScore', essential: false },
        { name: 'Bill Negotiation', icon: TrendingUp, path: 'BillNegotiation', essential: false },
        { name: 'Insurance Shopping', icon: Shield, path: 'InsuranceShopping', essential: false },
        { name: 'Tax Export', icon: FileText, path: 'TaxExport', essential: false },
        { name: 'International Assets', icon: Globe, path: 'InternationalAssets', essential: false },

        // Business Management
        { name: 'Business Hub', icon: Briefcase, path: 'BusinessHub' },
        { name: 'Business Clients', icon: Users, path: 'BusinessClients' },
        { name: 'Business Projects', icon: Briefcase, path: 'BusinessProjects' },
        { name: 'Business Invoices', icon: FileText, path: 'BusinessInvoices' },
        { name: 'Business Expenses', icon: DollarSign, path: 'BusinessExpenses' },
        { name: 'Business Contracts', icon: FileText, path: 'BusinessContracts' },
        { name: 'Business Reports', icon: TrendingUp, path: 'BusinessReports' },

        // Family & Collaboration
        { name: 'Collaboration', icon: Users, path: 'Collaboration' },
        { name: 'Family Roles', icon: Shield, path: 'FamilyRoleManagement' },
        { name: 'Workflows', icon: Zap, path: 'FamilyWorkflows' },
        { name: 'My To-Do', icon: CheckCircle, path: 'FamilyToDo' },
        { name: 'Family Notifications', icon: LayoutDashboard, path: 'FamilyNotifications' },

        // Professional Services
        { name: 'Professional Network', icon: Users, path: 'ProfessionalMarketplace' },
        { name: 'Concierge', icon: Users, path: 'ConciergeService' },

        // Health & Medical
        { name: 'Health', icon: Heart, path: 'Health', essential: true },
        { name: 'Medical Profile', icon: Heart, path: 'MedicalProfile', essential: false },

        // Legal & Estate
        { name: 'Legal & Estate', icon: Shield, path: 'Legal', essential: true },
        { name: 'Legacy Messages', icon: Heart, path: 'LegacyMessages', essential: true },
        { name: 'Succession', icon: Shield, path: 'Succession', essential: false },
        { name: 'Family Tree', icon: Users, path: 'FamilyTree', essential: false },
        { name: 'Audit Log', icon: Shield, path: 'AuditLog', essential: false },
        { name: 'Estate Planning', icon: FileText, path: 'EstatePlanningWizard', essential: false },
        { name: 'Charitable Giving', icon: Heart, path: 'CharitableGiving', essential: false },
        { name: 'Education Funds', icon: TrendingUp, path: 'EducationFunds', essential: false },
        { name: 'Medicare Navigator', icon: Heart, path: 'MedicareNavigator', essential: false },
        { name: 'Digital Memorial', icon: Heart, path: 'DigitalMemorial', essential: false },
        { name: 'Art & Collectibles', icon: Gem, path: 'ArtCollectibles', essential: false },
        { name: 'Doctor Appointments', icon: Heart, path: 'DoctorAppointments', essential: false },
        { name: 'Home Services', icon: Home, path: 'HomeServices', essential: false },

        // Planning & Calendar
        { name: 'Calendar', icon: Calendar, path: 'Calendar', essential: true },
        { name: 'Travel', icon: Plane, path: 'Travel', essential: false },

        // Contacts & Communication
        { name: 'Contacts', icon: Users, path: 'Contacts', essential: true },
        { name: 'Email Assistant', icon: Plug, path: 'EmailAssistant' },

        // Emergency
        { name: 'Emergency Response', icon: AlertCircle, path: 'EmergencyResponse' },

        // Settings & System
        { name: 'Notifications', icon: LayoutDashboard, path: 'NotificationSettings' },
        { name: 'Integrations', icon: Plug, path: 'Integrations' },
        { name: 'Role Management', icon: Shield, path: 'RoleManagement' },
        { name: 'Voice Assistant', icon: Users, path: 'VoiceAssistant' },
        { name: 'Pricing', icon: DollarSign, path: 'Pricing' }
        ];

    return (
        <AuthGuard>
        <PWAManager />
        <OfflineDataManager />
        <OfflineIndicator />
        <div className="min-h-screen flex" style={{ backgroundColor: '#F8F9FA' }}>
            <style>{`
                :root {
                    --dark-blue: #0F1729;
                    --medium-blue: #2E5C8A;
                    --light-blue: #4A90E2;
                    --pale-blue: #B8D4ED;
                    --pure-white: #FFFFFF;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    -webkit-tap-highlight-color: transparent;
                    overscroll-behavior-y: contain;
                    -webkit-overflow-scrolling: touch;
                    color: #0F1729;
                    background-color: #F8F9FA;
                }

                .touch-manipulation {
                    touch-action: manipulation;
                }

                * {
                    -webkit-tap-highlight-color: transparent;
                }

                button, a {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }

                .pb-safe {
                    padding-bottom: env(safe-area-inset-bottom);
                }

                .safe-area-inset {
                    padding-left: env(safe-area-inset-left);
                    padding-right: env(safe-area-inset-right);
                }
                
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Playfair Display', Georgia, serif;
                    font-weight: 500;
                    color: #000000;
                }

                p, span, div, a, button, label, input, textarea, select {
                    color: #0F1729;
                }
                
                button, a[role="button"] {
                    min-height: 50px;
                    min-width: 50px;
                    touch-action: manipulation;
                    border-radius: 8px;
                }

                @media print {
                    body {
                        background: white !important;
                    }
                    aside, nav, button.print\\:hidden, .print\\:hidden {
                        display: none !important;
                    }
                    main {
                        margin: 0 !important;
                    }
                    .shadow-lg, .shadow-xl {
                        box-shadow: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#0F1729] to-[#1E3A5F] border-r border-[#2E5C8A]">
                <div className="p-6 border-b border-[#2E5C8A]/20">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-10 h-10 object-contain"
                        />
                        <div>
                            <h1 className="text-lg font-light text-white tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>North Star</h1>
                            <p className="text-[#B8D4ED] text-xs font-light">Life Manager</p>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-3 bg-white/10 hover:bg-white/15 rounded-lg transition-colors text-[#B8D4ED] text-sm min-h-[50px]"
                    >
                        <Search className="w-5 h-5" />
                        <span>Search...</span>
                        <kbd className="ml-auto text-xs bg-[#8A9A7B]/10 px-1.5 py-0.5 rounded">⌘K</kbd>
                    </button>
                    <div className="mt-4 space-y-2">
                        <LargeTextToggle />
                        <SimplifiedViewToggle />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTutorialsOpen(true)}
                            className="w-full gap-2"
                        >
                            <Play className="w-4 h-4" />
                            Video Tutorials
                        </Button>
                        <PushNotificationManager />
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.filter(item => !simplifiedView || item.essential).map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPageName === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={createPageUrl(item.path)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-light min-h-[50px] ${
                                    isActive
                                        ? 'bg-[#4A90E2] text-white shadow-lg'
                                        : 'text-[#B8D4ED] hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                        })}
                        </nav>

                        <div className="p-4 border-t border-[#2E5C8A]/20">
                        <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-4 rounded-lg text-[#B8D4ED] hover:text-white hover:bg-white/10 transition-all font-light w-full touch-manipulation active:bg-white/20 min-h-[50px]"
                        >
                        <LogOut className="w-5 h-5" />
                        <span className="text-base">Logout</span>
                    </button>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-[#7BB3E0]">
                        <Link to={createPageUrl('Privacy')} className="hover:text-white transition-colors">
                            Privacy
                        </Link>
                        <Link to={createPageUrl('Terms')} className="hover:text-white transition-colors">
                            Terms
                        </Link>
                    </div>
                    </div>
                    </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0F1729] to-[#1E3A5F] border-b border-[#2E5C8A] safe-area-inset">
                <div className="flex items-center justify-between px-4 h-16">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-8 h-8 object-contain"
                        />
                        <div>
                            <h1 className="text-sm font-light text-white" style={{ fontFamily: 'Playfair Display, serif' }}>North Star</h1>
                        </div>
                        </Link>
                        <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-3 text-[#B8D4ED] hover:bg-white/10 rounded-lg touch-manipulation active:scale-95 transition-transform min-h-[50px] min-w-[50px]"
                            aria-label="Search"
                        >
                            <Search className="w-6 h-6" />
                        </button>
                        <PushNotificationManager />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-3 text-[#B8D4ED] hover:bg-white/10 rounded-lg touch-manipulation active:scale-95 transition-transform min-h-[50px] min-w-[50px] flex items-center flex-col justify-center gap-1"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            <span className="text-xs">MENU</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-16 left-0 right-0 bg-gradient-to-b from-[#0F1729] to-[#1E3A5F] border-b border-[#2E5C8A] p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl">
                        <div className="mb-4 space-y-2">
                            <LargeTextToggle />
                            <SimplifiedViewToggle />
                        </div>
                        {navItems.filter(item => !simplifiedView || item.essential).map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPageName === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={createPageUrl(item.path)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all font-light touch-manipulation active:scale-98 min-h-[50px] ${
                                        isActive
                                            ? 'bg-[#4A90E2] text-white shadow-lg'
                                            : 'text-[#B8D4ED] hover:text-white hover:bg-white/10 active:bg-white/20'
                                    }`}
                                    >
                                    <Icon className="w-6 h-6" />
                                    <span className="text-base">{item.name}</span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-4 rounded-lg text-[#B8D4ED] hover:text-white hover:bg-white/10 transition-all font-light w-full min-h-[50px]"
                        >
                            <LogOut className="w-6 h-6" />
                            <span className="text-base">Logout</span>
                        </button>
                        <div className="flex justify-center gap-6 mt-4 text-sm text-[#7BB3E0] pb-4">
                            <Link 
                                to={createPageUrl('Privacy')} 
                                onClick={() => setMobileMenuOpen(false)}
                                className="hover:text-white transition-colors"
                            >
                                Privacy
                            </Link>
                            <Link 
                                to={createPageUrl('Terms')} 
                                onClick={() => setMobileMenuOpen(false)}
                                className="hover:text-white transition-colors"
                            >
                                Terms
                            </Link>
                        </div>
                        </div>
                        )}
                        </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-0 mt-16 lg:mt-0 pb-safe">
                {children}
            </main>

            {/* Global Search */}
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
            
            {/* AI Chat Assistant */}
            <ChatAssistant />

            {/* Proactive Assistant */}
            <ProactiveAssistant />

            {/* PWA Install Prompt */}
            <PWAInstaller />

            {/* Video Tutorials */}
            <VideoTutorials open={tutorialsOpen} onOpenChange={setTutorialsOpen} />
            </div>
            </AuthGuard>
            );
            }