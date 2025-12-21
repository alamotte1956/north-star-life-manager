import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { FileText, Shield, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
    const handleLogout = () => {
        base44.auth.logout();
    };

    return (
        <div className="min-h-screen">
            <style>{`
                :root {
                    --navy-dark: #0F1B2E;
                    --navy: #1A2B44;
                    --gold: #C9A95C;
                    --gold-light: #D4AF37;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Playfair Display', Georgia, serif;
                }
            `}</style>

            {/* Navigation */}
            <nav className="bg-gradient-to-r from-[#0F1B2E] to-[#1A2B44] border-b border-[#C9A95C]/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-lg blur-md" />
                                <div className="relative w-10 h-10 bg-gradient-to-br from-[#C9A95C] to-[#D4AF37] rounded-lg flex items-center justify-center">
                                    <span className="text-white font-light text-lg">★</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-light text-white tracking-wide">
                                    North Star
                                </h1>
                                <p className="text-[#C9A95C] text-xs font-light">Life Manager</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex items-center gap-2">
                            <Link
                                to={createPageUrl('Vault')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-light ${
                                    currentPageName === 'Vault'
                                        ? 'bg-[#C9A95C] text-white shadow-lg shadow-[#C9A95C]/30'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                Vault
                            </Link>
                            <Link
                                to={createPageUrl('Succession')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-light ${
                                    currentPageName === 'Succession'
                                        ? 'bg-[#C9A95C] text-white shadow-lg shadow-[#C9A95C]/30'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Shield className="w-4 h-4" />
                                Succession
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all font-light ml-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <main>
                {children}
            </main>
        </div>
    );
}