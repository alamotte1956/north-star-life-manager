import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { sanitizePII } from './sanitizePII.js';

/**
 * AI Correlation Engine - Links health metrics to financial behavior
 * Analyzes patterns between wellness data and spending habits
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch health, financial, and insurance data
        const [healthRecords, wearableData, transactions, medications, insuranceQuotes] = await Promise.all([
            base44.entities.HealthRecord.list('-date', 90),
            base44.entities.WearableData.list('-date', 90),
            base44.entities.Transaction.list('-date', 90),
            base44.entities.Medication.list(),
            base44.entities.InsuranceQuote.filter({ insurance_type: 'health' })
        ]);

        // Group data by date for correlation analysis
        const dailyData = {};
        
        // Process health records (mood, symptoms)
        healthRecords.forEach(record => {
            const date = record.date?.split('T')[0];
            if (!date) return;
            
            if (!dailyData[date]) dailyData[date] = { health: {}, financial: {} };
            
            if (record.mood) dailyData[date].health.mood = record.mood;
            if (record.notes) dailyData[date].health.notes = record.notes;
        });

        // Process wearable data (sleep, exercise, heart rate)
        wearableData.forEach(data => {
            const date = data.date?.split('T')[0];
            if (!date) return;
            
            if (!dailyData[date]) dailyData[date] = { health: {}, financial: {} };
            
            if (data.sleep_hours) dailyData[date].health.sleep_hours = data.sleep_hours;
            if (data.steps) dailyData[date].health.steps = data.steps;
            if (data.exercise_minutes) dailyData[date].health.exercise_minutes = data.exercise_minutes;
            if (data.heart_rate_avg) dailyData[date].health.heart_rate_avg = data.heart_rate_avg;
        });

        // Process transactions (spending patterns)
        transactions.forEach(txn => {
            const date = txn.date?.split('T')[0];
            if (!date) return;
            
            if (!dailyData[date]) dailyData[date] = { health: {}, financial: {} };
            
            if (!dailyData[date].financial.total_spent) dailyData[date].financial.total_spent = 0;
            if (!dailyData[date].financial.transactions) dailyData[date].financial.transactions = [];
            if (!dailyData[date].financial.categories) dailyData[date].financial.categories = {};
            
            if (txn.amount < 0) {
                dailyData[date].financial.total_spent += Math.abs(txn.amount);
                dailyData[date].financial.transactions.push({
                    amount: Math.abs(txn.amount),
                    category: txn.category,
                    merchant: txn.merchant
                });
                
                const category = txn.category || 'uncategorized';
                dailyData[date].financial.categories[category] = 
                    (dailyData[date].financial.categories[category] || 0) + Math.abs(txn.amount);
            }
        });

        // Calculate correlation metrics
        const correlationData = [];
        
        for (const [date, data] of Object.entries(dailyData)) {
            if (data.health && data.financial) {
                correlationData.push({
                    date,
                    mood: data.health.mood,
                    sleep_hours: data.health.sleep_hours,
                    steps: data.health.steps,
                    exercise_minutes: data.health.exercise_minutes,
                    total_spent: data.financial.total_spent || 0,
                    transaction_count: data.financial.transactions?.length || 0,
                    categories: data.financial.categories || {}
                });
            }
        }

        // Extract chronic conditions and active medications
        const chronicConditions = healthRecords
            .filter(r => r.diagnosis || r.chronic_condition)
            .map(r => ({
                condition: r.diagnosis || r.chronic_condition,
                severity: r.severity,
                date: r.date
            }));

        const activeMedications = medications.filter(m => m.status === 'active').map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            cost: m.cost_per_refill
        }));

        // Calculate healthcare spending trends
        const healthcareSpending = transactions
            .filter(t => ['medical', 'pharmacy', 'health', 'healthcare', 'insurance'].includes(t.category?.toLowerCase()))
            .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

        // Sanitize for AI analysis
        const sanitizedData = sanitizePII(correlationData);
        const sanitizedConditions = sanitizePII(chronicConditions);
        const sanitizedMedications = sanitizePII(activeMedications);

        // AI Correlation Analysis with Predictive Healthcare Costs
        const analysisPrompt = `You are a behavioral health and financial analyst specializing in healthcare cost prediction. Analyze the correlation between health metrics and financial behavior, with focus on predicting healthcare costs.

DATA SUMMARY:
- Days analyzed: ${correlationData.length}
- Health metrics: mood, sleep hours, steps, exercise minutes
- Financial metrics: daily spending, transaction count, spending categories
- Healthcare spending (90 days): $${healthcareSpending.toFixed(2)}
- Chronic conditions: ${chronicConditions.length}
- Active medications: ${activeMedications.length}

CHRONIC CONDITIONS:
${JSON.stringify(sanitizedConditions, null, 2)}

ACTIVE MEDICATIONS:
${JSON.stringify(sanitizedMedications, null, 2)}

CURRENT INSURANCE QUOTES:
${JSON.stringify(insuranceQuotes.slice(0, 3).map(q => ({
    provider: q.provider,
    annual_premium: q.annual_premium,
    deductible: q.deductible,
    coverage_amount: q.coverage_amount
})), null, 2)}

DAILY DATA (last 30 days sample):
${JSON.stringify(sanitizedData.slice(-30), null, 2)}

ANALYSIS INSTRUCTIONS:
1. Identify patterns between health states and spending behavior
2. Look for correlations like:
   - Poor sleep → increased spending
   - High stress/bad mood → impulse purchases or comfort spending
   - Low exercise → specific category spending (food delivery, etc.)
   - Good mood/exercise → better financial decisions
3. Calculate correlation strength (strong, moderate, weak)
4. Identify trigger categories (which spending categories correlate with health states)
5. **PREDICT FUTURE HEALTHCARE COSTS** based on chronic conditions, medications, and trends
6. **ASSESS INSURANCE ADEQUACY** - compare current coverage to predicted needs
7. **FINANCIAL PLANNING ADJUSTMENTS** for managing chronic conditions
8. Provide actionable interventions

Return JSON with:
{
    "correlations": [
        {
            "health_factor": "sleep_quality",
            "financial_impact": "spending_increase",
            "strength": "strong|moderate|weak",
            "description": "When sleep is below 6 hours, spending increases by X%",
            "affected_categories": ["dining", "entertainment"],
            "data_points": 15
        }
    ],
    "key_insights": [
        "Primary insight about strongest correlation"
    ],
    "risk_factors": [
        "Behaviors that lead to poor financial decisions"
    ],
    "recommendations": [
        {
            "trigger": "Poor sleep detected",
            "action": "Enable 24-hour purchase delay for non-essentials",
            "expected_impact": "Reduce impulse spending by X%"
        }
    ],
    "wellness_score": 85,
    "financial_wellness_alignment": "Your wellness habits support 85% of your financial goals"
}`;

        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    correlations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                health_factor: { type: 'string' },
                                financial_impact: { type: 'string' },
                                strength: { type: 'string' },
                                description: { type: 'string' },
                                affected_categories: { type: 'array', items: { type: 'string' } },
                                data_points: { type: 'number' }
                            }
                        }
                    },
                    key_insights: { type: 'array', items: { type: 'string' } },
                    risk_factors: { type: 'array', items: { type: 'string' } },
                    recommendations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                trigger: { type: 'string' },
                                action: { type: 'string' },
                                expected_impact: { type: 'string' }
                            }
                        }
                    },
                    wellness_score: { type: 'number' },
                    financial_wellness_alignment: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            analysis: aiAnalysis,
            data_summary: {
                days_analyzed: correlationData.length,
                health_records: healthRecords.length,
                wearable_data_points: wearableData.length,
                transactions: transactions.length
            }
        });

    } catch (error) {
        console.error('Wellness correlation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});