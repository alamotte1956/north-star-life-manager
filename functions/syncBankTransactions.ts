import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { account_id, days = 30 } = await req.json();

        // Get bank account
        const accounts = await base44.entities.BankAccount.filter({ id: account_id });
        const account = accounts[0];

        if (!account || account.user_email !== user.email) {
            return Response.json({ error: 'Account not found' }, { status: 404 });
        }

        const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
        const PLAID_SECRET = Deno.env.get("PLAID_SECRET");

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get transactions from Plaid
        const response = await fetch('https://sandbox.plaid.com/transactions/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: PLAID_CLIENT_ID,
                secret: PLAID_SECRET,
                access_token: account.plaid_access_token,
                start_date: startDate.toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            })
        });

        const { transactions } = await response.json();

        // Import transactions
        const imported = [];
        for (const txn of transactions) {
            const created = await base44.entities.Transaction.create({
                user_email: user.email,
                date: txn.date,
                description: txn.name,
                amount: -txn.amount, // Plaid uses positive for debits
                category: txn.category?.[0] || 'Uncategorized',
                merchant: txn.merchant_name,
                account_id: account.id,
                account_name: account.account_name,
                transaction_id: txn.transaction_id,
                pending: txn.pending
            });
            imported.push(created);
        }

        // Update account balance and sync time
        await base44.entities.BankAccount.update(account_id, {
            last_sync: new Date().toISOString()
        });

        return Response.json({
            success: true,
            imported_count: imported.length,
            transactions: imported
        });

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});