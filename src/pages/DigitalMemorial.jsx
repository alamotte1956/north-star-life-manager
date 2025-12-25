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
        honoree_name: '',
        life_dates: '',
        tribute_text: '',
        favorite_quote: '',
        legacy_statement: '',
        photo_urls: [],
        document_ids: []
    });

    const queryClient = useQueryClient();

    // Using Contact entity with special memorial flag
    const { data: memorials = [] } = useQuery({
        queryKey: ['memorials'],
        queryFn: async () => {
            const contacts = await base44.entities.Contact.list();
            return contacts.filter(c => c.notes?.includes('[MEMORIAL]'));
        }
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list()
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Contact.create({
            name: data.honoree_name,
            category: 'family',
            relationship: 'memorial',
            notes: `[MEMORIAL]\n\nLife: ${data.life_dates}\n\n${data.tribute_text}\n\nFavorite Quote: "${data.favorite_quote}"\n\nLegacy: ${data.legacy_statement}`,
            email: `memorial-${Date.now()}@family.local`
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
            honoree_name: '',
            life_dates: '',
            tribute_text: '',
            favorite_quote: '',
            legacy_statement: '',
            photo_urls: [],
            document_ids: []
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const parseMemorial = (notes) => {
        const lines = notes.split('\n');
        return {
            life_dates: lines.find(l => l.startsWith('Life:'))?.replace('Life:', '').trim(),
            tribute: lines.slice(3).join('\n').split('Favorite Quote:')[0].trim(),
            quote: lines.find(l => l.includes('Favorite Quote:'))?.split('"')[1],
            legacy: lines.find(l => l.startsWith('Legacy:'))?.replace('Legacy:', '').trim()
        };
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
                                Digital Memorials
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {memorials.map((memorial) => {
                        const parsed = parseMemorial(memorial.notes);
                        return (
                            <Card key={memorial.id} className="border-[#4A90E2]/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-red-500" />
                                            {memorial.name}
                                        </span>
                                    </CardTitle>
                                    {parsed.life_dates && (
                                        <p className="text-sm text-[#0F1729]/60">{parsed.life_dates}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {parsed.tribute && (
                                        <div className="bg-gradient-to-br from-white to-[#F8F9FA] p-4 rounded-lg border border-[#4A90E2]/10">
                                            <p className="text-[#0F1729] leading-relaxed">{parsed.tribute}</p>
                                        </div>
                                    )}

                                    {parsed.quote && (
                                        <div className="bg-[#4A90E2]/5 border-l-4 border-[#4A90E2] p-4 rounded">
                                            <p className="italic text-[#0F1729]">"{parsed.quote}"</p>
                                        </div>
                                    )}

                                    {parsed.legacy && (
                                        <div>
                                            <h4 className="text-sm font-medium text-[#0F1729]/60 mb-2">Legacy</h4>
                                            <p className="text-sm text-[#0F1729]">{parsed.legacy}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {memorials.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Heart className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No memorials created yet</p>
                            <p className="text-sm text-[#0F1729]/40">Honor and remember loved ones with digital tributes</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Digital Memorial</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Honoree Name *</Label>
                                <Input
                                    value={formData.honoree_name}
                                    onChange={(e) => setFormData({ ...formData, honoree_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Life Dates</Label>
                                <Input
                                    placeholder="e.g., 1935 - 2024"
                                    value={formData.life_dates}
                                    onChange={(e) => setFormData({ ...formData, life_dates: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Tribute Text *</Label>
                                <Textarea
                                    placeholder="Share memories, accomplishments, and what made them special..."
                                    value={formData.tribute_text}
                                    onChange={(e) => setFormData({ ...formData, tribute_text: e.target.value })}
                                    rows={6}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Favorite Quote or Saying</Label>
                                <Input
                                    placeholder="A quote they lived by..."
                                    value={formData.favorite_quote}
                                    onChange={(e) => setFormData({ ...formData, favorite_quote: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Legacy Statement</Label>
                                <Textarea
                                    placeholder="How they impacted the world and what they left behind..."
                                    value={formData.legacy_statement}
                                    onChange={(e) => setFormData({ ...formData, legacy_statement: e.target.value })}
                                    rows={4}
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