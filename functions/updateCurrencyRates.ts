import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const API_KEY = Deno.env.get("CURRENCY_API_KEY");

        // Get all international assets
        const assets = await base44.entities.InternationalAsset.filter({ 
            user_email: user.email 
        });

        if (assets.length === 0) {
            return Response.json({ 
                success: true,
                message: 'No international assets to update'
            });
        }

        // Get unique currencies
        const currencies = [...new Set(assets.map(a => a.local_currency))];

        // Fetch exchange rates
        const ratesResponse = await fetch(
            `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`
        );
        const ratesData = await ratesResponse.json();
        const rates = ratesData.conversion_rates;

        // Update each asset
        const updated = [];
        for (const asset of assets) {
            const rate = rates[asset.local_currency];
            if (rate) {
                const usdValue = asset.value_local / rate;
                
                await base44.entities.InternationalAsset.update(asset.id, {
                    exchange_rate: rate,
                    value_usd: usdValue,
                    last_rate_update: new Date().toISOString()
                });

                updated.push({
                    asset_name: asset.asset_name,
                    currency: asset.local_currency,
                    old_usd: asset.value_usd,
                    new_usd: usdValue,
                    change: usdValue - (asset.value_usd || 0)
                });
            }
        }

        return Response.json({
            success: true,
            updated_count: updated.length,
            total_value_usd: updated.reduce((sum, a) => sum + a.new_usd, 0),
            updates: updated
        });

    } catch (error) {
        console.error('Currency update error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});