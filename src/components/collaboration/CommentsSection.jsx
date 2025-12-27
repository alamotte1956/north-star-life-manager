import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import AICollaborationInsights from './AICollaborationInsights';

export default function CommentsSection({ entityType, entityId }) {
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);

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

        const mentionedUsers = newComment.match(/@(\S+@\S+\.\S+)/g)?.map(m => m.slice(1)) || [];

        if (editingComment) {
            await base44.entities.Comment.update(editingComment.id, {
                comment_text: newComment,
                edited: true,
                edited_at: new Date().toISOString(),
                mentioned_users: mentionedUsers
            });
            setEditingComment(null);
        } else {
            await base44.entities.Comment.create({
                entity_type: entityType,
                entity_id: entityId,
                comment_text: newComment,
                parent_comment_id: replyingTo?.id,
                mentioned_users: mentionedUsers
            });

            // Notify mentioned users
            for (const userEmail of mentionedUsers) {
                await base44.entities.FamilyNotification.create({
                    user_email: userEmail,
                    title: 'Mentioned in Comment',
                    message: `You were mentioned in a comment on ${entityType}`,
                    type: 'mention',
                    priority: 'normal',
                    read: false,
                    linked_entity_type: entityType,
                    linked_entity_id: entityId
                });
            }
        }

        setNewComment('');
        setReplyingTo(null);
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

            {comments.length > 0 && (
                <AICollaborationInsights
                    entityType={entityType}
                    entityId={entityId}
                    insightType="discussion_summary"
                />
            )}

            {replyingTo && (
                <div className="p-2 bg-blue-50 rounded-lg text-sm flex items-center justify-between">
                    <span>Replying to {replyingTo.created_by}</span>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            )}

            {editingComment && (
                <div className="p-2 bg-amber-50 rounded-lg text-sm flex items-center justify-between">
                    <span>Editing comment...</span>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingComment(null); setNewComment(''); }}>
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Add a comment... (use @email to mention)"}
                    rows={2}
                    className="flex-1"
                />
                <Button type="submit" size="sm" className="self-end">
                    <Send className="w-4 h-4" />
                </Button>
            </form>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.filter(c => !c.parent_comment_id).map(comment => {
                    const replies = comments.filter(r => r.parent_comment_id === comment.id);
                    return (
                        <div key={comment.id}>
                            <Card className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="text-xs font-medium text-[#1A2B44]">
                                            {comment.created_by}
                                        </div>
                                        {comment.edited && (
                                            <span className="text-xs text-gray-400 italic">(edited)</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-gray-500">
                                            {format(new Date(comment.created_date), 'MMM d, h:mm a')}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReplyingTo(comment)}
                                            className="h-6 px-2 text-xs"
                                        >
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
                                {comment.mentioned_users?.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                        <Users className="w-3 h-3" />
                                        Mentioned: {comment.mentioned_users.join(', ')}
                                    </div>
                                )}
                            </Card>

                            {replies.length > 0 && (
                                <div className="ml-8 mt-2 space-y-2">
                                    {replies.map(reply => (
                                        <Card key={reply.id} className="p-2 bg-gray-50">
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="text-xs font-medium text-[#1A2B44]">
                                                    {reply.created_by}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {format(new Date(reply.created_date), 'MMM d, h:mm a')}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.comment_text}</p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}