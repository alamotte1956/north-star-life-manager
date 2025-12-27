import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all health data
        const [healthRecords, medications, wearableData, medicalInfo] = await Promise.all([
            base44.entities.HealthRecord.list('-date'),
            base44.entities.Medication.list(),
            base44.entities.WearableData.list('-date', 30),
            base44.entities.MedicalEmergencyInfo.list()
        ]);

        // Calculate medication adherence
        const activeMeds = medications.filter(m => m.active);
        const adherenceData = activeMeds.map(med => {
            const log = med.adherence_log || [];
            const last7Days = log.slice(-7);
            const adherenceRate = last7Days.length > 0 
                ? (last7Days.filter(l => l.taken).length / last7Days.length) * 100 
                : 100;
            return { name: med.name, adherence: adherenceRate };
        });

        // Recent health metrics
        const recentHeartRate = wearableData.filter(d => d.data_type === 'heart_rate').slice(0, 7);
        const recentSleep = wearableData.filter(d => d.data_type === 'sleep').slice(0, 7);
        const recentSteps = wearableData.filter(d => d.data_type === 'steps').slice(0, 7);

        const avgHeartRate = recentHeartRate.length > 0
            ? recentHeartRate.reduce((sum, d) => sum + d.value, 0) / recentHeartRate.length
            : 0;

        const avgSleep = recentSleep.length > 0
            ? recentSleep.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / recentSleep.length / 60
            : 0;

        const avgSteps = recentSteps.length > 0
            ? recentSteps.reduce((sum, d) => sum + d.value, 0) / recentSteps.length
            : 0;

        // Recent health events
        const recentRecords = healthRecords.slice(0, 10);
        const conditions = medicalInfo.filter(m => m.category === 'medical_condition');

        // Generate AI insights
        const prompt = `You are a health advisor AI. Analyze this user's health data and provide personalized insights and recommendations.

Current Medications (${activeMeds.length}):
${activeMeds.map(m => `- ${m.name} (${m.dosage}): ${m.purpose || 'N/A'}`).join('\n') || 'None'}

Medication Adherence (Last 7 days):
${adherenceData.map(a => `- ${a.name}: ${a.adherence.toFixed(0)}%`).join('\n') || 'No data'}

Recent Health Metrics (Last 7 days avg):
- Heart Rate: ${avgHeartRate ? avgHeartRate.toFixed(0) + ' bpm' : 'No data'}
- Sleep: ${avgSleep ? avgSleep.toFixed(1) + ' hours' : 'No data'}
- Steps: ${avgSteps ? avgSteps.toFixed(0) : 'No data'}

Medical Conditions:
${conditions.map(c => `- ${c.title}`).join('\n') || 'None reported'}

Recent Health Records (Last 10):
${recentRecords.map(r => `- ${r.title} (${r.date}): ${r.record_type}`).join('\n') || 'None'}

Provide analysis in JSON format with:
1. overall_health_score - Score from 1-10
2. health_summary - Brief overall health summary (2-3 sentences)
3. medication_insights - Analysis of medication adherence and any concerns (2 sentences)
4. lifestyle_insights - Analysis of sleep, activity, heart rate patterns (2 sentences)
5. risk_factors - Array of 2-3 identified health risk factors or concerns
6. recommendations - Array of 3-4 specific actionable health recommendations
7. positive_trends - Array of 1-2 positive health trends to encourage user

Keep all text concise, supportive, and actionable. Be encouraging about positive trends.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    overall_health_score: { type: 'number' },
                    health_summary: { type: 'string' },
                    medication_insights: { type: 'string' },
                    lifestyle_insights: { type: 'string' },
                    risk_factors: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    recommendations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    positive_trends: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            insights: result,
            metrics: {
                active_medications: activeMeds.length,
                avg_adherence: adherenceData.length > 0 
                    ? adherenceData.reduce((sum, a) => sum + a.adherence, 0) / adherenceData.length 
                    : 0,
                avg_heart_rate: avgHeartRate,
                avg_sleep_hours: avgSleep,
                avg_daily_steps: avgSteps,
                health_records_count: healthRecords.length
            }
        });

    } catch (error) {
        console.error('Health insights error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});