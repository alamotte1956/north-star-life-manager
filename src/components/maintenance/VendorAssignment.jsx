import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorAssignment({ task, onAssigned }) {
    const [assigning, setAssigning] = useState(false);

    const { data: assignments = [] } = useQuery({
        queryKey: ['taskAssignments', task.id],
        queryFn: () => base44.entities.MaintenanceAssignment.filter({ maintenance_task_id: task.id })
    });

    const currentAssignment = assignments[0];

    const handleAutoAssign = async () => {
        setAssigning(true);
        try {
            const result = await base44.functions.invoke('autoAssignVendor', {
                maintenance_task_id: task.id
            });
            toast.success(`Assigned to ${result.data.vendor.company_name}!`);
            onAssigned?.();
        } catch (error) {
            toast.error('Failed to assign vendor');
        } finally {
            setAssigning(false);
        }
    };

    if (currentAssignment) {
        return (
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">Assigned to {currentAssignment.vendor_name}</span>
                    </div>
                    <Badge className={
                        currentAssignment.status === 'completed' ? 'bg-green-600' :
                        currentAssignment.status === 'in_progress' ? 'bg-blue-600' :
                        'bg-yellow-600'
                    }>
                        {currentAssignment.status}
                    </Badge>
                    {currentAssignment.scheduled_date && (
                        <div className="mt-2 text-sm text-gray-700">
                            Scheduled: {currentAssignment.scheduled_date} {currentAssignment.scheduled_time_slot}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Button
            onClick={handleAutoAssign}
            disabled={assigning}
            className="w-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37]"
        >
            {assigning ? (
                <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Finding Best Vendor...
                </>
            ) : (
                <>
                    <Users className="w-4 h-4 mr-2" />
                    Auto-Assign Vendor with AI
                </>
            )}
        </Button>
    );
}