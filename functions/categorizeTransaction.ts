import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { description, amount, merchant, transaction_type } = await req.json();

        if (!description && !merchant) {
            return Response.json({ error: 'Description or merchant required' }, { status: 400 });
        }

        const searchText = merchant || description;

        // Get user's categorization rules
        const rules = await base44.entities.CategorizationRule.filter({
            user_email: user.email,
            is_active: true
        });

        // Check if any rule matches
        let matchedRule = null;
        for (const rule of rules) {
            const pattern = new RegExp(rule.merchant_pattern, 'i');
            if (pattern.test(searchText)) {
                // Check if rule applies to this transaction type
                if (rule.applies_to === 'all' || rule.applies_to === transaction_type) {
                    matchedRule = rule;
                    break;
                }
            }
        }

        if (matchedRule) {
            // Update rule stats
            await base44.entities.CategorizationRule.update(matchedRule.id, {
                match_count: (matchedRule.match_count || 0) + 1,
                last_matched: new Date().toISOString()
            });

            return Response.json({
                success: true,
                category: matchedRule.category,
                confidence: matchedRule.confidence,
                source: 'rule',
                rule_id: matchedRule.id
            });
        }

        // No rule matched, use AI
        const aiResult = await base44.integrations.Core.InvokeLLM({
            prompt: `Categorize this financial transaction:
            
Description/Merchant: ${searchText}
Amount: $${amount}
Transaction Type: ${transaction_type || 'general'}

Based on the description, suggest the most appropriate category from these options:
- Housing (rent, mortgage, utilities, home maintenance)
- Transportation (gas, car payments, insurance, public transit)
- Food & Dining (groceries, restaurants, coffee shops)
- Healthcare (medical, dental, pharmacy, insurance)
- Entertainment (streaming, movies, games, hobbies)
- Shopping (clothing, electronics, general retail)
- Travel (hotels, flights, vacation)
- Education (tuition, books, courses)
- Personal Care (gym, salon, wellness)
- Bills & Utilities (phone, internet, electricity, water)
- Subscriptions (software, services, memberships)
- Insurance (life, health, auto, home)
- Investments (stocks, bonds, retirement)
- Debt Payments (loans, credit cards)
- Gifts & Donations (charity, presents)
- Other

Also provide your confidence level (0-1) and a brief reason.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    category: { type: 'string' },
                    confidence: { type: 'number' },
                    reason: { type: 'string' },
                    suggested_merchant_pattern: { type: 'string' }
                }
            }
        });

        // If confidence is high, auto-create a rule
        if (aiResult.confidence >= 0.8) {
            await base44.entities.CategorizationRule.create({
                user_email: user.email,
                merchant_pattern: aiResult.suggested_merchant_pattern || searchText.split(' ')[0],
                category: aiResult.category,
                confidence: aiResult.confidence,
                rule_type: 'ai_learned',
                match_count: 1,
                last_matched: new Date().toISOString(),
                applies_to: transaction_type || 'all'
            });
        }

        return Response.json({
            success: true,
            category: aiResult.category,
            confidence: aiResult.confidence,
            reason: aiResult.reason,
            source: 'ai',
            needs_review: aiResult.confidence < 0.7
        });

    } catch (error) {
        console.error('Categorization error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});