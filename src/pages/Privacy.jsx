import React from 'react';
import { Shield } from 'lucide-react';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-[#C5A059]" />
                        <h1 className="text-4xl font-light text-[#C5A059]">Privacy Policy</h1>
                    </div>
                    <p className="text-[#F4E4C1]/80">Last updated: December 25, 2025</p>
                </div>

                <div className="space-y-8 text-[#F4E4C1]">
                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">1. Information We Collect</h2>
                        <p className="mb-3">We collect information you provide directly to us, including:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Account information (name, email, password)</li>
                            <li>Family and household data</li>
                            <li>Documents and files you upload</li>
                            <li>Property, vehicle, and asset information</li>
                            <li>Financial and health records</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">2. How We Use Your Information</h2>
                        <p className="mb-3">We use the information we collect to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your documents with AI/OCR technology</li>
                            <li>Send you notifications and reminders</li>
                            <li>Analyze usage patterns to enhance user experience</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">3. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your data, including:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                            <li>End-to-end encryption for sensitive documents</li>
                            <li>Secure cloud storage with row-level security</li>
                            <li>Regular security audits and updates</li>
                            <li>Two-factor authentication options</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">4. Data Sharing</h2>
                        <p>We do not sell your personal information. We may share data with:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                            <li>Family members you explicitly authorize</li>
                            <li>Service providers who assist in operations</li>
                            <li>Legal authorities when required by law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">5. Your Rights</h2>
                        <p className="mb-3">You have the right to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Access your personal data</li>
                            <li>Request data corrections or deletion</li>
                            <li>Export your data</li>
                            <li>Opt-out of communications</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">6. Cookies and Tracking</h2>
                        <p>We use cookies and similar technologies to improve your experience, analyze usage, and deliver personalized content.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">7. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please contact us at privacy@northstar.app</p>
                    </section>
                </div>
            </div>
        </div>
    );
}