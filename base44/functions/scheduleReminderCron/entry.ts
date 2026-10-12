import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function should be called daily via cron job
// Set up in Dashboard -> Functions -> Schedule as daily task

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Call the reminder function
        const response = await base44.asServiceRole.functions.invoke('sendAppointmentReminders', {});

        return Response.json({
            success: true,
            result: response.data
        });

    } catch (error) {
        console.error('Cron error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});