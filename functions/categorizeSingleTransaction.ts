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

        const { merchant, description, amount } = await req.json();

        // Input validation
        if (!description || typeof description !== 'string') {
            return Response.json({ error: 'Description is required and must be a string' }, { status: 400 });
        }
        
        if (description.length > 500) {
            return Response.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
        }

        if (typeof amount !== 'number' || isNaN(amount)) {
            return Response.json({ error: 'Amount must be a valid number' }, { status: 400 });
        }

        if (!merchant || typeof merchant !== 'string') {
            return Response.json({ error: 'Merchant is required and must be a string' }, { status: 400 });
        }

        if (merchant.length > 200) {
            return Response.json({ error: 'Merchant name too long (max 200 characters)' }, { status: 400 });
        }

        // Get user's historical corrections for learning
        const corrections = await base44.entities.TransactionCorrection.filter({ 
            created_by: user.email 
        });

        // Build context from corrections
        let learningContext = '';
        if (corrections.length > 0) {
            learningContext = '\n\nUser learning history (use this to improve accuracy):\n';
            corrections.slice(-20).forEach(c => {
                learningContext += `- "${c.merchant || c.description_pattern}" → ${c.corrected_category}\n`;
            });
        }

        // Get user's past transactions for pattern matching
        const pastTransactions = await base44.entities.Transaction.filter({ 
            created_by: user.email 
        }, '-date', 50);

        let transactionContext = '';
        if (pastTransactions.length > 0) {
            transactionContext = '\n\nUser\'s transaction patterns:\n';
            const merchantCategories = {};
            pastTransactions.forEach(t => {
                if (t.merchant && t.category) {
                    if (!merchantCategories[t.merchant]) {
                        merchantCategories[t.merchant] = t.category;
                    }
                }
            });
            Object.entries(merchantCategories).slice(-15).forEach(([merch, cat]) => {
                transactionContext += `- ${merch} → ${cat}\n`;
            });
        }

        // Use AI to categorize with learning
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a financial transaction categorizer. Categorize transactions into:
property, vehicle, subscription, maintenance, health, travel, utilities, groceries, dining, entertainment, other

Consider:
1. Merchant name patterns
2. Transaction description
3. Amount context
4. User's historical corrections (prioritize these!)
5. User's transaction patterns

Return JSON: {
  "category": "category_name",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}${learningContext}${transactionContext}`
                },
                {
                    role: "user",
                    content: `Categorize: "${description}" from "${merchant}" for $${Math.abs(amount)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        return Response.json({
            success: true,
            category: result.category,
            confidence: result.confidence || 0.7,
            reasoning: result.reasoning
        });

    } catch (error) {
        console.error('Categorization error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});