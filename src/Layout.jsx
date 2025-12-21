import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
    LayoutDashboard, FileText, Shield, Home, Wrench, Users, Car,
    DollarSign, Gem, Plane, Heart, Calendar, LogOut, Menu, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        base44.auth.logout();
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
        { name: 'Vault', icon: FileText, path: 'Vault' },
        { name: 'Properties', icon: Home, path: 'Properties' },
        { name: 'Maintenance', icon: Wrench, path: 'Maintenance' },
        { name: 'Contacts', icon: Users, path: 'Contacts' },
        { name: 'Vehicles', icon: Car, path: 'Vehicles' },
        { name: 'Subscriptions', icon: DollarSign, path: 'Subscriptions' },
        { name: 'Valuables', icon: Gem, path: 'Valuables' },
        { name: 'Travel', icon: Plane, path: 'Travel' },
        { name: 'Health', icon: Heart, path: 'Health' },
        { name: 'Medical Profile', icon: Heart, path: 'MedicalProfile' },
        { name: 'Legal & Estate', icon: Shield, path: 'Legal' },
        { name: 'Calendar', icon: Calendar, path: 'Calendar' },
        { name: 'Succession', icon: Shield, path: 'Succession' }
    ];

    return (
        <div className="min-h-screen flex">
            <style>{`
                :root {
                    --navy-dark: #0F2847;
                    --navy: #1B4B7F;
                    --burgundy: #8B2635;
                    --burgundy-light: #A63446;
                    --cream: #E8DCC4;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Playfair Display', Georgia, serif;
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
            <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#0F2847] to-[#1B4B7F] border-r border-[#8B2635]/20">
                <div className="p-6 border-b border-[#8B2635]/20">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#8B2635]/30 rounded-lg blur-md" />
                            <div className="relative w-10 h-10 bg-gradient-to-br from-[#8B2635] to-[#A63446] rounded-lg flex items-center justify-center">
                                <span className="text-white font-light text-lg">★</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-light text-white tracking-wide">North Star</h1>
                            <p className="text-[#E8DCC4] text-xs font-light">Life Manager</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPageName === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={createPageUrl(item.path)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-light ${
                                    isActive
                                        ? 'bg-[#8B2635] text-white shadow-lg shadow-[#8B2635]/30'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#8B2635]/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all font-light w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0F2847] to-[#1B4B7F] border-b border-[#8B2635]/20">
                <div className="flex items-center justify-between px-6 h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#8B2635] to-[#A63446] rounded-lg flex items-center justify-center">
                            <span className="text-white font-light">★</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-light text-white">North Star</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-white hover:bg-white/5 rounded-lg"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-16 left-0 right-0 bg-gradient-to-b from-[#0F2847] to-[#1B4B7F] border-b border-[#8B2635]/20 p-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPageName === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={createPageUrl(item.path)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-light ${
                                        isActive
                                            ? 'bg-[#8B2635] text-white'
                                            : 'text-white/70 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all font-light w-full"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
                {children}
            </main>
        </div>
    );
}