import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { timeframe = 'yearly' } = await req.json();

        // Fetch all property-related data
        const properties = await base44.entities.Property.list();
        const transactions = await base44.entities.Transaction.list();
        const maintenanceTasks = await base44.entities.MaintenanceTask.list();
        const documents = await base44.entities.Document.list();

        // Filter property-related transactions
        const propertyTransactions = transactions.filter(t => 
            t.linked_entity_type === 'Property' || t.category === 'property'
        );

        // Prepare data for AI analysis
        const propertyData = properties.map(prop => {
            const propTransactions = propertyTransactions.filter(t => 
                t.linked_entity_id === prop.id
            );
            
            const propMaintenance = maintenanceTasks.filter(m => 
                m.property_name === prop.name
            );

            const propDocuments = documents.filter(d => 
                d.linked_entity_id === prop.id && d.linked_entity_type === 'Property'
            );

            // Calculate financial metrics
            const income = propTransactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const expenses = propTransactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const maintenanceCosts = propMaintenance
                .reduce((sum, m) => sum + (m.estimated_cost || 0), 0);

            const totalRevenue = prop.monthly_rent ? prop.monthly_rent * 12 : income;
            const totalCosts = expenses + maintenanceCosts + (prop.property_tax_annual || 0);
            const netIncome = totalRevenue - totalCosts;
            const roi = prop.purchase_price ? (netIncome / prop.purchase_price) * 100 : 0;

            // Tenant information
            const isVacant = !prop.tenant_name;
            const leaseExpiresWithin90Days = prop.lease_end_date && 
                new Date(prop.lease_end_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

            return {
                id: prop.id,
                name: prop.name,
                type: prop.property_type,
                address: prop.address,
                purchase_price: prop.purchase_price,
                current_value: prop.current_value,
                monthly_rent: prop.monthly_rent,
                tenant_name: prop.tenant_name,
                lease_start: prop.lease_start_date,
                lease_end: prop.lease_end_date,
                is_vacant: isVacant,
                lease_expiring_soon: leaseExpiresWithin90Days,
                annual_income: totalRevenue,
                annual_expenses: totalCosts,
                net_income: netIncome,
                roi_percent: roi,
                maintenance_count: propMaintenance.length,
                maintenance_costs: maintenanceCosts,
                transaction_count: propTransactions.length,
                document_count: propDocuments.length,
                property_tax: prop.property_tax_annual,
                square_footage: prop.square_footage
            };
        });

        // Calculate portfolio metrics
        const portfolioMetrics = {
            total_properties: properties.length,
            total_value: properties.reduce((sum, p) => sum + (p.current_value || 0), 0),
            total_investment: properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
            occupied_properties: properties.filter(p => p.tenant_name).length,
            vacant_properties: properties.filter(p => !p.tenant_name).length,
            vacancy_rate: properties.length > 0 ? 
                (properties.filter(p => !p.tenant_name).length / properties.length) * 100 : 0,
            total_monthly_rent: properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0),
            total_annual_income: propertyData.reduce((sum, p) => sum + p.annual_income, 0),
            total_annual_expenses: propertyData.reduce((sum, p) => sum + p.annual_expenses, 0),
            portfolio_roi: propertyData.reduce((sum, p) => sum + p.roi_percent, 0) / (properties.length || 1)
        };

        // AI Analysis
        const analysisPrompt = `You are a property portfolio analyst. Analyze this property data and provide comprehensive insights.

Portfolio Overview:
${JSON.stringify(portfolioMetrics, null, 2)}

Individual Properties:
${JSON.stringify(propertyData, null, 2)}

Provide a detailed analysis including:

1. **Portfolio Performance**: Assess overall financial health, ROI trends, and profitability
2. **Vacancy Analysis**: Evaluate current vacancy rates, identify problem properties, and suggest strategies
3. **ROI Rankings**: Rank properties by performance and identify best/worst performers
4. **Profitability Trends**: Analyze income vs expenses patterns across the portfolio
5. **Tenant Behavior Predictions**: For each property with a tenant:
   - Likelihood of lease renewal (0-100%)
   - Likelihood of late payments based on patterns (0-100%)
   - Risk factors to watch
6. **Risk Assessment**: Identify properties with financial concerns or maintenance issues
7. **Optimization Recommendations**: Specific actions to improve portfolio performance
8. **Market Position**: Compare property values to purchase prices and assess equity growth

Return detailed JSON analysis.`;

        const aiResult = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    portfolio_performance: {
                        type: 'object',
                        properties: {
                            overall_health_score: { type: 'number' },
                            summary: { type: 'string' },
                            key_strengths: { type: 'array', items: { type: 'string' } },
                            key_concerns: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    vacancy_analysis: {
                        type: 'object',
                        properties: {
                            current_rate: { type: 'number' },
                            status: { type: 'string' },
                            problem_properties: { type: 'array', items: { type: 'string' } },
                            recommendations: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    roi_rankings: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                property_name: { type: 'string' },
                                roi: { type: 'number' },
                                performance_rating: { type: 'string' },
                                insights: { type: 'string' }
                            }
                        }
                    },
                    profitability_trends: {
                        type: 'object',
                        properties: {
                            trend_direction: { type: 'string' },
                            avg_net_income: { type: 'number' },
                            income_expense_ratio: { type: 'number' },
                            analysis: { type: 'string' }
                        }
                    },
                    tenant_predictions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                property_name: { type: 'string' },
                                tenant_name: { type: 'string' },
                                renewal_likelihood: { type: 'number' },
                                late_payment_risk: { type: 'number' },
                                risk_factors: { type: 'array', items: { type: 'string' } },
                                recommendations: { type: 'string' }
                            }
                        }
                    },
                    risk_assessment: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                property_name: { type: 'string' },
                                risk_level: { type: 'string' },
                                concerns: { type: 'array', items: { type: 'string' } },
                                action_items: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    },
                    optimization_recommendations: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    market_position: {
                        type: 'object',
                        properties: {
                            equity_gained: { type: 'number' },
                            appreciation_rate: { type: 'number' },
                            position_summary: { type: 'string' }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            portfolio_metrics: portfolioMetrics,
            property_data: propertyData,
            ai_insights: aiResult
        });

    } catch (error) {
        console.error('Property analytics error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});