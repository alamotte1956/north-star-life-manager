import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, CheckCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TwoPersonAuth({ document, onAccessGranted }) {
    const [requesting, setRequesting] = useState(false);
    const [approverEmail, setApproverEmail] = useState('');
    const [requestSent, setRequestSent] = useState(false);

    const requestAccess = async () => {
        setRequesting(true);
        try {
            // Send notification to approver
            await base44.integrations.Core.SendEmail({
                to: approverEmail,
                subject: `Access Request: ${document.title}`,
                body: `A family member is requesting access to the document "${document.title}".
                
Please log in to North Star to approve or deny this request.

Document Category: ${document.category}
Requested by: ${(await base44.auth.me()).email}
Time: ${new Date().toLocaleString()}

This is a security measure to protect sensitive documents.`
            });

            // Create pending access request
            await base44.entities.Comment.create({
                entity_type: 'Document',
                entity_id: document.id,
                comment: `Two-person authorization requested. Approver: ${approverEmail}`,
                metadata: {
                    type: 'access_request',
                    status: 'pending',
                    approver: approverEmail
                }
            });

            setRequestSent(true);
            toast.success('Access request sent!');
        } catch (error) {
            toast.error('Failed to send request');
        }
        setRequesting(false);
    };

    return (
        <Dialog open={true}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-orange-600" />
                        Two-Person Authorization Required
                    </DialogTitle>
                </DialogHeader>

                {!requestSent ? (
                    <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-sm text-orange-900">
                                This document requires approval from a second authorized person for enhanced security.
                            </p>
                        </div>

                        <div>
                            <Label>Second Approver Email</Label>
                            <Input
                                type="email"
                                value={approverEmail}
                                onChange={(e) => setApproverEmail(e.target.value)}
                                placeholder="family.member@email.com"
                                required
                            />
                            <p className="text-xs text-[#0F1729]/50 mt-1">
                                Must be a family member with access rights
                            </p>
                        </div>

                        <Button
                            onClick={requestAccess}
                            disabled={requesting || !approverEmail}
                            className="w-full bg-gradient-to-r from-[#2E5C8A] to-[#4A90E2] text-white"
                        >
                            Request Authorization
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                            <h3 className="font-medium text-blue-900 mb-2">Request Sent</h3>
                            <p className="text-sm text-blue-800">
                                We've notified {approverEmail}. You'll receive access once they approve.
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}