import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { medication_id, taken, notes } = await req.json();

        const medication = await base44.entities.Medication.list();
        const med = medication.find(m => m.id === medication_id);

        if (!med) {
            return Response.json({ error: 'Medication not found' }, { status: 404 });
        }

        const log = med.adherence_log || [];
        log.push({
            date: new Date().toISOString(),
            taken: taken,
            notes: notes || ''
        });

        await base44.asServiceRole.entities.Medication.update(medication_id, {
            adherence_log: log,
            last_taken: taken ? new Date().toISOString() : med.last_taken
        });

        return Response.json({
            success: true,
            message: 'Medication logged successfully'
        });

    } catch (error) {
        console.error('Log medication error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});