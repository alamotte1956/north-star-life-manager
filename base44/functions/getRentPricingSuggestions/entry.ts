import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id } = await req.json();

        // Get property details
        const property = await base44.entities.Property.get(property_id);
        
        if (!property) {
            throw new Error('Property not found');
        }

        // Get all properties for market comparison
        const allProperties = await base44.entities.Property.list();
        
        // Get rent payment history for this property
        const rentPayments = await base44.entities.RentPayment.filter({
            property_id: property_id
        });

        // Build context for AI analysis
        const prompt = `Analyze this rental property and provide optimal rent pricing recommendations.

PROPERTY DETAILS:
- Name: ${property.name}
- Type: ${property.property_type}
- Address: ${property.address || 'Not specified'}
- Square Footage: ${property.square_footage || 'Not specified'}
- Current Monthly Rent: $${property.monthly_rent || 0}
- Purchase Price: $${property.purchase_price || 'N/A'}
- Current Value: $${property.current_value || 'N/A'}

${property.tenant_name ? `
CURRENT TENANT:
- Tenant: ${property.tenant_name}
- Lease Start: ${property.lease_start_date || 'N/A'}
- Lease End: ${property.lease_end_date || 'N/A'}
` : ''}

RENTAL PAYMENT HISTORY (Last 12 months):
${rentPayments.slice(0, 12).map(p => 
    `- ${p.due_date}: $${p.amount} (${p.status})`
).join('\n') || 'No payment history available'}

COMPARABLE PROPERTIES IN PORTFOLIO:
${allProperties
    .filter(p => p.id !== property_id && p.monthly_rent && p.property_type === property.property_type)
    .slice(0, 5)
    .map(p => `- ${p.name}: $${p.monthly_rent}/month, ${p.square_footage || 'N/A'} sqft`)
    .join('\n') || 'No comparable properties'}

ANALYSIS REQUIRED:
1. Optimal rent price recommendation based on market data
2. Price range (minimum to maximum recommended)
3. Comparison to current rent (if set)
4. Revenue optimization strategies
5. Market trends affecting rent prices
6. Pricing confidence level (low/medium/high)
7. Key factors influencing the recommendation
8. Suggested rent increase schedule (if applicable)
9. Competitive positioning analysis
10. Risk assessment for the recommended price`;

        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommended_rent: {
                        type: 'number',
                        description: 'Optimal monthly rent price'
                    },
                    price_range: {
                        type: 'object',
                        properties: {
                            min: { type: 'number' },
                            max: { type: 'number' }
                        }
                    },
                    current_vs_recommended: {
                        type: 'string',
                        description: 'Comparison analysis'
                    },
                    revenue_strategies: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    market_trends: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                trend: { type: 'string' },
                                impact: { type: 'string' },
                                description: { type: 'string' }
                            }
                        }
                    },
                    confidence_level: {
                        type: 'string',
                        enum: ['low', 'medium', 'high']
                    },
                    key_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    increase_schedule: {
                        type: 'object',
                        properties: {
                            next_increase_date: { type: 'string' },
                            suggested_amount: { type: 'number' },
                            frequency: { type: 'string' }
                        }
                    },
                    competitive_analysis: {
                        type: 'string'
                    },
                    risk_assessment: {
                        type: 'string'
                    },
                    annual_revenue_projection: {
                        type: 'number'
                    },
                    roi_improvement: {
                        type: 'string'
                    }
                }
            }
        });

        return Response.json({
            success: true,
            property_name: property.name,
            current_rent: property.monthly_rent,
            analysis
        });

    } catch (error) {
        console.error('Rent pricing analysis error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});