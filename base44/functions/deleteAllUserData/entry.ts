import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // List of all entities to delete
        const entities = [
            'Document', 'Property', 'Vehicle', 'Contact', 'HealthRecord', 
            'Medication', 'Investment', 'BillPayment', 'Subscription',
            'MaintenanceTask', 'Transaction', 'Budget', 'FinancialGoal',
            'ValuableItem', 'TravelPlan', 'EmergencyInfo', 'Beneficiary',
            'AdvanceDirective', 'Contract', 'ImportantDate', 'CalendarEvent',
            'BusinessClient', 'Project', 'Invoice', 'BusinessExpense',
            'HomeInventoryItem', 'VideoMessage', 'InternationalAsset',
            'ConciergeRequest', 'ProfessionalBooking', 'SharedAccess',
            'Comment', 'BudgetTransaction', 'PaymentMethod', 'ScheduledPayment'
        ];

        let deletedCount = 0;
        const errors = [];

        // Delete only records owned by the authenticated user
        for (const entityName of entities) {
            try {
                // Use service role to ensure we can delete, but filter by user ownership
                const records = await base44.asServiceRole.entities[entityName].filter({
                    created_by: user.email
                });

                for (const record of records) {
                    await base44.asServiceRole.entities[entityName].delete(record.id);
                    deletedCount++;
                }
            } catch (err) {
                errors.push(`${entityName}: ${err.message}`);
            }
        }

        return Response.json({ 
            success: true, 
            deleted_count: deletedCount,
            errors: errors.length > 0 ? errors : null
        });
    } catch (error) {
        console.error('Delete error:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});