import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { purpose } = await req.json();

        // Get all health data
        const [healthRecords, medications, wearableData, medicalInfo, allergies] = await Promise.all([
            base44.entities.HealthRecord.list('-date'),
            base44.entities.Medication.list(),
            base44.entities.WearableData.list('-date', 30),
            base44.entities.MedicalEmergencyInfo.list(),
            base44.entities.MedicalEmergencyInfo.filter({ category: 'allergy' })
        ]);

        const activeMeds = medications.filter(m => m.active);
        const conditions = medicalInfo.filter(m => m.category === 'medical_condition');
        const recentRecords = healthRecords.slice(0, 20);

        // Generate comprehensive health summary
        const prompt = `Generate a comprehensive medical summary for a doctor visit. Purpose: ${purpose || 'General checkup'}

Patient: ${user.full_name}

Current Medications:
${activeMeds.map(m => `- ${m.name} (${m.dosage}), ${m.frequency}, prescribed by ${m.prescribing_doctor || 'N/A'} for ${m.purpose || 'N/A'}`).join('\n') || 'None'}

Known Allergies:
${allergies.map(a => a.title).join(', ') || 'None reported'}

Medical Conditions:
${conditions.map(c => c.title).join(', ') || 'None reported'}

Recent Health Records (Last 20):
${recentRecords.map(r => `- ${r.date}: ${r.title} (${r.record_type}) - ${r.notes || ''}`).join('\n') || 'None'}

Recent Vital Signs (Last 30 days):
- Average Heart Rate: ${wearableData.filter(d => d.data_type === 'heart_rate').slice(0, 10).reduce((sum, d) => sum + d.value, 0) / 10 || 'N/A'} bpm
- Average Sleep: ${wearableData.filter(d => d.data_type === 'sleep').slice(0, 7).reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / 7 / 60 || 'N/A'} hours
- Average Steps: ${wearableData.filter(d => d.data_type === 'steps').slice(0, 7).reduce((sum, d) => sum + d.value, 0) / 7 || 'N/A'}

Generate a professional medical summary in JSON format:
1. chief_complaint - Brief statement of visit purpose
2. current_medications - Formatted list of medications
3. allergies - Formatted list of allergies
4. medical_history - Summary of medical history and conditions
5. recent_events - Summary of recent health events/records
6. vital_signs_summary - Summary of recent vitals
7. questions_for_doctor - Array of 3-4 relevant questions patient should ask
8. full_summary - Complete formatted summary ready for printing/sharing

Make it professional, clear, and formatted for medical professionals.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    chief_complaint: { type: 'string' },
                    current_medications: { type: 'string' },
                    allergies: { type: 'string' },
                    medical_history: { type: 'string' },
                    recent_events: { type: 'string' },
                    vital_signs_summary: { type: 'string' },
                    questions_for_doctor: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    full_summary: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            summary: result,
            generated_at: new Date().toISOString(),
            patient_name: user.full_name
        });

    } catch (error) {
        console.error('Health summary error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});