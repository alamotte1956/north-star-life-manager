import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantFeedback({ assignment, onSubmitted }) {
    const [ratings, setRatings] = useState({
        overall: 0,
        quality: 0,
        timeliness: 0,
        professionalism: 0
    });
    const [comments, setComments] = useState('');
    const [resolved, setResolved] = useState(true);
    const [recommend, setRecommend] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const StarRating = ({ value, onChange, label }) => (
        <div className="space-y-1">
            <Label className="text-sm">{label}</Label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="touch-manipulation"
                    >
                        <Star
                            className={`w-8 h-8 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    const handleSubmit = async () => {
        if (ratings.overall === 0) {
            toast.error('Please provide an overall rating');
            return;
        }

        setSubmitting(true);
        try {
            const feedback = await base44.entities.MaintenanceFeedback.create({
                assignment_id: assignment.id,
                maintenance_task_id: assignment.maintenance_task_id,
                vendor_id: assignment.vendor_id,
                tenant_email: assignment.tenant_email || 'unknown',
                property_name: assignment.property_name,
                rating: ratings.overall,
                quality_rating: ratings.quality,
                timeliness_rating: ratings.timeliness,
                professionalism_rating: ratings.professionalism,
                comments,
                issue_resolved: resolved,
                would_recommend: recommend
            });

            // Trigger AI analysis
            await base44.functions.invoke('analyzeFeedback', {
                feedback_id: feedback.id
            });

            toast.success('Thank you for your feedback!');
            onSubmitted?.();
        } catch (error) {
            toast.error('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-light">Rate Your Service</CardTitle>
                <p className="text-sm text-gray-600">
                    Service by {assignment.vendor_name}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <StarRating
                    value={ratings.overall}
                    onChange={(v) => setRatings({...ratings, overall: v})}
                    label="Overall Experience"
                />
                <StarRating
                    value={ratings.quality}
                    onChange={(v) => setRatings({...ratings, quality: v})}
                    label="Work Quality"
                />
                <StarRating
                    value={ratings.timeliness}
                    onChange={(v) => setRatings({...ratings, timeliness: v})}
                    label="Timeliness"
                />
                <StarRating
                    value={ratings.professionalism}
                    onChange={(v) => setRatings({...ratings, professionalism: v})}
                    label="Professionalism"
                />

                <div>
                    <Label>Comments (optional)</Label>
                    <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Share your experience..."
                        rows={3}
                    />
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={resolved}
                            onChange={(e) => setResolved(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">Issue fully resolved</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={recommend}
                            onChange={(e) => setRecommend(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">Would recommend</span>
                    </label>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting || ratings.overall === 0}
                    className="w-full bg-[#C5A059] h-12 touch-manipulation"
                >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
            </CardContent>
        </Card>
    );
}