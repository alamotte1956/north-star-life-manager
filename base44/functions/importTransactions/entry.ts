import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url } = await req.json();

        // Fetch CSV content
        const csvResponse = await fetch(file_url);
        const csvText = await csvResponse.text();

        // Get user's historical corrections for learning
        const corrections = await base44.asServiceRole.entities.TransactionCorrection.filter({ 
            created_by: user.email 
        });

        const pastTransactions = await base44.asServiceRole.entities.Transaction.filter({ 
            created_by: user.email 
        }, '-date', 100);

        // Build learning context
        let learningContext = '';
        if (corrections.length > 0) {
            learningContext = '\n\nUser learning history (prioritize these patterns):\n';
            corrections.slice(-30).forEach(c => {
                learningContext += `- "${c.merchant || c.description_pattern}" → ${c.corrected_category}\n`;
            });
        }

        let transactionContext = '';
        if (pastTransactions.length > 0) {
            transactionContext = '\n\nUser\'s transaction patterns:\n';
            const merchantCategories = {};
            pastTransactions.forEach(t => {
                if (t.merchant && t.category) {
                    merchantCategories[t.merchant] = t.category;
                }
            });
            Object.entries(merchantCategories).slice(-20).forEach(([merch, cat]) => {
                transactionContext += `- ${merch} → ${cat}\n`;
            });
        }

        // Use AI to parse and categorize transactions with learning
        const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Parse this CSV transaction data and return structured JSON. For each transaction:
- Extract: date, description, amount, merchant
- Categorize into: property, vehicle, subscription, maintenance, health, travel, utilities, groceries, dining, entertainment, other
- IMPORTANT: Use user's learning history to improve accuracy
- Suggest entity links if applicable (look for property names, vehicle info, subscription services)

Return JSON array with: {date, description, amount, category, merchant, confidence, suggested_link: {type, name}}

Date format: YYYY-MM-DD. Amount: negative for expenses, positive for income.
Confidence: 0.0-1.0 for how confident you are in the category.${learningContext}${transactionContext}`
                },
                {
                    role: "user",
                    content: `Parse these transactions:\n\n${csvText}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const parsed = JSON.parse(analysisResponse.choices[0].message.content);
        const transactions = parsed.transactions || [];

        // Try to link to existing entities
        const properties = await base44.asServiceRole.entities.Property.filter({ created_by: user.email });
        const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ created_by: user.email });
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ created_by: user.email });

        let imported = 0;
        let failed = 0;

        for (const txn of transactions) {
            try {
                let linkedEntity = { type: null, id: null, name: null };

                // Attempt entity linking
                if (txn.suggested_link) {
                    const { type, name } = txn.suggested_link;
                    
                    if (type === 'Property') {
                        const match = properties.find(p => 
                            p.name?.toLowerCase().includes(name?.toLowerCase()) ||
                            p.address?.toLowerCase().includes(name?.toLowerCase())
                        );
                        if (match) linkedEntity = { type: 'Property', id: match.id, name: match.name };
                    } else if (type === 'Vehicle') {
                        const match = vehicles.find(v => 
                            `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(name?.toLowerCase())
                        );
                        if (match) linkedEntity = { type: 'Vehicle', id: match.id, name: `${match.year} ${match.make} ${match.model}` };
                    } else if (type === 'Subscription') {
                        const match = subscriptions.find(s => 
                            s.name?.toLowerCase().includes(name?.toLowerCase())
                        );
                        if (match) linkedEntity = { type: 'Subscription', id: match.id, name: match.name };
                    }
                }

                await base44.asServiceRole.entities.Transaction.create({
                    date: txn.date,
                    description: txn.description,
                    amount: txn.amount,
                    category: txn.category || 'other',
                    merchant: txn.merchant,
                    linked_entity_type: linkedEntity.type,
                    linked_entity_id: linkedEntity.id,
                    linked_entity_name: linkedEntity.name,
                    notes: txn.confidence < 0.7 ? `AI Confidence: ${(txn.confidence * 100).toFixed(0)}% - Review recommended` : null,
                    created_by: user.email
                });

                imported++;
            } catch (error) {
                console.error('Failed to import transaction:', error);
                failed++;
            }
        }

        return Response.json({
            success: true,
            imported,
            failed,
            total: transactions.length
        });

    } catch (error) {
        console.error('Import error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});