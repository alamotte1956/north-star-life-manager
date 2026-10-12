import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { company_name, industry, company_description, contact_name } = await req.json();

        // Use AI to analyze and categorize the client
        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a business consultant AI helping to onboard a new client.

Client Information:
- Company Name: ${company_name}
- Industry: ${industry}
- Description: ${company_description || 'Not provided'}
- Contact: ${contact_name}

Please provide:
1. A client category (e.g., "Enterprise", "Small Business", "Startup", "Fortune 500", "Mid-Market")
2. Brief reasoning for the categorization (2-3 sentences)
3. 3-5 relevant services or products that would be valuable for this client type
4. Suggested tags for organization (3-5 tags)
5. A personalized, professional welcome email

For suggested services, consider:
- Their industry needs
- Company size implications
- Common pain points in their sector
- Growth stage requirements

The welcome email should:
- Be warm and professional
- Reference their industry
- Briefly mention how you can help
- Invite them to schedule a discovery call
- Be 150-200 words`,
            response_json_schema: {
                type: "object",
                properties: {
                    category: { type: "string" },
                    category_reasoning: { type: "string" },
                    suggested_services: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" },
                                estimated_value: { type: "string" }
                            }
                        }
                    },
                    tags: {
                        type: "array",
                        items: { type: "string" }
                    },
                    welcome_email: {
                        type: "object",
                        properties: {
                            subject: { type: "string" },
                            body: { type: "string" }
                        }
                    },
                    suggested_data: {
                        type: "object",
                        properties: {
                            billing_rate: { type: "string" },
                            payment_terms: { type: "string" }
                        }
                    }
                }
            }
        });

        return Response.json(analysis);

    } catch (error) {
        console.error('Error analyzing client:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});