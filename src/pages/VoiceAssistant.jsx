import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Speaker, CheckCircle } from 'lucide-react';

export default function VoiceAssistant() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Voice Assistant Integration</h1>
                    <p className="text-[#1A2B44]/60">Control North Star with Alexa and Google Home</p>
                </div>

                {/* Alexa Integration */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Speaker className="w-6 h-6 text-white" />
                                </div>
                                Amazon Alexa
                            </CardTitle>
                            <Badge className="bg-blue-100 text-blue-700">Coming Soon</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-medium text-[#1A2B44] mb-3">Alexa Voice Commands</h3>
                        <div className="space-y-2 text-sm text-[#1A2B44]/70">
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>"Alexa, ask North Star when is my next maintenance due?"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>"Alexa, ask North Star for my property value summary"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>"Alexa, ask North Star to add a reminder"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>"Alexa, ask North Star what bills are due this week"</span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                            <ol className="space-y-1 text-sm text-blue-800">
                                <li>1. Open the Alexa app on your phone</li>
                                <li>2. Go to Skills & Games</li>
                                <li>3. Search for "North Star Life Manager"</li>
                                <li>4. Enable the skill and link your account</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>

                {/* Google Home Integration */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                    <Speaker className="w-6 h-6 text-white" />
                                </div>
                                Google Home
                            </CardTitle>
                            <Badge className="bg-green-100 text-green-700">Coming Soon</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-medium text-[#1A2B44] mb-3">Google Assistant Commands</h3>
                        <div className="space-y-2 text-sm text-[#1A2B44]/70">
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>"Hey Google, ask North Star about my upcoming appointments"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>"Hey Google, ask North Star for my financial health score"</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mic className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>"Hey Google, ask North Star to check my investment performance"</span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Setup Instructions</h4>
                            <ol className="space-y-1 text-sm text-green-800">
                                <li>1. Open the Google Home app</li>
                                <li>2. Tap Settings → Services</li>
                                <li>3. Search for "North Star"</li>
                                <li>4. Link your account</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>

                {/* Capabilities */}
                <Card className="bg-purple-50 border-purple-200">
                    <CardHeader>
                        <CardTitle>Voice Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                'Check upcoming maintenance tasks',
                                'Review bill payment schedule',
                                'Get investment portfolio summary',
                                'Ask for document expiry alerts',
                                'Check property rent collection status',
                                'Add calendar reminders',
                                'Get financial health insights',
                                'Review budget status'
                            ].map((capability, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-purple-800">
                                    <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                    {capability}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}