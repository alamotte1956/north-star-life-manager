import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id } = await req.json();

        if (!property_id) {
            return Response.json({ error: 'Property ID required' }, { status: 400 });
        }

        // Fetch property details
        const properties = await base44.entities.Property.filter({ id: property_id });
        
        if (properties.length === 0) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        const property = properties[0];

        // Use AI with internet context for market data
        const prediction = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze optimal rent pricing for this rental property using current market data:

Property Details:
- Location: ${property.address || property.name}
- Type: ${property.property_type || 'residential'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Square Feet: ${property.square_feet || 'N/A'}
- Year Built: ${property.year_built || 'N/A'}
- Current Rent: ${property.monthly_rent ? `$${property.monthly_rent}` : 'Not set'}
- Amenities: ${property.amenities || 'Standard'}
- Pet-Friendly: ${property.pet_friendly ? 'Yes' : 'No'}

Using current market data, provide:
1. Recommended monthly rent range (low, optimal, high)
2. Comparative market analysis summary
3. Factors affecting pricing (positive and negative)
4. Seasonal pricing considerations
5. Competitive positioning
6. Revenue optimization strategy

Base analysis on current rental market trends, location factors, and property features.`,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommended_rent: {
                        type: 'object',
                        properties: {
                            low: { type: 'number' },
                            optimal: { type: 'number' },
                            high: { type: 'number' }
                        }
                    },
                    market_analysis: { type: 'string' },
                    pricing_factors: {
                        type: 'object',
                        properties: {
                            positive: { type: 'array', items: { type: 'string' } },
                            negative: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    seasonal_considerations: { type: 'string' },
                    competitive_position: { type: 'string' },
                    optimization_strategy: { type: 'string' },
                    confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
                    notes: { type: 'string' }
                }
            }
        });

        // Calculate potential change if current rent exists
        let change_analysis = null;
        if (property.monthly_rent) {
            const currentRent = property.monthly_rent;
            const optimalRent = prediction.recommended_rent.optimal;
            const difference = optimalRent - currentRent;
            const percentChange = (difference / currentRent) * 100;

            change_analysis = {
                current_rent: currentRent,
                suggested_change: difference,
                percent_change: percentChange,
                annual_impact: difference * 12,
                recommendation: Math.abs(percentChange) < 5 
                    ? 'Your rent is well-aligned with market rates'
                    : percentChange > 0 
                        ? `Consider increasing rent by $${Math.abs(difference).toFixed(0)} (${percentChange.toFixed(1)}% increase)`
                        : `You may be overpriced by $${Math.abs(difference).toFixed(0)} (${Math.abs(percentChange).toFixed(1)}% decrease recommended)`
            };
        }

        return Response.json({
            success: true,
            prediction,
            change_analysis
        });

    } catch (error) {
        console.error('Predict rent error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});