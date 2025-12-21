import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, email_id, params } = await req.json();

        if (action === 'analyze_email') {
            const email = await base44.entities.Email.filter({ id: email_id });
            if (!email || email.length === 0) {
                return Response.json({ error: 'Email not found' }, { status: 404 });
            }

            const emailData = email[0];

            const analysisPrompt = `Analyze this email and provide comprehensive insights:

SUBJECT: ${emailData.subject}
FROM: ${emailData.from}
BODY: ${emailData.body}

Provide a JSON response with:
1. summary - Brief 2-3 sentence summary
2. category - Best category (work/personal/finance/travel/family/health/property/subscriptions/other)
3. priority - Priority level (high/medium/low)
4. sentiment - Overall sentiment (positive/neutral/negative/urgent)
5. action_items - Array of specific action items extracted from email
6. suggested_reply - Professional, context-appropriate reply draft
7. requires_reminder - Boolean if follow-up needed
8. suggested_reminder_days - Days until reminder (if needed)
9. key_points - Array of key points mentioned`;

            const analysis = await base44.integrations.Core.InvokeLLM({
                prompt: analysisPrompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string' },
                        category: { type: 'string' },
                        priority: { type: 'string' },
                        sentiment: { type: 'string' },
                        action_items: { type: 'array', items: { type: 'string' } },
                        suggested_reply: { type: 'string' },
                        requires_reminder: { type: 'boolean' },
                        suggested_reminder_days: { type: 'number' },
                        key_points: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            // Update email with AI analysis
            const updateData = {
                ai_summary: analysis.summary,
                category: analysis.category,
                priority: analysis.priority,
                sentiment: analysis.sentiment,
                action_items: analysis.action_items,
                suggested_reply: analysis.suggested_reply
            };

            if (analysis.requires_reminder && analysis.suggested_reminder_days) {
                const reminderDate = new Date();
                reminderDate.setDate(reminderDate.getDate() + analysis.suggested_reminder_days);
                updateData.reminder_date = reminderDate.toISOString();
            }

            await base44.entities.Email.update(email_id, updateData);

            return Response.json({ success: true, analysis });
        }

        if (action === 'draft_email') {
            const { context, tone = 'professional', purpose } = params;

            const draftPrompt = `Draft a ${tone} email based on this context:

PURPOSE: ${purpose}
CONTEXT: ${context}

Create a complete email with:
1. subject - Appropriate subject line
2. body - Complete email body (professional formatting)
3. key_points - Main points covered in the email

Make it clear, concise, and appropriate for ${tone} communication.`;

            const draft = await base44.integrations.Core.InvokeLLM({
                prompt: draftPrompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        subject: { type: 'string' },
                        body: { type: 'string' },
                        key_points: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            return Response.json({ success: true, draft });
        }

        if (action === 'summarize_thread') {
            const { thread_id } = params;
            
            const threadEmails = await base44.entities.Email.filter(
                { thread_id },
                'created_date'
            );

            if (!threadEmails || threadEmails.length === 0) {
                return Response.json({ error: 'Thread not found' }, { status: 404 });
            }

            const threadText = threadEmails.map((e, i) => 
                `Email ${i + 1} (${new Date(e.created_date).toLocaleDateString()}):\nFrom: ${e.from}\nSubject: ${e.subject}\n${e.body}\n`
            ).join('\n---\n');

            const summaryPrompt = `Summarize this email thread:

${threadText}

Provide a JSON response with:
1. overall_summary - Comprehensive summary of entire conversation
2. key_decisions - Decisions made in the thread
3. action_items - Action items from all emails
4. participants - List of participants
5. timeline - Brief timeline of events
6. next_steps - Suggested next steps`;

            const summary = await base44.integrations.Core.InvokeLLM({
                prompt: summaryPrompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        overall_summary: { type: 'string' },
                        key_decisions: { type: 'array', items: { type: 'string' } },
                        action_items: { type: 'array', items: { type: 'string' } },
                        participants: { type: 'array', items: { type: 'string' } },
                        timeline: { type: 'string' },
                        next_steps: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            return Response.json({ success: true, summary, email_count: threadEmails.length });
        }

        if (action === 'suggest_reply') {
            const email = await base44.entities.Email.filter({ id: email_id });
            if (!email || email.length === 0) {
                return Response.json({ error: 'Email not found' }, { status: 404 });
            }

            const emailData = email[0];
            const { context = '', tone = 'professional' } = params;

            const replyPrompt = `Generate a ${tone} reply to this email:

ORIGINAL EMAIL:
Subject: ${emailData.subject}
From: ${emailData.from}
Body: ${emailData.body}

ADDITIONAL CONTEXT: ${context}

Provide a JSON response with:
1. reply_body - Complete reply text
2. suggested_subject - Reply subject line
3. tone_used - Tone of the reply
4. key_points_addressed - What points from original email are addressed`;

            const reply = await base44.integrations.Core.InvokeLLM({
                prompt: replyPrompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        reply_body: { type: 'string' },
                        suggested_subject: { type: 'string' },
                        tone_used: { type: 'string' },
                        key_points_addressed: { type: 'array', items: { type: 'string' } }
                    }
                }
            });

            return Response.json({ success: true, reply });
        }

        if (action === 'prioritize_inbox') {
            const emails = await base44.entities.Email.filter(
                { read: false, archived: false },
                '-created_date',
                50
            );

            if (!emails || emails.length === 0) {
                return Response.json({ success: true, prioritized: [] });
            }

            const emailSummaries = emails.map(e => ({
                id: e.id,
                subject: e.subject,
                from: e.from,
                snippet: e.body.substring(0, 200)
            }));

            const priorityPrompt = `Analyze these emails and prioritize them:

${emailSummaries.map((e, i) => `${i + 1}. From: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}`).join('\n\n')}

Provide a JSON response with:
1. high_priority - Array of email IDs that are high priority
2. medium_priority - Array of email IDs that are medium priority
3. low_priority - Array of email IDs that are low priority
4. reasoning - Brief explanation of prioritization`;

            const prioritization = await base44.integrations.Core.InvokeLLM({
                prompt: priorityPrompt,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        high_priority: { type: 'array', items: { type: 'string' } },
                        medium_priority: { type: 'array', items: { type: 'string' } },
                        low_priority: { type: 'array', items: { type: 'string' } },
                        reasoning: { type: 'string' }
                    }
                }
            });

            // Update email priorities
            for (const id of prioritization.high_priority) {
                await base44.entities.Email.update(id, { priority: 'high' });
            }
            for (const id of prioritization.medium_priority) {
                await base44.entities.Email.update(id, { priority: 'medium' });
            }
            for (const id of prioritization.low_priority) {
                await base44.entities.Email.update(id, { priority: 'low' });
            }

            return Response.json({ success: true, prioritization });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('AI Email Assistant error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});