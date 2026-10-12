import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, conversation_history } = await req.json();

        if (!message) {
            return Response.json({ error: 'Message required' }, { status: 400 });
        }

        // Get user's investment data
        const investments = await base44.entities.Investment.filter({
            created_by: user.email
        });

        // Get financial goals
        const goals = await base44.entities.FinancialGoal.filter({
            created_by: user.email
        });

        // Calculate portfolio metrics
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalCost = investments.reduce((sum, inv) => sum + (inv.cost_basis || 0), 0);
        const totalGain = totalValue - totalCost;
        const totalReturn = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : 0;

        // Build context for AI
        const portfolioContext = `
User Portfolio Summary:
- Total Value: $${totalValue.toLocaleString()}
- Total Cost Basis: $${totalCost.toLocaleString()}
- Total Gain/Loss: $${totalGain.toLocaleString()} (${totalReturn}%)
- Number of Investments: ${investments.length}

Investment Breakdown:
${investments.map(inv => {
    const gain = (inv.current_value || 0) - (inv.cost_basis || 0);
    const returnPct = inv.cost_basis > 0 ? ((gain / inv.cost_basis) * 100).toFixed(2) : 0;
    return `- ${inv.name}: ${inv.shares || inv.units} shares/units, Current Value: $${(inv.current_value || 0).toLocaleString()}, Return: ${returnPct}%`;
}).join('\n')}

Financial Goals:
${goals.map(g => `- ${g.title}: Target $${g.target_amount?.toLocaleString()}, Current: $${g.current_amount?.toLocaleString()}, Target Date: ${g.target_date}`).join('\n')}

Asset Allocation:
${investments.reduce((acc, inv) => {
    const type = inv.asset_type || 'other';
    acc[type] = (acc[type] || 0) + (inv.current_value || 0);
    return acc;
}, {})}
`;

        // Build conversation history for context
        const conversationContext = conversation_history 
            ? conversation_history.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')
            : '';

        // Call AI with full context
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a knowledgeable and personalized financial advisor specializing in investment portfolio management. You have access to the user's complete investment data and financial goals.

${portfolioContext}

Previous Conversation:
${conversationContext}

User Question: ${message}

Provide a helpful, personalized response that:
1. References specific investments, metrics, or goals from their portfolio when relevant
2. Offers actionable insights and recommendations
3. Explains complex concepts in simple terms
4. Considers their risk tolerance and financial goals
5. Provides market context when discussing trends
6. Is conversational and supportive in tone

If the user asks about market trends, provide current insights (remember you have knowledge cutoff, so mention general trends and encourage checking recent data).

If the user asks about specific actions (buy/sell), provide guidance but remind them to do their own research and consult licensed advisors for major decisions.

Keep responses concise but informative (2-4 paragraphs maximum).`,
            add_context_from_internet: message.toLowerCase().includes('market') || 
                                       message.toLowerCase().includes('trend') || 
                                       message.toLowerCase().includes('news')
        });

        return Response.json({
            success: true,
            response: response,
            portfolio_referenced: investments.length > 0
        });

    } catch (error) {
        console.error('Investment advisor chat error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});