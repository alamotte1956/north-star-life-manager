import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, data } = await req.json();

        // Get QuickBooks access token (this would come from OAuth)
        const quickbooksToken = Deno.env.get('QUICKBOOKS_ACCESS_TOKEN');
        
        if (!quickbooksToken) {
            return Response.json({ 
                error: 'QuickBooks not connected. Please authorize QuickBooks first.' 
            }, { status: 400 });
        }

        // Example: Sync transactions from QuickBooks
        if (action === 'sync_transactions') {
            // In a real implementation, you'd call QuickBooks API
            const response = await fetch('https://sandbox-quickbooks.api.intuit.com/v3/company/YOUR_COMPANY_ID/query?query=select * from Purchase', {
                headers: {
                    'Authorization': `Bearer ${quickbooksToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch from QuickBooks');
            }

            const qbData = await response.json();
            
            // Transform and save to Transaction entity
            const transactions = qbData.QueryResponse?.Purchase || [];
            const savedTransactions = [];

            for (const purchase of transactions.slice(0, 10)) {
                const transaction = await base44.entities.Transaction.create({
                    date: purchase.TxnDate || new Date().toISOString().split('T')[0],
                    description: purchase.PrivateNote || purchase.PaymentType || 'QuickBooks Transaction',
                    amount: -(purchase.TotalAmt || 0),
                    category: 'other',
                    merchant: purchase.EntityRef?.name || 'Unknown',
                    notes: `Synced from QuickBooks - ID: ${purchase.Id}`
                });
                savedTransactions.push(transaction);
            }

            return Response.json({
                success: true,
                synced_count: savedTransactions.length,
                message: `Successfully synced ${savedTransactions.length} transactions from QuickBooks`
            });
        }

        return Response.json({
            success: true,
            message: 'QuickBooks integration ready'
        });

    } catch (error) {
        console.error('QuickBooks sync error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});