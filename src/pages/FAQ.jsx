import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
    Shield, Lock, CheckCircle, Star, DollarSign, Heart, 
    Settings, HelpCircle, Search, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAQSection = ({ icon: Icon, title, questions, iconColor }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQuestions = questions.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="shadow-lg">
            <CardHeader className="border-b border-[#B8D4ED]">
                <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
                        <Icon className={`w-6 h-6 ${iconColor.replace('bg-', 'text-')}`} />
                    </div>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-3">
                    {filteredQuestions.map((q, idx) => (
                        <div key={idx} className="border border-[#B8D4ED] rounded-lg overflow-hidden">
                            <button
                                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                className="w-full px-4 py-4 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors text-left"
                            >
                                <span className="font-medium text-black pr-4">{q.question}</span>
                                {expandedIndex === idx ? (
                                    <ChevronUp className="w-5 h-5 text-[#4A90E2] flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-[#4A90E2] flex-shrink-0" />
                                )}
                            </button>
                            {expandedIndex === idx && (
                                <div className="px-4 pb-4 pt-2 bg-[#F8F9FA]/50">
                                    <p className="text-[#0F1729]/70 leading-relaxed whitespace-pre-line">
                                        {q.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default function FAQ() {
    const [globalSearch, setGlobalSearch] = useState('');

    const sections = [
        {
            icon: Star,
            iconColor: 'bg-[#4A90E2]',
            title: 'General Questions',
            questions: [
                {
                    question: 'What is North Star Life Manager?',
                    answer: 'North Star Life Manager is a holistic life management platform that combines your financial health and your physical well-being into one dashboard. We use advanced AI to help you see how your spending habits impact your health, and how your wellness affects your wealth.'
                },
                {
                    question: 'Who is this app for?',
                    answer: 'It is for anyone who wants to take control of their life\'s direction. Whether you are managing a chronic condition, saving for a big goal, or just want to understand why you feel (and spend) the way you do, North Star provides the insights you need.'
                },
                {
                    question: 'Is this a medical or financial advisory service?',
                    answer: 'No. North Star Life Manager is an informational self-help tool. While we provide powerful data and AI-driven insights, we are not licensed medical doctors or financial advisors. We help you organize your data so you can make better decisions, but we do not provide diagnosis or fiduciary investment advice.'
                }
            ]
        },
        {
            icon: Shield,
            iconColor: 'bg-green-600',
            title: 'Security & Privacy',
            questions: [
                {
                    question: 'Is my data safe?',
                    answer: 'Security is our top priority. We use industry-standard AES-256 encryption to protect your data. Your information is encrypted both when it is stored on our servers and when it is being transmitted to your device.'
                },
                {
                    question: 'Do you sell my data?',
                    answer: 'No. We do not sell your personal health or financial data to advertisers or third parties. Your data belongs to you. We are wholly owned by A.I. Help Pros LLP, and our business model is based on providing value to you, not selling your information to others.'
                },
                {
                    question: 'Can your employees see my bank balance or medical logs?',
                    answer: 'No. Your sensitive data is encrypted. Our support staff cannot access your specific banking credentials or private medical notes. We can only see account status (e.g., "Active") to help you with technical support.'
                }
            ]
        },
        {
            icon: DollarSign,
            iconColor: 'bg-[#50C878]',
            title: 'Connecting Your Finances',
            questions: [
                {
                    question: 'Do you store my bank login credentials?',
                    answer: 'Never. We use secure third-party integration partners (similar to those used by major payment apps) to connect to your bank. We only receive a "read-only" token that allows us to see balances and transactions. We cannot move money or change settings in your bank account.'
                },
                {
                    question: 'What if I don\'t want to link my bank account?',
                    answer: 'That is completely fine! You can use the Manual Entry feature to input your spending and balances yourself. You will still get the benefit of our AI analysis without linking a live feed.'
                }
            ]
        },
        {
            icon: Heart,
            iconColor: 'bg-red-500',
            title: 'Health & Wellness Features',
            questions: [
                {
                    question: 'What kind of health data can I track?',
                    answer: 'You can track a wide variety of metrics, including sleep, mood, diet, exercise, and specific symptoms. You can also integrate with popular wearables (like Apple Health or Google Fit) to import data automatically.'
                },
                {
                    question: 'How does the "Correlation Engine" work?',
                    answer: 'This is our unique feature. Our AI analyzes the timestamps of your financial transactions and your health logs. For example, it might notice that your spending on "Eating Out" increases 40% on days when you report "High Stress" or "Poor Sleep." This helps you identify triggers and break bad habits.'
                }
            ]
        },
        {
            icon: Settings,
            iconColor: 'bg-purple-600',
            title: 'Account & Support',
            questions: [
                {
                    question: 'How do I cancel my subscription?',
                    answer: 'You can cancel at any time directly through the "Account Settings" menu in the app. There are no long-term contracts or cancellation fees.'
                },
                {
                    question: 'I have a technical issue. How do I get help?',
                    answer: 'We are here for you. Please email our support team at support@aihelppros.com. We aim to respond to all inquiries within 24 hours.'
                },
                {
                    question: 'Who owns North Star Life Manager?',
                    answer: 'North Star Life Manager is developed and wholly owned by A.I. Help Pros LLP, a technology company dedicated to using Artificial Intelligence to solve real-world human problems.'
                }
            ]
        }
    ];

    const filteredSections = sections.map(section => ({
        ...section,
        questions: section.questions.filter(q =>
            q.question.toLowerCase().includes(globalSearch.toLowerCase()) ||
            q.answer.toLowerCase().includes(globalSearch.toLowerCase())
        )
    })).filter(section => section.questions.length > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#4A90E2]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] p-4 rounded-2xl">
                                <HelpCircle className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black mb-1">
                                Frequently Asked Questions
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">
                                Everything you need to know about North Star Life Manager
                            </p>
                        </div>
                    </div>

                    {/* Global Search */}
                    <div className="relative mt-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F1729]/40" />
                        <Input
                            placeholder="Search all FAQs..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="pl-12 h-14 text-lg border-[#4A90E2]/30 focus:border-[#4A90E2]"
                        />
                    </div>
                </div>

                {/* Security Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <div className="flex items-center gap-3 p-4 bg-white border border-green-200 rounded-xl">
                        <Lock className="w-6 h-6 text-green-600" />
                        <div>
                            <div className="font-medium text-black">AES-256 Encryption</div>
                            <div className="text-xs text-[#0F1729]/60">Bank-level security</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white border border-blue-200 rounded-xl">
                        <Shield className="w-6 h-6 text-[#4A90E2]" />
                        <div>
                            <div className="font-medium text-black">HIPAA Compliant</div>
                            <div className="text-xs text-[#0F1729]/60">Health data protected</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white border border-purple-200 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                        <div>
                            <div className="font-medium text-black">GDPR/CCPA Ready</div>
                            <div className="text-xs text-[#0F1729]/60">Your data, your rights</div>
                        </div>
                    </div>
                </div>

                {/* FAQ Sections */}
                <div className="space-y-6">
                    {filteredSections.map((section, idx) => (
                        <FAQSection
                            key={idx}
                            icon={section.icon}
                            iconColor={section.iconColor}
                            title={section.title}
                            questions={section.questions}
                        />
                    ))}
                </div>

                {/* Contact Support */}
                <Card className="mt-12 bg-gradient-to-r from-[#4A90E2]/10 to-[#7BB3E0]/10 border-[#4A90E2]">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#4A90E2] rounded-full flex items-center justify-center flex-shrink-0">
                                <HelpCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-light text-black mb-2">
                                    Still have questions?
                                </h3>
                                <p className="text-[#0F1729]/70 mb-4">
                                    Our support team is here to help. We respond to all inquiries within 24 hours.
                                </p>
                                <Button
                                    onClick={() => window.location.href = 'mailto:support@aihelppros.com'}
                                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Note */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-[#0F1729]/50">
                        Owned and operated by A.I. Help Pros LLP
                    </p>
                </div>
            </div>
        </div>
    );
}