import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Home, Wrench, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function QuickAddButtons({ properties, maintenanceTasks, billPayments, onEventAdded }) {
    
    const addPropertyEvent = async (property) => {
        if (!property.lease_end_date) {
            toast.error('No lease end date for this property');
            return;
        }

        try {
            const event = await base44.entities.CalendarEvent.create({
                title: `Lease Renewal: ${property.name}`,
                description: `Lease ends for ${property.name}${property.tenant_name ? ` (Tenant: ${property.tenant_name})` : ''}`,
                event_type: 'lease_event',
                category: 'administrative',
                due_date: property.lease_end_date,
                priority: 'high',
                linked_entity_type: 'Property',
                linked_entity_id: property.id,
                linked_entity_name: property.name,
                status: 'pending',
                all_day: true,
                reminder_days_before: 30
            });
            
            toast.success('Lease renewal added to calendar!');
            onEventAdded?.(event);
        } catch (error) {
            toast.error('Failed to add event');
        }
    };

    const addMaintenanceEvent = async (task) => {
        if (!task.next_due_date) {
            toast.error('No due date for this task');
            return;
        }

        try {
            const event = await base44.entities.CalendarEvent.create({
                title: task.title,
                description: `Maintenance for ${task.property_name}${task.notes ? `: ${task.notes}` : ''}`,
                event_type: 'maintenance',
                category: 'maintenance',
                due_date: task.next_due_date,
                priority: task.status === 'overdue' ? 'high' : 'medium',
                linked_entity_type: 'MaintenanceTask',
                linked_entity_id: task.id,
                linked_entity_name: task.property_name,
                status: 'pending',
                all_day: true,
                recurring: task.frequency !== 'one_time',
                recurrence_pattern: task.frequency === 'weekly' ? 'weekly' :
                                   task.frequency === 'monthly' ? 'monthly' :
                                   task.frequency === 'quarterly' ? 'quarterly' :
                                   task.frequency === 'annual' ? 'yearly' : undefined
            });
            
            toast.success('Maintenance added to calendar!');
            onEventAdded?.(event);
        } catch (error) {
            toast.error('Failed to add event');
        }
    };

    const addBillEvent = async (bill) => {
        if (!bill.next_payment_date) {
            toast.error('No payment date for this bill');
            return;
        }

        try {
            const event = await base44.entities.CalendarEvent.create({
                title: `Pay ${bill.bill_name}`,
                description: `${bill.merchant} - $${bill.amount}`,
                event_type: 'bill_due',
                category: 'financial',
                due_date: bill.next_payment_date,
                priority: 'high',
                linked_entity_type: 'BillPayment',
                linked_entity_id: bill.id,
                linked_entity_name: bill.bill_name,
                status: 'pending',
                all_day: true,
                recurring: true,
                recurrence_pattern: bill.frequency === 'weekly' ? 'weekly' :
                                   bill.frequency === 'monthly' ? 'monthly' :
                                   bill.frequency === 'quarterly' ? 'quarterly' :
                                   bill.frequency === 'annual' ? 'yearly' : 'monthly',
                reminder_days_before: 3
            });
            
            toast.success('Bill payment added to calendar!');
            onEventAdded?.(event);
        } catch (error) {
            toast.error('Failed to add event');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Property Events</h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {properties?.filter(p => p.lease_end_date).map(property => (
                        <Button
                            key={property.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => addPropertyEvent(property)}
                            className="w-full justify-start text-left text-xs"
                        >
                            <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{property.name} - {format(new Date(property.lease_end_date), 'MMM d')}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <h4 className="font-medium text-orange-900">Maintenance Due</h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {maintenanceTasks?.filter(t => t.next_due_date && t.status !== 'completed').slice(0, 5).map(task => (
                        <Button
                            key={task.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => addMaintenanceEvent(task)}
                            className="w-full justify-start text-left text-xs"
                        >
                            <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{task.title} - {format(new Date(task.next_due_date), 'MMM d')}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-900">Bills Due</h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {billPayments?.filter(b => b.next_payment_date && b.status === 'active').slice(0, 5).map(bill => (
                        <Button
                            key={bill.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => addBillEvent(bill)}
                            className="w-full justify-start text-left text-xs"
                        >
                            <Calendar className="w-3 h-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{bill.bill_name} - ${bill.amount}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}