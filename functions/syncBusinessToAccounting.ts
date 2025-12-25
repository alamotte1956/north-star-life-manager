import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sync_type = 'all' } = await req.json();

        // Fetch business data
        const [invoices, expenses, clients] = await Promise.all([
            base44.entities.Invoice.list('-invoice_date', 100),
            base44.entities.BusinessExpense.filter({ synced_to_accounting: false }),
            base44.entities.BusinessClient.list()
        ]);

        const syncData = {
            invoices: invoices.map(inv => ({
                invoice_number: inv.invoice_number,
                client_name: inv.client_name,
                date: inv.invoice_date,
                due_date: inv.due_date,
                line_items: inv.line_items,
                total: inv.total_amount,
                status: inv.status,
                paid_date: inv.paid_date
            })),
            expenses: expenses.map(exp => ({
                date: exp.expense_date,
                category: exp.category,
                description: exp.description,
                amount: exp.amount,
                vendor: exp.vendor,
                billable: exp.billable,
                tax_deductible: exp.tax_deductible
            })),
            clients: clients.map(c => ({
                company_name: c.company_name,
                contact_name: c.contact_name,
                email: c.email,
                billing_rate: c.billing_rate,
                payment_terms: c.payment_terms
            }))
        };

        // Try QuickBooks first
        try {
            const qbResult = await base44.functions.invoke('syncQuickBooks', { data: syncData });
            if (qbResult.data?.success) {
                // Mark expenses as synced
                for (const expense of expenses) {
                    await base44.entities.BusinessExpense.update(expense.id, {
                        synced_to_accounting: true
                    });
                }

                return Response.json({
                    success: true,
                    platform: 'QuickBooks',
                    synced: {
                        invoices: invoices.length,
                        expenses: expenses.length,
                        clients: clients.length
                    }
                });
            }
        } catch (qbError) {
            // QuickBooks not connected
        }

        // Try Xero
        try {
            const xeroResult = await base44.functions.invoke('syncXero', { data: syncData });
            if (xeroResult.data?.success) {
                for (const expense of expenses) {
                    await base44.entities.BusinessExpense.update(expense.id, {
                        synced_to_accounting: true
                    });
                }

                return Response.json({
                    success: true,
                    platform: 'Xero',
                    synced: {
                        invoices: invoices.length,
                        expenses: expenses.length,
                        clients: clients.length
                    }
                });
            }
        } catch (xeroError) {
            // Xero not connected
        }

        // No accounting software connected
        return Response.json({
            success: false,
            message: 'No accounting software connected. Please connect QuickBooks or Xero in Integrations.',
            data_ready: syncData
        });

    } catch (error) {
        console.error('Accounting sync error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});