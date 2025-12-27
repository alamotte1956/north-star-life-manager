import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Trophy, Target } from 'lucide-react';

export default function InteractiveQuiz({ topic, onClose }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const { data: quizData, isLoading } = useQuery({
        queryKey: ['quiz', topic],
        queryFn: async () => {
            const result = await base44.functions.invoke('generateFinancialQuiz', {
                topic,
                difficulty: 'intermediate'
            });
            return result.data;
        },
        enabled: !!topic
    });

    const handleAnswer = (answerIndex) => {
        setSelectedAnswer(answerIndex);
        setShowExplanation(true);
        
        const isCorrect = answerIndex === quizData.quiz.questions[currentQuestion].correct_answer_index;
        if (isCorrect) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestion < quizData.quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            setCompleted(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setScore(0);
        setCompleted(false);
    };

    if (!topic) return null;

    return (
        <Dialog open={!!topic} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        {quizData?.quiz?.quiz_title || `${topic} Quiz`}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-12 text-center">
                        <Target className="w-12 h-12 mx-auto mb-4 text-[#C5A059] animate-pulse" />
                        <p className="text-gray-500">Generating quiz...</p>
                    </div>
                ) : completed ? (
                    <div className="py-8 text-center space-y-6">
                        <Trophy className="w-16 h-16 mx-auto text-[#D4AF37]" />
                        <h2 className="text-3xl font-bold text-black">Quiz Complete!</h2>
                        <div className="text-center">
                            <p className="text-6xl font-bold text-[#C5A059] mb-2">
                                {score}/{quizData.quiz.questions.length}
                            </p>
                            <p className="text-black/70">
                                You got {((score / quizData.quiz.questions.length) * 100).toFixed(0)}% correct
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={handleRestart} className="bg-[#C5A059]">
                                Try Again
                            </Button>
                            <Button onClick={onClose} variant="outline">
                                Close
                            </Button>
                        </div>
                    </div>
                ) : quizData?.quiz?.questions ? (
                    <div className="space-y-6">
                        {/* Progress */}
                        <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Question {currentQuestion + 1} of {quizData.quiz.questions.length}</span>
                                <span>Score: {score}/{quizData.quiz.questions.length}</span>
                            </div>
                            <Progress value={((currentQuestion + 1) / quizData.quiz.questions.length) * 100} />
                        </div>

                        {/* Question */}
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <Badge className="bg-blue-100 text-blue-800">
                                        {quizData.quiz.questions[currentQuestion].difficulty}
                                    </Badge>
                                </div>
                                <h3 className="text-xl font-semibold text-black mb-4">
                                    {quizData.quiz.questions[currentQuestion].question}
                                </h3>
                            </CardContent>
                        </Card>

                        {/* Answer Options */}
                        <div className="space-y-3">
                            {quizData.quiz.questions[currentQuestion].options.map((option, idx) => {
                                const isSelected = selectedAnswer === idx;
                                const isCorrect = idx === quizData.quiz.questions[currentQuestion].correct_answer_index;
                                const showResult = showExplanation && isSelected;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !showExplanation && handleAnswer(idx)}
                                        disabled={showExplanation}
                                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                                            showResult && isCorrect
                                                ? 'border-green-500 bg-green-50'
                                                : showResult && !isCorrect
                                                ? 'border-red-500 bg-red-50'
                                                : isSelected
                                                ? 'border-[#C5A059] bg-[#C5A059]/10'
                                                : 'border-gray-200 hover:border-[#C5A059] hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{option}</span>
                                            {showExplanation && isSelected && (
                                                isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {showExplanation && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6">
                                    <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                                    <p className="text-blue-800">{quizData.quiz.questions[currentQuestion].explanation}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Next Button */}
                        {showExplanation && (
                            <Button onClick={handleNext} className="w-full bg-[#C5A059]">
                                {currentQuestion < quizData.quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </Button>
                        )}
                    </div>
                ) : (
                    <p className="text-red-600">Failed to load quiz</p>
                )}
            </DialogContent>
        </Dialog>
    );
}