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

        const { document_id, file_url } = await req.json();

        if (!document_id || !file_url) {
            return Response.json({ error: 'Missing document_id or file_url' }, { status: 400 });
        }

        // Update status to analyzing
        await base44.entities.Document.update(document_id, {
            analysis_status: 'analyzing'
        });

        // Use OpenAI to analyze the document
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert document analyzer. Extract the following information from documents:
1. Document Type: Identify what kind of document this is (e.g., Will, Insurance Policy, Property Deed, Tax Document, Medical Record, etc.)
2. Expiry Date: Find any expiration, renewal, or important dates (return in YYYY-MM-DD format, or null if none found)
3. Cabin Related: Determine if this document relates to a cabin, lake home, or seasonal property (return true/false)

Return ONLY valid JSON with this exact structure:
{
  "document_type": "string",
  "expiry_date": "YYYY-MM-DD or null",
  "cabin_related": boolean
}`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Please analyze this document and extract the document type, expiry date, and whether it's cabin-related."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: file_url
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        // Update document with analysis results
        await base44.entities.Document.update(document_id, {
            document_type: analysis.document_type || 'Unknown',
            expiry_date: analysis.expiry_date === 'null' ? null : analysis.expiry_date,
            cabin_related: analysis.cabin_related || false,
            analysis_status: 'completed'
        });

        return Response.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Analysis error:', error);
        
        // Try to update document status to failed if we have the ID
        try {
            const { document_id } = await req.json();
            if (document_id) {
                const base44 = createClientFromRequest(req);
                await base44.entities.Document.update(document_id, {
                    analysis_status: 'failed'
                });
            }
        } catch {}

        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});