import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all health records and medications
        const healthRecords = await base44.entities.HealthRecord.list('-date', 100);
        const medications = await base44.entities.Medication.list();
        const wearableData = await base44.entities.WearableData.list('-date', 30);

        // Prepare data summary
        const recordsSummary = healthRecords.map(r => ({
            type: r.record_type,
            title: r.title,
            date: r.date,
            summary: r.ai_summary,
            key_findings: r.key_findings,
            risk_indicators: r.risk_indicators
        }));

        const medicationsSummary = medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            purpose: m.purpose,
            active: m.active
        }));

        const trendsPrompt = `Analyze this aggregated health data and provide insights on trends and risks:

HEALTH RECORDS (${healthRecords.length} total):
${JSON.stringify(recordsSummary, null, 2)}

CURRENT MEDICATIONS (${medications.length} total):
${JSON.stringify(medicationsSummary, null, 2)}

WEARABLE DATA POINTS: ${wearableData.length}

Provide comprehensive analysis with:
1. identified_trends - Key health trends observed over time
2. risk_factors - Potential health risks identified
3. positive_patterns - Positive health patterns
4. recommendations - Actionable health recommendations
5. medication_insights - Insights about current medication regime
6. follow_up_priorities - What should be prioritized for follow-up
7. overall_health_score - Score from 1-100
8. overall_assessment - Brief overall health assessment`;

        const trends = await base44.integrations.Core.InvokeLLM({
            prompt: trendsPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    identified_trends: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                trend: { type: 'string' },
                                severity: { type: 'string' },
                                description: { type: 'string' }
                            }
                        }
                    },
                    risk_factors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                risk: { type: 'string' },
                                level: { type: 'string' },
                                recommendation: { type: 'string' }
                            }
                        }
                    },
                    positive_patterns: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                action: { type: 'string' },
                                priority: { type: 'string' }
                            }
                        }
                    },
                    medication_insights: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    follow_up_priorities: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    overall_health_score: { type: 'number' },
                    overall_assessment: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            trends,
            data_points: {
                health_records: healthRecords.length,
                medications: medications.length,
                wearable_data: wearableData.length
            }
        });

    } catch (error) {
        console.error('Health trends analysis error:', error);
        return Response.json({
            error: error.message,
            success: false
        }, { status: 500 });
    }
});