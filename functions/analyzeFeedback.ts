import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { feedback_id } = await req.json();

        // Fetch feedback
        const feedbacks = await base44.asServiceRole.entities.MaintenanceFeedback.filter({ id: feedback_id });
        if (!feedbacks.length) {
            return Response.json({ error: 'Feedback not found' }, { status: 404 });
        }

        const feedback = feedbacks[0];

        // AI sentiment and analysis
        const aiPrompt = `Analyze this maintenance service feedback:

RATINGS:
- Overall: ${feedback.rating}/5
- Quality: ${feedback.quality_rating}/5
- Timeliness: ${feedback.timeliness_rating}/5
- Professionalism: ${feedback.professionalism_rating}/5

COMMENTS: ${feedback.comments || 'None'}

RESOLVED: ${feedback.issue_resolved ? 'Yes' : 'No'}
WOULD RECOMMEND: ${feedback.would_recommend ? 'Yes' : 'No'}

Provide:
1. Sentiment (positive/neutral/negative)
2. Brief summary (2 sentences)
3. Key strengths mentioned
4. Areas for improvement
5. Action items for vendor or property manager`;

        const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    sentiment: { type: 'string' },
                    summary: { type: 'string' },
                    strengths: { type: 'array', items: { type: 'string' } },
                    improvements: { type: 'array', items: { type: 'string' } },
                    action_items: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        // Update feedback with analysis
        await base44.asServiceRole.entities.MaintenanceFeedback.update(feedback_id, {
            ai_sentiment: analysis.sentiment,
            ai_summary: analysis.summary
        });

        // Update vendor rating
        const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: feedback.vendor_id });
        if (vendors.length) {
            const vendor = vendors[0];
            const allVendorFeedback = await base44.asServiceRole.entities.MaintenanceFeedback.filter({ vendor_id: vendor.id });
            const avgRating = allVendorFeedback.reduce((sum, f) => sum + f.rating, 0) / allVendorFeedback.length;
            
            await base44.asServiceRole.entities.Vendor.update(vendor.id, {
                rating: Math.round(avgRating * 10) / 10,
                total_jobs_completed: vendor.total_jobs_completed + 1
            });
        }

        return Response.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Analyze feedback error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});