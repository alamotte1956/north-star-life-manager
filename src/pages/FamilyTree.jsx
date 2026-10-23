import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function FamilyTree() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        relationship: 'child',
        birth_date: '',
        email: '',
        phone: '',
        address: ''
    });

    const queryClient = useQueryClient();

    const { data: familyMembers = [] } = useQuery({
        queryKey: ['familyMembers'],
        queryFn: () => base44.entities.Contact.filter({ category: 'family' })
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 100)
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Contact.create({
            ...data,
            category: 'family'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['familyMembers']);
            setDialogOpen(false);
            resetForm();
            toast.success('Family member added!');
        }
    });

    const resetForm = () => {
        setFormData({
            name: '',
            relationship: 'child',
            birth_date: '',
            email: '',
            phone: '',
            address: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    // Group by relationship
    const grouped = familyMembers.reduce((acc, member) => {
        const rel = member.relationship || 'other';
        if (!acc[rel]) acc[rel] = [];
        acc[rel].push(member);
        return acc;
    }, {});

    // Get documents linked to family members
    const getMemberDocuments = (memberName) => {
        return documents.filter(doc => 
            doc.title?.toLowerCase().includes(memberName.toLowerCase()) ||
            doc.linked_entity_name?.toLowerCase().includes(memberName.toLowerCase())
        );
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
                                Family Tree
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Organize your family connections and legacy documents</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Family Member
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {Object.entries(grouped).map(([relationship, members]) => (
                        <Card key={relationship} className="border-[#4A90E2]/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-light">
                                    <Users className="w-5 h-5 text-[#4A90E2]" />
                                    {relationship.charAt(0).toUpperCase() + relationship.slice(1)}ren
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {members.map(member => {
                                        const memberDocs = getMemberDocuments(member.name);
                                        return (
                                            <Card key={member.id} className="bg-gradient-to-br from-white to-[#F8F9FA] border-[#4A90E2]/10">
                                                <CardContent className="pt-6">
                                                    <h3 className="font-medium text-lg text-black mb-2">{member.name}</h3>
                                                    {member.birth_date && (
                                                        <p className="text-sm text-[#0F1729]/60 mb-2">
                                                            Born: {new Date(member.birth_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {member.email && (
                                                        <p className="text-sm text-[#0F1729]/60 mb-2">{member.email}</p>
                                                    )}
                                                    {member.phone && (
                                                        <p className="text-sm text-[#0F1729]/60 mb-2">{member.phone}</p>
                                                    )}
                                                    {memberDocs.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-[#4A90E2]/10">
                                                            <div className="flex items-center gap-2 text-sm text-[#4A90E2]">
                                                                <FileText className="w-4 h-4" />
                                                                {memberDocs.length} linked document{memberDocs.length > 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {familyMembers.length === 0 && (
                    <Card className="border-[#4A90E2]/20">
                        <CardContent className="py-16 text-center">
                            <Users className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                            <p className="text-[#0F1729]/60 mb-2">No family members added yet</p>
                            <p className="text-sm text-[#0F1729]/40">Start building your family tree</p>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Family Member</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Relationship</Label>
                                <Select 
                                    value={formData.relationship} 
                                    onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="parent">Parent</SelectItem>
                                        <SelectItem value="child">Child</SelectItem>
                                        <SelectItem value="grandchild">Grandchild</SelectItem>
                                        <SelectItem value="sibling">Sibling</SelectItem>
                                        <SelectItem value="spouse">Spouse</SelectItem>
                                        <SelectItem value="other">Other Relative</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Birth Date</Label>
                                <Input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                                    Add Member
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}