import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Brain, Target, Sparkles, Clock, Play, FileText, Video, CheckCircle } from 'lucide-react';
import ConceptExplainer from '../components/literacy/ConceptExplainer';
import InteractiveQuiz from '../components/literacy/InteractiveQuiz';

export default function FinancialLiteracy() {
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [quizTopic, setQuizTopic] = useState(null);

    const { data: content, isLoading } = useQuery({
        queryKey: ['literacyContent'],
        queryFn: async () => {
            const result = await base44.functions.invoke('getPersonalizedLiteracyContent', {});
            return result.data;
        }
    });

    const getIconForType = (type) => {
        switch (type) {
            case 'article': return FileText;
            case 'video': return Video;
            case 'guide': return BookOpen;
            case 'tutorial': return Play;
            default: return FileText;
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-blue-100 text-blue-800';
            case 'advanced': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] flex items-center justify-center">
                <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 text-[#C5A059] animate-pulse" />
                    <p className="text-black/70">Personalizing your learning path...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-black to-[#1a1a1a] p-4 rounded-2xl">
                                <BookOpen className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-black">Financial Literacy Hub</h1>
                            <p className="text-black/70 font-light">Personalized learning for your financial journey</p>
                        </div>
                    </div>
                    
                    {content?.content?.personalized_message && (
                        <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-[#D4AF37]">
                            <CardContent className="pt-6">
                                <p className="text-black/80 leading-relaxed">{content.content.personalized_message}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Tabs defaultValue="learn" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="learn">Learn</TabsTrigger>
                        <TabsTrigger value="concepts">Concepts</TabsTrigger>
                        <TabsTrigger value="quiz">Practice</TabsTrigger>
                        <TabsTrigger value="tips">Tips</TabsTrigger>
                    </TabsList>

                    {/* Learn Tab */}
                    <TabsContent value="learn" className="space-y-6">
                        {/* Recommended Topics */}
                        <div>
                            <h2 className="text-2xl font-light text-black mb-4">Recommended for You</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {content?.content?.recommended_topics?.map((topic, idx) => (
                                    <Card key={idx} className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setSelectedConcept(topic.title)}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <CardTitle className="text-lg">{topic.title}</CardTitle>
                                                <Badge className={
                                                    topic.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    topic.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }>
                                                    {topic.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-black/70">{topic.description}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 text-sm text-black/60">
                                                <Clock className="w-4 h-4" />
                                                {topic.estimated_time}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Educational Content */}
                        <div>
                            <h2 className="text-2xl font-light text-black mb-4">Learning Resources</h2>
                            <div className="space-y-4">
                                {content?.content?.educational_content?.map((item, idx) => {
                                    const Icon = getIconForType(item.type);
                                    return (
                                        <Card key={idx} className="hover:shadow-lg transition-shadow">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#C5A059] to-[#D4AF37] flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-6 h-6 text-black" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="font-semibold text-lg text-black">{item.title}</h3>
                                                            <div className="flex gap-2">
                                                                <Badge className={getDifficultyColor(item.difficulty)}>
                                                                    {item.difficulty}
                                                                </Badge>
                                                                <Badge variant="outline">{item.type}</Badge>
                                                            </div>
                                                        </div>
                                                        <p className="text-black/70 mb-3">{item.description}</p>
                                                        {item.key_takeaways && (
                                                            <div className="space-y-1 mb-3">
                                                                <p className="text-sm font-medium text-black/80">Key Takeaways:</p>
                                                                <ul className="space-y-1">
                                                                    {item.key_takeaways.map((takeaway, i) => (
                                                                        <li key={i} className="text-sm text-black/60 flex items-start gap-2">
                                                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                            {takeaway}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3 text-sm text-black/60">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {item.estimated_time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Concepts Tab */}
                    <TabsContent value="concepts" className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-light text-black mb-4">Key Concepts to Master</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {content?.content?.key_concepts?.map((concept, idx) => (
                                    <Card key={idx} className="hover:shadow-xl transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>{concept.concept}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedConcept(concept.concept)}
                                                >
                                                    <Brain className="w-4 h-4 mr-2" />
                                                    Learn More
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-black/80 mb-1">Why It Matters:</p>
                                                <p className="text-black/70">{concept.why_important}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-black/80 mb-1">Simple Explanation:</p>
                                                <p className="text-black/70">{concept.simplified_explanation}</p>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900 mb-1">Real-World Example:</p>
                                                <p className="text-sm text-blue-800">{concept.real_world_example}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Quiz Tab */}
                    <TabsContent value="quiz" className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-light text-black mb-4">Test Your Knowledge</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {['Investing Basics', 'Budgeting', 'Retirement Planning', 'Tax Strategies', 'Debt Management', 'Risk Management'].map((topic) => (
                                    <Button
                                        key={topic}
                                        variant="outline"
                                        className="h-auto p-4 text-left flex-col items-start"
                                        onClick={() => setQuizTopic(topic)}
                                    >
                                        <Target className="w-5 h-5 mb-2 text-[#C5A059]" />
                                        <span className="font-semibold">{topic} Quiz</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tips Tab */}
                    <TabsContent value="tips" className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-light text-black mb-4">Actionable Tips</h2>
                            <div className="space-y-4">
                                {content?.content?.actionable_tips?.map((tip, idx) => (
                                    <Card key={idx} className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-black mb-2">{tip.tip}</p>
                                                    <p className="text-sm text-black/70 mb-2">{tip.impact}</p>
                                                    <Badge className={
                                                        tip.ease === 'easy' ? 'bg-green-100 text-green-800' :
                                                        tip.ease === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-orange-100 text-orange-800'
                                                    }>
                                                        {tip.ease} to implement
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Concept Explainer Dialog */}
                <ConceptExplainer
                    concept={selectedConcept}
                    onClose={() => setSelectedConcept(null)}
                />

                {/* Interactive Quiz Dialog */}
                <InteractiveQuiz
                    topic={quizTopic}
                    onClose={() => setQuizTopic(null)}
                />
            </div>
        </div>
    );
}