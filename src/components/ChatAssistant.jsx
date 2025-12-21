import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const unsubscribeRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const initConversation = async () => {
            if (isOpen && !conversation) {
                try {
                    const conv = await base44.agents.createConversation({
                        agent_name: 'lifeAssistant',
                        metadata: {
                            name: 'Life Assistant Chat',
                            description: 'AI assistant conversation'
                        }
                    });
                    setConversation(conv);
                    setMessages(conv.messages || []);
                } catch (error) {
                    console.error('Failed to create conversation:', error);
                }
            }
        };

        initConversation();
    }, [isOpen]);

    useEffect(() => {
        if (conversation?.id) {
            unsubscribeRef.current = base44.agents.subscribeToConversation(conversation.id, (data) => {
                setMessages(data.messages || []);
                setIsLoading(false);
            });

            return () => {
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                }
            };
        }
    }, [conversation?.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !conversation || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);

        try {
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: userMessage
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            setIsLoading(false);
        }
    };

    const suggestionPrompts = [
        "What's my total monthly spending on subscriptions?",
        "When is my next maintenance task due?",
        "Add a reminder for my birthday on March 15th",
        "Show me all my properties"
    ];

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] text-black p-4 rounded-full shadow-2xl hover:shadow-[#D4AF37]/50 transition-all hover:scale-110 touch-manipulation"
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#D4AF37]/20">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-black to-[#1a1a1a] text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] rounded-full flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h3 className="font-light text-black">Life Assistant</h3>
                                <p className="text-xs text-black/70">Ask me anything</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#F8F7F4] to-white">
                        {messages.length === 0 && (
                            <div className="space-y-4">
                                <div className="text-center text-[#1A2B44]/60 text-sm py-8">
                                    👋 Hi! I'm your Life Assistant. I can help you manage your data, answer questions, and add records.
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs text-[#1A2B44]/50 font-light px-1">Try asking:</p>
                                    {suggestionPrompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInputValue(prompt)}
                                            className="w-full text-left text-sm p-3 bg-white hover:bg-[#D4AF37]/5 rounded-lg border border-[#D4AF37]/20 transition-colors"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-r from-black to-[#1a1a1a] text-white'
                                            : 'bg-white border border-[#D4AF37]/20 text-[#1A2B44]'
                                    }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="text-sm">{msg.content}</p>
                                    ) : (
                                        <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                    
                                    {msg.tool_calls?.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-[#D4AF37]/20 space-y-1">
                                            {msg.tool_calls.map((tool, tidx) => (
                                                <div key={tidx} className="text-xs text-[#D4AF37] flex items-center gap-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {tool.name.split('.').pop()}...
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-[#D4AF37]/20 rounded-2xl px-4 py-3">
                                    <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-[#D4AF37]/20 bg-white">
                        <div className="flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask me anything..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black hover:shadow-lg"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}