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

        // Step 1: Extract text using OCR
        const ocrResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract ALL text from this document. Return the complete text exactly as it appears."
                        },
                        {
                            type: "image_url",
                            image_url: { url: file_url }
                        }
                    ]
                }
            ]
        });

        const extractedText = ocrResponse.choices[0].message.content;

        // Step 2: Analyze, categorize, and summarize
        const analysisResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert document analyzer. Analyze documents and extract structured information.

Extract:
1. document_type: Specific type (e.g., "Vehicle Invoice", "Property Tax Bill", "Insurance Policy", "Maintenance Receipt", "Medical Bill", "Contract")
2. category: One of: legal, financial, property, vehicle, health, insurance, tax, personal, other
3. expiry_date: Any expiration/renewal date in YYYY-MM-DD or null
4. amount: Total monetary amount (number) or null
5. cabin_related: Is this about a cabin/seasonal property? (boolean)
6. extracted_data: Object with key details like: vendor, property_address, vehicle_info, policy_number, invoice_number, date, parties_involved, etc.
7. suggested_entity_link: If this relates to a specific entity type, suggest: {type: "Property"|"Vehicle"|"Subscription", name: "name to search for"}
8. summary: 2-3 sentence summary highlighting the most important information
9. key_points: Array of 3-5 key points from the document
10. action_items: Array of action items or next steps (if any)

Return ONLY valid JSON.`
                },
                {
                    role: "user",
                    content: `Analyze this document text and extract structured information:\n\n${extractedText}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(analysisResponse.choices[0].message.content);

        // Step 3: Attempt to link to entities
        let linkedEntity = { type: null, id: null, name: null };
        
        if (analysis.suggested_entity_link) {
            const { type, name } = analysis.suggested_entity_link;
            
            try {
                if (type === 'Property') {
                    const properties = await base44.asServiceRole.entities.Property.filter({ created_by: user.email });
                    const match = properties.find(p => 
                        p.name?.toLowerCase().includes(name?.toLowerCase()) ||
                        p.address?.toLowerCase().includes(name?.toLowerCase())
                    );
                    if (match) {
                        linkedEntity = { type: 'Property', id: match.id, name: match.name };
                    }
                } else if (type === 'Vehicle') {
                    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ created_by: user.email });
                    const match = vehicles.find(v => 
                        `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(name?.toLowerCase()) ||
                        v.name?.toLowerCase().includes(name?.toLowerCase())
                    );
                    if (match) {
                        linkedEntity = { type: 'Vehicle', id: match.id, name: `${match.year} ${match.make} ${match.model}` };
                    }
                } else if (type === 'Subscription') {
                    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ created_by: user.email });
                    const match = subscriptions.find(s => 
                        s.name?.toLowerCase().includes(name?.toLowerCase()) ||
                        s.provider?.toLowerCase().includes(name?.toLowerCase())
                    );
                    if (match) {
                        linkedEntity = { type: 'Subscription', id: match.id, name: match.name };
                    }
                }
            } catch (linkError) {
                console.log('Entity linking error:', linkError);
            }
        }

        // Update document with all extracted information
        await base44.entities.Document.update(document_id, {
            document_type: analysis.document_type || 'Unknown',
            category: analysis.category || 'other',
            extracted_text: extractedText,
            extracted_data: analysis.extracted_data || {},
            expiry_date: analysis.expiry_date === 'null' ? null : analysis.expiry_date,
            amount: analysis.amount || null,
            cabin_related: analysis.cabin_related || false,
            linked_entity_type: linkedEntity.type,
            linked_entity_id: linkedEntity.id,
            linked_entity_name: linkedEntity.name,
            ai_summary: analysis.summary || null,
            key_points: analysis.key_points || [],
            action_items: analysis.action_items || [],
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