import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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

        const { document_id } = await req.json();

        if (!document_id) {
            return Response.json({ error: 'document_id is required' }, { status: 400 });
        }

        // Fetch the document
        const documents = await base44.entities.Document.filter({ id: document_id });
        const document = documents[0];

        if (!document) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }

        // Check if user owns this document
        if (document.created_by !== user.email) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const textContent = document.extracted_text || '';

        if (!textContent) {
            return Response.json({ 
                error: 'No text content available for summarization. Please ensure the document has been processed with OCR.' 
            }, { status: 400 });
        }

        // Generate comprehensive AI summary
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert document analyzer. Analyze the provided document text and extract:
1. A concise 2-3 sentence summary of the key information
2. 4-7 key points (bullet points of critical information)
3. Action items or next steps (things the user should do)
4. 2-5 relevant tags for organization (e.g., urgent, renewal-needed, high-value, tax-related, legal-review)

Return your response as a valid JSON object with these exact keys: summary, key_points (array), action_items (array), tags (array).
Keep it practical, actionable, and focused on what matters most to the user.`
                },
                {
                    role: "user",
                    content: `Analyze this document:\n\n${textContent.substring(0, 10000)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // Update the document with AI analysis
        const updatedDoc = await base44.entities.Document.update(document_id, {
            ai_summary: analysis.summary || '',
            key_points: analysis.key_points || [],
            action_items: analysis.action_items || [],
            suggested_tags: analysis.tags || [],
            analysis_status: 'completed'
        });

        return Response.json({ 
            success: true,
            summary: analysis.summary,
            key_points: analysis.key_points,
            action_items: analysis.action_items,
            suggested_tags: analysis.tags,
            document: updatedDoc
        });

    } catch (error) {
        console.error('Error generating document summary:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate summary' 
        }, { status: 500 });
    }
});