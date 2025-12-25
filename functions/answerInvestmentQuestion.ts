import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { question, current_advice, financial_snapshot, market_data } = await req.json();

        // Fetch user's investments for specific performance questions
        const investments = await base44.entities.Investment.list();
        
        // Fetch recent transactions for spending-related questions
        const transactions = await base44.entities.Transaction.list('-date', 30);

        const answerPrompt = `You are an expert financial advisor and investment analyst. Answer the user's question with specific, actionable insights based on their financial data and current market conditions.

USER QUESTION: ${question}

CURRENT FINANCIAL SITUATION:
${financial_snapshot ? `
- Monthly Income: $${financial_snapshot.monthly_income?.toFixed(2)}
- Monthly Expenses: $${financial_snapshot.monthly_expenses?.toFixed(2)}
- Net Savings: $${financial_snapshot.net_savings?.toFixed(2)}
- Savings Rate: ${financial_snapshot.savings_rate?.toFixed(1)}%
- Investment Portfolio Value: $${financial_snapshot.investment_value?.toFixed(2)}
- Portfolio Return: ${financial_snapshot.investment_return?.toFixed(1)}%
- Active Goals: ${financial_snapshot.active_goals} (${financial_snapshot.goals_on_track} on track)
` : 'No financial snapshot available'}

CURRENT INVESTMENTS:
${investments.map(inv => `- ${inv.asset_name} (${inv.asset_type}): ${inv.quantity} shares at $${inv.current_price} = $${inv.current_value} (${inv.gain_loss_percentage?.toFixed(1)}% return)`).join('\n')}

CURRENT AI ADVISOR RECOMMENDATIONS:
${current_advice ? `
- Health Score: ${current_advice.financial_health_score}/10
- Diversification Score: ${current_advice.investment_advice?.diversification_score}/10
- Key Investment Recommendations: ${current_advice.investment_advice?.strategy_recommendations?.slice(0, 3).join(', ')}
- Rebalancing Advice: ${current_advice.investment_advice?.rebalancing_advice}
` : 'No current advice available'}

REAL-TIME MARKET DATA:
${market_data ? `
- S&P 500: ${market_data.sp500} (${market_data.sp500_change >= 0 ? '+' : ''}${market_data.sp500_change}% today)
- VTI: $${market_data.vti} (${market_data.vti_change >= 0 ? '+' : ''}${market_data.vti_change}%)
- Bonds (AGG): $${market_data.bonds} (${market_data.bonds_change >= 0 ? '+' : ''}${market_data.bonds_change}%)
- Gold: $${market_data.gold} (${market_data.gold_change >= 0 ? '+' : ''}${market_data.gold_change}%)
- Market Sentiment: ${market_data.market_sentiment}
- VIX (Volatility): ${market_data.vix}
` : 'No market data available'}

INSTRUCTIONS:
1. Answer the specific question directly and comprehensively
2. Use actual numbers from their portfolio and financial data
3. Reference current market conditions and how they affect the answer
4. Provide specific, actionable recommendations
5. Compare their performance to relevant benchmarks when applicable
6. Suggest specific tickers/funds when relevant
7. Keep the tone professional but conversational
8. If the question is about timing, use market data to inform the answer
9. For portfolio questions, analyze their actual holdings

Provide a clear, informative answer (2-4 paragraphs) that directly addresses their question.`;

        const answer = await base44.integrations.Core.InvokeLLM({
            prompt: answerPrompt
        });

        return Response.json({
            success: true,
            answer
        });

    } catch (error) {
        console.error('Investment question error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});