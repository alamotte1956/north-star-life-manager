import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id } = await req.json();

        // Fetch property details
        const properties = await base44.entities.Property.list();
        const property = properties.find(p => p.id === property_id);

        if (!property) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        // Build comprehensive valuation prompt
        const prompt = `You are a real estate valuation expert. Provide a detailed property valuation analysis.

Property Details:
- Name: ${property.name}
- Address: ${property.address || 'Not specified'}
- Type: ${property.property_type}
- Square Footage: ${property.square_footage || 'Not specified'}
- Purchase Price: ${property.purchase_price ? '$' + property.purchase_price : 'Not specified'}
- Purchase Date: ${property.purchase_date || 'Not specified'}
- Current Recorded Value: ${property.current_value ? '$' + property.current_value : 'Not specified'}
${property.seasonal ? '- Seasonal Property: Yes (Open: ' + property.season_open + ', Close: ' + property.season_close + ')' : ''}

Tasks:
1. Research current real estate market conditions for the property's location
2. Analyze comparable properties in the area
3. Consider property type, size, and features
4. Factor in any seasonal property considerations
5. Estimate current market value
6. Provide confidence level (1-10)
7. List key factors influencing the valuation
8. Suggest improvements that could increase value
9. Identify market trends affecting this property
10. Provide investment outlook

Generate a comprehensive valuation report.`;

        const valuation = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    estimated_value: {
                        type: 'number',
                        description: 'Estimated current market value in USD'
                    },
                    value_range_low: {
                        type: 'number',
                        description: 'Lower bound of value range'
                    },
                    value_range_high: {
                        type: 'number',
                        description: 'Upper bound of value range'
                    },
                    confidence_score: {
                        type: 'number',
                        description: 'Confidence in estimate (1-10)'
                    },
                    appreciation_rate: {
                        type: 'number',
                        description: 'Annual appreciation rate percentage'
                    },
                    key_value_drivers: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Main factors driving property value'
                    },
                    comparable_properties: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                address: { type: 'string' },
                                price: { type: 'number' },
                                size: { type: 'string' },
                                sold_date: { type: 'string' }
                            }
                        },
                        description: 'Recent comparable sales'
                    },
                    market_conditions: {
                        type: 'object',
                        properties: {
                            trend: {
                                type: 'string',
                                enum: ['rising', 'stable', 'declining']
                            },
                            description: { type: 'string' },
                            median_price: { type: 'number' },
                            inventory_level: { type: 'string' }
                        }
                    },
                    value_improvement_suggestions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                improvement: { type: 'string' },
                                estimated_cost: { type: 'number' },
                                potential_value_increase: { type: 'number' },
                                roi_percentage: { type: 'number' }
                            }
                        }
                    },
                    investment_outlook: {
                        type: 'object',
                        properties: {
                            rating: {
                                type: 'string',
                                enum: ['excellent', 'good', 'fair', 'poor']
                            },
                            summary: { type: 'string' },
                            hold_recommendation: { type: 'boolean' },
                            timeframe: { type: 'string' }
                        }
                    },
                    seasonal_factors: {
                        type: 'string',
                        description: 'Impact of seasonal nature on value'
                    },
                    risk_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        // Update property with AI valuation
        await base44.entities.Property.update(property_id, {
            current_value: valuation.estimated_value,
            ai_maintenance_score: property.ai_maintenance_score || 75, // Keep existing or default
            ai_financial_score: Math.round((valuation.confidence_score / 10) * 100)
        });

        return Response.json({
            success: true,
            valuation,
            property_name: property.name,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Property valuation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});