import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Eye, Edit, Trash2, FileText, Search, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLog() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: activities = [] } = useQuery({
        queryKey: ['documentActivities'],
        queryFn: () => base44.entities.DocumentActivity.list('-created_date', 500)
    });

    const actionIcons = {
        viewed: Eye,
        edited: Edit,
        deleted: Trash2,
        shared: FileText,
        downloaded: FileText
    };

    const actionColors = {
        viewed: 'bg-blue-100 text-blue-700',
        edited: 'bg-yellow-100 text-yellow-700',
        deleted: 'bg-red-100 text-red-700',
        shared: 'bg-green-100 text-green-700',
        downloaded: 'bg-purple-100 text-purple-700'
    };

    const filtered = activities.filter(activity => 
        activity.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                Security Audit Log
                            </h1>
                            <p className="text-[#0F1729]/60 font-light">Complete access history for all sensitive documents</p>
                        </div>
                    </div>
                </div>

                <Card className="mb-6 border-[#4A90E2]/20">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0F1729]/40" />
                            <Input
                                placeholder="Search by document, user, or action..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#4A90E2]/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#4A90E2]" />
                            Activity History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filtered.length > 0 ? (
                            <div className="space-y-3">
                                {filtered.map((activity) => {
                                    const ActionIcon = actionIcons[activity.action] || FileText;
                                    const colorClass = actionColors[activity.action] || 'bg-gray-100 text-gray-700';
                                    
                                    return (
                                        <div 
                                            key={activity.id} 
                                            className="flex items-center justify-between p-4 bg-white border border-[#4A90E2]/10 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`p-2 rounded-lg ${colorClass}`}>
                                                    <ActionIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-black truncate">
                                                        {activity.document_name}
                                                    </h3>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-[#0F1729]/60">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {activity.user_email}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(activity.created_date), 'MMM d, yyyy h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={colorClass}>
                                                {activity.action}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Shield className="w-16 h-16 mx-auto mb-4 text-[#4A90E2]/40" />
                                <p className="text-[#0F1729]/60">No activity found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}