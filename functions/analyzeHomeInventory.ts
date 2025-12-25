import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { image_url, room, property_id } = await req.json();

        if (!image_url) {
            return Response.json({ error: 'Missing image_url' }, { status: 400 });
        }

        // Use AI vision to detect items
        const detectionPrompt = `Analyze this room photo and identify all valuable items visible.

For each item detected, provide:
- item_name
- category (electronics, furniture, appliances, jewelry, art, collectibles, etc.)
- brand (if visible)
- estimated_value (conservative estimate)
- condition (excellent/good/fair/poor based on visual)
- confidence (0-1 for detection accuracy)

Return as JSON array of detected items.`;

        const detection = await base44.integrations.Core.InvokeLLM({
            prompt: detectionPrompt,
            file_urls: [image_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                item_name: { type: 'string' },
                                category: { type: 'string' },
                                brand: { type: 'string' },
                                estimated_value: { type: 'number' },
                                condition: { type: 'string' },
                                confidence: { type: 'number' }
                            }
                        }
                    }
                }
            }
        });

        // Get property info if provided
        let propertyName = null;
        if (property_id) {
            const properties = await base44.entities.Property.filter({ id: property_id });
            if (properties.length > 0) {
                propertyName = properties[0].name;
            }
        }

        // Save detected items
        const savedItems = [];
        for (const item of detection.items) {
            if (item.confidence > 0.6) { // Only save high-confidence detections
                const saved = await base44.entities.HomeInventoryItem.create({
                    user_email: user.email,
                    property_id: property_id || null,
                    property_name: propertyName,
                    room: room || 'Unknown',
                    item_name: item.item_name,
                    category: item.category,
                    brand: item.brand || null,
                    current_value: item.estimated_value,
                    condition: item.condition,
                    photos: [image_url],
                    ai_detected: true,
                    ai_confidence: item.confidence
                });
                savedItems.push(saved);
            }
        }

        return Response.json({
            success: true,
            detected_items: savedItems.length,
            total_value: savedItems.reduce((sum, item) => sum + (item.current_value || 0), 0),
            items: savedItems
        });

    } catch (error) {
        console.error('Home inventory analysis error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});