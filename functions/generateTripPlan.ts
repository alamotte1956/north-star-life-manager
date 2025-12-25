import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { destination, start_date, end_date, travelers, budget, interests } = await req.json();

        const durationDays = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert travel planner. Create a comprehensive trip plan for:

Destination: ${destination}
Duration: ${durationDays} days (${start_date} to ${end_date})
Travelers: ${travelers}
Budget: $${budget || 'Not specified'}
Interests: ${interests || 'General sightseeing'}

Provide:
1. A brief summary (2-3 sentences) of what makes this trip special
2. A day-by-day itinerary with 3-5 activities per day
3. A comprehensive packing list (15-20 items)
4. Budget breakdown for: accommodation, food, activities, transportation, misc
5. Travel tips specific to this destination

Make it practical, exciting, and tailored to their interests.`,
            response_json_schema: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    description: { type: "string" },
                    itinerary: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                day: { type: "number" },
                                activities: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            }
                        }
                    },
                    packing_list: {
                        type: "array",
                        items: { type: "string" }
                    },
                    budget_breakdown: {
                        type: "object",
                        properties: {
                            accommodation: { type: "number" },
                            food: { type: "number" },
                            activities: { type: "number" },
                            transportation: { type: "number" },
                            miscellaneous: { type: "number" }
                        }
                    },
                    travel_tips: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

        return Response.json(result);

    } catch (error) {
        console.error('Error generating trip plan:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});