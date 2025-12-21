import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { email_from, email_subject, email_body, user_email } = await req.json();

        if (!user_email) {
            return Response.json({ error: 'user_email required' }, { status: 400 });
        }

        // Find matching automation rules
        const automations = await base44.asServiceRole.entities.Automation.filter({
            trigger_type: 'email',
            enabled: true
        });

        const matchedRules = automations.filter(rule => {
            const config = rule.trigger_config || {};
            const senderMatch = !config.sender_contains || 
                email_from?.toLowerCase().includes(config.sender_contains.toLowerCase());
            const subjectMatch = !config.subject_contains || 
                email_subject?.toLowerCase().includes(config.subject_contains.toLowerCase());
            return senderMatch && subjectMatch && rule.created_by === user_email;
        });

        if (matchedRules.length === 0) {
            return Response.json({ 
                success: true, 
                message: 'No matching rules',
                matched: 0 
            });
        }

        const results = [];

        for (const rule of matchedRules) {
            try {
                if (rule.action_type === 'create_subscription') {
                    // Use AI to extract subscription details from email
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `Extract subscription information from this email. Return JSON with:
{
  "name": "service name",
  "provider": "company name",
  "billing_amount": number,
  "billing_frequency": "monthly"|"quarterly"|"annual",
  "next_billing_date": "YYYY-MM-DD",
  "category": "streaming"|"software"|"gym"|"other"
}`
                            },
                            {
                                role: "user",
                                content: `From: ${email_from}\nSubject: ${email_subject}\n\n${email_body}`
                            }
                        ],
                        response_format: { type: "json_object" }
                    });

                    const extracted = JSON.parse(response.choices[0].message.content);

                    // Create subscription
                    await base44.asServiceRole.entities.Subscription.create({
                        ...extracted,
                        status: 'active',
                        auto_renew: true,
                        created_by: user_email
                    });

                    results.push({
                        rule: rule.name,
                        action: 'created_subscription',
                        data: extracted
                    });

                    // Update automation last_triggered
                    await base44.asServiceRole.entities.Automation.update(rule.id, {
                        last_triggered: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Rule execution error:', error);
                results.push({
                    rule: rule.name,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            matched: matchedRules.length,
            results
        });

    } catch (error) {
        console.error('Email processing error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});