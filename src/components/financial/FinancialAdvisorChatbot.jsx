import React, { useState, useEffect, useRef } from 'react';
import logger from '@/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, Loader2, TrendingUp, DollarSign, Shield, PiggyBank } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FinancialAdvisorChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch all relevant financial data
    const { data: investments = [] } = useQuery({
        queryKey: ['investments'],
        queryFn: () => base44.entities.Investment.list(),
        enabled: isOpen
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => base44.entities.Transaction.list('-date', 90),
        enabled: isOpen
    });

    const { data: budgets = [] } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => base44.entities.Budget.list(),
        enabled: isOpen
    });

    const { data: insuranceQuotes = [] } = useQuery({
        queryKey: ['insurance-quotes'],
        queryFn: () => base44.entities.InsuranceQuote.list(),
        enabled: isOpen
    });

    const { data: bankAccounts = [] } = useQuery({
        queryKey: ['bank-accounts'],
        queryFn: () => base44.entities.BankAccount.list(),
        enabled: isOpen
    });

    const { data: financialGoals = [] } = useQuery({
        queryKey: ['financial-goals'],
        queryFn: () => base44.entities.FinancialGoal.list(),
        enabled: isOpen
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const suggestedQuestions = [
        "How is my investment portfolio performing?",
        "Am I on track to meet my financial goals?",
        "What's my current budget status?",
        "Should I rebalance my portfolio?",
        "Which insurance plan is best for me?",
        "How can I improve my financial health?"
    ];

    const handleSendMessage = async (messageText = input) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare financial context
            const totalInvestments = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
            const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
            
            const monthlyIncome = transactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0) / 3;
            
            const monthlyExpenses = transactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3;

            const portfolioByType = investments.reduce((acc, inv) => {
                acc[inv.investment_type] = (acc[inv.investment_type] || 0) + (inv.current_value || 0);
                return acc;
            }, {});

            const activeGoals = financialGoals.filter(g => g.status === 'active');
            const goalsOnTrack = activeGoals.filter(g => g.progress >= 75).length;

            const context = `
You are a professional financial advisor with access to the user's complete financial profile. Answer their question with specific, actionable advice based on their data.

FINANCIAL PROFILE:
- Total Investments: $${totalInvestments.toFixed(0)}
- Total Cash (Bank Accounts): $${totalBankBalance.toFixed(0)}
- Net Worth: $${(totalInvestments + totalBankBalance).toFixed(0)}
- Monthly Income: $${monthlyIncome.toFixed(0)}
- Monthly Expenses: $${monthlyExpenses.toFixed(0)}
- Monthly Savings: $${(monthlyIncome - monthlyExpenses).toFixed(0)}
- Savings Rate: ${((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1)}%

INVESTMENT PORTFOLIO:
${Object.entries(portfolioByType).map(([type, value]) => 
    `- ${type}: $${value.toFixed(0)} (${(value / totalInvestments * 100).toFixed(1)}%)`
).join('\n')}

FINANCIAL GOALS:
- Total Active Goals: ${activeGoals.length}
- Goals On Track: ${goalsOnTrack}
${activeGoals.slice(0, 5).map(g => 
    `- ${g.name}: $${g.current_amount}/$${g.target_amount} (${g.progress}% complete)`
).join('\n')}

INSURANCE:
${insuranceQuotes.slice(0, 3).map(q => 
    `- ${q.insurance_type}: ${q.provider} - $${q.monthly_premium}/mo (Score: ${q.ai_recommendation_score}/10)`
).join('\n')}

RECENT SPENDING PATTERNS (last 90 days):
${transactions.slice(0, 10).map(t => 
    `- ${t.description || t.merchant}: $${Math.abs(t.amount).toFixed(2)} (${t.category})`
).join('\n')}

USER QUESTION: ${messageText}

Provide a helpful, specific answer referencing their actual data. Be concise but thorough. Include actionable recommendations.`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: context
            });

            const assistantMessage = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            logger.error('Financial advisor error:', error);
            const errorMessage = { 
                role: 'assistant', 
                content: 'I apologize, but I encountered an error. Please try again or rephrase your question.' 
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setIsLoading(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center group z-50"
                aria-label="Open Financial Advisor"
            >
                <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </button>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Financial Advisor</span>
                    <Badge className="bg-white/20 text-white">{messages.length}</Badge>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[450px] h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-[#4A90E2]/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-medium">Financial Advisor</h3>
                        <p className="text-xs text-white/80">AI-Powered Assistant</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setMessages([]);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2E5C8A] to-[#4A90E2] rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Your Financial Advisor
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Ask me anything about your finances, investments, budget, or insurance
                        </p>
                        
                        <div className="space-y-2 text-left">
                            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                            {suggestedQuestions.map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(question)}
                                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message, idx) => (
                    <div
                        key={idx}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                message.role === 'user'
                                    ? 'bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            {message.role === 'assistant' ? (
                                <ReactMarkdown
                                    className="text-sm prose prose-sm max-w-none"
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-sm">{message.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-[#4A90E2]" />
                                <span className="text-sm text-gray-600">Analyzing your finances...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your finances..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    AI-powered advice based on your actual financial data
                </p>
            </div>
        </div>
    );
}