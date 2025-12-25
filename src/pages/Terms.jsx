import React from 'react';
import { FileText } from 'lucide-react';

export default function Terms() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-8 h-8 text-[#C5A059]" />
                        <h1 className="text-4xl font-light text-[#C5A059]">Terms of Service</h1>
                    </div>
                    <p className="text-[#F4E4C1]/80">Last updated: December 25, 2025</p>
                    <p className="text-[#F4E4C1]/60 mt-2">© 2025 North Star Life Manager. All rights reserved.</p>
                </div>

                <div className="space-y-8 text-[#F4E4C1]">
                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing and using North Star Life Manager, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">2. Description of Service</h2>
                        <p>North Star provides a comprehensive life management platform including:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                            <li>Document storage and management with AI-powered OCR</li>
                            <li>Property and asset tracking</li>
                            <li>Financial management tools</li>
                            <li>Health record management</li>
                            <li>Family collaboration features</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">3. User Responsibilities</h2>
                        <p className="mb-3">You agree to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Use the service in compliance with applicable laws</li>
                            <li>Not upload malicious content or violate others' rights</li>
                            <li>Not attempt to breach security or access unauthorized data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">4. Subscription and Payments</h2>
                        <p>Paid subscription tiers provide additional features and storage. Subscriptions are billed monthly or annually. You may cancel at any time, with access continuing until the end of the billing period.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">5. Intellectual Property Rights</h2>
                        <p className="mb-3">The North Star platform, including its software, design, logos, features, and documentation, is protected by copyright, trademark, and other intellectual property laws. All rights, title, and interest in the platform belong to North Star.</p>
                        <p>You may not copy, modify, distribute, sell, or lease any part of our platform without prior written permission.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">6. User Content and Data Ownership</h2>
                        <p>You retain all ownership rights to the content and data you upload to North Star. By using our service, you grant us a limited license to store, process, and display your content solely to provide the service. You can export or delete your data at any time.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">7. Service Availability</h2>
                        <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. Maintenance windows will be communicated in advance when possible.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">8. Limitation of Liability</h2>
                        <p>North Star is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from use of the service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">9. Termination</h2>
                        <p>We may suspend or terminate your account for violations of these terms. You may terminate your account at any time through account settings.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">10. Changes to Terms</h2>
                        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">11. Governing Law and Jurisdiction</h2>
                        <p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of Minnesota, without regard to its conflict of law provisions. Any disputes arising from these terms or use of the service shall be subject to the exclusive jurisdiction of the state and federal courts located in Minnesota.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-light text-[#C5A059] mb-4">12. Contact</h2>
                        <p>For questions about these Terms of Service, contact us at legal@northstar.app</p>
                    </section>
                </div>
            </div>
        </div>
    );
}