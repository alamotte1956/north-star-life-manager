import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TwoPersonAuth({ documentId, onAccessGranted }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState('pending'); // pending, approved, denied

    const requestAccess = async () => {
        try {
            // Send notification to authorized approvers
            await base44.integrations.Core.SendEmail({
                to: 'family-admin@example.com', // Replace with actual admin email
                subject: `Document Access Request - Requires Approval`,
                body: `A family member has requested access to a sensitive document (ID: ${documentId}).

This document requires two-person authorization for security.

Please review and approve/deny this request in the North Star app.`
            });

            setRequestSent(true);
            toast.success('Access request sent to administrators');
            
            // In production, you'd poll or use websockets for real-time updates
            // For now, simulate approval after 5 seconds
            setTimeout(() => {
                setApprovalStatus('approved');
                toast.success('Access approved!');
                if (onAccessGranted) onAccessGranted();
            }, 5000);

        } catch (error) {
            toast.error('Failed to send access request');
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="gap-2 border-orange-500 text-orange-700 hover:bg-orange-50"
            >
                <Shield className="w-4 h-4" />
                Requires Two-Person Authorization
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-600" />
                            Two-Person Authorization Required
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-orange-900 mb-1">
                                        High-Security Document
                                    </p>
                                    <p className="text-sm text-orange-700">
                                        This document requires approval from an authorized family member before access is granted.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!requestSent ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>Your request will be sent to authorized approvers</span>
                                </div>
                                <Button
                                    onClick={requestAccess}
                                    className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                                >
                                    Request Access
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {approvalStatus === 'pending' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-900">
                                                    Waiting for Approval
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    An administrator has been notified of your request
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {approvalStatus === 'approved' && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium text-green-900">
                                                    Access Approved!
                                                </p>
                                                <p className="text-sm text-green-700">
                                                    You can now view this document
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}