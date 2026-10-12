import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { entity_type, partial_data, field } = await req.json();

        // Fetch recent similar records
        let recentRecords = [];
        
        try {
            if (entity_type === 'MaintenanceTask') {
                recentRecords = await base44.asServiceRole.entities.MaintenanceTask.filter(
                    { created_by: user.email }, 
                    '-created_date', 
                    10
                );
            } else if (entity_type === 'Subscription') {
                recentRecords = await base44.asServiceRole.entities.Subscription.filter(
                    { created_by: user.email },
                    '-created_date',
                    10
                );
            } else if (entity_type === 'Vehicle') {
                recentRecords = await base44.asServiceRole.entities.Vehicle.filter(
                    { created_by: user.email },
                    '-created_date',
                    10
                );
            }
        } catch (error) {
            console.log('Error fetching records:', error);
        }

        // Use AI to suggest values
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You're helping auto-fill form fields. Based on past records and partial input, suggest intelligent values.
Return JSON with: {suggestions: [string array of 3-5 suggestions], confidence: "high"|"medium"|"low"}`
                },
                {
                    role: "user",
                    content: `Entity: ${entity_type}
Field: ${field}
Partial data entered: ${JSON.stringify(partial_data)}
Past records: ${JSON.stringify(recentRecords.slice(0, 5))}

Suggest values for the "${field}" field.`
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        return Response.json({
            success: true,
            suggestions: result.suggestions || [],
            confidence: result.confidence || 'low'
        });

    } catch (error) {
        console.error('Suggestion error:', error);
        return Response.json({ 
            error: error.message,
            success: false,
            suggestions: []
        }, { status: 500 });
    }
});