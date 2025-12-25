import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { insurance_type, coverage_details } = await req.json();

        // Get comprehensive user data for personalized recommendations
        const [
            properties, 
            vehicles, 
            healthRecords, 
            medications, 
            wearableData,
            financialGoals,
            investments,
            budgetTransactions
        ] = await Promise.all([
            base44.entities.Property.filter({ created_by: user.email }),
            base44.entities.Vehicle.filter({ created_by: user.email }),
            base44.entities.HealthRecord.list('-date', 90),
            base44.entities.Medication.filter({ status: 'active' }),
            base44.entities.WearableData.list('-date', 30),
            base44.entities.FinancialGoal.filter({ status: 'active' }),
            base44.entities.Investment.list(),
            base44.entities.BudgetTransaction.list('-date', 90)
        ]);

        // Extract health profile
        const chronicConditions = healthRecords
            .filter(r => r.diagnosis || r.chronic_condition)
            .map(r => r.diagnosis || r.chronic_condition);
        
        const activeConditions = [...new Set(chronicConditions)];
        
        const medicationCosts = medications.reduce((sum, m) => 
            sum + (m.cost_per_refill || 0), 0
        );

        // Calculate financial profile
        const totalInvestments = investments.reduce((sum, inv) => 
            sum + (inv.current_value || 0), 0
        );
        
        const monthlyIncome = budgetTransactions
            .filter(t => t.category === 'income' && t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0) / 3;
        
        const monthlyExpenses = budgetTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3;

        const healthcareSpending = budgetTransactions
            .filter(t => ['medical', 'pharmacy', 'health', 'healthcare'].includes(t.category?.toLowerCase()))
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Risk assessment
        const age = user.date_of_birth ? 
            new Date().getFullYear() - new Date(user.date_of_birth).getFullYear() : 35;
        
        const avgSteps = wearableData
            .filter(d => d.steps)
            .reduce((sum, d) => sum + d.steps, 0) / (wearableData.length || 1);

        const riskFactors = [];
        if (activeConditions.length > 0) riskFactors.push(`Chronic conditions: ${activeConditions.join(', ')}`);
        if (avgSteps < 5000) riskFactors.push('Low physical activity');
        if (medications.length > 3) riskFactors.push('Multiple medications');
        if (age > 55) riskFactors.push('Age-related considerations');

        const analysisPrompt = `You are an insurance advisor specializing in personalized recommendations. Generate insurance quotes comparison with deep personalization:

INSURANCE REQUEST:
- Type: ${insurance_type}
- Coverage Needs: ${JSON.stringify(coverage_details)}

USER PROFILE:
- Age: ${age}
- Properties: ${properties.length}
- Vehicles: ${vehicles.length}
- Total Investments: $${totalInvestments.toFixed(0)}
- Monthly Income: $${monthlyIncome.toFixed(0)}
- Monthly Expenses: $${monthlyExpenses.toFixed(0)}
- Healthcare Spending (3mo): $${healthcareSpending.toFixed(0)}

HEALTH PROFILE:
- Chronic Conditions: ${activeConditions.length > 0 ? activeConditions.join(', ') : 'None'}
- Active Medications: ${medications.length}
- Monthly Medication Costs: $${medicationCosts.toFixed(0)}
- Average Daily Steps: ${avgSteps.toFixed(0)}
- Risk Factors: ${riskFactors.length > 0 ? riskFactors.join('; ') : 'Low risk'}

FINANCIAL GOALS:
${financialGoals.map(g => `- ${g.name}: $${g.target_amount} by ${g.target_date}`).join('\n')}

PERSONALIZATION REQUIREMENTS:
${insurance_type === 'health' ? `
For health insurance, heavily weight:
1. Coverage for chronic conditions (${activeConditions.join(', ')})
2. Prescription drug coverage (${medications.length} active medications)
3. Specialist access for ongoing care
4. HSA/FSA compatibility for tax benefits
5. Preventive care coverage for wellness
6. Network quality in user's area
7. Out-of-pocket maximums relative to income
8. Deductible affordability based on monthly budget
` : ''}

Research and provide 5-6 competitive quotes from major providers (e.g., Blue Cross Blue Shield, UnitedHealthcare, Aetna, Cigna, Kaiser, Humana) with:
- Provider name (real major providers)
- Monthly/Annual premium (realistic based on age, health, coverage)
- Coverage amount / benefits
- Deductible
- Out-of-pocket maximum
- Key coverage features SPECIFIC to user's health needs
- Pros/cons PERSONALIZED to user's situation
- AI recommendation score (1-10) based on:
  * Coverage adequacy for chronic conditions
  * Affordability relative to income
  * Network quality
  * Prescription coverage
  * Financial value
  * Alignment with financial goals

CRITICAL: Recommendations must prioritize plans that:
1. Cover the user's specific chronic conditions
2. Have strong prescription drug coverage
3. Are affordable within their budget
4. Align with their financial goals
5. Provide best value for their health risk profile

Return detailed, personalized analysis.`;

        const quotes = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    quotes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                provider: { type: 'string' },
                                monthly_premium: { type: 'number' },
                                annual_premium: { type: 'number' },
                                coverage_amount: { type: 'number' },
                                deductible: { type: 'number' },
                                out_of_pocket_max: { type: 'number' },
                                coverage_details: { type: 'object' },
                                pros: { type: 'array', items: { type: 'string' } },
                                cons: { type: 'array', items: { type: 'string' } },
                                recommendation_score: { type: 'number' },
                                personalization_notes: { type: 'string' },
                                condition_coverage: { type: 'array', items: { type: 'string' } },
                                prescription_tier: { type: 'string' },
                                specialist_copay: { type: 'number' },
                                preventive_care: { type: 'string' },
                                hsa_compatible: { type: 'boolean' },
                                affordability_score: { type: 'number' },
                                value_score: { type: 'number' }
                            }
                        }
                    },
                    personalized_summary: { type: 'string' },
                    budget_impact_analysis: { type: 'string' },
                    health_coverage_assessment: { type: 'string' }
                }
            }
        });

        // Save quotes to database
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        const savedQuotes = [];
        for (const quote of quotes.quotes) {
            const saved = await base44.entities.InsuranceQuote.create({
                user_email: user.email,
                insurance_type,
                provider: quote.provider,
                coverage_amount: quote.coverage_amount,
                monthly_premium: quote.monthly_premium,
                annual_premium: quote.annual_premium,
                deductible: quote.deductible,
                coverage_details: {
                    ...quote.coverage_details,
                    out_of_pocket_max: quote.out_of_pocket_max,
                    prescription_tier: quote.prescription_tier,
                    specialist_copay: quote.specialist_copay,
                    preventive_care: quote.preventive_care,
                    hsa_compatible: quote.hsa_compatible,
                    condition_coverage: quote.condition_coverage,
                    personalization_notes: quote.personalization_notes,
                    affordability_score: quote.affordability_score,
                    value_score: quote.value_score
                },
                quote_valid_until: validUntil.toISOString().split('T')[0],
                ai_recommendation_score: quote.recommendation_score,
                pros: quote.pros,
                cons: quote.cons,
                status: 'active'
            });
            savedQuotes.push(saved);
        }

        return Response.json({
            success: true,
            quotes: savedQuotes,
            top_recommendation: savedQuotes.sort((a, b) => b.ai_recommendation_score - a.ai_recommendation_score)[0],
            personalized_summary: quotes.personalized_summary,
            budget_impact_analysis: quotes.budget_impact_analysis,
            health_coverage_assessment: quotes.health_coverage_assessment,
            user_profile: {
                chronic_conditions: activeConditions,
                risk_factors: riskFactors,
                monthly_healthcare_budget: (monthlyIncome - monthlyExpenses) * 0.1
            }
        });

    } catch (error) {
        console.error('Insurance comparison error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});