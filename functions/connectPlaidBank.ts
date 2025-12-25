import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { public_token } = await req.json();

        if (!public_token) {
            return Response.json({ error: 'Missing public_token' }, { status: 400 });
        }

        const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
        const PLAID_SECRET = Deno.env.get("PLAID_SECRET");

        // Exchange public token for access token
        const exchangeResponse = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: PLAID_CLIENT_ID,
                secret: PLAID_SECRET,
                public_token
            })
        });

        const { access_token, item_id } = await exchangeResponse.json();

        // Get accounts
        const accountsResponse = await fetch('https://sandbox.plaid.com/accounts/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: PLAID_CLIENT_ID,
                secret: PLAID_SECRET,
                access_token
            })
        });

        const { accounts } = await accountsResponse.json();

        // Store accounts in database
        const createdAccounts = [];
        for (const account of accounts) {
            const created = await base44.entities.BankAccount.create({
                user_email: user.email,
                institution_name: account.name,
                account_type: account.type,
                account_name: account.name,
                last_four: account.mask,
                current_balance: account.balances.current,
                available_balance: account.balances.available,
                currency: account.balances.iso_currency_code || 'USD',
                plaid_account_id: account.account_id,
                plaid_access_token: access_token,
                last_sync: new Date().toISOString(),
                status: 'active'
            });
            createdAccounts.push(created);
        }

        return Response.json({
            success: true,
            accounts: createdAccounts,
            message: `Connected ${accounts.length} account(s)`
        });

    } catch (error) {
        console.error('Plaid connection error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});