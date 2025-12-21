import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query || query.trim().length === 0) {
            return Response.json({ results: [], success: true });
        }

        // Get all documents
        const documents = await base44.entities.Document.list();

        // Use AI for intelligent semantic search
        const prompt = `You are a document search expert. The user is searching for: "${query}"

Available documents:
${documents.map((doc, idx) => `
${idx + 1}. Title: ${doc.title}
   Type: ${doc.document_type || 'Unknown'}
   Category: ${doc.category || 'Unknown'}
   Summary: ${doc.extracted_data?.summary || 'No summary'}
   Keywords: ${doc.extracted_data?.keywords?.join(', ') || 'None'}
   Text snippet: ${doc.extracted_text?.substring(0, 200) || 'No text'}
   Date: ${doc.created_date}
`).join('\n')}

Analyze the search query and rank ALL documents by relevance (0-100 score).
Consider:
- Direct matches in title, type, summary
- Semantic similarity (e.g., "medical" matches "health", "invoice" matches "bill")
- Date relevance if query mentions time
- Keywords and extracted data
- Context and intent

Return JSON with array of document relevance scores:
[
  {"document_index": 0, "relevance_score": 95, "match_reason": "Direct match in title and keywords"},
  {"document_index": 1, "relevance_score": 70, "match_reason": "Related content in summary"},
  ...
]

Include ALL documents, even low relevance ones. Only return documents with score > 0.`;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    results: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                document_index: { type: 'number' },
                                relevance_score: { type: 'number' },
                                match_reason: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        // Map results back to documents
        const rankedDocuments = result.results
            .filter(r => r.relevance_score > 30) // Only show reasonably relevant results
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .map(r => ({
                ...documents[r.document_index],
                relevance_score: r.relevance_score,
                match_reason: r.match_reason
            }));

        return Response.json({
            success: true,
            query,
            results: rankedDocuments,
            total_found: rankedDocuments.length
        });

    } catch (error) {
        console.error('Document search error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});