import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Lightbulb, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const categoryLabels = {
    hvac: 'HVAC',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    landscaping: 'Landscaping',
    cleaning: 'Cleaning',
    security: 'Security',
    pool: 'Pool',
    seasonal: 'Seasonal',
    inspection: 'Inspection',
    other: 'Other'
};

const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200'
};

export default function AIMaintenanceSuggestions({ onTaskAdded }) {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [addingTasks, setAddingTasks] = useState({});

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('suggestMaintenanceTasks', {});
            setSuggestions(result.data);
            toast.success('AI maintenance suggestions generated!');
        } catch (error) {
            toast.error('Failed to generate suggestions');
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (suggestion) => {
        setAddingTasks(prev => ({ ...prev, [suggestion.title]: true }));
        try {
            await base44.entities.MaintenanceTask.create({
                title: suggestion.title,
                property_name: suggestion.property_name,
                category: suggestion.category,
                frequency: suggestion.frequency,
                next_due_date: suggestion.suggested_due_date,
                estimated_cost: suggestion.estimated_cost,
                provider_name: suggestion.suggested_provider,
                notes: `AI suggested: ${suggestion.rationale}`
            });
            toast.success(`Task "${suggestion.title}" added!`);
            onTaskAdded?.();
            // Remove from suggestions
            setSuggestions(prev => ({
                ...prev,
                suggestions: prev.suggestions.filter(s => s.title !== suggestion.title)
            }));
        } catch (error) {
            toast.error('Failed to add task');
        } finally {
            setAddingTasks(prev => ({ ...prev, [suggestion.title]: false }));
        }
    };

    if (!suggestions && !loading) {
        return (
            <Card className="border-2 border-[#C5A059]/30 bg-gradient-to-br from-white to-[#C5A059]/5">
                <CardContent className="pt-6 text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#C5A059] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-light text-[#0F172A] mb-2">AI Maintenance Scheduler</h3>
                    <p className="text-[#64748B] mb-6 max-w-md mx-auto">
                        Let AI analyze your properties, documents, and maintenance history to suggest proactive maintenance tasks.
                    </p>
                    <Button 
                        onClick={fetchSuggestions}
                        className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Maintenance Suggestions
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="border-2 border-[#C5A059]/30">
                <CardContent className="pt-6 text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-[#64748B]">Analyzing properties and generating suggestions...</p>
                </CardContent>
            </Card>
        );
    }

    if (!suggestions?.suggestions?.length) {
        return (
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-light text-[#0F172A] mb-2">All Caught Up!</h3>
                    <p className="text-[#64748B] mb-4">Your maintenance schedule looks comprehensive.</p>
                    <Button 
                        variant="outline"
                        onClick={fetchSuggestions}
                        className="gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Refresh Suggestions
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-[#C5A059]/30">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-light flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#C5A059]" />
                        AI Maintenance Suggestions
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {suggestions.suggestions.length} suggestions
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchSuggestions}
                            disabled={loading}
                        >
                            <Sparkles className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {suggestions.context_summary && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">Analysis Summary</span>
                        </div>
                        <p className="text-xs">
                            Analyzed {suggestions.context_summary.properties_analyzed} properties, 
                            {suggestions.context_summary.existing_tasks} existing tasks, and 
                            {suggestions.context_summary.documents_reviewed} documents
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    {suggestions.suggestions.map((suggestion, idx) => (
                        <div
                            key={idx}
                            className="p-4 border border-[#0F172A]/10 rounded-lg hover:border-[#C5A059]/30 transition-colors bg-white"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-[#0F172A]">{suggestion.title}</h4>
                                        {suggestion.priority && (
                                            <Badge className={priorityColors[suggestion.priority]}>
                                                {suggestion.priority}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-[#64748B] mb-2">
                                        <span>{suggestion.property_name}</span>
                                        <span>•</span>
                                        <span>{categoryLabels[suggestion.category]}</span>
                                        <span>•</span>
                                        <span>Due: {format(new Date(suggestion.suggested_due_date), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => addTask(suggestion)}
                                    disabled={addingTasks[suggestion.title]}
                                    className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white"
                                >
                                    {addingTasks[suggestion.title] ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Adding...
                                        </span>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add Task
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="p-3 bg-[#F8F7F4] rounded-lg">
                                <div className="flex items-start gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-[#C5A059] mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-[#0F172A]">{suggestion.rationale}</p>
                                </div>
                                {suggestion.estimated_cost && (
                                    <div className="text-xs text-[#64748B] mt-2">
                                        Estimated cost: ${suggestion.estimated_cost.toLocaleString()}
                                    </div>
                                )}
                                {suggestion.suggested_provider && (
                                    <div className="text-xs text-[#64748B]">
                                        Provider: {suggestion.suggested_provider}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}