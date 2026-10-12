import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id } = await req.json();

        if (!property_id) {
            return Response.json({ error: 'Property ID required' }, { status: 400 });
        }

        // Fetch property details
        const properties = await base44.entities.Property.filter({ id: property_id });
        
        if (properties.length === 0) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        const property = properties[0];

        const listing = await base44.integrations.Core.InvokeLLM({
            prompt: `Create an attractive rental property listing description based on these details:

Property Name: ${property.name}
Type: ${property.property_type || 'N/A'}
Address: ${property.address || 'N/A'}
Bedrooms: ${property.bedrooms || 'N/A'}
Bathrooms: ${property.bathrooms || 'N/A'}
Square Feet: ${property.square_feet || 'N/A'}
Year Built: ${property.year_built || 'N/A'}
Amenities: ${property.amenities || 'N/A'}
Pet Policy: ${property.pet_friendly ? 'Pet-friendly' : 'No pets'}
Parking: ${property.parking_spaces ? `${property.parking_spaces} space(s)` : 'N/A'}
${property.notes ? `Additional Notes: ${property.notes}` : ''}

Generate:
1. A compelling headline (60 chars max)
2. A detailed description (200-300 words) highlighting best features
3. A short description for quick listings (50-75 words)
4. 5 key selling points/highlights
5. SEO-friendly keywords

Make it appealing, professional, and honest. Emphasize unique features and location benefits.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    headline: { type: 'string' },
                    full_description: { type: 'string' },
                    short_description: { type: 'string' },
                    key_highlights: { type: 'array', items: { type: 'string' } },
                    seo_keywords: { type: 'array', items: { type: 'string' } },
                    target_audience: { type: 'string' }
                }
            }
        });

        return Response.json({
            success: true,
            listing
        });

    } catch (error) {
        console.error('Generate listing error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});