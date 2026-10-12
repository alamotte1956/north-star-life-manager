import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id } = await req.json();

        // Fetch property data
        const properties = property_id 
            ? [await base44.entities.Property.filter({ id: property_id })[0]]
            : await base44.entities.Property.filter({ created_by: user.email });

        if (!properties || properties.length === 0) {
            return Response.json({ error: 'No properties found' }, { status: 404 });
        }

        // Fetch related data for all properties
        const [maintenanceTasks, documents, transactions] = await Promise.all([
            base44.asServiceRole.entities.MaintenanceTask.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Document.filter({ 
                created_by: user.email,
                category: 'property'
            }),
            base44.asServiceRole.entities.Transaction.filter({ 
                created_by: user.email,
                category: 'property'
            })
        ]);

        const insights = await Promise.all(properties.map(async (property) => {
            // Filter data for this specific property
            const propertyMaintenance = maintenanceTasks.filter(t => t.property_name === property.name);
            const propertyDocs = documents.filter(d => 
                d.linked_entity_id === property.id || 
                d.extracted_data?.property_address?.toLowerCase().includes(property.address?.toLowerCase())
            );
            const propertyTransactions = transactions.filter(t => 
                t.linked_entity_id === property.id ||
                t.description?.toLowerCase().includes(property.name?.toLowerCase())
            );

            // Prepare data summary for AI
            const dataSummary = {
                property: {
                    name: property.name,
                    type: property.property_type,
                    address: property.address,
                    purchase_date: property.purchase_date,
                    purchase_price: property.purchase_price,
                    current_value: property.current_value,
                    square_footage: property.square_footage,
                    property_tax_annual: property.property_tax_annual,
                    monthly_rent: property.monthly_rent,
                    tenant_name: property.tenant_name,
                    lease_end_date: property.lease_end_date
                },
                maintenance: {
                    total_tasks: propertyMaintenance.length,
                    overdue: propertyMaintenance.filter(t => t.status === 'overdue').length,
                    categories: propertyMaintenance.map(t => t.category),
                    recent: propertyMaintenance.slice(0, 5)
                },
                financials: {
                    total_expenses_ytd: propertyTransactions
                        .filter(t => t.amount < 0 && new Date(t.date).getFullYear() === new Date().getFullYear())
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
                    total_income_ytd: propertyTransactions
                        .filter(t => t.amount > 0 && new Date(t.date).getFullYear() === new Date().getFullYear())
                        .reduce((sum, t) => sum + t.amount, 0),
                    recent_transactions: propertyTransactions.slice(0, 10)
                },
                documents: {
                    total: propertyDocs.length,
                    recent: propertyDocs.slice(0, 5).map(d => ({
                        type: d.document_type,
                        amount: d.amount,
                        expiry_date: d.expiry_date,
                        summary: d.ai_summary
                    }))
                }
            };

            // Call AI for insights
            const aiInsights = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Analyze this property data and provide comprehensive insights:

${JSON.stringify(dataSummary, null, 2)}

Provide:
1. maintenance_score: Overall maintenance health score (0-100)
2. financial_score: Financial health score (0-100)
3. maintenance_trends: Summary of maintenance patterns and trends
4. financial_performance: Analysis of income vs expenses, ROI, cash flow
5. risk_factors: Array of specific risk factors or concerns
6. recommendations: Array of actionable recommendations
7. next_major_repair: Predicted next major repair needed
8. estimated_repair_cost: Estimated cost for that repair (number)
9. lease_insights: If rental property, insights on lease status and tenant situation
10. upcoming_deadlines: Array of important upcoming dates (lease renewals, insurance, taxes, etc.)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        maintenance_score: { type: "number" },
                        financial_score: { type: "number" },
                        maintenance_trends: { type: "string" },
                        financial_performance: { type: "string" },
                        risk_factors: { type: "array", items: { type: "string" } },
                        recommendations: { type: "array", items: { type: "string" } },
                        next_major_repair: { type: "string" },
                        estimated_repair_cost: { type: "number" },
                        lease_insights: { type: "string" },
                        upcoming_deadlines: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Update property with AI insights
            await base44.asServiceRole.entities.Property.update(property.id, {
                ai_maintenance_score: aiInsights.maintenance_score,
                ai_financial_score: aiInsights.financial_score,
                ai_risk_factors: aiInsights.risk_factors,
                ai_recommendations: aiInsights.recommendations,
                next_major_repair: aiInsights.next_major_repair,
                estimated_repair_cost: aiInsights.estimated_repair_cost
            });

            return {
                property_id: property.id,
                property_name: property.name,
                ...aiInsights,
                data_summary: {
                    total_maintenance: propertyMaintenance.length,
                    overdue_maintenance: propertyMaintenance.filter(t => t.status === 'overdue').length,
                    ytd_expenses: dataSummary.financials.total_expenses_ytd,
                    ytd_income: dataSummary.financials.total_income_ytd,
                    total_documents: propertyDocs.length
                }
            };
        }));

        return Response.json({
            success: true,
            insights: property_id ? insights[0] : insights
        });

    } catch (error) {
        console.error('Property insights error:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});