import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { destination, start_date, end_date, travelers, budget, preferences } = await req.json();

        // Generate AI travel plan
        const prompt = `Create a comprehensive travel itinerary for the following trip:

Destination: ${destination}
Dates: ${start_date} to ${end_date}
Number of Travelers: ${travelers}
${budget ? `Budget: $${budget} per person` : ''}
${preferences ? `Preferences: ${preferences}` : ''}

Provide:
1. Day-by-day itinerary with activities and timing
2. Recommended hotels with price ranges
3. Flight recommendations and estimated costs
4. Must-see attractions and experiences
5. Local dining recommendations
6. Transportation tips
7. Packing list essentials
8. Budget breakdown
9. Travel tips and warnings
10. Best booking platforms for flights and hotels

Use real-time internet data to get current information about the destination, prices, and recommendations.`;

        const travelPlan = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    itinerary: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                day: { type: 'number' },
                                date: { type: 'string' },
                                activities: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            time: { type: 'string' },
                                            activity: { type: 'string' },
                                            location: { type: 'string' },
                                            estimated_cost: { type: 'number' },
                                            duration: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    hotel_recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                area: { type: 'string' },
                                price_range: { type: 'string' },
                                rating: { type: 'string' },
                                booking_link: { type: 'string' },
                                highlights: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    },
                    flight_recommendations: {
                        type: 'object',
                        properties: {
                            estimated_cost: { type: 'string' },
                            duration: { type: 'string' },
                            booking_platforms: { type: 'array', items: { type: 'string' } },
                            tips: { type: 'string' }
                        }
                    },
                    attractions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                description: { type: 'string' },
                                estimated_time: { type: 'string' },
                                cost: { type: 'string' }
                            }
                        }
                    },
                    dining_recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                cuisine: { type: 'string' },
                                price_range: { type: 'string' },
                                specialty: { type: 'string' }
                            }
                        }
                    },
                    transportation: { type: 'string' },
                    packing_list: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    budget_breakdown: {
                        type: 'object',
                        properties: {
                            flights: { type: 'number' },
                            accommodation: { type: 'number' },
                            food: { type: 'number' },
                            activities: { type: 'number' },
                            transportation: { type: 'number' },
                            miscellaneous: { type: 'number' },
                            total: { type: 'number' }
                        }
                    },
                    travel_tips: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    warnings: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            travel_plan: travelPlan,
            destination,
            start_date,
            end_date
        });

    } catch (error) {
        console.error('Travel planning error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});