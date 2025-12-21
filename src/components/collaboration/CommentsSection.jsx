import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function CommentsSection({ entityType, entityId }) {
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);

    const { data: comments = [], refetch } = useQuery({
        queryKey: ['comments', entityType, entityId],
        queryFn: () => base44.entities.Comment.filter(
            { entity_type: entityType, entity_id: entityId },
            '-created_date'
        ),
        enabled: showComments
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        await base44.entities.Comment.create({
            entity_type: entityType,
            entity_id: entityId,
            comment_text: newComment
        });

        setNewComment('');
        refetch();
    };

    if (!showComments) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(true)}
                className="gap-2"
            >
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
            </Button>
        );
    }

    return (
        <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Discussion ({comments.length})
                </h4>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(false)}
                >
                    Hide
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="flex-1"
                />
                <Button type="submit" size="sm" className="self-end">
                    <Send className="w-4 h-4" />
                </Button>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.map(comment => (
                    <Card key={comment.id} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-xs font-medium text-[#1A2B44]">
                                {comment.created_by}
                            </div>
                            <div className="text-xs text-gray-500">
                                {format(new Date(comment.created_date), 'MMM d, h:mm a')}
                            </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment_text}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}