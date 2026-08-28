import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Edit, Download, Share2, MessageSquare, Upload } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivityLogViewer({ activities }) {
    const activityConfig = {
        upload: { icon: Upload, color: 'bg-green-100 text-green-700', label: 'Uploaded' },
        view: { icon: Eye, color: 'bg-blue-100 text-blue-700', label: 'Viewed' },
        edit: { icon: Edit, color: 'bg-yellow-100 text-yellow-700', label: 'Edited' },
        download: { icon: Download, color: 'bg-purple-100 text-purple-700', label: 'Downloaded' },
        share: { icon: Share2, color: 'bg-indigo-100 text-indigo-700', label: 'Shared' },
        comment: { icon: MessageSquare, color: 'bg-pink-100 text-pink-700', label: 'Commented' },
        version_upload: { icon: Upload, color: 'bg-orange-100 text-orange-700', label: 'New Version' }
    };

    return (
        <Card className="border-[#0F172A]/10 shadow-sm">
            <CardHeader>
                <CardTitle style={{ fontFamily: 'Playfair Display, serif' }}>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    {activities.length === 0 ? (
                        <div className="text-center py-12 text-[#64748B]">
                            No activity recorded
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity, index) => {
                                const config = activityConfig[activity.activity_type] || activityConfig.view;
                                const Icon = config.icon;
                                
                                return (
                                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-[#0F172A]/5 rounded-lg transition-colors">
                                        <div className={`p-2 rounded-lg ${config.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[#0F172A]">
                                                <span className="font-medium">{activity.user_name || activity.user_email}</span>
                                                {' '}{config.label.toLowerCase()}{' '}
                                                <span className="font-medium">{activity.document_title}</span>
                                            </p>
                                            <p className="text-xs text-[#64748B] mt-1">
                                                {format(new Date(activity.created_date), 'MMM dd, yyyy • HH:mm')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {config.label}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}