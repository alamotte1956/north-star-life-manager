import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            merchant, 
            original_category, 
            corrected_category, 
            transaction_type,
            rule_id 
        } = await req.json();

        if (!merchant || !corrected_category) {
            return Response.json({ error: 'Merchant and corrected category required' }, { status: 400 });
        }

        // If there was a rule that was wrong, update it
        if (rule_id) {
            const rules = await base44.entities.CategorizationRule.filter({ id: rule_id });
            if (rules.length > 0) {
                const rule = rules[0];
                const correctionCount = (rule.correction_count || 0) + 1;
                
                // If corrected too many times, deactivate the rule
                if (correctionCount >= 3) {
                    await base44.entities.CategorizationRule.update(rule_id, {
                        is_active: false,
                        correction_count: correctionCount
                    });
                } else {
                    await base44.entities.CategorizationRule.update(rule_id, {
                        correction_count: correctionCount
                    });
                }
            }
        }

        // Create new rule from correction
        const merchantPattern = merchant.split(' ')[0]; // First word as pattern
        
        // Check if rule already exists
        const existingRules = await base44.entities.CategorizationRule.filter({
            user_email: user.email,
            merchant_pattern: merchantPattern,
            category: corrected_category
        });

        if (existingRules.length === 0) {
            await base44.entities.CategorizationRule.create({
                user_email: user.email,
                merchant_pattern: merchantPattern,
                category: corrected_category,
                confidence: 1.0,
                rule_type: 'manual_correction',
                match_count: 1,
                last_matched: new Date().toISOString(),
                applies_to: transaction_type || 'all',
                is_active: true
            });
        } else {
            // Update existing rule confidence
            const existingRule = existingRules[0];
            await base44.entities.CategorizationRule.update(existingRule.id, {
                confidence: Math.min(1.0, existingRule.confidence + 0.1),
                match_count: (existingRule.match_count || 0) + 1,
                is_active: true
            });
        }

        return Response.json({
            success: true,
            message: 'Learned from correction',
            new_rule: merchantPattern
        });

    } catch (error) {
        console.error('Learn from correction error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});