import React, { useState, useRef, useEffect } from 'react';
import logger from '@/utils/logger';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Sparkles, TrendingUp, DollarSign, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const QUICK_QUESTIONS = [
    { icon: TrendingUp, text: "How is my portfolio performing?", color: "text-green-600" },
    { icon: DollarSign, text: "Should I rebalance my investments?", color: "text-blue-600" },
    { icon: Target, text: "Am I on track for my financial goals?", color: "text-purple-600" },
    { icon: Sparkles, text: "What are current market trends?", color: "text-yellow-600" }
];

export default function InvestmentAdvisorChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversation]);

    const sendMessage = async (text) => {
        const messageText = text || message;
        if (!messageText.trim() || loading) return;

        const userMessage = { role: 'user', content: messageText };
        setConversation(prev => [...prev, userMessage]);
        setMessage('');
        setLoading(true);

        try {
            const result = await base44.functions.invoke('investmentAdvisorChat', {
                message: messageText,
                conversation_history: conversation
            });

            if (result.data.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: result.data.response,
                    portfolio_referenced: result.data.portfolio_referenced
                };
                setConversation(prev => [...prev, assistantMessage]);
            } else {
                toast.error('Failed to get response');
            }
        } catch (error) {
            logger.error('Chat error:', error);
            toast.error('Failed to send message');
        }

        setLoading(false);
    };

    const handleQuickQuestion = (question) => {
        sendMessage(question);
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:shadow-[#C5A059]/50 transition-all hover:scale-110 z-50"
                aria-label="Investment Advisor"
            >
                <MessageCircle className="w-6 h-6" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col z-50 border-[#C5A059] bg-gradient-to-br from-black to-[#1a1a1a]">
            <CardHeader className="border-b border-[#C5A059] flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                    <CardTitle className="text-base text-[#C5A059]">Investment Advisor</CardTitle>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-[#B8935E] hover:text-[#C5A059]"
                >
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
                {conversation.length === 0 ? (
                    <div className="p-6 space-y-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C5A059] to-[#D4AF37] flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="w-8 h-8 text-black" />
                            </div>
                            <h3 className="font-semibold text-[#C5A059] mb-2">Your Personal Investment Advisor</h3>
                            <p className="text-sm text-[#B8935E]">
                                Ask me anything about your portfolio, market trends, or investment strategies
                            </p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-[#B8935E] mb-2">Quick questions:</p>
                            {QUICK_QUESTIONS.map((q, idx) => {
                                const Icon = q.icon;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickQuestion(q.text)}
                                        className="w-full text-left p-3 rounded-lg border border-[#C5A059]/30 hover:border-[#C5A059] hover:bg-[#C5A059]/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${q.color}`} />
                                            <span className="text-sm text-[#B8935E] group-hover:text-[#C5A059]">{q.text}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {conversation.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-black'
                                                : 'bg-[#0a0a0a] border border-[#C5A059]/30 text-[#B8935E]'
                                        }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown
                                                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0 text-[#B8935E]">{children}</p>,
                                                    strong: ({ children }) => <strong className="text-[#C5A059]">{children}</strong>,
                                                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2 text-[#B8935E]">{children}</ul>,
                                                    li: ({ children }) => <li className="mb-1 text-[#B8935E]">{children}</li>,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <p className="text-sm">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#0a0a0a] border border-[#C5A059]/30 rounded-lg p-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-[#C5A059] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}

                <div className="border-t border-[#C5A059]/30 p-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }} className="flex gap-2">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask about your investments..."
                            disabled={loading}
                            className="flex-1 bg-[#0a0a0a] border-[#C5A059]/30 text-[#B8935E] placeholder:text-[#B8935E]/50"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37]"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
