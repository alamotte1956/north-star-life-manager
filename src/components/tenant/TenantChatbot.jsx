import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TenantChatbot({ property }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi! I'm your property assistant. I can help answer questions about your lease, maintenance requests, rent payments, and more. How can I help you today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await base44.functions.invoke('tenantChatbot', {
                property_id: property.id,
                question: input,
                conversation_history: messages.slice(-5)
            });

            const botMessage = {
                role: 'assistant',
                content: result.data.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            toast.error('Failed to get response');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble responding right now. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        "When is my rent due?",
        "How do I submit a maintenance request?",
        "What's included in my lease?",
        "Who do I contact for emergencies?"
    ];

    return (
        <Card className="border-2 border-[#C5A059]/30">
            <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#C5A059]" />
                    AI Property Assistant
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto mb-4 space-y-3">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                    msg.role === 'user'
                                        ? 'bg-[#C5A059] text-white'
                                        : 'bg-white border border-gray-200 text-[#1A2B44]'
                                }`}
                            >
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                <div className={`text-xs mt-1 ${
                                    msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                                }`}>
                                    {format(msg.timestamp, 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Questions */}
                {messages.length <= 2 && (
                    <div className="mb-4">
                        <div className="text-xs text-gray-600 mb-2">Quick questions:</div>
                        <div className="grid grid-cols-2 gap-2">
                            {quickQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(q)}
                                    className="text-xs p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left touch-manipulation"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-1"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-[#C5A059] h-11 px-4 touch-manipulation"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}