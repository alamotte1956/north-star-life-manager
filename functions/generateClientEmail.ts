import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { client_name, contact_name, email_type, client_info } = await req.json();

        const prompts = {
            followup: `Generate a professional follow-up email to ${contact_name} at ${client_name}. 
Industry: ${client_info.industry}. 
The email should check in on their needs, offer assistance, and maintain a warm but professional tone. Keep it brief (100-150 words).`,

            invoice_reminder: `Generate a polite payment reminder email for ${contact_name} at ${client_name}.
Outstanding balance: $${client_info.outstanding_balance || 0}.
The tone should be professional and friendly, not aggressive. Offer to discuss payment terms if needed. Keep it brief.`,

            project_update: `Generate a project update email template for ${contact_name} at ${client_name}.
Industry: ${client_info.industry}.
Include placeholders for: current status, completed milestones, next steps, and timeline. Professional tone.`,

            thank_you: `Generate a thank you email to ${contact_name} at ${client_name} for their business.
Industry: ${client_info.industry}.
Express genuine appreciation, mention looking forward to continued partnership. Keep it warm and concise (100 words).`
        };

        const prompt = prompts[email_type] || prompts.followup;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt + '\n\nReturn a JSON with subject (string) and body (string).',
            response_json_schema: {
                type: "object",
                properties: {
                    subject: { type: "string" },
                    body: { type: "string" }
                }
            }
        });

        return Response.json({
            ...result,
            type: email_type
        });

    } catch (error) {
        console.error('Error generating email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});