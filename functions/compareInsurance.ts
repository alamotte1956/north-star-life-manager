import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { insurance_type, coverage_details } = await req.json();

        // Get user's assets for context
        const [properties, vehicles] = await Promise.all([
            base44.entities.Property.filter({ created_by: user.email }),
            base44.entities.Vehicle.filter({ created_by: user.email })
        ]);

        const analysisPrompt = `Generate insurance quotes comparison for:

Insurance Type: ${insurance_type}
Coverage Needs: ${JSON.stringify(coverage_details)}
Properties: ${properties.length}
Vehicles: ${vehicles.length}

Research and provide 4-5 competitive quotes from major providers with:
- Provider name
- Monthly/Annual premium
- Coverage amount
- Deductible
- Key coverage features
- Pros/cons
- AI recommendation score (1-10)

Return as JSON array of quotes.`;

        const quotes = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    quotes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                provider: { type: 'string' },
                                monthly_premium: { type: 'number' },
                                annual_premium: { type: 'number' },
                                coverage_amount: { type: 'number' },
                                deductible: { type: 'number' },
                                coverage_details: { type: 'object' },
                                pros: { type: 'array', items: { type: 'string' } },
                                cons: { type: 'array', items: { type: 'string' } },
                                recommendation_score: { type: 'number' }
                            }
                        }
                    }
                }
            }
        });

        // Save quotes to database
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        const savedQuotes = [];
        for (const quote of quotes.quotes) {
            const saved = await base44.entities.InsuranceQuote.create({
                user_email: user.email,
                insurance_type,
                provider: quote.provider,
                coverage_amount: quote.coverage_amount,
                monthly_premium: quote.monthly_premium,
                annual_premium: quote.annual_premium,
                deductible: quote.deductible,
                coverage_details: quote.coverage_details,
                quote_valid_until: validUntil.toISOString().split('T')[0],
                ai_recommendation_score: quote.recommendation_score,
                pros: quote.pros,
                cons: quote.cons,
                status: 'active'
            });
            savedQuotes.push(saved);
        }

        return Response.json({
            success: true,
            quotes: savedQuotes,
            top_recommendation: savedQuotes.sort((a, b) => b.ai_recommendation_score - a.ai_recommendation_score)[0]
        });

    } catch (error) {
        console.error('Insurance comparison error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});