import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
    LayoutDashboard, FileText, Shield, Home, Wrench, Users, Car,
    DollarSign, Gem, Plane, Heart, Calendar, LogOut, Menu, X, Search, Plug, TrendingUp, Zap, CheckCircle, Activity, AlertCircle, Globe
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlobalSearch from '@/components/GlobalSearch';
import ChatAssistant from '@/components/ChatAssistant';
import PWAInstaller from '@/components/PWAInstaller';
import ProactiveAssistant from '@/components/ProactiveAssistant';
import PushNotificationManager from '@/components/PushNotificationManager';
import AuthGuard from '@/components/auth/AuthGuard';

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

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
        { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
        { name: 'Collaboration', icon: Users, path: 'Collaboration' },
        { name: 'Vault', icon: FileText, path: 'Vault' },
        { name: 'Reports', icon: FileText, path: 'Reports' },
        { name: 'Properties', icon: Home, path: 'Properties' },
        { name: 'Property Management', icon: TrendingUp, path: 'PropertyManagement' },
        { name: 'Maintenance', icon: Wrench, path: 'Maintenance' },
        { name: 'Contacts', icon: Users, path: 'Contacts' },
        { name: 'Vehicles', icon: Car, path: 'Vehicles' },
        { name: 'Subscriptions', icon: DollarSign, path: 'Subscriptions' },
        { name: 'Budget & Goals', icon: TrendingUp, path: 'Budget' },
        { name: 'Financial Health', icon: Activity, path: 'FinancialHealth' },
        { name: 'Credit Score', icon: Shield, path: 'CreditScore' },
        { name: 'Financial Dashboard', icon: TrendingUp, path: 'FinancialDashboard' },
        { name: 'Bill Payments', icon: DollarSign, path: 'BillPayments' },
        { name: 'Auto Payments', icon: Zap, path: 'AutomatedPayments' },
        { name: 'Investments', icon: TrendingUp, path: 'Investments' },
        { name: 'Valuables', icon: Gem, path: 'Valuables' },
        { name: 'Travel', icon: Plane, path: 'Travel' },
        { name: 'Health', icon: Heart, path: 'Health' },
        { name: 'Medical Profile', icon: Heart, path: 'MedicalProfile' },
        { name: 'Legal & Estate', icon: Shield, path: 'Legal' },
        { name: 'Calendar', icon: Calendar, path: 'Calendar' },
        { name: 'Pricing', icon: DollarSign, path: 'Pricing' },
        { name: 'Notifications', icon: LayoutDashboard, path: 'NotificationSettings' },
        { name: 'Family Notifications', icon: LayoutDashboard, path: 'FamilyNotifications' },
        { name: 'Succession', icon: Shield, path: 'Succession' },
        { name: 'Integrations', icon: Plug, path: 'Integrations' },
        { name: 'Email Assistant', icon: Plug, path: 'EmailAssistant' },
        { name: 'Role Management', icon: Shield, path: 'RoleManagement' },
        { name: 'Family Roles', icon: Shield, path: 'FamilyRoleManagement' },
        { name: 'Workflows', icon: Zap, path: 'FamilyWorkflows' },
        { name: 'My To-Do', icon: CheckCircle, path: 'FamilyToDo' },
        { name: 'Banking Hub', icon: DollarSign, path: 'BankingHub' },
        { name: 'Bill Negotiation', icon: TrendingUp, path: 'BillNegotiation' },
        { name: 'Professional Network', icon: Users, path: 'ProfessionalMarketplace' },
        { name: 'Tax Export', icon: FileText, path: 'TaxExport' },
        { name: 'Insurance Shopping', icon: Shield, path: 'InsuranceShopping' },
        { name: 'Legacy Messages', icon: Heart, path: 'LegacyMessages' },
        { name: 'Home Inventory', icon: Home, path: 'HomeInventory' },
        { name: 'Concierge', icon: Users, path: 'ConciergeService' },
        { name: 'Emergency Response', icon: AlertCircle, path: 'EmergencyResponse' },
        { name: 'International Assets', icon: Globe, path: 'InternationalAssets' },
        { name: 'Voice Assistant', icon: Users, path: 'VoiceAssistant' }
        ];

    return (
        <AuthGuard>
        <div className="min-h-screen flex" style={{ backgroundColor: '#000000' }}>
            <style>{`
                :root {
                    --pure-black: #000000;
                    --deep-black: #0a0a0a;
                    --champagne-gold: #C5A059;
                    --bright-gold: #D4AF37;
                    --soft-gold: #F4E4C1;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    -webkit-tap-highlight-color: transparent;
                    overscroll-behavior-y: contain;
                    -webkit-overflow-scrolling: touch;
                    color: #B8935E;
                    background-color: #000000;
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
                    color: #C5A059;
                }

                p, span, div, a, button, label, input, textarea, select {
                    color: #B8935E;
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
            <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-black to-[#0a0a0a] border-r border-[#C5A059]">
                <div className="p-6 border-b border-[#C5A059]/20">
                    <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-10 h-10 object-contain"
                        />
                        <div>
                            <h1 className="text-lg font-light text-[#C5A059] tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>North Star</h1>
                            <p className="text-[#64748B] text-xs font-light">Life Manager</p>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-3 bg-white/10 hover:bg-white/15 rounded-lg transition-colors text-[#B8935E] text-sm min-h-[50px]"
                    >
                        <Search className="w-5 h-5" />
                        <span>Search...</span>
                        <kbd className="ml-auto text-xs bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
                    </button>
                    <div className="mt-4">
                        <PushNotificationManager />
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPageName === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={createPageUrl(item.path)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-light min-h-[50px] ${
                                    isActive
                                        ? 'bg-[#C5A059] text-[#0F172A] shadow-lg'
                                        : 'text-[#B8935E] hover:text-[#C5A059] hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                        })}
                        </nav>

                        <div className="p-4 border-t border-[#C5A059]/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-4 rounded-lg text-[#B8935E] hover:text-[#C5A059] hover:bg-white/5 transition-all font-light w-full touch-manipulation active:bg-white/10 min-h-[50px]"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-base">Logout</span>
                    </button>
                    <div className="flex justify-center gap-4 mt-4 text-xs text-[#8B7355]">
                        <Link to={createPageUrl('Privacy')} className="hover:text-[#C5A059] transition-colors">
                            Privacy
                        </Link>
                        <Link to={createPageUrl('Terms')} className="hover:text-[#C5A059] transition-colors">
                            Terms
                        </Link>
                    </div>
                    </div>
                    </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-black to-[#0a0a0a] border-b border-[#C5A059] safe-area-inset">
                <div className="flex items-center justify-between px-4 h-16">
                    <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-8 h-8 object-contain"
                        />
                        <div>
                            <h1 className="text-sm font-light text-[#C5A059]" style={{ fontFamily: 'Playfair Display, serif' }}>North Star</h1>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-3 text-[#C5A059] hover:bg-white/5 rounded-lg touch-manipulation active:scale-95 transition-transform min-h-[50px] min-w-[50px]"
                            aria-label="Search"
                        >
                            <Search className="w-6 h-6" />
                        </button>
                        <PushNotificationManager />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-3 text-[#C5A059] hover:bg-white/5 rounded-lg touch-manipulation active:scale-95 transition-transform min-h-[50px] min-w-[50px] flex items-center flex-col justify-center gap-1"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            <span className="text-xs">MENU</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-16 left-0 right-0 bg-gradient-to-b from-black to-[#0a0a0a] border-b border-[#C5A059] p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPageName === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={createPageUrl(item.path)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-all font-light touch-manipulation active:scale-98 min-h-[50px] ${
                                        isActive
                                            ? 'bg-[#C5A059] text-[#0F172A] shadow-lg'
                                            : 'text-[#B8935E] hover:text-[#C5A059] hover:bg-white/5 active:bg-white/10'
                                    }`}
                                >
                                    <Icon className="w-6 h-6" />
                                    <span className="text-base">{item.name}</span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-4 rounded-lg text-[#B8935E] hover:text-[#C5A059] hover:bg-white/5 transition-all font-light w-full min-h-[50px]"
                        >
                            <LogOut className="w-6 h-6" />
                            <span className="text-base">Logout</span>
                        </button>
                        <div className="flex justify-center gap-6 mt-4 text-sm text-[#8B7355] pb-4">
                            <Link 
                                to={createPageUrl('Privacy')} 
                                onClick={() => setMobileMenuOpen(false)}
                                className="hover:text-[#C5A059] transition-colors"
                            >
                                Privacy
                            </Link>
                            <Link 
                                to={createPageUrl('Terms')} 
                                onClick={() => setMobileMenuOpen(false)}
                                className="hover:text-[#C5A059] transition-colors"
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
            </div>
            </AuthGuard>
            );
            }