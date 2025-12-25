import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { investment_ids, ticker, timeframe = '1M' } = await req.json();

        // If requesting historical data for specific ticker
        if (ticker && timeframe) {
            const historicalPrompt = `Get historical price data for ${ticker} for the ${timeframe} timeframe.
            Return daily closing prices as an array of objects with date and price.
            For 1D: hourly data for today
            For 1W: daily data for past week
            For 1M: daily data for past month
            For 1Y: weekly data for past year
            For 5Y: monthly data for past 5 years
            Format: [{date: "YYYY-MM-DD", price: number}]`;

            const historicalResult = await base44.integrations.Core.InvokeLLM({
                prompt: historicalPrompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    date: { type: 'string' },
                                    price: { type: 'number' }
                                }
                            }
                        },
                        current_price: { type: 'number' },
                        change_percent: { type: 'number' }
                    }
                }
            });

            return Response.json({
                success: true,
                ticker,
                timeframe,
                historical_data: historicalResult.data || [],
                current_price: historicalResult.current_price,
                change_percent: historicalResult.change_percent
            });
        }

        // Get investments to update
        const investments = await base44.entities.Investment.list();
        const toUpdate = investment_ids 
            ? investments.filter(inv => investment_ids.includes(inv.id))
            : investments.filter(inv => inv.ticker_symbol);

        if (toUpdate.length === 0) {
            return Response.json({ 
                success: true,
                message: 'No investments with ticker symbols to update',
                updated: 0
            });
        }

        // Get tickers
        const tickers = toUpdate
            .map(inv => inv.ticker_symbol)
            .filter(Boolean)
            .join(', ');

        // Use AI to fetch current market prices
        const prompt = `Get the current market prices for these tickers: ${tickers}. 
        Return the data in JSON format with ticker as key and current price as value.
        Only include the price as a number, no currency symbols.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    prices: {
                        type: 'object',
                        additionalProperties: { type: 'number' }
                    }
                }
            }
        });

        const prices = result.prices || {};
        const updates = [];

        // Update each investment
        for (const inv of toUpdate) {
            if (!inv.ticker_symbol || !prices[inv.ticker_symbol]) continue;

            const newPrice = prices[inv.ticker_symbol];
            const currentValue = parseFloat(inv.shares || 0) * newPrice;
            const costBasis = inv.cost_basis || 0;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

            await base44.asServiceRole.entities.Investment.update(inv.id, {
                current_price: newPrice,
                current_value: currentValue,
                unrealized_gain_loss: gainLoss,
                unrealized_gain_loss_percent: gainLossPercent,
                last_updated: new Date().toISOString()
            });

            updates.push({
                ticker: inv.ticker_symbol,
                old_price: inv.current_price,
                new_price: newPrice
            });
        }

        return Response.json({
            success: true,
            message: `Updated ${updates.length} investments`,
            updated: updates.length,
            updates
        });

    } catch (error) {
        console.error('Fetch prices error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});