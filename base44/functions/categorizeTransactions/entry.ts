import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch uncategorized or recently added transactions
        const transactions = await base44.asServiceRole.entities.Transaction.filter({ 
            created_by: user.email 
        });

        const uncategorized = transactions.filter(t => !t.category || t.category === 'other');

        if (uncategorized.length === 0) {
            return Response.json({ 
                success: true, 
                message: 'No transactions need categorization',
                processed: 0 
            });
        }

        // Fetch entities for linking
        const [properties, vehicles, subscriptions, corrections] = await Promise.all([
            base44.asServiceRole.entities.Property.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Vehicle.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Subscription.filter({ created_by: user.email }),
            base44.asServiceRole.entities.TransactionCorrection.filter({ created_by: user.email })
        ]);

        // Build context for AI
        const context = {
            properties: properties.map(p => ({ name: p.name, address: p.address })),
            vehicles: vehicles.map(v => ({ name: v.name, make: v.make, model: v.model })),
            subscriptions: subscriptions.map(s => ({ name: s.name, provider: s.provider })),
            past_corrections: corrections.map(c => ({
                merchant: c.merchant,
                pattern: c.description_pattern,
                correct_category: c.corrected_category
            }))
        };

        // Process in batches
        const batchSize = 10;
        let processed = 0;

        for (let i = 0; i < uncategorized.length; i += batchSize) {
            const batch = uncategorized.slice(i, i + batchSize);
            
            const categorizations = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Categorize these financial transactions and link them to relevant entities.

Available entities: ${JSON.stringify(context, null, 2)}

Transactions to categorize:
${JSON.stringify(batch.map(t => ({
    id: t.id,
    description: t.description,
    merchant: t.merchant,
    amount: t.amount,
    date: t.date
})), null, 2)}

For each transaction, provide:
1. category: One of: property, vehicle, subscription, maintenance, health, travel, utilities, groceries, dining, entertainment, other
2. linked_entity: If relevant, specify {type: "Property"|"Vehicle"|"Subscription", id: "entity_id_from_context", name: "entity_name"}
3. confidence: 0-100 confidence score
4. reasoning: Brief explanation

Categories guide:
- property: Rent, mortgage, property tax, property insurance, HOA fees
- vehicle: Gas, car payments, auto insurance, repairs, registration
- subscription: Recurring services (Netflix, gym, software)
- maintenance: Home/property repairs, lawn care, cleaning
- health: Medical bills, pharmacy, health insurance
- travel: Flights, hotels, rental cars, vacation expenses
- utilities: Electric, water, gas, internet, phone
- groceries: Supermarkets, food shopping
- dining: Restaurants, food delivery
- entertainment: Movies, concerts, events

Match entities by:
- Property: Address or property name in description
- Vehicle: Make/model or vehicle-related merchants
- Subscription: Provider name matching

Return array of categorization objects with transaction_id.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        categorizations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    transaction_id: { type: "string" },
                                    category: { type: "string" },
                                    linked_entity: {
                                        type: "object",
                                        properties: {
                                            type: { type: "string" },
                                            id: { type: "string" },
                                            name: { type: "string" }
                                        }
                                    },
                                    confidence: { type: "number" },
                                    reasoning: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Update transactions
            for (const cat of categorizations.categorizations) {
                const updates = {
                    category: cat.category
                };

                if (cat.linked_entity?.id) {
                    updates.linked_entity_type = cat.linked_entity.type;
                    updates.linked_entity_id = cat.linked_entity.id;
                    updates.linked_entity_name = cat.linked_entity.name;
                }

                await base44.asServiceRole.entities.Transaction.update(cat.transaction_id, updates);
                processed++;
            }
        }

        return Response.json({
            success: true,
            processed,
            message: `Successfully categorized ${processed} transactions`
        });

    } catch (error) {
        console.error('Transaction categorization error:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});