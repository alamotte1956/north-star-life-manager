import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, addWeeks } from 'date-fns';

export default function TaskSuggestions({ onTaskAdded }) {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(new Set());

    const getSuggestions = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('getTaskSuggestions', {});
            setSuggestions(result.data.suggestions);
            toast.success('AI task suggestions generated!');
        } catch (error) {
            toast.error('Failed to get suggestions');
        } finally {
            setLoading(false);
        }
    };

    const parseSuggestedDate = (suggestedDate) => {
        const now = new Date();
        const lower = suggestedDate.toLowerCase();
        
        if (lower.includes('tomorrow')) return format(addDays(now, 1), 'yyyy-MM-dd');
        if (lower.includes('next week')) return format(addWeeks(now, 1), 'yyyy-MM-dd');
        if (lower.includes('in 2 weeks')) return format(addWeeks(now, 2), 'yyyy-MM-dd');
        if (lower.includes('in 7 days')) return format(addDays(now, 7), 'yyyy-MM-dd');
        if (lower.includes('in 14 days')) return format(addDays(now, 14), 'yyyy-MM-dd');
        if (lower.includes('in 30 days')) return format(addDays(now, 30), 'yyyy-MM-dd');
        
        // Try to extract number of days
        const daysMatch = lower.match(/in (\d+) days?/);
        if (daysMatch) return format(addDays(now, parseInt(daysMatch[1])), 'yyyy-MM-dd');
        
        return format(addDays(now, 7), 'yyyy-MM-dd');
    };

    const addTask = async (suggestion) => {
        setAdding(prev => new Set([...prev, suggestion.title]));
        try {
            const event = await base44.entities.CalendarEvent.create({
                title: suggestion.title,
                description: suggestion.reason,
                event_type: 'task',
                category: suggestion.category,
                due_date: parseSuggestedDate(suggestion.suggested_date),
                priority: suggestion.priority,
                linked_entity_name: suggestion.related_entity,
                linked_entity_type: suggestion.related_entity_type,
                status: 'pending',
                all_day: true
            });
            
            toast.success('Task added to calendar!');
            setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
            onTaskAdded?.(event);
        } catch (error) {
            toast.error('Failed to add task');
        } finally {
            setAdding(prev => {
                const next = new Set(prev);
                next.delete(suggestion.title);
                return next;
            });
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'bg-red-100 text-red-700 border-red-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-blue-100 text-blue-700 border-blue-200'
        };
        return colors[priority] || colors.medium;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            maintenance: '🔧',
            financial: '💰',
            administrative: '📋',
            seasonal: '🍂',
            legal: '⚖️',
            other: '📌'
        };
        return icons[category] || icons.other;
    };

    if (!suggestions) {
        return (
            <Card className="border-[#C5A059]/20">
                <CardContent className="pt-6 text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#C5A059] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-light text-[#0F172A] mb-2">AI Task Suggestions</h3>
                    <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
                        Get personalized task recommendations based on your properties, bills, and upcoming events
                    </p>
                    <Button
                        onClick={getSuggestions}
                        disabled={loading}
                        className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Get AI Suggestions
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-[#C5A059]/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#C5A059]" />
                        AI Task Suggestions
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={getSuggestions}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {suggestions.length === 0 ? (
                    <div className="text-center py-8 text-[#64748B]">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No new suggestions at this time</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {suggestions.map((suggestion, idx) => (
                            <div key={idx} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#0F172A]/10">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                                            <h4 className="font-medium text-[#0F172A]">{suggestion.title}</h4>
                                        </div>
                                        <p className="text-sm text-[#64748B] mb-3">{suggestion.reason}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={getPriorityColor(suggestion.priority)}>
                                                {suggestion.priority}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {suggestion.suggested_date}
                                            </Badge>
                                            {suggestion.related_entity && (
                                                <Badge variant="outline" className="text-xs">
                                                    {suggestion.related_entity}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => addTask(suggestion)}
                                        disabled={adding.has(suggestion.title)}
                                        className="bg-[#C5A059] text-white hover:bg-[#D4AF37]"
                                    >
                                        {adding.has(suggestion.title) ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}