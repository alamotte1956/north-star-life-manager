import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'File URL required' }, { status: 400 });
        }

        // Extract text from receipt using AI OCR
        const extractionPrompt = `Extract all information from this receipt image.

Extract:
1. Merchant/vendor name
2. Date of transaction
3. Total amount
4. Individual line items with descriptions and prices
5. Payment method if visible
6. Tax amount if visible
7. Receipt/transaction number if visible

Return structured data.`;

        const extracted = await base44.integrations.Core.InvokeLLM({
            prompt: extractionPrompt,
            file_urls: [file_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    merchant: { type: 'string' },
                    date: { type: 'string' },
                    total_amount: { type: 'number' },
                    tax_amount: { type: 'number' },
                    line_items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                description: { type: 'string' },
                                amount: { type: 'number' }
                            }
                        }
                    },
                    payment_method: { type: 'string' },
                    receipt_number: { type: 'string' }
                }
            }
        });

        // Categorize the transaction
        const properties = await base44.entities.Property.list();
        const vehicles = await base44.entities.Vehicle.list();

        const categorizationPrompt = `Categorize this transaction and determine if it relates to any property or vehicle.

Transaction:
- Merchant: ${extracted.merchant}
- Amount: $${extracted.total_amount}
- Items: ${extracted.line_items.map(item => item.description).join(', ')}

Available Properties: ${properties.map(p => `${p.name} (${p.address || p.property_type})`).join(', ')}
Available Vehicles: ${vehicles.map(v => `${v.name || v.make + ' ' + v.model}`).join(', ')}

Determine:
1. Transaction category
2. If it relates to a specific property or vehicle
3. Description of what was purchased`;

        const categorization = await base44.integrations.Core.InvokeLLM({
            prompt: categorizationPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        enum: ['property', 'vehicle', 'subscription', 'maintenance', 'health', 'travel', 'utilities', 'groceries', 'dining', 'entertainment', 'other']
                    },
                    description: { type: 'string' },
                    linked_to_property: { type: 'boolean' },
                    linked_to_vehicle: { type: 'boolean' },
                    property_name: { type: 'string' },
                    vehicle_name: { type: 'string' },
                    reasoning: { type: 'string' }
                }
            }
        });

        // Find linked entity
        let linked_entity_type = null;
        let linked_entity_id = null;
        let linked_entity_name = null;

        if (categorization.linked_to_property && categorization.property_name) {
            const property = properties.find(p => 
                p.name.toLowerCase().includes(categorization.property_name.toLowerCase()) ||
                (p.address && p.address.toLowerCase().includes(categorization.property_name.toLowerCase()))
            );
            if (property) {
                linked_entity_type = 'Property';
                linked_entity_id = property.id;
                linked_entity_name = property.name;
            }
        }

        if (categorization.linked_to_vehicle && categorization.vehicle_name) {
            const vehicle = vehicles.find(v => 
                (v.name && v.name.toLowerCase().includes(categorization.vehicle_name.toLowerCase())) ||
                `${v.make} ${v.model}`.toLowerCase().includes(categorization.vehicle_name.toLowerCase())
            );
            if (vehicle) {
                linked_entity_type = 'Vehicle';
                linked_entity_id = vehicle.id;
                linked_entity_name = vehicle.name || `${vehicle.make} ${vehicle.model}`;
            }
        }

        return Response.json({
            success: true,
            extracted_data: extracted,
            categorization: {
                category: categorization.category,
                description: categorization.description,
                reasoning: categorization.reasoning,
                linked_entity_type,
                linked_entity_id,
                linked_entity_name
            }
        });

    } catch (error) {
        console.error('Receipt extraction error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});