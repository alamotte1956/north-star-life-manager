import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, filters } = await req.json();

        if (!query || query.trim().length === 0) {
            return Response.json({ results: [], success: true });
        }

        // Get all documents
        let documents = await base44.entities.Document.list();

        // Apply metadata filters
        if (filters) {
            if (filters.category && filters.category !== 'all') {
                documents = documents.filter(d => d.category === filters.category);
            }
            if (filters.document_type && filters.document_type !== 'all') {
                documents = documents.filter(d => d.document_type === filters.document_type);
            }
            if (filters.date_from) {
                documents = documents.filter(d => new Date(d.created_date) >= new Date(filters.date_from));
            }
            if (filters.date_to) {
                documents = documents.filter(d => new Date(d.created_date) <= new Date(filters.date_to));
            }
            if (filters.amount_min) {
                documents = documents.filter(d => d.amount && d.amount >= filters.amount_min);
            }
            if (filters.amount_max) {
                documents = documents.filter(d => d.amount && d.amount <= filters.amount_max);
            }
            if (filters.has_expiry) {
                documents = documents.filter(d => d.expiry_date);
            }
            if (filters.linked_entity_type && filters.linked_entity_type !== 'all') {
                documents = documents.filter(d => d.linked_entity_type === filters.linked_entity_type);
            }
        }

        if (documents.length === 0) {
            return Response.json({ results: [], success: true, query });
        }

        // Use AI for intelligent semantic search
        const prompt = `You are a document search expert. The user is searching for: "${query}"

Available documents:
${documents.map((doc, idx) => `
${idx + 1}. Title: ${doc.title}
   Type: ${doc.document_type || 'Unknown'}
   Category: ${doc.category || 'Unknown'}
   AI Summary: ${doc.ai_summary || 'No summary'}
   Key Points: ${doc.key_points?.join('; ') || 'None'}
   Action Items: ${doc.action_items?.join('; ') || 'None'}
   Amount: ${doc.amount ? '$' + doc.amount : 'N/A'}
   Expiry: ${doc.expiry_date || 'N/A'}
   Linked Entity: ${doc.linked_entity_name || 'None'}
   Text snippet: ${doc.extracted_text?.substring(0, 300) || 'No text'}
   Date: ${doc.created_date}
`).join('\n')}

Analyze the search query semantically and rank ALL documents by relevance (0-100 score).
Use deep semantic understanding:
- Direct matches in title, type, summary
- Conceptual similarity (e.g., "medical" → "health", "invoice" → "bill", "lease" → "rental agreement")
- Intent understanding (e.g., "tax documents" → tax bills, receipts, W-2s)
- Time-based queries (e.g., "recent", "last month", "2024")
- Amount-based queries (e.g., "expensive", "over $1000")
- Entity relationships (documents linked to specific properties, vehicles)
- Action items and key points relevance
- Context and user intent

Return JSON with array of document relevance scores:
[
  {"document_index": 0, "relevance_score": 95, "match_reason": "Direct match in title and keywords"},
  {"document_index": 1, "relevance_score": 70, "match_reason": "Semantically related content"},
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