import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Video, Heart, Calendar, Lock, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function LegacyMessages() {
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        recipient_name: '',
        recipient_email: '',
        message_type: 'legacy',
        title: '',
        delivery_condition: 'manual_trigger',
        scheduled_delivery_date: '',
        notes: ''
    });
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    const { data: messages = [] } = useQuery({
        queryKey: ['video-messages'],
        queryFn: () => base44.entities.VideoMessage.list('-created_date')
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.VideoMessage.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['video-messages'] });
            setShowCreate(false);
            toast.success('Legacy message created');
        }
    });

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data } = await base44.functions.invoke('uploadVideo', { file });
            setFormData({ ...formData, video_url: data.file_url });
            toast.success('Video uploaded');
        } catch (error) {
            toast.error('Upload failed');
        }
        setUploading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Legacy Video Messages</h1>
                            <p className="text-[#1A2B44]/60">Record heartfelt messages for loved ones</p>
                        </div>
                        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                            <Video className="w-5 h-5 mr-2" />
                            Record Message
                        </Button>
                    </div>
                </div>

                {/* Info Card */}
                <Card className="mb-8 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <Heart className="w-8 h-8 text-purple-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-purple-900 mb-2">Create Lasting Memories</h3>
                                <p className="text-sm text-purple-800 mb-3">
                                    Record video messages for special occasions, future milestones, or as part of your estate plan. 
                                    Messages can be time-locked and delivered automatically when conditions are met.
                                </p>
                                <ul className="space-y-1 text-sm text-purple-700">
                                    <li>• Birthday and graduation messages</li>
                                    <li>• Legacy instructions and final wishes</li>
                                    <li>• Digital asset handoff (social media, crypto)</li>
                                    <li>• Encrypted and secure storage</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Messages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {messages.map((msg) => (
                        <Card key={msg.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{msg.title}</CardTitle>
                                        <p className="text-sm text-[#1A2B44]/60">For: {msg.recipient_name}</p>
                                    </div>
                                    <Badge className={
                                        msg.delivered ? 'bg-green-100 text-green-700' :
                                        msg.delivery_condition === 'on_date' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }>
                                        {msg.delivered ? 'Delivered' : 
                                         msg.delivery_condition === 'on_date' ? 'Scheduled' :
                                         msg.delivery_condition === 'on_death' ? 'Time-Locked' : 'Draft'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                        <Video className="w-4 h-4" />
                                        Type: {msg.message_type}
                                    </div>

                                    {msg.scheduled_delivery_date && (
                                        <div className="flex items-center gap-2 text-sm text-[#1A2B44]/60">
                                            <Calendar className="w-4 h-4" />
                                            Scheduled: {new Date(msg.scheduled_delivery_date).toLocaleDateString()}
                                        </div>
                                    )}

                                    {msg.delivery_condition === 'on_death' && (
                                        <div className="flex items-center gap-2 text-sm text-amber-700">
                                            <Lock className="w-4 h-4" />
                                            Time-locked until estate trigger
                                        </div>
                                    )}

                                    {msg.notes && (
                                        <p className="text-sm text-[#1A2B44]/70">{msg.notes}</p>
                                    )}

                                    <div className="flex gap-2">
                                        {msg.video_url && (
                                            <Button size="sm" variant="outline" className="flex-1">
                                                <Video className="w-4 h-4 mr-2" />
                                                Preview
                                            </Button>
                                        )}
                                        {!msg.delivered && msg.delivery_condition === 'manual_trigger' && (
                                            <Button size="sm" className="flex-1 bg-[#D4AF37] hover:bg-[#C5A059] text-black">
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Create Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Legacy Message</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Recipient Name</Label>
                                    <Input
                                        value={formData.recipient_name}
                                        onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                                        placeholder="e.g., Sarah Johnson"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Recipient Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.recipient_email}
                                        onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                                        placeholder="sarah@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Message Type</Label>
                                <Select
                                    value={formData.message_type}
                                    onValueChange={(value) => setFormData({ ...formData, message_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="legacy">Legacy / Final Wishes</SelectItem>
                                        <SelectItem value="birthday">Birthday Message</SelectItem>
                                        <SelectItem value="graduation">Graduation Message</SelectItem>
                                        <SelectItem value="wedding">Wedding Message</SelectItem>
                                        <SelectItem value="emergency">Emergency Instructions</SelectItem>
                                        <SelectItem value="general">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Message Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., My message for you"
                                    required
                                />
                            </div>

                            <div>
                                <Label>Video Upload</Label>
                                <div className="border-2 border-dashed border-[#D4AF37]/30 rounded-lg p-8 text-center">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-[#D4AF37]" />
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                        id="video-upload"
                                    />
                                    <label htmlFor="video-upload">
                                        <Button type="button" variant="outline" disabled={uploading} asChild>
                                            <span>
                                                {uploading ? 'Uploading...' : 'Choose Video File'}
                                            </span>
                                        </Button>
                                    </label>
                                    {formData.video_url && (
                                        <p className="text-sm text-green-600 mt-2">✓ Video uploaded</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label>Delivery Condition</Label>
                                <Select
                                    value={formData.delivery_condition}
                                    onValueChange={(value) => setFormData({ ...formData, delivery_condition: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual_trigger">Manual - I'll send it myself</SelectItem>
                                        <SelectItem value="on_date">Scheduled - Deliver on specific date</SelectItem>
                                        <SelectItem value="on_death">Time-Locked - Deliver after I pass</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.delivery_condition === 'on_date' && (
                                <div>
                                    <Label>Delivery Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.scheduled_delivery_date}
                                        onChange={(e) => setFormData({ ...formData, scheduled_delivery_date: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional context or instructions..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                    Create Message
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}