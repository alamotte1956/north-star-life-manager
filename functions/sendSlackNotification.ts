import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { channel, message, title } = await req.json();

        if (!message) {
            return Response.json({ error: 'message required' }, { status: 400 });
        }

        // Get Slack access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');

        // Send message to Slack
        const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel: channel || '#general',
                text: title || 'North Star Update',
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*${title || 'North Star Update'}*\n${message}`
                        }
                    }
                ]
            })
        });

        const result = await slackResponse.json();

        if (!result.ok) {
            throw new Error(result.error || 'Failed to send Slack message');
        }

        return Response.json({
            success: true,
            message: 'Notification sent to Slack'
        });

    } catch (error) {
        console.error('Slack notification error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});