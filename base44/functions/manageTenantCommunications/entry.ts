import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, tenant_message, property_id, communication_type, tenant_name } = await req.json();

        // Fetch property and tenant context
        let property = null;
        if (property_id) {
            const properties = await base44.entities.Property.list();
            property = properties.find(p => p.id === property_id);
        }

        // Different AI actions
        if (action === 'generate_response') {
            // Generate automated response to tenant inquiry
            const prompt = `You are a professional property manager communicating with a tenant. Generate a helpful, friendly response.

Tenant Message: "${tenant_message}"

Property Context:
${property ? `- Property: ${property.name}
- Address: ${property.address}
- Monthly Rent: $${property.monthly_rent}
- Tenant: ${property.tenant_name}
- Lease End: ${property.lease_end_date}` : 'No property context'}

Generate a professional, empathetic response that:
1. Addresses the tenant's concern directly
2. Provides clear next steps or information
3. Maintains a friendly, professional tone
4. Includes relevant property-specific details if applicable
5. Sets appropriate expectations

Keep response concise (2-3 paragraphs maximum).`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        response_text: { type: 'string' },
                        suggested_subject: { type: 'string' },
                        urgency_level: { 
                            type: 'string',
                            enum: ['low', 'medium', 'high']
                        },
                        follow_up_needed: { type: 'boolean' }
                    }
                }
            });

            return Response.json({
                success: true,
                ...response
            });
        }

        if (action === 'generate_template') {
            // Generate communication template
            const prompt = `Generate a professional communication template for a property manager.

Template Type: ${communication_type}
Property Info: ${property ? `${property.name} - ${property.address}` : 'General'}
Tenant: ${tenant_name || 'Tenant'}

Create a template for: ${communication_type}

Common template types:
- rent_reminder: Friendly rent payment reminder
- maintenance_acknowledgment: Confirm receipt of maintenance request
- lease_renewal: Discuss lease renewal options
- late_payment_notice: Professional late payment notification
- maintenance_update: Update on maintenance progress
- move_in_welcome: Welcome new tenant
- move_out_instructions: Move-out procedure details
- policy_update: Communicate policy changes

Generate:
1. Subject line
2. Email body with personalization placeholders like [TENANT_NAME], [PROPERTY_ADDRESS], [AMOUNT], [DATE]
3. Professional signature
4. Tone guide (formal, friendly, urgent, etc.)`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        subject: { type: 'string' },
                        body: { type: 'string' },
                        tone: { type: 'string' },
                        placeholders: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        best_time_to_send: { type: 'string' },
                        tips: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            });

            return Response.json({
                success: true,
                template: response
            });
        }

        if (action === 'analyze_sentiment') {
            // Analyze sentiment of tenant messages
            const prompt = `Analyze the sentiment and tone of this tenant communication.

Tenant Message: "${tenant_message}"

Property Context: ${property ? property.name : 'N/A'}

Provide:
1. Overall sentiment (positive, neutral, negative, urgent)
2. Emotional tone (frustrated, satisfied, concerned, angry, grateful, etc.)
3. Key concerns or topics mentioned
4. Urgency level (1-10)
5. Recommended response priority (low, medium, high, critical)
6. Any red flags or escalation indicators
7. Suggested response approach`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        sentiment: {
                            type: 'string',
                            enum: ['positive', 'neutral', 'negative', 'urgent']
                        },
                        emotional_tone: { type: 'string' },
                        key_concerns: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        urgency_score: { type: 'number' },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'critical']
                        },
                        red_flags: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        response_approach: { type: 'string' },
                        estimated_resolution_time: { type: 'string' }
                    }
                }
            });

            return Response.json({
                success: true,
                analysis: response
            });
        }

        if (action === 'bulk_analyze_communications') {
            // Analyze multiple tenant communications for patterns
            const properties = await base44.entities.Property.list();
            
            const prompt = `Analyze tenant communication patterns across this property portfolio.

Properties:
${properties.map(p => `- ${p.name}: Tenant: ${p.tenant_name || 'Vacant'}, Lease End: ${p.lease_end_date || 'N/A'}`).join('\n')}

Provide insights on:
1. Common tenant concerns or issues
2. Properties with communication red flags
3. Tenants who may need proactive outreach
4. Overall tenant satisfaction indicators
5. Recommended communication strategies
6. Properties at risk based on tenant behavior patterns`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        common_concerns: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        at_risk_properties: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    property_name: { type: 'string' },
                                    risk_factors: {
                                        type: 'array',
                                        items: { type: 'string' }
                                    },
                                    recommended_action: { type: 'string' }
                                }
                            }
                        },
                        satisfaction_score: { type: 'number' },
                        proactive_outreach: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    property_name: { type: 'string' },
                                    reason: { type: 'string' },
                                    suggested_message: { type: 'string' }
                                }
                            }
                        },
                        communication_tips: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            });

            return Response.json({
                success: true,
                insights: response
            });
        }

        return Response.json({
            error: 'Invalid action specified',
            success: false
        }, { status: 400 });

    } catch (error) {
        console.error('Tenant communication error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});