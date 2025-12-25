import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Plus, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalMemorial() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        loved_one_name: '',
        relationship: '',
        birth_date: '',
        passing_date: '',
        biography: '',
        favorite_memories: '',
        photo_urls: [],
        tribute_message: ''
    });

    const queryClient = useQueryClient();

    const { data: memorials = [] } = useQuery({
        queryKey: ['memorials'],
        queryFn: () => base44.entities.Contact.filter({ category: 'memorial' })
    });

    const { data: legacyMessages = [] } = useQuery({
        queryKey: ['legacyMessages'],
        queryFn: () => base44.entities.VideoMessage.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Contact.create({
            ...data,
            category: 'memorial',
            name: data.loved_one_name
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['memorials']);
            setDialogOpen(false);
            resetForm();
            toast.success('Memorial created');
        }
    });

    const resetForm = () => {
        setFormData({
            loved_one_name: '',
            relationship: '',
            birth_date: '',
            passing_date: '',
            biography: '',
            favorite_memories: '',
            photo_urls: [],
            tribute_message: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/b516d228e_Gemini_Generated_Image_tp0qgztp0qgztp0q.png" 
                            alt="North Star Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div>
                            <h1 className="text-4xl font-light text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Digital Memorial
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Honor and remember loved ones</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Memorial
                    </Button>
                </div>

                {/* Memorial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {memorials.map((memorial) => (
                        <Card key={memorial.id} className="border-[#4A90E2]/20 bg-gradient-to-br from-white to-purple-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="w-6 h-6 text-[#4A90E2]" />
                                    {memorial.loved_one_name}
                                </CardTitle>
                                {memorial.birth_date && memorial.passing_date && (
                                    <p className="text-sm text-[#0F1729]/60">
                                        {new Date(memorial.birth_date).getFullYear()} - {new Date(memorial.passing_date).getFullYear()}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {memorial.relationship && (
                                    <p className="text-sm text-[#0F1729]/70">
                                        <strong>Relationship:</strong> {memorial.relationship}
                                    </p>
                                )}

                                {memorial.biography && (
                                    <div className="bg-white/50 p-4 rounded-lg">
                                        <h4 className="text-sm font-medium text-black mb-2">Life Story</h4>
                                        <p className="text-sm text-[#0F1729]/80 line-clamp-4">{memorial.biography}</p>
                                    </div>
                                )}

                                {memorial.tribute_message && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="text-sm font-medium text-blue-900 mb-2">Tribute</h4>
                                        <p className="text-sm text-blue-800 italic">{memorial.tribute_message}</p>
                                    </div>
                                )}

                                {memorial.photo_urls?.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-[#4A90E2]">
                                        <ImageIcon className="w-4 h-4" />
                                        {memorial.photo_urls.length} photo{memorial.photo_urls.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {memorials.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No memorials created yet</p>
                            <p className="text-sm text-[#0F1729]/40">Create lasting tributes to honor loved ones</p>
                        </CardContent>
                    </Card>
                )}

                {/* Add Memorial Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Digital Memorial</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Name</Label>
                                <Input
                                    value={formData.loved_one_name}
                                    onChange={(e) => setFormData({ ...formData, loved_one_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Relationship</Label>
                                <Input
                                    value={formData.relationship}
                                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                    placeholder="Father, Mother, Spouse, etc."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Birth Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Passing Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.passing_date}
                                        onChange={(e) => setFormData({ ...formData, passing_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Biography / Life Story</Label>
                                <Textarea
                                    value={formData.biography}
                                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                                    placeholder="Share their story, accomplishments, and what made them special..."
                                    rows="6"
                                />
                            </div>

                            <div>
                                <Label>Favorite Memories</Label>
                                <Textarea
                                    value={formData.favorite_memories}
                                    onChange={(e) => setFormData({ ...formData, favorite_memories: e.target.value })}
                                    placeholder="Share cherished moments and memories..."
                                    rows="4"
                                />
                            </div>

                            <div>
                                <Label>Tribute Message</Label>
                                <Textarea
                                    value={formData.tribute_message}
                                    onChange={(e) => setFormData({ ...formData, tribute_message: e.target.value })}
                                    placeholder="Your personal message of love and remembrance..."
                                    rows="4"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Create Memorial
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}