import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bill_id } = await req.json();

        const bills = await base44.entities.BillNegotiation.filter({ id: bill_id });
        const bill = bills[0];

        if (!bill || bill.user_email !== user.email) {
            return Response.json({ error: 'Bill not found' }, { status: 404 });
        }

        await base44.entities.BillNegotiation.update(bill_id, { status: 'analyzing' });

        // AI analysis
        const analysisPrompt = `Analyze this bill for negotiation potential:

Bill Type: ${bill.bill_type}
Provider: ${bill.provider}
Current Monthly Cost: $${bill.current_monthly_cost}

Provide:
1. Savings potential (realistic % and target monthly cost)
2. Negotiation strategy (3-4 key tactics)
3. Competitor pricing research (3 alternatives with pricing)
4. Talking points (4-5 specific points to use in negotiation)

Format as JSON with: savings_potential (%), target_cost, strategy (string), talking_points (array), competitor_offers (array of {provider, price, features})`;

        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    savings_potential: { type: 'number' },
                    target_cost: { type: 'number' },
                    strategy: { type: 'string' },
                    talking_points: { type: 'array', items: { type: 'string' } },
                    competitor_offers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                provider: { type: 'string' },
                                price: { type: 'number' },
                                features: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        const targetCost = analysis.target_cost;
        const savingsAmount = bill.current_monthly_cost - targetCost;
        const annualSavings = savingsAmount * 12;

        await base44.entities.BillNegotiation.update(bill_id, {
            status: 'negotiating',
            target_monthly_cost: targetCost,
            savings_amount: savingsAmount,
            annual_savings: annualSavings,
            ai_analysis: `Potential to save ${analysis.savings_potential}% (~$${savingsAmount.toFixed(2)}/month or $${annualSavings.toFixed(2)}/year)`,
            negotiation_strategy: analysis.strategy,
            talking_points: analysis.talking_points,
            competitor_offers: analysis.competitor_offers
        });

        return Response.json({
            success: true,
            analysis,
            savings_amount: savingsAmount,
            annual_savings: annualSavings
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});